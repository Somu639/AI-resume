import type { ResumeTheme } from "./themes";

/**
 * Base spacing tokens (points). Multiplied by theme.spacingScale
 * so PDF and DOCX preserve proportional spacing consistently.
 */
export const BASE_SPACING = {
  pageMargin: 48,
  sectionGap: 12,
  blockGap: 8,
  bulletGap: 3,
  lineGap: 2,
  ruleHeight: 1,
  ruleGap: 6,
  headerGap: 4,
} as const;

export type SpacingTokens = {
  [K in keyof typeof BASE_SPACING]: number;
};

export function getSpacing(theme: ResumeTheme): SpacingTokens {
  const s = theme.spacingScale;
  return {
    pageMargin: Math.round(BASE_SPACING.pageMargin * Math.min(Math.max(s, 0.75), 1.15)),
    sectionGap: Math.round(BASE_SPACING.sectionGap * s),
    blockGap: Math.round(BASE_SPACING.blockGap * s),
    bulletGap: Math.max(2, Math.round(BASE_SPACING.bulletGap * s)),
    lineGap: Math.max(1, Math.round(BASE_SPACING.lineGap * s)),
    ruleHeight: BASE_SPACING.ruleHeight,
    ruleGap: Math.round(BASE_SPACING.ruleGap * s),
    headerGap: Math.round(BASE_SPACING.headerGap * s),
  };
}

/** Convert PDF points ≈ to DOCX twentieths of a point (twips). 1pt = 20 twips */
export function ptToTwip(pt: number): number {
  return Math.round(pt * 20);
}

/** Convert PDF points to inches for DOCX margins. */
export function ptToInch(pt: number): number {
  return Number((pt / 72).toFixed(3));
}
