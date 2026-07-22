import { ATS_WEAK_SECTION_THRESHOLD } from "@resumeai/shared";
import type { AtsScoreBreakdown, AtsScoreResult } from "./schema";
import type { ExperienceScoreResult } from "./scores/experience";
import type { FormattingScoreResult } from "./scores/formatting";
import type { KeywordMatchResult } from "./scores/keywords";
import type { ProjectScoreResult } from "./scores/projects";
import type { SkillMatchResult } from "./scores/skills";
import { dedupePreserveOrder } from "./utils";

const SECTION_LABELS: Record<keyof AtsScoreBreakdown, string> = {
  keywordMatching: "Keywords",
  skillMatching: "Skills",
  experienceRelevance: "Experience",
  resumeFormatting: "Formatting",
  projectRelevance: "Projects",
};

export function buildAtsInsights(input: {
  breakdown: AtsScoreBreakdown;
  atsScore: number;
  keywords: KeywordMatchResult;
  skills: SkillMatchResult;
  experience: ExperienceScoreResult;
  formatting: FormattingScoreResult;
  projects: ProjectScoreResult;
}): Pick<
  AtsScoreResult,
  "missingKeywords" | "suggestions" | "strengths" | "weakSections" | "insights"
> {
  const {
    breakdown,
    atsScore,
    keywords,
    skills,
    experience,
    formatting,
    projects,
  } = input;

  const missingKeywords = dedupePreserveOrder([
    ...keywords.missing.slice(0, 20),
    ...skills.missingRequired.slice(0, 15),
  ]);

  const weakSections = (
    Object.entries(breakdown) as Array<[keyof AtsScoreBreakdown, number]>
  )
    .filter(([, score]) => score < ATS_WEAK_SECTION_THRESHOLD)
    .sort((a, b) => a[1] - b[1])
    .map(([key]) => SECTION_LABELS[key]);

  const suggestions: string[] = [];
  const strengths: string[] = [];
  const insights: string[] = [];

  if (skills.missingRequired.length) {
    suggestions.push(
      `Add required skills that are missing: ${skills.missingRequired
        .slice(0, 6)
        .join(", ")}.`
    );
  }

  if (keywords.missing.length) {
    suggestions.push(
      `Weave in missing JD keywords naturally: ${keywords.missing
        .slice(0, 6)
        .join(", ")}.`
    );
  }

  if (experience.yearsRequired != null && experience.yearsDetected != null) {
    if (experience.yearsDetected < experience.yearsRequired) {
      suggestions.push(
        `Highlight transferable experience — JD asks for ~${experience.yearsRequired}+ years; resume signals ~${experience.yearsDetected}.`
      );
    } else {
      strengths.push(
        `Experience depth meets or exceeds the JD requirement (~${experience.yearsRequired}+ years).`
      );
    }
  } else if (!experience.yearsDetected) {
    suggestions.push(
      "Quantify tenure (e.g. “3 years”) or use clear date ranges in experience bullets."
    );
  }

  if (!formatting.checks.hasSkillsSection) {
    suggestions.push(
      "Add a dedicated Skills section with ATS-friendly keywords."
    );
  }
  if (!formatting.checks.hasBullets) {
    suggestions.push(
      "Use bullet points for achievements so parsers can extract impact cleanly."
    );
  }
  if (!formatting.checks.hasEmail) {
    suggestions.push("Include a professional email address in the header.");
  }
  if (!projects.hasProjectsSection) {
    suggestions.push(
      "Add a Projects section showcasing tools and outcomes aligned to the JD."
    );
  } else if (breakdown.projectRelevance >= 75) {
    strengths.push("Projects align well with the job’s tools and keywords.");
  }

  if (breakdown.keywordMatching >= 80) {
    strengths.push("Strong keyword coverage against the job description.");
  }
  if (breakdown.skillMatching >= 80) {
    strengths.push("Core required skills are well represented.");
  }
  if (breakdown.resumeFormatting >= 80) {
    strengths.push("Resume structure looks ATS-friendly (sections + contact).");
  }

  if (suggestions.length === 0 && atsScore >= 85) {
    suggestions.push(
      "Score is strong — tailor the summary to mirror the top 3 JD priorities."
    );
  }

  insights.push(
    `Composite ATS score is ${atsScore}/100 using weighted keyword (35%), skills (25%), experience (20%), formatting (10%), and projects (10%).`
  );

  if (weakSections.length) {
    insights.push(
      `Weakest areas: ${weakSections.join(", ")}. Prioritize fixing these first for the largest score lift.`
    );
  } else {
    insights.push(
      "No major weak sections detected — refine wording for senior impact and metrics."
    );
  }

  const coverage =
    keywords.targetKeywords.length === 0
      ? null
      : Math.round(
          (keywords.matched.length / keywords.targetKeywords.length) * 100
        );
  if (coverage != null) {
    insights.push(
      `Keyword coverage: ${keywords.matched.length}/${keywords.targetKeywords.length} (${coverage}%).`
    );
  }

  if (skills.missingRequired.length) {
    insights.push(
      `${skills.missingRequired.length} required skill(s) appear missing from the resume.`
    );
  }

  return {
    missingKeywords,
    suggestions: dedupePreserveOrder(suggestions).slice(0, 8),
    strengths: dedupePreserveOrder(strengths).slice(0, 6),
    weakSections,
    insights: dedupePreserveOrder(insights).slice(0, 6),
  };
}
