import type { ResumeScoringInput } from "../schema";
import {
  countBulletLines,
  extractSection,
  hasEmail,
  hasPhone,
} from "../utils";

export type FormattingScoreResult = {
  score: number;
  checks: Record<string, boolean>;
};

export function scoreResumeFormatting(
  resume: ResumeScoringInput
): FormattingScoreResult {
  const text = resume.resumeText;
  const length = text.trim().length;

  const checks = {
    hasEmail: hasEmail(text),
    hasPhone: hasPhone(text),
    hasExperienceSection:
      extractSection(text, ["experience", "work experience", "employment"])
        .length > 0,
    hasEducationSection:
      extractSection(text, ["education", "academic"]).length > 0,
    hasSkillsSection:
      extractSection(text, ["skills", "technical skills", "technologies"])
        .length > 0,
    hasBullets: countBulletLines(text) >= 3,
    reasonableLength: length >= 400 && length <= 12_000,
    notTooSparse: text.split(/\r?\n/).filter((l) => l.trim()).length >= 12,
  };

  const weights: Record<keyof typeof checks, number> = {
    hasEmail: 15,
    hasPhone: 10,
    hasExperienceSection: 20,
    hasEducationSection: 10,
    hasSkillsSection: 15,
    hasBullets: 15,
    reasonableLength: 10,
    notTooSparse: 5,
  };

  let earned = 0;
  let total = 0;
  for (const key of Object.keys(checks) as Array<keyof typeof checks>) {
    total += weights[key];
    if (checks[key]) earned += weights[key];
  }

  return {
    score: (earned / total) * 100,
    checks,
  };
}
