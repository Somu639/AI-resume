import { textIncludesTerm } from "../ats-scoring/utils";
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

/**
 * Deterministic ATS booster â€” only promotes JD terms already evidenced
 * in the resume corpus (never invents employers/roles/metrics).
 */
export function boostResumeForAts(
  resume: ResumeJson,
  job: Job
): { resume: ResumeJson; promotedKeywords: string[] } {
  const corpus = resumeJsonToText(resume);
  const jdTerms = collectJdTerms(job);
  const promotedKeywords: string[] = [];

  const existingSkills = [...resume.skills];
  const skillKeys = new Set(existingSkills.map((s) => s.toLowerCase()));

  for (const term of jdTerms) {
    if (skillKeys.has(term.toLowerCase())) continue;
    if (!corpusIncludes(corpus, term)) continue;
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

  // Strengthen summary with evidenced JD terms (no new claims)
  let summary = resume.personalInfo.summary?.trim() ?? "";
  const summaryMissing = jdTerms
    .filter((t) => corpusIncludes(corpus, t) && !corpusIncludes(summary, t))
    .slice(0, 8);
  if (summaryMissing.length) {
    const keywordClause = summaryMissing.join(", ");
    if (summary) {
      summary = `${summary} Core strengths aligned to this role include ${keywordClause}.`;
    } else {
      summary = `Professional with experience spanning ${keywordClause}.`;
    }
  }

  // Ensure enough action bullets for formatting score (duplicate-safe pad from existing)
  const experience = resume.experience.map((jobItem) => {
    const bullets = [...jobItem.bullets];
    if (bullets.length === 0 && jobItem.title) {
      bullets.push(
        `Contributed as ${jobItem.title} at ${jobItem.company}`.trim()
      );
    }
    return { ...jobItem, bullets };
  });

  // Mirror evidenced tools into project technologies when projects exist
  const projects = resume.projects.map((project) => {
    const tech = [...(project.technologies ?? [])];
    const techKeys = new Set(tech.map((t) => t.toLowerCase()));
    const projectCorpus = [
      project.name,
      project.description ?? "",
      ...project.bullets,
      ...tech,
    ].join("\n");
    for (const term of jdTerms.slice(0, 15)) {
      if (techKeys.has(term.toLowerCase())) continue;
      if (!corpusIncludes(projectCorpus, term) && !corpusIncludes(corpus, term)) {
        continue;
      }
      // Only attach if already evidenced somewhere on resume
      if (!corpusIncludes(corpus, term)) continue;
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
