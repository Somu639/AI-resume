import type { JobTargetInput, ResumeScoringInput } from "../schema";
import {
  dedupePreserveOrder,
  extractSection,
  textIncludesTerm,
} from "../utils";

export type SkillMatchResult = {
  score: number;
  matchedRequired: string[];
  missingRequired: string[];
  matchedPreferred: string[];
  missingPreferred: string[];
};

function resumeSkillCorpus(resume: ResumeScoringInput): string {
  const skillsSection = extractSection(resume.resumeText, [
    "skills",
    "technical skills",
    "core skills",
    "technologies",
  ]);
  const listed = (resume.skills ?? []).join("\n");
  return `${skillsSection}\n${listed}\n${resume.resumeText}`;
}

export function scoreSkillMatching(
  resume: ResumeScoringInput,
  job: JobTargetInput
): SkillMatchResult {
  const corpus = resumeSkillCorpus(resume);
  const required = dedupePreserveOrder(job.requiredSkills);
  const preferred = dedupePreserveOrder(job.preferredSkills);

  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];
  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];

  for (const skill of required) {
    if (textIncludesTerm(corpus, skill)) matchedRequired.push(skill);
    else missingRequired.push(skill);
  }

  for (const skill of preferred) {
    if (textIncludesTerm(corpus, skill)) matchedPreferred.push(skill);
    else missingPreferred.push(skill);
  }

  const requiredScore =
    required.length === 0
      ? 75
      : (matchedRequired.length / required.length) * 100;

  const preferredScore =
    preferred.length === 0
      ? 75
      : (matchedPreferred.length / preferred.length) * 100;

  // Required skills dominate the skill dimension.
  const score = requiredScore * 0.7 + preferredScore * 0.3;

  return {
    score,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    missingPreferred,
  };
}
