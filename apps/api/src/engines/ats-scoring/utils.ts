export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Case-insensitive whole-phrase / token match against haystack. */
export function textIncludesTerm(haystack: string, term: string): boolean {
  const needle = term.trim();
  if (!needle) return false;

  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);

  if (normalizedNeedle.length <= 2) {
    const re = new RegExp(
      `(?:^|\\W)${escapeRegExp(normalizedNeedle)}(?:$|\\W)`,
      "i"
    );
    return re.test(normalizedHaystack);
  }

  if (normalizedHaystack.includes(normalizedNeedle)) return true;

  // Common tech aliases so "JS" matches JavaScript, etc.
  const aliases: Record<string, string[]> = {
    javascript: ["js", "ecmascript"],
    typescript: ["ts"],
    "node.js": ["nodejs", "node"],
    react: ["reactjs", "react.js"],
    "next.js": ["nextjs"],
    postgresql: ["postgres"],
    kubernetes: ["mongo"],
    k8s: ["kubernetes"],
    aws: ["amazon web services"],
  };

  const key = normalizedNeedle.replace(/[^a-z0-9.+#]/g, "");
  for (const alias of aliases[key] ?? []) {
    if (normalizedHaystack.includes(normalizeText(alias))) return true;
  }
  for (const [canonical, list] of Object.entries(aliases)) {
    if (list.some((a) => normalizeText(a).replace(/[^a-z0-9.+#]/g, "") === key)) {
      if (normalizedHaystack.includes(normalizeText(canonical))) return true;
    }
  }

  return false;
}

export function dedupePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, " ");
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function clampScore(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function extractSection(text: string, headers: string[]): string {
  const lines = text.split(/\r?\n/);
  const headerRe = new RegExp(
    `^\\s*(${headers.map(escapeRegExp).join("|")})\\s*[:\\-]?\\s*$`,
    "i"
  );

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headerRe.test(lines[i] ?? "")) {
      start = i + 1;
      break;
    }
  }

  if (start < 0) return "";

  const nextHeaderRe =
    /^\s*(experience|work experience|employment|education|skills|projects|project|certifications|summary|profile|contact)\s*[:\-]?\s*$/i;

  const collected: string[] = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (nextHeaderRe.test(line) && !headerRe.test(line)) break;
    collected.push(line);
  }

  return collected.join("\n").trim();
}

export function parseYearsRequired(experience: string): number | null {
  if (!experience.trim()) return null;

  const range = experience.match(/(\d+)\s*[-â€“to]+\s*(\d+)\s*\+?\s*years?/i);
  if (range) {
    return Number(range[1]);
  }

  const single = experience.match(/(\d+)\s*\+?\s*years?/i);
  if (single) return Number(single[1]);

  return null;
}

/** Rough estimate of years mentioned in resume experience text. */
export function estimateResumeYears(text: string): number | null {
  const matches = [...text.matchAll(/(\d{1,2})\s*\+?\s*years?/gi)];
  if (!matches.length) {
    const dateRanges = [...text.matchAll(/\b(20\d{2}|19\d{2})\s*[-â€“]\s*(20\d{2}|19\d{2}|present|current)\b/gi)];
    if (!dateRanges.length) return null;

    let total = 0;
    for (const match of dateRanges) {
      const start = Number(match[1]);
      const endRaw = (match[2] ?? "").toLowerCase();
      const end =
        endRaw === "present" || endRaw === "current"
          ? new Date().getFullYear()
          : Number(endRaw);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        total += end - start;
      }
    }
    return total > 0 ? total : null;
  }

  return Math.max(...matches.map((m) => Number(m[1])));
}

export function hasEmail(text: string): boolean {
  return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
}

export function hasPhone(text: string): boolean {
  return /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(
    text
  );
}

export function countBulletLines(text: string): number {
  return text.split(/\r?\n/).filter((line) => /^\s*[-â€¢*Â·]/.test(line)).length;
}
