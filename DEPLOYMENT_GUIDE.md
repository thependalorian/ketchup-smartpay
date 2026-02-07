# Ketchup SmartPay – Deployment Guide

- **Portals:** Deploy to **Vercel** (ketchup-portal → app.ketchup.cc, government-portal → gov.ketchup.cc).
- **Backend:** Deploy to **Railway** (api.ketchup.cc). See **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)** for step-by-step and env vars.

**Vercel + file tree:** See [VERCEL_ALIGNMENT.md](./VERCEL_ALIGNMENT.md) for how the repo layout maps to Vercel docs (monorepo, build, rewrites, functions, env) with 98% confidence.

---

## Fix once and for all (one procedure)

Do this once so backend and portals work and data loads.

1. **Backend secrets** are in **`secrets.local`** (gitignored – never committed).  
   That file already has DATABASE_URL, KETCHUP_API_KEY, GOVERNMENT_API_KEY, BUFFR_*, etc.  
   **Add your Vercel token:** open `secrets.local`, set `VERCEL_TOKEN=` to your token from https://vercel.com/account/tokens .

2. **Portal secrets** stay in `apps/ketchup-portal/.env.local` and `apps/government-portal/.env.local`. Set **VITE_API_URL** to your **Railway backend URL** (e.g. `https://pretty-sparkle-production-xxx.up.railway.app` or `https://api.ketchup.cc` if DNS points to Railway). The sync script pushes these to Vercel.

3. **Sync all secrets to Vercel** (from repo root):
   ```bash
   cd ketchup-smartpay
   node scripts/set-vercel-env-and-domain.mjs
   ```
   Script reads `secrets.local` for VERCEL_TOKEN and backend vars, and each portal’s `.env.local` for portal vars. Use BACKEND_URL so both portals get the same API URL. Backend is on Railway only.

4. **Backend** is on **Railway** only. Deploy with `railway up`. See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md).

5. **Deploy portals** (if needed):
   ```bash
   ./scripts/deploy-ketchup-portal.sh
   ./scripts/deploy-government-portal.sh
   ```

6. **Verify:**
   ```bash
   curl -s https://api.ketchup.cc/health
   curl -s -H "X-API-Key: YOUR_KETCHUP_API_KEY" https://api.ketchup.cc/api/v1/dashboard/metrics
   ```
   Health should return JSON; metrics should return JSON (not 500/503). Then open app.ketchup.cc and gov.ketchup.cc — dashboards should show numbers, not “—”.

**Checklist – every secret that must exist**

| Variable | backend/.env.local | Railway backend | ketchup-portal .env.local | Vercel ketchup-portal | gov-portal .env.local | Vercel government-portal |
|----------|--------------------|------------------------|----------------------------|------------------------|-------------------------|---------------------------|
| `DATABASE_URL` | ✓ | ✓ | optional | optional | optional | optional |
| `KETCHUP_API_KEY` | ✓ | ✓ | — | — | — | — |
| `GOVERNMENT_API_KEY` | ✓ | ✓ | — | — | — | — |
| `VITE_API_URL` | — | — | ✓ = https://api.ketchup.cc | ✓ (sync) | ✓ = https://api.ketchup.cc | ✓ (sync) |
| `VITE_API_KEY` (Ketchup) | — | — | ✓ = KETCHUP_API_KEY | ✓ (sync) | — | — |
| `VITE_API_KEY` (Gov) | — | — | — | — | ✓ = GOVERNMENT_API_KEY | ✓ (sync) |
| `BUFFR_API_URL` | ✓ | ✓ (sync) | ✓ | ✓ (sync) | ✓ | ✓ (sync) |
| `BUFFR_API_KEY` | ✓ | ✓ (sync) | ✓ | ✓ (sync) | ✓ | ✓ (sync) |
| `BUFFR_WEBHOOK_SECRET` | ✓ | ✓ | — | — | — | — |
| `API_KEY` / `KETCHUP_SMARTPAY_API_KEY` | optional | optional | — | — | — | — |
| `VITE_APP_NAME`, `VITE_ENVIRONMENT`, etc. | — | — | ✓ | ✓ (sync) | ✓ | ✓ (sync) |

