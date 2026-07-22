import { z } from "zod";
import { jobDescriptionAnalysisSchema } from "../job-description/schema";

/**
 * LLMs (esp. Groq) often return a string field as a string[] of lines/bullets.
 * Coerce those into a single string so validation doesn't fail.
 */
const flexibleString = z.preprocess((val) => {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (item == null) return "";
        if (typeof item === "string") return item;
        if (typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }
        if (typeof item === "object" && "text" in (item as object)) {
          return String((item as { text: unknown }).text ?? "");
        }
        return JSON.stringify(item);
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}, z.string());

const flexibleStringMin1 = flexibleString.pipe(z.string().min(1));

const flexibleStringArray = z.preprocess((val) => {
  if (val == null) return [];
  if (Array.isArray(val)) {
    return val.flatMap((item) => {
      if (item == null) return [];
      if (typeof item === "string") return [item];
      if (typeof item === "number" || typeof item === "boolean") {
        return [String(item)];
      }
      if (typeof item === "object" && item !== null && "name" in item) {
        return [String((item as { name: unknown }).name ?? "")];
      }
      return [JSON.stringify(item)];
    });
  }
  if (typeof val === "string") {
    return val
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [String(val)];
}, z.array(z.string()));

const flexibleNumber = z.preprocess((val) => {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const n = Number(val.replace(/%/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}, z.number());

export const personalInfoSchema = z.object({
  name: flexibleStringMin1,
  email: flexibleString.pipe(z.string().email("Valid email is required")),
  phone: flexibleString.optional().default(""),
  location: flexibleString.optional().default(""),
  linkedin: flexibleString.optional().default(""),
  github: flexibleString.optional().default(""),
  website: flexibleString.optional().default(""),
  summary: flexibleString.optional().default(""),
});

export const experienceItemSchema = z.object({
  company: flexibleStringMin1,
  title: flexibleStringMin1,
  location: flexibleString.optional().default(""),
  startDate: flexibleString.optional().default(""),
  endDate: flexibleString.optional().default(""),
  bullets: flexibleStringArray.default([]),
});

export const educationItemSchema = z.object({
  institution: flexibleStringMin1,
  degree: flexibleString.optional().default(""),
  field: flexibleString.optional().default(""),
  startDate: flexibleString.optional().default(""),
  endDate: flexibleString.optional().default(""),
  details: flexibleStringArray.optional().default([]),
});

export const projectItemSchema = z.object({
  name: flexibleStringMin1,
  description: flexibleString.optional().default(""),
  bullets: flexibleStringArray.default([]),
  technologies: flexibleStringArray.optional().default([]),
  url: flexibleString.optional().default(""),
});

export const certificationItemSchema = z.object({
  name: flexibleStringMin1,
  issuer: flexibleString.optional().default(""),
  date: flexibleString.optional().default(""),
});

export const resumeJsonSchema = z.object({
  personalInfo: personalInfoSchema,
  skills: flexibleStringArray.default([]),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  certifications: z.array(certificationItemSchema).default([]),
});

export const resumeModificationSchema = z.object({
  type: z.preprocess((val) => {
    const s = String(val ?? "modified").toLowerCase();
    if (s === "added" || s === "removed" || s === "modified") return s;
    if (s.includes("add")) return "added";
    if (s.includes("remov") || s.includes("delet")) return "removed";
    return "modified";
  }, z.enum(["added", "removed", "modified"])),
  section: flexibleStringMin1,
  before: flexibleString.optional(),
  after: flexibleString.optional(),
  reason: flexibleString.optional(),
});

export const atsAnalysisSchema = z.object({
  summary: flexibleStringMin1,
  strengths: flexibleStringArray.default([]),
  weaknesses: flexibleStringArray.default([]),
  keywordMatchEstimate: flexibleNumber.pipe(z.number().min(0).max(100)),
  recommendations: flexibleStringArray.default([]),
});

export const coverLetterSchema = z.object({
  greeting: flexibleStringMin1,
  body: flexibleStringMin1,
  closing: flexibleStringMin1,
});

/** Job description JSON = classified JD analysis payload. */
export const jobDescriptionJsonSchema = jobDescriptionAnalysisSchema;

export const optimizeResumeRequestSchema = z.object({
  resume: resumeJsonSchema,
  jobDescription: jobDescriptionJsonSchema,
  /** When set with an authenticated user, persist a new ResumeVersion */
  resumeId: z.string().min(1).optional(),
});

export const optimizeResumeModelOutputSchema = z.object({
  optimizedResume: resumeJsonSchema,
  modifications: z.array(resumeModificationSchema).default([]),
  atsAnalysis: atsAnalysisSchema,
  missingKeywords: flexibleStringArray.default([]),
  coverLetter: coverLetterSchema,
});

export const optimizeResumeResultSchema = z.object({
  optimizedResume: resumeJsonSchema,
  modifications: z.array(resumeModificationSchema),
  atsAnalysis: atsAnalysisSchema,
  missingKeywords: z.array(z.string()),
  coverLetter: coverLetterSchema,
  atsImprovementScore: z.number(),
  beforeAtsScore: z.number().min(0).max(100),
  afterAtsScore: z.number().min(0).max(100),
});

export type ResumeJson = z.infer<typeof resumeJsonSchema>;
export type ResumeModification = z.infer<typeof resumeModificationSchema>;
export type AtsAnalysis = z.infer<typeof atsAnalysisSchema>;
export type CoverLetter = z.infer<typeof coverLetterSchema>;
export type OptimizeResumeRequest = z.infer<typeof optimizeResumeRequestSchema>;
export type OptimizeResumeResult = z.infer<typeof optimizeResumeResultSchema>;
