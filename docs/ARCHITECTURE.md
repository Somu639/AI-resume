# ResumeAI Architecture

## System Overview

ResumeAI is a monorepo SaaS application. The Next.js frontend talks to an Express API, which orchestrates authentication, file storage (S3), persistence (PostgreSQL via Prisma), and AI analysis/generation (OpenAI).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 Clients                                     │
│                     Browser / Mobile (responsive UI)                        │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         apps/web  (Next.js 15)                              │
│  App Router · Auth UI · Dashboard · Optimize · Cover Letter · Export        │
│  Tailwind CSS · shadcn/ui · TypeScript                                      │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ REST / JSON
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         apps/api  (Express)                                 │
│  Auth · Resumes · Job Descriptions · Analysis · Optimize · Export · CL      │
└───────┬──────────────────┬──────────────────┬──────────────────┬────────────┘
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  PostgreSQL   │  │    AWS S3     │  │  OpenAI API   │  │ Google OAuth  │
│  (Prisma)     │  │  resumes/     │  │  GPT models   │  │  + Email JWT  │
│  users, files │  │  exports/     │  │  analyze +    │  │               │
│  versions...  │  │  versions/    │  │  generate     │  │               │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
```

## High-Level Data Flow: Optimize Resume

```
1. User uploads resume (PDF/DOCX) ──► API stores file in S3
                                      └──► Prisma Resume + original Version

2. User pastes/uploads JD ──────────► API stores JobDescription
                                      └──► OpenAI extracts keywords/skills

3. User runs Compare ───────────────► Analysis service:
                                      ├── parse resume text
                                      ├── match keywords vs JD
                                      ├── compute ATS score
                                      ├── compute keyword %
                                      ├── find missing skills
                                      ├── find missing responsibilities
                                      └── compute formatting score
                                      └──► persist AnalysisResult

4. User generates optimized resume ─► OpenAI rewrites resume for JD
                                      ├── generate change diffs / highlights
                                      ├── store ResumeVersion (parent = previous)
                                      └── optionally regenerate cover letter

5. User exports ────────────────────► Export service builds PDF + DOCX
                                      └──► upload to S3, return signed URLs
```

## Component Architecture

### Frontend (`apps/web`)

| Area | Responsibility |
|------|----------------|
| `app/(auth)` | Login / register (email + Google) |
| `app/(dashboard)` | Authenticated shell: dashboard, resumes, optimize, cover letter, settings |
| `components/ui` | shadcn/ui primitives |
| `components/resume` | Upload, preview, version timeline |
| `components/optimize` | JD input, scores, diff highlights |
| `components/cover-letter` | Generate / edit / export cover letter |
| `hooks` | Auth session, uploads, analysis polling |
| `lib` | API client, auth helpers, formatters |

### Backend (`apps/api`)

| Area | Responsibility |
|------|----------------|
| `routes` | HTTP route definitions |
| `controllers` | Request validation + response shaping |
| `services` | Business logic (auth, resume, analysis, openai, s3, export) |
| `middleware` | Auth guard, upload limits, error handler, rate limit |
| `prisma` | Schema, migrations, seed |
| `config` | Env, OpenAI, S3, CORS, JWT |

### Shared (`packages/shared`)

Cross-app TypeScript types (scores, version diffs, API DTOs), constants (file limits, score weights), and pure utilities.

## Domain Model (core entities)

```
User
 ├── Resume[]
 │    └── ResumeVersion[]  (version history + change highlights)
 ├── JobDescription[]
 ├── Analysis[]             (scores + missing skills/responsibilities)
 ├── OptimizedResume[]      (links ResumeVersion ↔ JobDescription ↔ Analysis)
 └── CoverLetter[]
```

See [DATA_MODEL.md](./DATA_MODEL.md) for full field definitions.

## Auth Flow

1. **Email**: register → hash password → JWT access + refresh cookies
2. **Google**: OAuth 2.0 → upsert user → issue same JWT cookies
3. Protected API routes validate Bearer / cookie JWT via `authMiddleware`

## File Storage Layout (S3)

```
s3://resumeai-{env}/
  users/{userId}/
    resumes/{resumeId}/original.{pdf|docx}
    versions/{versionId}/resume.{pdf|docx}
    exports/{exportId}/optimized.{pdf|docx}
    cover-letters/{id}/letter.{pdf|docx}
```

## Scoring Model

| Metric | Description |
|--------|-------------|
| **ATS compatibility** | Structure, headings, parseability, forbidden elements |
| **Keyword match %** | Overlap of JD keywords present in resume |
| **Missing skills** | JD skills not found in resume |
| **Missing responsibilities** | JD duty phrases without resume support |
| **Formatting score** | Consistency, section order, length, bullet quality |

Weights and thresholds live in `packages/shared/src/constants/scoring.ts`.

## AI Pipeline

```
JobDescription text ──► extractKeywords() ──► KeywordSet
Resume text + KeywordSet + JD ──► analyzeResume() ──► AnalysisResult
Resume + JD + Analysis ──► generateOptimizedResume() ──► { content, changes[] }
Resume + JD ──► generateCoverLetter() ──► CoverLetter
```

All OpenAI calls go through `apps/api/src/services/openai.service.ts` with structured JSON schemas.

## Security Considerations

- Auth required for all resume/JD/analysis/export routes
- File type + size validation (PDF/DOCX only)
- Signed S3 URLs with short TTL for downloads
- Rate limits on AI endpoints
- Secrets only via environment variables
- RLS-style ownership checks: every query scoped by `userId`

## Deployment Topology (target)

```
Vercel / Node host ──► apps/web
Railway / ECS / Fly ──► apps/api
Managed PostgreSQL   ──► Prisma
AWS S3 + CloudFront  ──► file delivery
```

## Folder Map

```
resumeai/
├── apps/
│   ├── web/
│   │   ├── public/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/login|register
│   │       │   ├── (dashboard)/dashboard|resumes|optimize|cover-letter|settings
│   │       │   └── api/                    # Next.js BFF proxies (optional)
│   │       ├── components/{ui,auth,dashboard,resume,optimize,cover-letter,shared}
│   │       ├── hooks/
│   │       ├── lib/
│   │       ├── styles/
│   │       └── types/
│   └── api/
│       ├── prisma/
│       ├── uploads/                        # local-dev only
│       └── src/
│           ├── config/
│           ├── controllers/
│           ├── middleware/
│           ├── routes/
│           ├── services/
│           ├── types/
│           └── utils/
├── packages/shared/src/{types,constants,utils}
├── docs/
└── scripts/
```
