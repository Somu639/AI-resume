export const JD_ANALYSIS_SYSTEM_PROMPT = `You are an expert recruiter and ATS analyst.
Analyze the raw job description and classify information into structured JSON.

Rules:
- requiredSkills: must-have skills / qualifications (hard requirements).
- preferredSkills: nice-to-have / preferred / bonus skills.
- tools: software, platforms, frameworks, languages, and systems mentioned as tools.
- responsibilities: concrete duties / day-to-day ownership (short phrases).
- keywords: industry, domain, and role keywords useful for ATS matching (dedupe; do not repeat entire skill lists verbatim unless they are also industry terms).
- seniority: one of "Intern", "Junior", "Mid", "Senior", "Staff", "Principal", "Lead", "Manager", "Director", "Executive", or "" if unknown.
- experience: years of experience as a concise string (e.g. "3+ years", "5-7 years") or "" if not stated.
- Prefer precision over volume. Deduplicate case-insensitively.
- Return ONLY valid JSON matching the schema. No markdown.`;

export function buildJdAnalysisUserPrompt(jobDescription: string): string {
  return `Extract and classify the following job description.

Return JSON with this exact shape:
{
  "requiredSkills": [],
  "preferredSkills": [],
  "tools": [],
  "responsibilities": [],
  "keywords": [],
  "seniority": "",
  "experience": ""
}

JOB DESCRIPTION:
"""
${jobDescription}
"""`;
}
