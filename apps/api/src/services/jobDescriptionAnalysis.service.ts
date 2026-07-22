import { analyzeJobDescription } from "../engines/job-description";

/**
 * Service wrapper around the JD analysis engine.
 */
export const jobDescriptionAnalysisService = {
  async analyze(rawJobDescription: string) {
    return analyzeJobDescription(rawJobDescription);
  },
};
