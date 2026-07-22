# ResumeAI Folder Structure

```
resumeai/
├── package.json                          # npm workspaces root
├── README.md
├── .gitignore
│
├── docs/
│   ├── ARCHITECTURE.md                   # System design + diagrams
│   ├── API.md                            # Route contracts
│   ├── DATA_MODEL.md                     # Prisma entity guide
│   └── FOLDER_STRUCTURE.md               # This file
│
├── scripts/                              # Ops / seed helpers
│
├── packages/
│   └── shared/                           # Shared DTOs & constants
│       └── src/
│           ├── index.ts
│           ├── types/                    # AnalysisScores, ResumeChange, …
│           ├── constants/                # FILE_LIMITS, SCORE_WEIGHTS
│           └── utils/
│
└── apps/
    ├── web/                              # Next.js 15 frontend
    │   ├── public/
    │   ├── next.config.ts
    │   ├── tailwind.config.js
    │   ├── .env.example
    │   └── src/
    │       ├── app/
    │       │   ├── layout.tsx
    │       │   ├── page.tsx              # Landing
    │       │   ├── globals.css
    │       │   ├── (auth)/
    │       │   │   ├── login/
    │       │   │   └── register/
    │       │   ├── (dashboard)/
    │       │   │   ├── layout.tsx        # Responsive shell + nav
    │       │   │   ├── dashboard/        # Overview
    │       │   │   ├── resumes/          # Upload + list + [id]
    │       │   │   ├── optimize/         # JD compare + AI rewrite
    │       │   │   ├── cover-letter/
    │       │   │   └── settings/
    │       │   └── api/                  # Optional Next BFF proxies
    │       ├── components/
    │       │   ├── ui/                   # shadcn/ui primitives
    │       │   ├── auth/
    │       │   ├── dashboard/
    │       │   ├── resume/               # UploadDropzone, VersionTimeline
    │       │   ├── optimize/             # ScoreCards, DiffHighlight, KeywordChips
    │       │   ├── cover-letter/
    │       │   └── shared/
    │       ├── hooks/
    │       ├── lib/                      # api.ts, utils.ts (cn)
    │       ├── styles/
    │       └── types/
    │
    └── api/                              # Express backend
        ├── prisma/
        │   └── schema.prisma
        ├── uploads/                      # Local-dev only
        ├── .env.example
        └── src/
            ├── index.ts                  # App bootstrap
            ├── config/                   # env, openai, s3
            ├── routes/                   # auth, resumes, JD, analysis, …
            ├── controllers/
            ├── services/                 # openai, s3, analysis, resume, optimize
            ├── middleware/               # auth, rateLimit, errorHandler
            ├── types/
            └── utils/
```

## Ownership by feature

| Feature | Frontend | Backend |
|---------|----------|---------|
| Auth (Google + email) | `components/auth`, `(auth)/*` | `routes/auth`, auth middleware |
| Dashboard | `(dashboard)/dashboard` | `GET /resumes`, `/analysis` |
| Upload resume | `components/resume` | `POST /resumes`, `s3Service`, `resumeService` |
| Job description | `components/optimize` | `job-descriptions` routes + keyword extract |
| Scoring | Score cards UI | `analysisService` + `openaiService.analyzeResume` |
| AI optimize + highlights | Diff UI | `optimizeService` + `openaiService.generateOptimizedResume` |
| Export PDF/DOCX | Export buttons | `optimizeService.export` |
| Version history | Version timeline | `ResumeVersion` model |
| Cover letter | `(dashboard)/cover-letter` | `cover-letters` routes |
