import { z } from "zod";

export const jobDescriptionAnalysisSchema = z.object({
  requiredSkills: z.array(z.string().min(1)).default([]),
  preferredSkills: z.array(z.string().min(1)).default([]),
  tools: z.array(z.string().min(1)).default([]),
  responsibilities: z.array(z.string().min(1)).default([]),
  keywords: z.array(z.string().min(1)).default([]),
  seniority: z.string().default(""),
  experience: z.string().default(""),
});

export type JobDescriptionAnalysisResult = z.infer<
  typeof jobDescriptionAnalysisSchema
>;

export const analyzeJobDescriptionInputSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(40, "Job description must be at least 40 characters")
    .max(50_000, "Job description is too long (max 50,000 characters)"),
});