If any cell is ✓ and missing, the sync or deploy will fail or data won’t load. After editing `.env.local`, run the sync script again, then redeploy the affected portal. **Railway:** Copy backend vars from `backend/.env.local` and `secrets.local` into Railway → Variables (see [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)).

---

## Where things run

| Project / service   | URL(s)                                      | Purpose              |
|--------------------|---------------------------------------------|----------------------|
| **Backend (Railway)** | api.ketchup.cc                             | Express API          |
| **ketchup-portal (Vercel)**  | app.ketchup.cc                              | Ketchup SmartPay UI  |
| **government-portal (Vercel)** | gov.ketchup.cc                            | Government Oversight UI |

---

## Secrets & environment variables

**Never commit real values.** Set these in Vercel (Project → Settings → Environment Variables) and in each app’s `.env.local` for local dev. Use placeholders below; replace with your actual secrets.

### Backend (Railway) – set in Railway Variables and `backend/.env.local` locally

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string, e.g. `postgresql://user:password@host/dbname?sslmode=require` |
| `KETCHUP_API_KEY` | Yes | API key for Ketchup portal; must match `VITE_API_KEY` in ketchup-portal |
| `GOVERNMENT_API_KEY` | Yes | API key for Government portal; must match `VITE_API_KEY` in government-portal |
| `API_KEY` | No | Legacy; auth middleware accepts this or `KETCHUP_SMARTPAY_API_KEY` |
| `KETCHUP_SMARTPAY_API_KEY` | No | Alternative to `KETCHUP_API_KEY` |
| `BUFFR_API_URL` | No | Buffr API base URL, e.g. `https://pay.buffr.ai` |
| `BUFFR_API_KEY` | No | Buffr API key |
| `BUFFR_WEBHOOK_SECRET` | No | Buffr webhook signing secret |

Full backend deploy and env: **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)**.

### Ketchup Portal (ketchup-portal) – set in Vercel and `apps/ketchup-portal/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend base URL: `https://api.ketchup.cc` (Railway) |
| `VITE_API_KEY` | Yes | Must match backend `KETCHUP_API_KEY`; sent as `X-API-Key` |
| `VITE_APP_NAME` | No | e.g. `SmartPay Ketchup Portal` |
| `VITE_APP_VERSION` | No | e.g. `2.0.0` |
| `VITE_ENVIRONMENT` | No | e.g. `production` |
| `VITE_APP_URL` | No | Canonical portal URL, e.g. `https://app.ketchup.cc` |
| `VITE_ENABLE_ANALYTICS` | No | `true` / `false` |
| `VITE_ENABLE_SENTRY` | No | `true` / `false` |
| `VITE_SENTRY_DSN` | No | Sentry DSN if using Sentry |
| `DATABASE_URL` | No | Only if portal has server-side DB usage |
| `BUFFR_API_URL` | No | Buffr API base URL |
| `BUFFR_API_KEY` | No | Buffr API key |

### Government Portal (government-portal) – set in Vercel and `apps/government-portal/.env.local`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend base URL: `https://api.ketchup.cc` (Railway) |
| `VITE_API_KEY` | Yes | Must match backend `GOVERNMENT_API_KEY`; sent as `X-API-Key` |
| `VITE_APP_NAME` | No | e.g. `SmartPay Government Portal` |
| `VITE_APP_VERSION` | No | e.g. `2.0.0` |
| `VITE_ENVIRONMENT` | No | e.g. `production` |
| `VITE_APP_URL` | No | Canonical portal URL, e.g. `https://gov.ketchup.cc` |
| `VITE_ENABLE_ANALYTICS` | No | `true` / `false` |
| `VITE_ENABLE_SENTRY` | No | `true` / `false` |
| `VITE_SENTRY_DSN` | No | Sentry DSN if using Sentry |
| `DATABASE_URL` | No | Only if portal has server-side DB usage |
| `BUFFR_API_URL` | No | Buffr API base URL |
| `BUFFR_API_KEY` | No | Buffr API key |

