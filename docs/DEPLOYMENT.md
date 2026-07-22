# ResumeAI Production Deployment

## Architecture

| Layer | Technology | Host |
|-------|------------|------|
| Frontend | Next.js 15 | **Vercel** |
| Backend console | **Streamlit** | Docker / Streamlit Cloud / any VM |
| REST API | Express (Node 20) | Docker / Render / Fly / ECS |
| Database | **PostgreSQL** | RDS / Neon / Supabase / Compose |
| Storage | **AWS S3** | AWS |

The Vercel frontend talks to the Express REST API (`/api/v1`).  
Streamlit is the production backend operations console and AI workflow UI, sharing PostgreSQL + S3 and calling the API for optimize/analyze.

## Environment variables

Copy examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/streamlit/.env.example apps/streamlit/.env
```

### API (`apps/api`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes (prod) | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | yes (prod) | ≥32 char secret |
| `JWT_REFRESH_SECRET` | yes (prod) | ≥32 char secret |
| `CLIENT_URL` | yes | Vercel site origin for CORS |
| `CLIENT_URLS` | no | Extra CORS origins (Streamlit) |
| `OPENAI_API_KEY` | yes (AI) | OpenAI |
| `AWS_*` / `S3_BUCKET` | yes (files) | S3 storage |
| `SENTRY_DSN` | no | Error tracking |
| `API_KEY` | recommended | Service auth for Streamlit→API |
| `LOG_LEVEL` | no | `info` / `debug` |
| `RATE_LIMIT_*` | no | Rate limit tuning |

### Web (Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Public API base, e.g. `https://api.yourdomain.com/api/v1` |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser error tracking |

### Streamlit

| Variable | Purpose |
|----------|---------|
| `API_BASE_URL` | Express API URL |
| `DATABASE_URL` | PostgreSQL |
| `S3_BUCKET` / AWS creds | Storage |
| `API_KEY` | Must match API if set |
| `SENTRY_DSN` | Optional |

## Local production stack (Docker)

```bash
# Prepare env files first
docker compose up --build postgres api streamlit
```

- API: http://localhost:4000/api/v1/health  
- Metrics: http://localhost:4000/metrics  
- Streamlit: http://localhost:8501  
- Postgres: localhost:5432  

Optional MinIO: `docker compose --profile local-s3 up`

## Frontend → Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `apps/web` (or use `vercel.json`).
3. Configure env: `NEXT_PUBLIC_API_URL`, etc.
4. Deploy. Production deploys also trigger on `v*` tags via CD deploy hook (`VERCEL_DEPLOY_HOOK_URL` secret).

## Backend → Streamlit

```bash
cd apps/streamlit
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

Or run the Docker image published by CD to `ghcr.io/<org>/resumeai/streamlit`.

## Security checklist

- [ ] Strong JWT secrets (not `dev-` prefixes)
- [ ] `API_KEY` set between Streamlit and API
- [ ] CORS limited to Vercel + Streamlit origins
- [ ] Helmet + HPP + rate limits enabled (API)
- [ ] S3 bucket private; use signed URLs
- [ ] Sentry DSNs configured
- [ ] `TRUST_PROXY=true` behind load balancers

## Monitoring

- **Logs**: structured JSON via Pino (`LOG_LEVEL`)
- **Errors**: Sentry (`SENTRY_DSN`)
- **Metrics**: Prometheus scrape `GET /metrics`
- **Health**: `GET /api/v1/health` and `/api/v1/health/ready`
- **Streamlit**: sidebar system status + DB/S3 checks

## CI/CD

- `.github/workflows/ci.yml` — lint/build API + Web, compile Streamlit, build Docker images
- `.github/workflows/cd.yml` — publish API + Streamlit images to GHCR on version tags; optional Vercel hook
