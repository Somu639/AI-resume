export { optimizeResume, generateCoverLetter } from "./optimizer";
export type { OptimizeResumeRequest, OptimizeResumeResult } from "./optimizer";
export {
  optimizeResumeRequestSchema,
  optimizeResumeResultSchema,
  resumeJsonSchema,
  resumeModificationSchema,
  atsAnalysisSchema,
  coverLetterSchema,
} from "./schema";
export type { AtsAnalysis, CoverLetter, ResumeJson } from "./schema";
export { resumeJsonToText } from "./serialize";
export {
  RESUME_OPTIMIZATION_SYSTEM_PROMPT,
  COVER_LETTER_SYSTEM_PROMPT,
  buildResumeOptimizationUserPrompt,
  buildCoverLetterUserPrompt,
} from "./prompts";
