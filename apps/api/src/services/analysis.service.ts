/**
 * Analysis service — ATS / keyword / formatting scores + gap lists.
 */
import { scoreAts, type AtsScoreRequest } from "../engines/ats-scoring";

export const analysisService = {
  async compare(_resumeId: string, _jobDescriptionId: string, _userId: string) {
    throw new Error(
      "Not implemented: analysisService.compare (persist resume/JD ids first)"
    );
  },

  /** Score resume text against a classified JD target. */
  scoreAts(input: AtsScoreRequest) {
    return scoreAts(input);
  },
};