### Deploy / CI only (not in app env)

| Variable | Where | Description |
|----------|--------|-------------|
| `VERCEL_TOKEN` | Local / CI | Vercel API token for `set-vercel-env-and-domain.mjs` and deploy scripts; create at https://vercel.com/account/tokens |

---

## Environment Files (minimal examples)

### 1. Backend (`backend/.env.local`)

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
GOVERNMENT_API_KEY=your_government_api_key
KETCHUP_API_KEY=your_ketchup_api_key
BUFFR_API_URL=https://pay.buffr.ai
BUFFR_API_KEY=your_buffr_api_key
BUFFR_WEBHOOK_SECRET=your_buffr_webhook_secret
```

### 2. Ketchup Portal (`apps/ketchup-portal/.env.local`)

```
VITE_API_URL=https://api.ketchup.cc
VITE_API_KEY=your_ketchup_api_key
VITE_APP_NAME=SmartPay Ketchup Portal
VITE_APP_VERSION=2.0.0
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=false
VITE_SENTRY_DSN=
BUFFR_API_URL=https://pay.buffr.ai
BUFFR_API_KEY=your_buffr_api_key
```

### 3. Government Portal (`apps/government-portal/.env.local`)

```
VITE_API_URL=https://api.ketchup.cc
VITE_API_KEY=your_government_api_key
VITE_APP_NAME=SmartPay Government Portal
VITE_APP_VERSION=2.0.0
VITE_ENVIRONMENT=production
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SENTRY=false
VITE_SENTRY_DSN=
BUFFR_API_URL=https://pay.buffr.ai
BUFFR_API_KEY=your_buffr_api_key
```

Use `https://api.ketchup.cc` once the backend is deployed on Railway and DNS is set.

---

## Deploy Commands

From repo root (`ketchup-smartpay/`):

```bash
# Optional: sync portal env from .env.local to Vercel (needs VERCEL_TOKEN)
export VERCEL_TOKEN=your_token_here
node scripts/set-vercel-env-and-domain.mjs

# Backend: deploy to Railway (see RAILWAY_DEPLOY.md; no script – use Railway dashboard or CLI)

# Deploy ketchup-portal (app.ketchup.cc)
./scripts/deploy-ketchup-portal.sh

# Deploy government-portal (gov.ketchup.cc)
./scripts/deploy-government-portal.sh
```

---

## Backend on Railway (one-time)

See **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)** for: Root Directory (empty), Build Command (`pnpm install && cd backend && pnpm run build`), Start Command (`cd backend && pnpm run start:prod`), and all env vars to set in Railway → Variables.

---

## API Endpoints

- **Health:** https://api.ketchup.cc/health  
- **Dashboard metrics:** https://api.ketchup.cc/api/v1/dashboard/metrics  
  - Header: `X-API-Key: <KETCHUP_API_KEY>`

---

## Data Flow

```
Portal UI (app.ketchup.cc / gov.ketchup.cc)  [Vercel]
  → VITE_API_URL = https://api.ketchup.cc
  → Backend API (Railway)
  → Database (Neon / DATABASE_URL)
```

---

## Troubleshooting

- **Dashboards show “—”:** Backend env (DATABASE_URL, KETCHUP_API_KEY, GOVERNMENT_API_KEY) may be missing in Vercel. Run `node scripts/set-vercel-env-and-domain.mjs` with `VERCEL_TOKEN`, then redeploy backend.
- **500 FUNCTION_INVOCATION_FAILED:** See `DATA_NOT_LOADING_FIX.md` §9 (env sync + backend redeploy).
