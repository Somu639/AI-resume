import { z } from "zod";

export const resumeScoringInputSchema = z.object({
  resumeText: z
    .string()
    .trim()
    .min(40, "Resume text must be at least 40 characters")
    .max(100_000, "Resume text is too long"),
  skills: z.array(z.string().min(1)).optional(),
  experience: z.array(z.string().min(1)).optional(),
  projects: z.array(z.string().min(1)).optional(),
});

export const jobTargetSchema = z.object({
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  seniority: z.string().default(""),
  experience: z.string().default(""),
});

export const atsScoreRequestSchema = z.object({
  resume: resumeScoringInputSchema,
  job: jobTargetSchema,
});

export const atsScoreBreakdownSchema = z.object({
  keywordMatching: z.number().min(0).max(100),
  skillMatching: z.number().min(0).max(100),
  experienceRelevance: z.number().min(0).max(100),
  resumeFormatting: z.number().min(0).max(100),
  projectRelevance: z.number().min(0).max(100),
});

export const atsScoreResultSchema = z.object({
  atsScore: z.number().min(0).max(100),
  missingKeywords: z.array(z.string()),
  suggestions: z.array(z.string()),
  strengths: z.array(z.string()),
  weakSections: z.array(z.string()),
  insights: z.array(z.string()),
  breakdown: atsScoreBreakdownSchema,
});

export type ResumeScoringInput = z.infer<typeof resumeScoringInputSchema>;
export type JobTargetInput = z.infer<typeof jobTargetSchema>;
export type AtsScoreRequest = z.infer<typeof atsScoreRequestSchema>;
export type AtsScoreBreakdown = z.infer<typeof atsScoreBreakdownSchema>;
export type AtsScoreResult = z.infer<typeof atsScoreResultSchema>;
