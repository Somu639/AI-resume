import type { JobTargetInput } from "../schema";
import { dedupePreserveOrder, textIncludesTerm } from "../utils";

export type KeywordMatchResult = {
  score: number;
  matched: string[];
  missing: string[];
  targetKeywords: string[];
};

export function scoreKeywordMatching(
  resumeText: string,
  job: JobTargetInput
): KeywordMatchResult {
  // Prefer concrete skills/tools/keywords — long responsibility clauses
  // inflate "missing" counts and unfairly tank ATS scores.
  const targetKeywords = dedupePreserveOrder(
    [...job.keywords, ...job.tools, ...job.requiredSkills, ...job.preferredSkills]
      .map((k) => k.trim())
      .filter((k) => k.length >= 2 && k.length <= 40)
  );

  if (targetKeywords.length === 0) {
    return { score: 85, matched: [], missing: [], targetKeywords: [] };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const keyword of targetKeywords) {
    if (textIncludesTerm(resumeText, keyword)) matched.push(keyword);
    else missing.push(keyword);
  }

  const score = (matched.length / targetKeywords.length) * 100;
  return { score, matched, missing, targetKeywords };
}
