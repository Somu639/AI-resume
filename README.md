# ResumeAI

AI-powered SaaS platform that optimizes resumes against job descriptions.

## Features

- Google & email authentication
- PDF / DOCX resume upload
- Job description analysis & keyword extraction
- ATS compatibility, keyword match, formatting scores
- AI-tailored resume generation with change highlights
- Version history
- Cover letter generation
- PDF / DOCX export
- Mobile-responsive dashboard

## Monorepo Structure

```
resumeai/
├── apps/
│   ├── web/          # Next.js 15 frontend (TypeScript, Tailwind, shadcn/ui)
│   ├── api/          # Express backend (Prisma, PostgreSQL, OpenAI, S3, Stripe)
│   └── streamlit/    # Ops console (metrics, health, admin tools)
├── packages/
│   ├── shared/         # Shared types, constants, utilities
│   └── resume-export/  # PDF/DOCX generators
├── docs/             # Architecture & design docs
└── .github/workflows # CI/CD
```

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | Next.js 15, TypeScript, Tailwind, shadcn/ui |
| Backend   | Node.js, Express, Prisma            |
| Database  | PostgreSQL                          |
| AI        | OpenAI API                          |
| Storage   | AWS S3                              |
| Billing   | Stripe Checkout + Customer Portal   |
| Ops UI    | Streamlit                           |

## Quick Start

```bash
# Install dependencies
npm install

# Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Generate Prisma client & run migrations (requires PostgreSQL)
npm run db:migrate

# Start API (http://localhost:4000) and Web (http://localhost:3000)
npm run dev:api
npm run dev:web
```

**Hard product rule:** ResumeAI never fabricates experience — it only rewrites and emphasizes content that already exists on the resume.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) — system design, data flow, folder map
- [API Overview](./docs/API.md) — route map and contracts
- [Data Model](./docs/DATA_MODEL.md) — Prisma entities
- [Deployment](./docs/DEPLOYMENT.md) — Vercel, Streamlit, Docker, CI/CD, env vars

## License

Proprietary — All rights reserved.
