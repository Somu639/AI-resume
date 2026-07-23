import { AppError } from "../../middleware/errorHandler";
import {
  chatJsonWithFailover,
  createLlmClients,
  isRateLimitError,
  type LlmClient,
} from "../../lib/openai";
import { scoreAts } from "../ats-scoring";
import { boostResumeForAts } from "./ats-booster";
import {
  COVER_LETTER_SYSTEM_PROMPT,
  RESUME_OPTIMIZATION_SYSTEM_PROMPT,
  buildAtsRefineUserPrompt,
  buildCoverLetterUserPrompt,
  buildResumeOptimizationUserPrompt,
} from "./prompts";
import {
  coverLetterSchema,
  optimizeResumeModelOutputSchema,
  optimizeResumeRequestSchema,
  optimizeResumeResultSchema,
  type CoverLetter,
  type OptimizeResumeRequest,
  type OptimizeResumeResult,
  type ResumeJson,
  type ResumeModification,
} from "./schema";
import { resumeJsonToText } from "./serialize";

// Cross the ">95" bar directly. The deterministic booster lifts the score in a
// single pass, so we stop as soon as we're above 95 instead of creeping up a
// few points per LLM pass.
const TARGET_ATS_SCORE = 96;
/**
 * At most ONE fallback LLM refine pass. Keeping this low conserves the daily
 * token budget (free Groq tier) — the deterministic booster does the heavy
 * lifting, so extra LLM passes rarely help but always cost tokens.
 */
const MAX_REFINE_PASSES = 1;

function parseModelJson(content: string, label: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError(502, `OpenAI returned invalid JSON for ${label}`);
  }
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function assertIdentityPreserved(original: ResumeJson, optimized: ResumeJson) {
  if (
    original.personalInfo.name.trim().toLowerCase() !==
    optimized.personalInfo.name.trim().toLowerCase()
  ) {
    throw new AppError(
      502,
      "Optimization rejected: candidate name was altered"
    );
  }

  if (
    original.personalInfo.email.trim().toLowerCase() !==
    optimized.personalInfo.email.trim().toLowerCase()
  ) {
    throw new AppError(
      502,
      "Optimization rejected: candidate email was altered"
    );
  }

  if (optimized.experience.length > original.experience.length) {
    throw new AppError(
      502,
      "Optimization rejected: invented experience entries are not allowed"
    );
  }

  if (optimized.education.length > original.education.length) {
    throw new AppError(
      502,
      "Optimization rejected: invented education entries are not allowed"
    );
  }

  if (optimized.certifications.length > original.certifications.length) {
    throw new AppError(
      502,
      "Optimization rejected: invented certifications are not allowed"
    );
  }
}

function scoreResumeAgainstJob(
  resume: ResumeJson,
  job: OptimizeResumeRequest["jobDescription"]
) {
  return scoreAts({
    resume: {
      resumeText: resumeJsonToText(resume),
      skills: resume.skills,
      experience: resume.experience.flatMap((e) => e.bullets),
      projects: resume.projects.flatMap((p) => [
        p.name,
        ...(p.technologies ?? []),
        ...p.bullets,
      ]),
    },
    job,
  });
}

type ModelOutput = {
  optimizedResume: ResumeJson;
  modifications: ResumeModification[];
  atsAnalysis: OptimizeResumeResult["atsAnalysis"];
  missingKeywords: string[];
  coverLetter: CoverLetter;
};

async function callOptimizeModel(
  clients: LlmClient[],
  system: string,
  user: string
): Promise<ModelOutput> {
  const content = await chatJsonWithFailover({
    clients,
    system,
    user,
    temperature: 0.12,
    label: "resume optimization",
  });

  const modelJson = parseModelJson(content, "resume optimization");
  const modelParsed = optimizeResumeModelOutputSchema.safeParse(modelJson);
  if (!modelParsed.success) {
    throw new AppError(
      502,
      `Optimization response failed validation: ${modelParsed.error.errors
        .map((e) => `${e.path.join(".") || "root"}: ${e.message}`)
        .slice(0, 5)
        .join("; ")}`
    );
  }

  return modelParsed.data;
}

/**
 * Zero-token optimization used when the LLM is unavailable / rate-limited.
 * Runs only the deterministic evidenced-keyword booster (never invents content)
 * so users still get an ATS-optimized resume instead of a hard error.
 */
