import type { ResumeJson } from "./schema";

/** Flatten structured resume JSON into plain text for ATS scoring. */
export function resumeJsonToText(resume: ResumeJson): string {
  const lines: string[] = [];
  const p = resume.personalInfo;

  lines.push(p.name);
  lines.push(
    [p.email, p.phone, p.location, p.linkedin, p.github, p.website]
      .filter(Boolean)
      .join(" | ")
  );

  if (p.summary) {
    lines.push("", "Summary", p.summary);
  }

  if (resume.skills.length) {
    lines.push("", "Skills", resume.skills.join(", "));
  }

  if (resume.experience.length) {
    lines.push("", "Experience");
    for (const job of resume.experience) {
      lines.push(
        `${job.title} — ${job.company}${job.location ? ` · ${job.location}` : ""}`
      );
      if (job.startDate || job.endDate) {
        lines.push(`${job.startDate ?? ""} - ${job.endDate ?? ""}`.trim());
      }
      for (const bullet of job.bullets) {
        lines.push(`- ${bullet}`);
      }
    }
  }

  if (resume.projects.length) {
    lines.push("", "Projects");
    for (const project of resume.projects) {
      lines.push(project.name);
      if (project.description) lines.push(project.description);
      if (project.technologies?.length) {
        lines.push(project.technologies.join(", "));
      }
      for (const bullet of project.bullets) {
        lines.push(`- ${bullet}`);
      }
    }
  }

  if (resume.education.length) {
    lines.push("", "Education");
    for (const edu of resume.education) {
      lines.push(
        [edu.degree, edu.field, edu.institution].filter(Boolean).join(", ")
      );
      for (const detail of edu.details ?? []) {
        lines.push(`- ${detail}`);
      }
    }
  }

  if (resume.certifications.length) {
    lines.push("", "Certifications");
    for (const cert of resume.certifications) {
      lines.push(
        [cert.name, cert.issuer, cert.date].filter(Boolean).join(" — ")
      );
    }
  }

  return lines.join("\n");
}
