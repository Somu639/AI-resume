import { ATS_SCORE_WEIGHTS } from "@resumeai/shared";
import { AppError } from "../../middleware/errorHandler";
import { buildAtsInsights } from "./insights";
import {
  atsScoreRequestSchema,
  atsScoreResultSchema,
  type AtsScoreRequest,
  type AtsScoreResult,
} from "./schema";
import { scoreExperienceRelevance } from "./scores/experience";
import { scoreResumeFormatting } from "./scores/formatting";
import { scoreKeywordMatching } from "./scores/keywords";
import { scoreProjectRelevance } from "./scores/projects";
import { scoreSkillMatching } from "./scores/skills";
import { clampScore } from "./utils";

/**
 * ATS scoring engine.
 * Weighted composite:
 * - Keyword matching 35%
 * - Skill matching 25%
 * - Experience relevance 20%
 * - Resume formatting 10%
 * - Project relevance 10%
 */
export function scoreAts(input: AtsScoreRequest): AtsScoreResult {
  const parsed = atsScoreRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError(
      400,
      parsed.error.errors[0]?.message ?? "Invalid ATS scoring input"
    );
  }

  const { resume, job } = parsed.data;

  const keywords = scoreKeywordMatching(resume.resumeText, job);
  const skills = scoreSkillMatching(resume, job);
  const experience = scoreExperienceRelevance(resume, job);
  const formatting = scoreResumeFormatting(resume);
  const projects = scoreProjectRelevance(resume, job);

  const breakdown = {
    keywordMatching: clampScore(keywords.score),
    skillMatching: clampScore(skills.score),
    experienceRelevance: clampScore(experience.score),
    resumeFormatting: clampScore(formatting.score),
    projectRelevance: clampScore(projects.score),
  };

  const weighted =
    breakdown.keywordMatching * ATS_SCORE_WEIGHTS.keywordMatching +
    breakdown.skillMatching * ATS_SCORE_WEIGHTS.skillMatching +
    breakdown.experienceRelevance * ATS_SCORE_WEIGHTS.experienceRelevance +
    breakdown.resumeFormatting * ATS_SCORE_WEIGHTS.resumeFormatting +
    breakdown.projectRelevance * ATS_SCORE_WEIGHTS.projectRelevance;

  const atsScore = clampScore(weighted);

  const narrative = buildAtsInsights({
    breakdown,
    atsScore,
    keywords,
    skills,
    experience,
    formatting,
    projects,
  });

  const result: AtsScoreResult = {
    atsScore,
    ...narrative,
    breakdown,
  };

  const validated = atsScoreResultSchema.safeParse(result);
  if (!validated.success) {
    throw new AppError(500, "ATS scoring produced an invalid result payload");
  }

  return validated.data;
}

export type { AtsScoreRequest, AtsScoreResult };
