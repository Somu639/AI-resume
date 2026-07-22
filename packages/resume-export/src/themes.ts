export type ResumeThemeId = "classic" | "modern" | "compact" | "executive";

export type ResumeTheme = {
  id: ResumeThemeId;
  label: string;
  description: string;
  colors: {
    text: string;
    muted: string;
    accent: string;
    rule: string;
    background: string;
  };
  fonts: {
    /** react-pdf built-in: Helvetica | Times-Roman | Courier */
    body: "Helvetica" | "Times-Roman" | "Courier";
    heading: "Helvetica" | "Times-Roman" | "Courier";
  };
  /** Multipliers applied on base spacing tokens */
  spacingScale: number;
  fontSize: {
    name: number;
    section: number;
    body: number;
    small: number;
  };
};

export const RESUME_THEMES: Record<ResumeThemeId, ResumeTheme> = {
  classic: {
    id: "classic",
    label: "Classic",
    description: "ATS-safe Times layout with strong hierarchy",
    colors: {
      text: "#111111",
      muted: "#444444",
      accent: "#111111",
      rule: "#222222",
      background: "#FFFFFF",
    },
    fonts: { body: "Times-Roman", heading: "Times-Roman" },
    spacingScale: 1,
    fontSize: { name: 20, section: 12, body: 10.5, small: 9.5 },
  },
  modern: {
    id: "modern",
    label: "Modern",
    description: "Clean Helvetica with teal accent rules",
    colors: {
      text: "#0F172A",
      muted: "#475569",
      accent: "#0F766E",
      rule: "#0F766E",
      background: "#FFFFFF",
    },
    fonts: { body: "Helvetica", heading: "Helvetica" },
    spacingScale: 1,
    fontSize: { name: 18, section: 11, body: 10, small: 9 },
  },
  compact: {
    id: "compact",
    label: "Compact",
    description: "Tighter spacing for denser one-page resumes",
    colors: {
      text: "#111111",
      muted: "#555555",
      accent: "#111111",
      rule: "#333333",
      background: "#FFFFFF",
    },
    fonts: { body: "Helvetica", heading: "Helvetica" },
    spacingScale: 0.82,
    fontSize: { name: 16, section: 10.5, body: 9.5, small: 8.5 },
  },
  executive: {
    id: "executive",
    label: "Executive",
    description: "Formal navy accent for senior roles",
    colors: {
      text: "#0B1220",
      muted: "#3F4B5F",
      accent: "#1E3A5F",
      rule: "#1E3A5F",
      background: "#FFFFFF",
    },
    fonts: { body: "Times-Roman", heading: "Times-Roman" },
    spacingScale: 1.05,
    fontSize: { name: 20, section: 12, body: 10.5, small: 9.5 },
  },
};

export function getTheme(themeId: ResumeThemeId = "classic"): ResumeTheme {
  return RESUME_THEMES[themeId] ?? RESUME_THEMES.classic;
}