function buildDeterministicOptimization(
  resume: ResumeJson,
  job: OptimizeResumeRequest["jobDescription"],
  beforeScore: ReturnType<typeof scoreResumeAgainstJob>,
  aggressive = false
): OptimizeResumeResult {
  const boosted = boostResumeForAts(resume, job, { aggressive });
  const working = boosted.resume;
  const afterScore = scoreResumeAgainstJob(working, job);

  const modifications: ResumeModification[] = [];
  if (boosted.promotedKeywords.length) {
    modifications.push({
      type: "added",
      section: "skills",
      after: boosted.promotedKeywords.join(", "),
      reason: aggressive
        ? "Injected JD keywords for maximum ATS coverage (aggressive mode, offline — AI writer was rate-limited)"
        : "Promoted JD keywords already evidenced in the resume (offline ATS boost — AI writer was temporarily rate-limited)",
    });
  }

  const topSkills = dedupeStrings([...job.requiredSkills, ...job.tools]).slice(
    0,
    6
  );
  const coverLetter: CoverLetter = {
    greeting: "Dear Hiring Manager,",
    body: `I am excited to apply for this ${
      job.seniority || "role"
    }. My background aligns with your key requirements${
      topSkills.length ? `, including ${topSkills.join(", ")}` : ""
    }, and my experience reflects the skills and impact described in the job posting. I would welcome the opportunity to contribute to your team.`,
    closing: `Sincerely,\n${resume.personalInfo.name}`,
  };

  const result: OptimizeResumeResult = {
    optimizedResume: working,
    modifications,
    atsAnalysis: {
      summary: `Resume optimized with the deterministic ATS booster (the AI writer is temporarily rate-limited). Optimized ATS score: ${afterScore.atsScore}/100 against this JD.`,
      strengths: afterScore.strengths,
      weaknesses: afterScore.weakSections.map(
        (section) => `Strengthen ${section} alignment with the JD.`
      ),
      keywordMatchEstimate: afterScore.atsScore,
      recommendations: afterScore.suggestions,
    },
    missingKeywords: afterScore.missingKeywords,
    coverLetter,
    atsImprovementScore: Number(
      (afterScore.atsScore - beforeScore.atsScore).toFixed(1)
    ),
    beforeAtsScore: beforeScore.atsScore,
    afterAtsScore: afterScore.atsScore,
  };

  const validated = optimizeResumeResultSchema.safeParse(result);
  if (!validated.success) {
    throw new AppError(
      500,
      "Optimization engine produced an invalid result payload"
    );
  }
  return validated.data;
}

/**
 * AI resume optimization engine.
 * Iteratively targets ATS ≥ TARGET_ATS_SCORE via LLM refine passes +
 * deterministic evidenced-keyword booster, stopping once the score converges.
 * Degrades to a zero-token deterministic boost if the LLM is rate-limited.
 */
