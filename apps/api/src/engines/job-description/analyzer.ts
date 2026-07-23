import { AppError } from "../../middleware/errorHandler";
import { chatJsonWithFailover } from "../../lib/openai";
import {
  analyzeJobDescriptionInputSchema,
  jobDescriptionAnalysisSchema,
  type JobDescriptionAnalysisResult,
} from "./schema";
import {
  JD_ANALYSIS_SYSTEM_PROMPT,
  buildJdAnalysisUserPrompt,
} from "./prompts";

function normalizeList(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function normalizeAnalysis(
  data: JobDescriptionAnalysisResult
): JobDescriptionAnalysisResult {
  return {
    requiredSkills: normalizeList(data.requiredSkills),
    preferredSkills: normalizeList(data.preferredSkills),
    tools: normalizeList(data.tools),
    responsibilities: normalizeList(data.responsibilities),
    keywords: normalizeList(data.keywords),
    seniority: data.seniority.trim(),
    experience: data.experience.trim(),
  };
}

function parseModelJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(raw);
  } catch {
    throw new AppError(502, "OpenAI returned invalid JSON for JD analysis");
  }
}

/**
 * Job description analysis engine.
 * Uses OpenAI to classify skills, tools, responsibilities, keywords, seniority, and experience.
 */
export async function analyzeJobDescription(
  rawJobDescription: string
): Promise<JobDescriptionAnalysisResult> {
  const input = analyzeJobDescriptionInputSchema.safeParse({
    jobDescription: rawJobDescription,
  });

  if (!input.success) {
    throw new AppError(
      400,
      input.error.errors[0]?.message ?? "Invalid job description input"
    );
  }

  const content = await chatJsonWithFailover({
    system: JD_ANALYSIS_SYSTEM_PROMPT,
    user: buildJdAnalysisUserPrompt(input.data.jobDescription),
    temperature: 0.1,
    label: "JD analysis",
  });

  const parsed = parseModelJson(content);
  const validated = jobDescriptionAnalysisSchema.safeParse(parsed);

  if (!validated.success) {
    throw new AppError(
      502,
      `JD analysis response failed validation: ${validated.error.errors
        .map((e) => e.message)
        .join("; ")}`
    );
  }

  return normalizeAnalysis(validated.data);
}

export type { JobDescriptionAnalysisResult };
