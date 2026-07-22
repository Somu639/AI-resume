# ResumeAI API Overview

Base URL (dev): `http://localhost:4000/api/v1`

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Email/password signup |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/google` | Exchange Google OAuth token |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Clear session |
| GET | `/auth/me` | Current user |

## Resumes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/resumes` | List user resumes |
| POST | `/resumes` | Upload PDF/DOCX |
| GET | `/resumes/:id` | Resume detail + versions |
| DELETE | `/resumes/:id` | Soft-delete resume |
| GET | `/resumes/:id/versions` | Version history |
| GET | `/resumes/:id/versions/:versionId` | Single version (+ change highlights) |

## Job Descriptions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/job-descriptions` | List saved JDs |
| POST | `/job-descriptions` | Create from paste or file upload |
| POST | `/job-descriptions/analyze` | Analyze raw JD with OpenAI (skills, tools, seniority, etc.) |
| GET | `/job-descriptions/:id` | JD + extracted keywords |
| DELETE | `/job-descriptions/:id` | Delete JD |
| POST | `/job-descriptions/:id/extract-keywords` | Re-run keyword extraction |

**JD analysis response shape:**

```json
{
  "data": {
    "requiredSkills": ["TypeScript", "React"],
    "preferredSkills": ["GraphQL"],
    "tools": ["Figma", "Jira"],
    "responsibilities": ["Own end-to-end product experiences"],
    "keywords": ["SaaS", "B2B", "design systems"],
    "seniority": "Senior",
    "experience": "5+ years"
  }
}
```

## Analysis

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analysis` | Compare resume vs JD (persisted) |
| POST | `/analysis/score` | Live ATS score from resume text + JD target |
| GET | `/analysis/:id` | Fetch scores + gaps |
| GET | `/analysis` | List analyses for user |

**ATS score response shape:**

```json
{
  "data": {
    "atsScore": 92,
    "missingKeywords": ["Kubernetes", "GraphQL"],
    "suggestions": ["Add required skills that are missing: Kubernetes."],
    "strengths": ["Strong keyword coverage against the job description."],
    "weakSections": ["Projects"],
    "insights": ["Composite ATS score is 92/100 using weighted keyword (35%), skills (25%), experience (20%), formatting (10%), and projects (10%)."],
    "breakdown": {
      "keywordMatching": 88,
      "skillMatching": 90,
      "experienceRelevance": 95,
      "resumeFormatting": 85,
      "projectRelevance": 70
    }
  }
}
```

**Legacy analysis response shape (conceptual):**

```json
{
  "atsScore": 78,
  "keywordMatchPercent": 64,
  "formattingScore": 85,
  "matchedKeywords": ["TypeScript", "React"],
  "missingSkills": ["Kubernetes"],
  "missingResponsibilities": ["Lead sprint planning"],
  "summary": "..."
}
```

## Optimize

| Method | Path | Description |
|--------|------|-------------|
| POST | `/optimize` | AI-optimize resume JSON against JD JSON |
| GET | `/optimize/:id` | Optimized result + highlights |
| POST | `/optimize/:id/export` | Export PDF and/or DOCX |

**Optimize request:** `{ resume: ResumeJson, jobDescription: JobDescriptionAnalysis }`

**Optimize response shape:**

```json
{
  "data": {
    "optimizedResume": {
      "personalInfo": { "name": "", "email": "", "summary": "" },
      "skills": [],
      "experience": [],
      "education": [],
      "projects": [],
      "certifications": []
    },
    "modifications": [
      {
        "type": "modified",
        "section": "summary",
        "before": "...",
        "after": "...",
        "reason": "Aligned summary to target seniority and keywords"
      }
    ],
    "atsAnalysis": {
      "summary": "Strong match after emphasizing design systems experience.",
      "strengths": ["Clear role alignment", "Supported keyword coverage"],
      "weaknesses": ["No Kubernetes evidence on resume"],
      "keywordMatchEstimate": 78,
      "recommendations": ["Add a projects bullet that names accessibility tooling already used"]
    },
    "missingKeywords": ["Kubernetes", "GraphQL"],
    "coverLetter": {
      "greeting": "Dear Hiring Manager,",
      "body": "Paragraphs...",
      "closing": "Sincerely,\nAlex Kim"
    },
    "atsImprovementScore": 12,
    "beforeAtsScore": 64,
    "afterAtsScore": 76
  }
}
```

## Export

| Method | Path | Description |
|--------|------|-------------|
| POST | `/export` | Generate ATS-friendly PDF or DOCX (binary download) |

**Export request:**

```json
{
  "resume": { "personalInfo": { "name": "Alex Kim", "email": "alex@example.com" }, "skills": [], "experience": [], "education": [], "projects": [], "certifications": [] },
  "theme": "modern",
  "format": "pdf"
}
```

Themes: `classic` | `modern` | `compact` | `executive`

## Cover Letters

| Method | Path | Description |
|--------|------|-------------|
| POST | `/cover-letters` | Generate from resume + JD |
| GET | `/cover-letters/:id` | Fetch letter |
| PATCH | `/cover-letters/:id` | Edit content |
| POST | `/cover-letters/:id/export` | Export PDF/DOCX |

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
