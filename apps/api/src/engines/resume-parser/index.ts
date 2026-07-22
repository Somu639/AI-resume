import { z } from "zod";
import { AppError } from "../../middleware/errorHandler";

/**
 * Resume parser — extracts text from PDF/DOCX and maps common sections
 * into structured JSON. Heuristic (non-LLM) so it never invents experience.
 */

export const parsedResumeSchema = z.object({
  personalInfo: z.object({
    name: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    location: z.string().default(""),
    linkedin: z.string().default(""),
    github: z.string().default(""),
    website: z.string().default(""),
    summary: z.string().default(""),
  }),
  skills: z.array(z.string()).default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        location: z.string().optional().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string().optional().default(""),
        field: z.string().optional().default(""),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        details: z.array(z.string()).optional().default([]),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional().default(""),
        bullets: z.array(z.string()).default([]),
        technologies: z.array(z.string()).optional().default([]),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().optional().default(""),
        date: z.string().optional().default(""),
      })
    )
    .default([]),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Za-z0-9_-]+/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9_-]+/i;

const SECTION_HEADERS: Record<string, string[]> = {
  summary: ["summary", "profile", "professional summary", "about"],
  skills: ["skills", "technical skills", "core skills", "technologies"],
  experience: [
    "experience",
    "work experience",
    "employment",
    "professional experience",
  ],
  education: ["education", "academic"],
  projects: ["projects", "personal projects", "selected projects"],
  certifications: ["certifications", "certificates", "licenses"],
};

function normalizeLines(text: string): string[] {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function findSection(
  lines: string[],
  headers: string[]
): { start: number; end: number } | null {
  const headerRe = new RegExp(
    `^(${headers.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*:?$`,
    "i"
  );
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i] ?? "")) {
      start = i + 1;
      break;
    }
  }
  if (start < 0) return null;

  const allHeaders = Object.values(SECTION_HEADERS).flat();
  const nextRe = new RegExp(
    `^(${allHeaders.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*:?$`,
    "i"
  );
  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (nextRe.test(lines[i] ?? "")) {
      end = i;
      break;
    }
  }
  return { start, end };
}

function extractBullets(lines: string[]): string[] {
  return lines
    .filter((l) => /^[-•*·]/.test(l) || /^\d+\./.test(l))
    .map((l) => l.replace(/^[-•*·]\s*/, "").replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

function parseExperience(block: string[]): ParsedResume["experience"] {
  const items: ParsedResume["experience"] = [];
  let current: ParsedResume["experience"][number] | null = null;

  for (const line of block) {
    if (/^[-•*·]/.test(line) || /^\d+\./.test(line)) {
      const bullet = line.replace(/^[-•*·]\s*/, "").replace(/^\d+\.\s*/, "");
      if (current) current.bullets.push(bullet);
      continue;
    }

    // Title — Company  OR  Company — Title
    const parts = line.split(/\s+[—–|-]\s+/);
    if (parts.length >= 2) {
      if (current) items.push(current);
      current = {
        title: parts[0]!.trim(),
        company: parts.slice(1).join(" — ").trim(),
        location: "",
        startDate: "",
        endDate: "",
        bullets: [],
      };
      continue;
    }

    const dates = line.match(
      /\b((?:19|20)\d{2}|\w{3,9}\s+(?:19|20)\d{2})\s*[-–to]+\s*((?:19|20)\d{2}|present|current|\w{3,9}\s+(?:19|20)\d{2})/i
    );
    if (dates && current) {
      current.startDate = dates[1] ?? "";
      current.endDate = dates[2] ?? "";
    }
  }
  if (current) items.push(current);
  return items;
}

/**
 * Convert raw resume text into structured JSON without inventing facts.
 * Missing fields stay empty arrays/strings.
 */
export function structureResumeText(rawText: string): ParsedResume {
  const lines = normalizeLines(rawText);
  const email = rawText.match(EMAIL_RE)?.[0] ?? "";
  const phone = rawText.match(PHONE_RE)?.[0] ?? "";
  const linkedin = rawText.match(LINKEDIN_RE)?.[0] ?? "";
  const github = rawText.match(GITHUB_RE)?.[0] ?? "";

  // Name heuristic: first non-contact line
  const name =
    lines.find(
      (l) =>
        !EMAIL_RE.test(l) &&
        !PHONE_RE.test(l) &&
        !/^https?:/i.test(l) &&
        l.length < 80
    ) ?? "";

  const summaryRange = findSection(lines, SECTION_HEADERS.summary);
  const skillsRange = findSection(lines, SECTION_HEADERS.skills);
  const expRange = findSection(lines, SECTION_HEADERS.experience);
  const eduRange = findSection(lines, SECTION_HEADERS.education);
  const projRange = findSection(lines, SECTION_HEADERS.projects);
  const certRange = findSection(lines, SECTION_HEADERS.certifications);

  const summary = summaryRange
    ? lines.slice(summaryRange.start, summaryRange.end).join(" ")
    : "";

  const skillsLine = skillsRange
    ? lines.slice(skillsRange.start, skillsRange.end).join(" ")
    : "";
  const skills = skillsLine
    .split(/[,|•·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);

  const experience = expRange
    ? parseExperience(lines.slice(expRange.start, expRange.end))
    : [];

  const education = eduRange
    ? lines.slice(eduRange.start, eduRange.end).map((line) => ({
        institution: line,
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        details: [] as string[],
      }))
    : [];

  const projectLines = projRange
    ? lines.slice(projRange.start, projRange.end)
    : [];
  const projects =
    projectLines.length > 0
      ? [
          {
            name: projectLines[0] ?? "Project",
            description: "",
            bullets: extractBullets(projectLines),
            technologies: [] as string[],
          },
        ]
      : [];

  const certifications = certRange
    ? lines.slice(certRange.start, certRange.end).map((line) => ({
        name: line,
        issuer: "",
        date: "",
      }))
    : [];

  return parsedResumeSchema.parse({
    personalInfo: {
      name,
      email,
      phone,
      location: "",
      linkedin,
      github,
      website: "",
      summary,
    },
    skills,
    experience,
    education,
    projects,
    certifications,
  });
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    // Lazy-load pdf-parse (DOMMatrix/canvas — crashes Vercel if imported at cold start)
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return (result.text || "").trim();
    } finally {
      await parser.destroy();
    }
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || "").trim();
  }

  throw new AppError(
    415,
    "Unsupported file type. Upload PDF or DOCX only.",
    "UNSUPPORTED_MEDIA"
  );
}

export async function parseResumeBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; parsed: ParsedResume }> {
  const text = await extractTextFromBuffer(buffer, mimeType);
  if (text.length < 40) {
    throw new AppError(
      422,
      "Could not extract enough text from the resume",
      "PARSE_EMPTY"
    );
  }
  return { text, parsed: structureResumeText(text) };
}