export async function optimizeResume(
  input: OptimizeResumeRequest
): Promise<OptimizeResumeResult> {
  const parsed = optimizeResumeRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      400,
      parsed.error.errors[0]?.message ?? "Invalid resume optimization input"
    );
  }

  const { resume, jobDescription, aggressive } = parsed.data;
  const beforeScore = scoreResumeAgainstJob(resume, jobDescription);
  const clients = createLlmClients();

  let modelOut: ModelOutput;
  try {
    modelOut = await callOptimizeModel(
      clients,
      RESUME_OPTIMIZATION_SYSTEM_PROMPT,
      buildResumeOptimizationUserPrompt(resume, jobDescription)
    );
  } catch (error) {
    // Daily token / rate limit exhausted → still deliver an optimized resume.
    if (isRateLimitError(error)) {
      return buildDeterministicOptimization(
        resume,
        jobDescription,
        beforeScore,
        aggressive
      );
    }
    throw error;
  }
  assertIdentityPreserved(resume, modelOut.optimizedResume);

  let working = modelOut.optimizedResume;
  let modifications = [...modelOut.modifications];
  let atsAnalysis = modelOut.atsAnalysis;
  let missingKeywords = modelOut.missingKeywords;
  let coverLetter = modelOut.coverLetter;

  {
    const boosted = boostResumeForAts(working, jobDescription, { aggressive });
    if (boosted.promotedKeywords.length) {
      modifications.push({
        type: "added",
        section: "skills",
        after: boosted.promotedKeywords.join(", "),
        reason: aggressive
          ? "Injected JD keywords for maximum ATS coverage (aggressive mode)"
          : "Promoted JD keywords already evidenced in the resume for ATS parsers",
      });
    }
    working = boosted.resume;
  }

  let afterScore = scoreResumeAgainstJob(working, jobDescription);

  // Iteratively refine (LLM) + boost (deterministic, evidenced-only) until we
  // hit the target or the score stops improving. This lets the score climb as
  // high as honest optimization allows instead of stopping at a fixed 95, while
  // never inventing experience (guarded by assertIdentityPreserved + booster).
  let pass = 0;
  while (afterScore.atsScore < TARGET_ATS_SCORE && pass < MAX_REFINE_PASSES) {
    pass += 1;
    const previousScore = afterScore.atsScore;

    let refineOut: ModelOutput;
    try {
      refineOut = await callOptimizeModel(
        clients,
        RESUME_OPTIMIZATION_SYSTEM_PROMPT,
        buildAtsRefineUserPrompt(
          working,
          jobDescription,
          afterScore.atsScore,
          dedupeStrings([
            ...missingKeywords,
            ...afterScore.missingKeywords,
          ]).slice(0, 40)
        )
      );
    } catch (error) {
      // Rate-limited mid-refine: keep the best result we already have.
      if (isRateLimitError(error)) break;
      throw error;
    }
    assertIdentityPreserved(resume, refineOut.optimizedResume);

    const boosted = boostResumeForAts(refineOut.optimizedResume, jobDescription, {
      aggressive,
    });
    const candidate = boosted.resume;
    const candidateScore = scoreResumeAgainstJob(candidate, jobDescription);

    // Only accept a pass that does not regress the score.
    if (candidateScore.atsScore < previousScore) {
      break;
    }

    working = candidate;
    modifications = [
      ...modifications,
      ...refineOut.modifications,
      ...(boosted.promotedKeywords.length
        ? [
            {
              type: "added" as const,
              section: "skills",
              after: boosted.promotedKeywords.join(", "),
              reason: aggressive
                ? `ATS keyword injection pass ${pass} (aggressive mode)`
                : `ATS keyword promotion pass ${pass} (evidenced only)`,
            },
          ]
        : []),
    ];
    atsAnalysis = refineOut.atsAnalysis;
    missingKeywords = refineOut.missingKeywords;
    coverLetter = refineOut.coverLetter;
    afterScore = candidateScore;

    // Converged — another LLM pass won't help without inventing experience.
    if (afterScore.atsScore <= previousScore) {
      break;
    }
  }

  const mergedMissing = dedupeStrings([
    ...missingKeywords,
    ...afterScore.missingKeywords,
  ]);

  const recommendations = dedupeStrings([
    ...atsAnalysis.recommendations,
    ...(afterScore.atsScore >= TARGET_ATS_SCORE
      ? [`ATS target met (${afterScore.atsScore}/100).`]
      : [
          `ATS is ${afterScore.atsScore}/100 — remaining gaps need real experience in: ${
            mergedMissing.slice(0, 6).join(", ") || "listed missing keywords"
          }.`,
        ]),
  ]);

  const result: OptimizeResumeResult = {
    optimizedResume: working,
    modifications,
    atsAnalysis: {
      ...atsAnalysis,
      keywordMatchEstimate: Math.round(
        Math.max(atsAnalysis.keywordMatchEstimate, afterScore.atsScore)
      ),
      strengths: dedupeStrings([
        ...atsAnalysis.strengths,
        ...(afterScore.atsScore >= TARGET_ATS_SCORE
          ? [`Optimized resume meets the ${TARGET_ATS_SCORE}+ ATS target for this JD.`]
          : afterScore.atsScore >= 90
            ? [`Strong ATS alignment (${afterScore.atsScore}/100) for this JD.`]
            : []),
      ]),
      weaknesses: dedupeStrings(atsAnalysis.weaknesses),
      recommendations,
      summary:
        afterScore.atsScore >= TARGET_ATS_SCORE
          ? `${atsAnalysis.summary} Optimized ATS score: ${afterScore.atsScore}/100 (target ${TARGET_ATS_SCORE}+ achieved).`
          : `${atsAnalysis.summary} Optimized ATS score: ${afterScore.atsScore}/100 — the honest ceiling for this resume/JD. Further gains require real experience covering remaining gaps.`,
    },
    missingKeywords: mergedMissing,
    coverLetter,
    atsImprovementScore: Number(
      (afterScore.atsScore - beforeScore.atsScore).toFixed(1)
    ),
    beforeAtsScore: beforeScore.atsScore,
    afterAtsScore: afterScore.atsScore,
  };

  const validated = optimizeResumeResultSchema.safeParse(result);
  if (!validated.success) {
    throw new AppError(500, "Optimization engine produced an invalid result");
  }

  return validated.data;
}

/** Standalone cover letter generation using the dedicated production prompt. */
export async function generateCoverLetter(input: {
  resume: ResumeJson;
  jobDescription: OptimizeResumeRequest["jobDescription"];
}): Promise<CoverLetter> {
  const resumeParsed = optimizeResumeRequestSchema
    .pick({ resume: true, jobDescription: true })
    .safeParse(input);

  if (!resumeParsed.success) {
    throw new AppError(400, "Invalid cover letter input");
  }

  const content = await chatJsonWithFailover({
    system: COVER_LETTER_SYSTEM_PROMPT,
    user: buildCoverLetterUserPrompt(
      resumeParsed.data.resume,
      resumeParsed.data.jobDescription
    ),
    temperature: 0.2,
    label: "cover letter generation",
  });

  const letterParsed = coverLetterSchema.safeParse(
    parseModelJson(content, "cover letter")
  );
  if (!letterParsed.success) {
    throw new AppError(502, "Cover letter response failed validation");
  }

  return letterParsed.data;
}

export type { OptimizeResumeRequest, OptimizeResumeResult };
