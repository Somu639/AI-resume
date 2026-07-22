import type { ResumeJson } from "@resumeai/shared";

export function formatDateRange(start?: string, end?: string): string {
  const s = (start ?? "").trim();
  const e = (end ?? "").trim();
  if (!s && !e) return "";
  if (s && e) return `${s} – ${e}`;
  return s || e;
}

export function contactLine(info: ResumeJson["personalInfo"]): string {
  return [
    info.email,
    info.phone,
    info.location,
    info.linkedin,
    info.github,
    info.website,
  ]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join("  |  ");
}

export function educationHeadline(item: ResumeJson["education"][number]): string {
  const degreeField = [item.degree, item.field].filter(Boolean).join(" in ");
  return [degreeField, item.institution].filter(Boolean).join(" — ");
}

export function safeFileStem(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "resume"
  );
}
