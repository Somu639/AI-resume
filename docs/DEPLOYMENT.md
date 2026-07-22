# ResumeAI Production Deployment

## Architecture

| Layer | Technology | Host |
|-------|------------|------|
| Frontend | Next.js 15 | **Vercel** (`apps/web`) |
| REST API | Express | **Vercel** (`apps/api`) — used by web + Streamlit |
| Backend console | **Streamlit** | **Streamlit Community Cloud** / Docker |
| Database | **PostgreSQL** | Neon / Supabase / RDS |
| Storage | **AWS S3** | AWS |

- **Frontend (Vercel):** marketing + dashboard UI  
- **Backend (Streamlit):** ops console and AI workflow UI  
- **REST API (Vercel):** shared JSON API both surfaces call  

## Environment variables

Copy examples:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/streamlit/.env.example apps/streamlit/.env
```

### API (`apps/api` on Vercel)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes (prod data) | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | yes (prod) | ≥32 char secret (not `dev-`) |
| `JWT_REFRESH_SECRET` | yes (prod) | ≥32 char secret |
| `CLIENT_URL` | yes | Vercel frontend origin for CORS |
| `CLIENT_URLS` | no | Extra CORS origins (Streamlit Cloud URL) |
| `OPENAI_API_KEY` | yes (AI) | Groq or OpenAI key |
| `OPENAI_BASE_URL` | no | Default Groq |
| `AWS_*` / `S3_BUCKET` | optional | S3 storage |
| `SENTRY_DSN` | no | Error tracking |
| `API_KEY` | recommended | Service auth for Streamlit→API |
| `TRUST_PROXY` | yes on Vercel | `true` |

### Web (Vercel)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://<api-project>.vercel.app/api/v1` |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser error tracking |

### Streamlit (Community Cloud)

| Variable | Purpose |
|----------|---------|
| `API_BASE_URL` | `https://<api-project>.vercel.app/api/v1` |
| `DATABASE_URL` | Same Postgres as API |
| `S3_BUCKET` / AWS creds | Optional |
| `API_KEY` | Must match API if set |

## Frontend → Vercel

1. Import the GitHub repo in Vercel (or `npx vercel` from `apps/web`).
2. Set **Root Directory** to `apps/web`.
3. Env: `NEXT_PUBLIC_API_URL=https://ai-resume-api-tau.vercel.app/api/v1`
4. Deploy.

## REST API → Vercel

1. Project root directory: `apps/api` (Express preset).
2. Set production env: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DATABASE_URL`, `CLIENT_URL`, `OPENAI_API_KEY`, `TRUST_PROXY=true`.
3. Redeploy. Health: `https://<api>.vercel.app/api/v1/health`

## Backend → Streamlit Community Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io) → **New app**.
2. Repo: `Somu639/AI-resume`, branch `main`.
3. **Main file path:** `apps/streamlit/app.py`
4. **App URL** will look like `https://<app>.streamlit.app`
5. In **Secrets** (or Advanced settings), paste:

```toml
API_BASE_URL = "https://ai-resume-api-tau.vercel.app/api/v1"
DATABASE_URL = "postgresql://..."
OPENAI_API_KEY = "gsk_..."
```

6. Add the Streamlit URL to API `CLIENT_URLS` for CORS.

Local Streamlit:

```bash
cd apps/streamlit
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

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
