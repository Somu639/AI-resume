import { parseYearsRequired, textIncludesTerm } from "../ats-scoring/utils";
import type { OptimizeResumeRequest, ResumeJson } from "./schema";
import { resumeJsonToText } from "./serialize";

type Job = OptimizeResumeRequest["jobDescription"];

const TECH_ALIASES: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "es6", "es2015"],
  typescript: ["ts"],
  "node.js": ["nodejs", "node"],
  react: ["reactjs", "react.js"],
  "next.js": ["nextjs", "next"],
  postgresql: ["postgres", "psql"],
  mongodb: ["mongo"],
  k8s: ["kubernetes"],
  aws: ["amazon web services", "ec2", "s3", "lambda"],
  docker: ["containers", "containerization"],
  ci: ["ci/cd", "continuous integration"],
  cd: ["ci/cd", "continuous delivery", "continuous deployment"],
  ml: ["machine learning"],
  ai: ["artificial intelligence"],
  ui: ["user interface"],
  ux: ["user experience"],
};

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.+#]/g, "");
}

function corpusIncludes(corpus: string, term: string): boolean {
  if (textIncludesTerm(corpus, term)) return true;
  const key = normalizeKey(term);
  const aliases = TECH_ALIASES[key] ?? [];
  for (const alias of aliases) {
    if (textIncludesTerm(corpus, alias)) return true;
  }
  // Also check if any alias key maps to this term
  for (const [canonical, list] of Object.entries(TECH_ALIASES)) {
    if (list.some((a) => normalizeKey(a) === key)) {
      if (textIncludesTerm(corpus, canonical)) return true;
    }
  }
  return false;
}

function collectJdTerms(job: Job): string[] {
  const raw = [
    ...job.requiredSkills,
    ...job.preferredSkills,
    ...job.tools,
    ...job.keywords,
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const term of raw) {
    const trimmed = term.trim().replace(/\s+/g, " ");
    if (trimmed.length < 2 || trimmed.length > 48) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export type BoostOptions = {
  /**
   * Aggressive keyword mode: inject EVERY JD term (skills/tools/keywords) into
   * the resume regardless of whether it is evidenced, and assert the JD's
   * required years of experience. This maximizes ATS keyword coverage to push
   * the score >95, at the cost of adding skills the candidate may not hold.
   * Off by default — honest, evidenced-only boosting is the default.
   */
  aggressive?: boolean;
};

/**
 * Deterministic ATS booster.
 * Default: only promotes JD terms already evidenced in the resume corpus
 * (never invents employers/roles/metrics).
 * Aggressive: promotes all JD terms for maximum ATS coverage (keyword-stuffing).
 */
export function boostResumeForAts(
  resume: ResumeJson,
  job: Job,
  options: BoostOptions = {}
): { resume: ResumeJson; promotedKeywords: string[] } {
  const aggressive = Boolean(options.aggressive);
  const corpus = resumeJsonToText(resume);
  const jdTerms = collectJdTerms(job);
  const promotedKeywords: string[] = [];

  const existingSkills = [...resume.skills];
  const skillKeys = new Set(existingSkills.map((s) => s.toLowerCase()));

  for (const term of jdTerms) {
    if (skillKeys.has(term.toLowerCase())) continue;
    // Honest mode requires evidence; aggressive mode injects unconditionally.
    if (!aggressive && !corpusIncludes(corpus, term)) continue;
    existingSkills.push(term);
    skillKeys.add(term.toLowerCase());
    promotedKeywords.push(term);
  }

  // Prioritize JD-aligned skills first for ATS parsers
  const prioritized = [
    ...jdTerms.filter((t) => skillKeys.has(t.toLowerCase())),
    ...existingSkills.filter(
      (s) => !jdTerms.some((t) => t.toLowerCase() === s.toLowerCase())
    ),
  ];
  const dedupedSkills: string[] = [];
  const seenSkill = new Set<string>();
  for (const skill of prioritized) {
    const key = skill.toLowerCase();
    if (seenSkill.has(key)) continue;
    seenSkill.add(key);
    dedupedSkills.push(skill);
  }

  // Strengthen summary with JD terms.
  let summary = resume.personalInfo.summary?.trim() ?? "";
  const summaryMissing = jdTerms
    .filter((t) => (aggressive || corpusIncludes(corpus, t)) && !corpusIncludes(summary, t))
    .slice(0, aggressive ? 20 : 8);
  if (summaryMissing.length) {
    const keywordClause = summaryMissing.join(", ");
    if (summary) {
      summary = `${summary} Core strengths aligned to this role include ${keywordClause}.`;
    } else {
      summary = `Professional with experience spanning ${keywordClause}.`;
    }
  }

  // Aggressive mode: assert the JD's required years so the experience-years
  // sub-score clears the bar (keyword-stuffing tradeoff, accepted by the user).
  if (aggressive) {
    const yearsRequired = parseYearsRequired(job.experience);
    if (yearsRequired != null && !/\b\d+\s*\+?\s*years?\b/i.test(summary)) {
      summary = `${yearsRequired}+ years of professional experience. ${summary}`.trim();
    }
  }

  // Surface evidenced JD terms into each experience entry so the experience
  // relevance sub-score reaches its honest ceiling in a single pass. We only
  // add a term when it is already evidenced within THAT SAME role's own text
  // (title/company/bullets, alias-aware) but not yet present verbatim — this
  // never invents work the candidate didn't do at that role.
  const experience = resume.experience.map((jobItem) => {
    const bullets = [...jobItem.bullets];
    const entryText = [jobItem.title, jobItem.company, ...bullets].join("\n");
    const bulletsText = bullets.join("\n");

    const surfaced: string[] = [];
    const seenHere = new Set<string>();
    for (const term of jdTerms) {
      const key = term.toLowerCase();
      if (seenHere.has(key)) continue;
      // Present verbatim already? skip.
      if (textIncludesTerm(bulletsText, term)) continue;
      // Honest mode: only surface terms evidenced in this role (alias-aware).
      // Aggressive mode: surface all JD terms.
      if (!aggressive && !corpusIncludes(entryText, term)) continue;
      seenHere.add(key);
      surfaced.push(term);
    }

    if (surfaced.length) {
      bullets.push(
        `Key tools & technologies: ${surfaced.slice(0, aggressive ? 24 : 14).join(", ")}`
      );
    }

    if (bullets.length === 0 && jobItem.title) {
      bullets.push(
        `Contributed as ${jobItem.title} at ${jobItem.company}`.trim()
      );
    }
    return { ...jobItem, bullets };
  });

  // Mirror JD tools into project technologies when projects exist.
  const projects = resume.projects.map((project) => {
    const tech = [...(project.technologies ?? [])];
    const techKeys = new Set(tech.map((t) => t.toLowerCase()));
    for (const term of jdTerms.slice(0, aggressive ? jdTerms.length : 15)) {
      if (techKeys.has(term.toLowerCase())) continue;
      // Honest mode: only attach terms already evidenced somewhere on resume.
      if (!aggressive && !corpusIncludes(corpus, term)) continue;
      tech.push(term);
      techKeys.add(term.toLowerCase());
      if (!promotedKeywords.includes(term)) promotedKeywords.push(term);
    }
    return { ...project, technologies: tech };
  });

  return {
    resume: {
      ...resume,
      personalInfo: {
        ...resume.personalInfo,
        summary,
      },
      skills: dedupedSkills,
      experience,
      projects,
    },
    promotedKeywords,
  };
}

export { collectJdTerms, corpusIncludes };
