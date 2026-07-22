import type { JobTargetInput, ResumeScoringInput } from "../schema";
import {
  dedupePreserveOrder,
  extractSection,
  textIncludesTerm,
} from "../utils";

export type ProjectScoreResult = {
  score: number;
  matched: string[];
  hasProjectsSection: boolean;
};

export function scoreProjectRelevance(
  resume: ResumeScoringInput,
  job: JobTargetInput
): ProjectScoreResult {
  const projectsSection =
    extractSection(resume.resumeText, [
      "projects",
      "project",
      "personal projects",
      "selected projects",
    ]) || (resume.projects ?? []).join("\n");

  const hasProjectsSection = projectsSection.trim().length > 20;
  const corpus = hasProjectsSection ? projectsSection : resume.resumeText;

  const terms = dedupePreserveOrder([
    ...job.keywords,
    ...job.requiredSkills,
    ...job.tools,
  ]);

  if (terms.length === 0) {
    return {
      score: hasProjectsSection ? 75 : 55,
      matched: [],
      hasProjectsSection,
    };
  }

  const matched: string[] = [];
  for (const term of terms) {
    if (textIncludesTerm(corpus, term)) matched.push(term);
  }

  const base = (matched.length / terms.length) * 100;
  // Use full-resume fallback more generously when projects aren't listed separately
  const score = hasProjectsSection ? base : Math.max(base * 0.85, base - 8);

  return { score, matched, hasProjectsSection };
}
