export const mockResumes = [
  {
    id: "1",
    title: "Product Designer — Primary",
    updatedAt: "2 hours ago",
    ats: 78,
    versions: 4,
    status: "Ready",
  },
  {
    id: "2",
    title: "Frontend Engineer Tailored",
    updatedAt: "Yesterday",
    ats: 86,
    versions: 2,
    status: "Optimized",
  },
  {
    id: "3",
    title: "UX Research Draft",
    updatedAt: "3 days ago",
    ats: 61,
    versions: 1,
    status: "Needs work",
  },
];

export const mockKeywords = {
  matched: ["TypeScript", "React", "Design systems", "Figma", "A/B testing"],
  missing: ["Kubernetes", "GraphQL", "Stakeholder management"],
};

export const mockChanges = [
  {
    section: "Summary",
    type: "modified" as const,
    before: "Designer with 5 years of experience.",
    after:
      "Product designer with 5 years shipping design systems for B2B SaaS teams.",
  },
  {
    section: "Experience",
    type: "added" as const,
    after: "Led cross-functional sprint planning with engineering leads.",
  },
  {
    section: "Skills",
    type: "added" as const,
    after: "Added: accessibility audits, experimentation frameworks.",
  },
];

export const scoreBreakdown = [
  { name: "ATS", score: 78 },
  { name: "Keywords", score: 64 },
  { name: "Format", score: 85 },
  { name: "Skills", score: 71 },
  { name: "Clarity", score: 80 },
];
