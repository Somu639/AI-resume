import type { EditorChange, EditorVersion } from "./types";

export const ORIGINAL_RESUME_HTML = `
<h1>Alex Kim</h1>
<p>Product Designer · alex@example.com · +1 555-0100</p>
<h2>Summary</h2>
<p>Designer with 5 years of experience building digital products.</p>
<h2>Experience</h2>
<p><strong>Acme Corp — Product Designer</strong> (2020 – Present)</p>
<ul>
  <li>Designed interfaces for web applications</li>
  <li>Collaborated with engineers and PMs</li>
</ul>
<h2>Skills</h2>
<p>Figma, Sketch, Prototyping, User Research</p>
`.trim();

export const OPTIMIZED_RESUME_HTML = `
<h1>Alex Kim</h1>
<p>Product Designer · alex@example.com · +1 555-0100</p>
<h2>Summary</h2>
<p>Product designer with 5 years shipping design systems for B2B SaaS teams.</p>
<h2>Experience</h2>
<p><strong>Acme Corp — Product Designer</strong> (2020 – Present)</p>
<ul>
  <li>Designed interfaces for web applications used by 40k monthly active users</li>
  <li>Collaborated with engineers and PMs across discovery and delivery</li>
  <li>Led cross-functional sprint planning with engineering leads</li>
</ul>
<h2>Skills</h2>
<p>Figma, Design systems, A/B testing, Accessibility audits, Prototyping, User Research</p>
`.trim();

export const INITIAL_CHANGES: EditorChange[] = [
  {
    id: "c1",
    section: "Summary",
    type: "modified",
    before: "Designer with 5 years of experience building digital products.",
    after:
      "Product designer with 5 years shipping design systems for B2B SaaS teams.",
    status: "pending",
  },
  {
    id: "c2",
    section: "Experience",
    type: "modified",
    before: "Designed interfaces for web applications",
    after:
      "Designed interfaces for web applications used by 40k monthly active users",
    status: "pending",
  },
  {
    id: "c3",
    section: "Experience",
    type: "added",
    after: "Led cross-functional sprint planning with engineering leads",
    status: "pending",
  },
  {
    id: "c4",
    section: "Skills",
    type: "added",
    after: "Design systems, A/B testing, Accessibility audits",
    status: "pending",
  },
];

export const INITIAL_VERSIONS: EditorVersion[] = [
  {
    id: "v4",
    label: "AI optimize · Stripe JD",
    html: OPTIMIZED_RESUME_HTML,
    createdAt: new Date().toISOString(),
    source: "ai",
  },
  {
    id: "v3",
    label: "Manual edit",
    html: OPTIMIZED_RESUME_HTML,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    source: "manual",
  },
  {
    id: "v2",
    label: "AI optimize · Notion JD",
    html: ORIGINAL_RESUME_HTML,
    createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    source: "ai",
  },
  {
    id: "v1",
    label: "Original upload",
    html: ORIGINAL_RESUME_HTML,
    createdAt: new Date(Date.now() - 7 * 86_400_000).toISOString(),
    source: "original",
  },
];

export const SAMPLE_JOB = {
  requiredSkills: ["Figma", "Design systems", "User Research"],
  preferredSkills: ["A/B testing", "Accessibility"],
  tools: ["Figma", "Sketch"],
  responsibilities: [
    "Lead sprint planning",
    "Ship design systems",
    "Partner with engineering",
  ],
  keywords: [
    "Product designer",
    "B2B",
    "SaaS",
    "design systems",
    "accessibility",
  ],
  seniority: "Senior",
  experience: "5+ years",
};
