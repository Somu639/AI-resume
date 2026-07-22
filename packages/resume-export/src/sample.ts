import type { ResumeJson } from "@resumeai/shared";

/** Sample structured resume used by export demos and the live editor. */
export const SAMPLE_RESUME_JSON: ResumeJson = {
  personalInfo: {
    name: "Alex Kim",
    email: "alex@example.com",
    phone: "+1 555-0100",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alexkim",
    github: "",
    website: "",
    summary:
      "Product designer with 5 years shipping design systems for B2B SaaS teams.",
  },
  skills: [
    "Figma",
    "Design systems",
    "A/B testing",
    "Accessibility audits",
    "Prototyping",
    "User Research",
  ],
  experience: [
    {
      company: "Acme Corp",
      title: "Product Designer",
      location: "San Francisco, CA",
      startDate: "2020",
      endDate: "Present",
      bullets: [
        "Designed interfaces for web applications used by 40k monthly active users",
        "Collaborated with engineers and PMs across discovery and delivery",
        "Led cross-functional sprint planning with engineering leads",
      ],
    },
  ],
  education: [
    {
      institution: "Rhode Island School of Design",
      degree: "BFA",
      field: "Graphic Design",
      startDate: "2014",
      endDate: "2018",
      details: [],
    },
  ],
  projects: [
    {
      name: "Design System Kit",
      description: "Shared component library for product teams",
      bullets: ["Documented accessibility patterns used across 4 products"],
      technologies: ["Figma", "Storybook"],
    },
  ],
  certifications: [],
};
