import { scoreAts, type AtsScoreRequest } from "../engines/ats-scoring";

/**
 * ATS scoring service — weighted resume vs JD analysis.
 */
export const atsScoringService = {
  score(input: AtsScoreRequest) {
    return scoreAts(input);
  },
};
