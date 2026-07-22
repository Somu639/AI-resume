/** File upload constraints shared by web + API. */
export const FILE_LIMITS = {
  maxBytes: 10 * 1024 * 1024,
  allowedMimeTypes: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  allowedExtensions: [".pdf", ".docx"],
} as const;

/**
 * ATS composite score weights (must sum to 1).
 * Keyword 35% · Skills 25% · Experience 20% · Formatting 10% · Projects 10%
 */
export const ATS_SCORE_WEIGHTS = {
  keywordMatching: 0.35,
  skillMatching: 0.25,
  experienceRelevance: 0.2,
  resumeFormatting: 0.1,
  projectRelevance: 0.1,
} as const;

/** @deprecated Prefer ATS_SCORE_WEIGHTS */
export const SCORE_WEIGHTS = {
  ats: 0.35,
  keywordMatch: 0.4,
  formatting: 0.25,
} as const;

export const ATS_WEAK_SECTION_THRESHOLD = 65;
