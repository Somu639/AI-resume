import type { JobTargetInput, ResumeScoringInput } from "../schema";
import {
  estimateResumeYears,
  extractSection,
  parseYearsRequired,
  textIncludesTerm,
} from "../utils";

export type ExperienceScoreResult = {
  score: number;
  yearsRequired: number | null;
  yearsDetected: number | null;
  relevanceHits: number;
};

export function scoreExperienceRelevance(
  resume: ResumeScoringInput,
  job: JobTargetInput
): ExperienceScoreResult {
  const experienceSection =
    extractSection(resume.resumeText, [
      "experience",
      "work experience",
      "employment",
      "professional experience",
    ]) || (resume.experience ?? []).join("\n");

  const corpus = experienceSection || resume.resumeText;
  const yearsRequired = parseYearsRequired(job.experience);
  const yearsDetected = estimateResumeYears(corpus);

  let yearsScore = 70;
  if (yearsRequired != null) {
    if (yearsDetected == null) {
      yearsScore = 45;
    } else if (yearsDetected >= yearsRequired) {
      yearsScore = 100;
    } else if (yearsDetected >= yearsRequired * 0.75) {
      yearsScore = 75;
    } else if (yearsDetected >= yearsRequired * 0.5) {
      yearsScore = 55;
    } else {
      yearsScore = 30;
    }
  }

  const relevanceTerms = [
    ...job.keywords.slice(0, 12),
    ...job.requiredSkills.slice(0, 12),
    ...job.tools.slice(0, 8),
    job.seniority,
  ].filter(Boolean);

  let relevanceHits = 0;
  for (const term of relevanceTerms) {
    if (textIncludesTerm(corpus, term)) relevanceHits += 1;
  }

  const relevanceScore =
    relevanceTerms.length === 0
      ? 70
      : (relevanceHits / relevanceTerms.length) * 100;

  const hasExperienceSection = experienceSection.trim().length > 40;
  const structureBonus = hasExperienceSection ? 8 : -10;

  const score = yearsScore * 0.55 + relevanceScore * 0.45 + structureBonus;

  return {
    score,
    yearsRequired,
    yearsDetected,
    relevanceHits,
  };
}
