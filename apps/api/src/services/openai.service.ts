import { analyzeJobDescription } from "../engines/job-description";
import {
  generateCoverLetter,
  optimizeResume,
} from "../engines/resume-optimization";

/**
 * OpenAI service — keyword extraction, analysis, resume rewrite, cover letter.
 * All prompts return structured JSON validated with Zod.
 */
export const openaiService = {
  async extractKeywords(jobDescription: string) {
    return analyzeJobDescription(jobDescription);
  },

  async analyzeResume(_input: {
    resumeText: string;
    jobDescription: string;
    keywords: unknown;
  }) {
    throw new Error("Not implemented: openaiService.analyzeResume");
  },

  async generateOptimizedResume(input: {
    resume: Parameters<typeof optimizeResume>[0]["resume"];
    jobDescription: Parameters<typeof optimizeResume>[0]["jobDescription"];
    aggressive?: boolean;
  }) {
    return optimizeResume({ aggressive: false, ...input });
  },

  async generateCoverLetter(input: {
    resume: Parameters<typeof generateCoverLetter>[0]["resume"];
    jobDescription: Parameters<typeof generateCoverLetter>[0]["jobDescription"];
  }) {
    return generateCoverLetter(input);
  },
};
