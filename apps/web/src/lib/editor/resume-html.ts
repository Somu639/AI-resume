/**
 * Convert structured resume JSON ↔ editor HTML.
 * Only uses fields present on the resume — never invents experience.
 */

export type ResumeJsonLike = {
  personalInfo: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary?: string;
  };
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    details?: string[];
  }>;
  projects: Array<{
    name: string;
    description?: string;
    bullets: string[];
    technologies?: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer?: string;
    date?: string;
  }>;
};

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contactLine(info: ResumeJsonLike["personalInfo"]): string {
  return [
    info.email,
    info.phone,
    info.location,
    info.linkedin,
    info.github,
    info.website,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Build TipTap-friendly HTML from structured resume JSON. */
export function resumeJsonToHtml(resume: ResumeJsonLike): string {
  const parts: string[] = [];
  const { personalInfo } = resume;

  parts.push(`<h1>${esc(personalInfo.name || "Resume")}</h1>`);
  const contact = contactLine(personalInfo);
  if (contact) parts.push(`<p>${esc(contact)}</p>`);

  if (personalInfo.summary?.trim()) {
    parts.push("<h2>Summary</h2>");
    parts.push(`<p>${esc(personalInfo.summary.trim())}</p>`);
  }

  if (resume.skills.length) {
    parts.push("<h2>Skills</h2>");
    parts.push(`<p>${esc(resume.skills.join(", "))}</p>`);
  }

  if (resume.experience.length) {
    parts.push("<h2>Experience</h2>");
    for (const job of resume.experience) {
      const dates = [job.startDate, job.endDate].filter(Boolean).join(" – ");
      const headline = `${job.title} — ${job.company}${
        dates ? ` (${dates})` : ""
      }`;
      parts.push(`<p><strong>${esc(headline)}</strong></p>`);
      if (job.bullets.length) {
        parts.push("<ul>");
        for (const b of job.bullets) {
          parts.push(`<li>${esc(b)}</li>`);
        }
        parts.push("</ul>");
      }
    }
  }

  if (resume.projects.length) {
    parts.push("<h2>Projects</h2>");
    for (const project of resume.projects) {
      parts.push(`<p><strong>${esc(project.name)}</strong></p>`);
      if (project.description?.trim()) {
        parts.push(`<p>${esc(project.description.trim())}</p>`);
      }
      if (project.technologies?.length) {
        parts.push(`<p>${esc(project.technologies.join(", "))}</p>`);
      }
      if (project.bullets.length) {
        parts.push("<ul>");
        for (const b of project.bullets) {
          parts.push(`<li>${esc(b)}</li>`);
        }
        parts.push("</ul>");
      }
    }
  }

  if (resume.education.length) {
    parts.push("<h2>Education</h2>");
    for (const edu of resume.education) {
      const degree = [edu.degree, edu.field].filter(Boolean).join(", ");
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
      const line = [edu.institution, degree, dates].filter(Boolean).join(" — ");
      parts.push(`<p><strong>${esc(line)}</strong></p>`);
      if (edu.details?.length) {
        parts.push("<ul>");
        for (const d of edu.details) parts.push(`<li>${esc(d)}</li>`);
        parts.push("</ul>");
      }
    }
  }

  if (resume.certifications.length) {
    parts.push("<h2>Certifications</h2>");
    parts.push("<ul>");
    for (const cert of resume.certifications) {
      const line = [cert.name, cert.issuer, cert.date].filter(Boolean).join(" — ");
      parts.push(`<li>${esc(line)}</li>`);
    }
    parts.push("</ul>");
  }

  return parts.join("\n");
}

/**
 * Ensure resume JSON meets optimize schema minimums without inventing experience.
 * Only fills empty identity fields with safe placeholders when required by Zod.
 */
export function prepareResumeForOptimize(raw: ResumeJsonLike): ResumeJsonLike {
  const name = raw.personalInfo.name?.trim() || "Candidate";
  const email =
    raw.personalInfo.email?.trim() && raw.personalInfo.email.includes("@")
      ? raw.personalInfo.email.trim()
      : "candidate@example.com";

  return {
    ...raw,
    personalInfo: {
      ...raw.personalInfo,
      name,
      email,
      phone: raw.personalInfo.phone ?? "",
      location: raw.personalInfo.location ?? "",
      linkedin: raw.personalInfo.linkedin ?? "",
      github: raw.personalInfo.github ?? "",
      website: raw.personalInfo.website ?? "",
      summary: raw.personalInfo.summary ?? "",
    },
    skills: raw.skills ?? [],
    experience: (raw.experience ?? []).map((e) => ({
      ...e,
      bullets: e.bullets ?? [],
      location: e.location ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
    })),
    education: (raw.education ?? []).map((e) => ({
      ...e,
      degree: e.degree ?? "",
      field: e.field ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      details: e.details ?? [],
    })),
    projects: (raw.projects ?? []).map((p) => ({
      ...p,
      description: p.description ?? "",
      bullets: p.bullets ?? [],
      technologies: p.technologies ?? [],
    })),
    certifications: (raw.certifications ?? []).map((c) => ({
      ...c,
      issuer: c.issuer ?? "",
      date: c.date ?? "",
    })),
  };
}
