# ResumeAI — Product overview

ResumeAI is a production SaaS that optimizes **existing** resume content against a job description using OpenAI — never inventing experience.

## Feature map

| Feature | Frontend | Backend |
|---------|----------|---------|
| Auth (email + Google) | `/login`, `/signup` | `POST /auth/*` |
| Dashboard | `/dashboard` | `GET /resumes`, analyses |
| Resume upload + parse | `/upload` | `POST /resumes` (PDF/DOCX → S3 + parsedJson) |
| JD analysis | `/analyze` | `POST /job-descriptions/analyze` |
| ATS scoring | `/ats-report` | `POST /analysis/score` |
| AI optimize | `/editor` + API | `POST /optimize` (anti-hallucination prompts) |
| Cover letter | `/cover-letter` | `POST /cover-letters` |
| Export PDF/DOCX | Editor export panel | `POST /export` + `@resumeai/resume-export` |
| Version history | Editor panel | `ResumeVersion` + `GET /resumes/:id/versions` |
| Billing | `/billing` | Stripe Checkout/Portal/Webhooks |

## Hard product constraints

1. Never fabricate employers, titles, dates, metrics, or credentials.
2. Only rewrite / emphasize content already present on the resume.
3. ATS-friendly one-column exports (Helvetica/Times, no tables/graphics).
4. Scalable monorepo: `apps/web`, `apps/api`, `apps/streamlit`, `packages/*`.

## Run locally

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm install
npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
npm run dev:api
npm run dev:web
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel + Docker + Streamlit production setup.
