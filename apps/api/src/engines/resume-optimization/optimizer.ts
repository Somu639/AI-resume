import OpenAI from "openai";
import { AppError } from "../../middleware/errorHandler";
import { createLlmClient, getLlmModel } from "../../lib/openai";
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

const TARGET_ATS_SCORE = 95;

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
  client: OpenAI,
  system: string,
  user: string
): Promise<ModelOutput> {
  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await client.chat.completions.create({
      model: getLlmModel(),
      temperature: 0.12,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown OpenAI error";
    throw new AppError(502, `OpenAI resume optimization failed: ${message}`);
  }

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new AppError(502, "OpenAI returned an empty optimization response");
  }

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
 * AI resume optimization engine.
 * Targets ATS ≥ 95 via LLM pass(es) + deterministic evidenced-keyword booster.
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

  const { resume, jobDescription } = parsed.data;
  const beforeScore = scoreResumeAgainstJob(resume, jobDescription);
  const client = createLlmClient();

  let modelOut = await callOptimizeModel(
    client,
    RESUME_OPTIMIZATION_SYSTEM_PROMPT,
    buildResumeOptimizationUserPrompt(resume, jobDescription)
  );
  assertIdentityPreserved(resume, modelOut.optimizedResume);

  let working = modelOut.optimizedResume;
  let modifications = [...modelOut.modifications];
  let atsAnalysis = modelOut.atsAnalysis;
  let missingKeywords = modelOut.missingKeywords;
  let coverLetter = modelOut.coverLetter;

  {
    const boosted = boostResumeForAts(working, jobDescription);
    if (boosted.promotedKeywords.length) {
      modifications.push({
        type: "added",
        section: "skills",
        after: boosted.promotedKeywords.join(", "),
        reason:
          "Promoted JD keywords already evidenced in the resume for ATS parsers",
      });
    }
    working = boosted.resume;
  }

  let afterScore = scoreResumeAgainstJob(working, jobDescription);

  if (afterScore.atsScore < TARGET_ATS_SCORE) {
    const refineOut = await callOptimizeModel(
      client,
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
    assertIdentityPreserved(resume, refineOut.optimizedResume);

    const boosted = boostResumeForAts(
      refineOut.optimizedResume,
      jobDescription
    );
    working = boosted.resume;
    modifications = [
      ...modifications,
      ...refineOut.modifications,
      ...(boosted.promotedKeywords.length
        ? [
            {
              type: "added" as const,
              section: "skills",
              after: boosted.promotedKeywords.join(", "),
              reason: "Second-pass ATS keyword promotion (evidenced only)",
            },
          ]
        : []),
    ];
    atsAnalysis = refineOut.atsAnalysis;
    missingKeywords = refineOut.missingKeywords;
    coverLetter = refineOut.coverLetter;
    afterScore = scoreResumeAgainstJob(working, jobDescription);
  }

  if (afterScore.atsScore < TARGET_ATS_SCORE) {
    const boosted = boostResumeForAts(working, jobDescription);
    working = boosted.resume;
    afterScore = scoreResumeAgainstJob(working, jobDescription);
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
          ? ["Optimized resume meets the 95+ ATS target for this JD."]
          : []),
      ]),
      weaknesses: dedupeStrings(atsAnalysis.weaknesses),
      recommendations,
      summary:
        afterScore.atsScore >= TARGET_ATS_SCORE
          ? `${atsAnalysis.summary} Optimized ATS score: ${afterScore.atsScore}/100 (target 95+ achieved).`
          : `${atsAnalysis.summary} Optimized ATS score: ${afterScore.atsScore}/100. Further gains require real experience covering remaining gaps.`,
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

  const client = createLlmClient();
  let completion: OpenAI.Chat.Completions.ChatCompletion;

  try {
    completion = await client.chat.completions.create({
      model: getLlmModel(),
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: COVER_LETTER_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildCoverLetterUserPrompt(
            resumeParsed.data.resume,
            resumeParsed.data.jobDescription
          ),
        },
      ],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown OpenAI error";
    throw new AppError(502, `OpenAI cover letter generation failed: ${message}`);
  }

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new AppError(502, "OpenAI returned an empty cover letter response");
  }

  const letterParsed = coverLetterSchema.safeParse(
    parseModelJson(content, "cover letter")
  );
  if (!letterParsed.success) {
    throw new AppError(502, "Cover letter response failed validation");
  }

  return letterParsed.data;
}

export type { OptimizeResumeRequest, OptimizeResumeResult };
