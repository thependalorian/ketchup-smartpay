# Deploy Backend to Railway

Portals (ketchup-portal, government-portal) stay on **Vercel**. The **backend API** runs on **Railway**. This doc covers one-time setup, deploy, and env vars.

---

## Prerequisites

- Railway account: https://railway.app
- Backend env values from **`backend/.env.local`** or **`secrets.local`** (do not commit; copy into Railway Dashboard)

---

## 0. Connect with Railway CLI

Install the CLI, log in, then link this repo to your Railway project (and optionally to a specific service).

### Install CLI

```bash
# macOS (Homebrew)
brew install railway

# Or npm (Node 16+)
npm i -g @railway/cli
```

### Log in and link

From **repo root** (`ketchup-smartpay/`):

```bash
# 1. Log in (opens browser)
railway login

# 2. Link this directory to a Railway project (choose workspace → project → environment)
#    Must run in an interactive terminal (Cursor terminal or system terminal).
railway link

# 3. If the project has multiple services, link to the backend service
railway service

# Optional: link non-interactively if you have the project ID (from Railway dashboard URL or Settings)
# railway link --project <project-id>
```

After `railway link`, the CLI stores the link in `.railway/` (gitignored). All later commands (e.g. `railway up`, `railway variables`) use that project/environment.

### Optional: deploy from CLI

```bash
# Deploy (build + deploy on Railway)
railway up

# Run locally with Railway env vars
railway run -- pnpm install && cd backend && pnpm run start
```

### Optional: CI / headless

Use an **account token** (not a project token) for `railway link` in CI. Create at Railway → Account Settings → Tokens, then:

```bash
export RAILWAY_API_TOKEN=your_account_token
railway link   # still need to pass project/environment; or use railway link --project <id>
```

---

## 1. Create project and service

1. Go to https://railway.app → **New Project**.
2. **Deploy from GitHub repo**: connect the `ketchup-smartpay` repo (monorepo root).
3. Add a **service** and choose **GitHub Repo** → select the repo.
4. Leave **Root Directory** **empty** (repo root). The backend uses `shared/` and must build from root.

---

## 2. Build and start settings

**Critical:** Set **Root Directory** to **empty** (repo root). If it is set to `backend`, Railway will run `node dist/backend/src/index.js` and crash with `ERR_MODULE_NOT_FOUND`.

### Option A: Dockerfile (recommended)

Repo root has a **`Dockerfile`** that builds the backend bundle and runs `node railway-start.cjs`. Railway uses it automatically when Root Directory is empty.

- **Root Directory:** *(empty)*
- **Build / Start:** Leave default — Railway builds from the Dockerfile and runs the CMD.

### Option B: railway.toml or manual commands

If you prefer Nixpacks/Railpack instead of Docker:

| Setting | Value |
|--------|--------|
| **Root Directory** | *(empty – use repo root)* |
| **Build Command** | `pnpm install && cd backend && pnpm run build:vercel` |
| **Start Command** | `pnpm run start` or `cd backend && pnpm run start:railway` |
| **Watch Paths** | `backend/**` (optional) |

**Do not use** `start:prod` or `node dist/backend/src/index.js` — that path hits ESM resolution errors. The app must start via `railway-start.cjs` (bundle).

---

## 3. Environment variables (Railway)

Set these in **Railway → your backend service → Variables**. Copy values from **`backend/.env.local`** or **`secrets.local`** (never commit those files).

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string, e.g. `postgresql://user:password@host/dbname?sslmode=require` |
| `KETCHUP_API_KEY` | API key for Ketchup portal; must match **Ketchup Portal** `VITE_API_KEY` (Vercel) |
| `GOVERNMENT_API_KEY` | API key for Government portal; must match **Government Portal** `VITE_API_KEY` (Vercel) |

### Optional (Buffr / integrations)

| Variable | Description |
|----------|-------------|
| `BUFFR_API_URL` | e.g. `https://pay.buffr.ai` |
| `BUFFR_API_KEY` | Buffr API key |
| `BUFFR_WEBHOOK_SECRET` | Buffr webhook signing secret |
| `API_KEY` | Legacy; auth accepts this or `KETCHUP_SMARTPAY_API_KEY` |
| `KETCHUP_SMARTPAY_API_KEY` | Alternative to `KETCHUP_API_KEY` |

### Optional (Railway)

| Variable | Description |
|----------|-------------|
| `PORT` | Railway sets this automatically; backend uses `process.env.PORT \|\| 3001` |
| `NODE_ENV` | Set to `production` for production |

---

## 4. Env checklist (copy from your `.env*`)

**Do not commit** `backend/.env.local` or `secrets.local`. Copy **names and values** from those files into **Railway → Variables**.

To list only variable **names** (from repo root; values stay in your local files):

```bash
# Backend vars (run from repo root)
grep -E "^[A-Z_]+=" backend/.env.local 2>/dev/null | cut -d= -f1
```

Reference templates (no secrets): `backend/.env.example`, `apps/ketchup-portal/.env.example`, `apps/government-portal/.env.example`.

Set **every variable** that appears in `backend/.env.local` (and any backend vars from `secrets.local`) in **Railway → Variables**. At minimum:

- `DATABASE_URL`
- `KETCHUP_API_KEY`
- `GOVERNMENT_API_KEY`
- `BUFFR_API_URL` (if used)
- `BUFFR_API_KEY` (if used)
- `BUFFR_WEBHOOK_SECRET` (if used)

---

## 5. Domain: api.ketchup.cc

1. In Railway → your backend service → **Settings** → **Networking** (or **Domains**), add a **custom domain**: `api.ketchup.cc`.
2. Railway will show a **CNAME** target (e.g. `xxx.railway.app` or a gateway hostname).
3. In your DNS (where ketchup.cc is managed), add:
   - **CNAME** `api` → (the target Railway shows).

After DNS propagates, the backend will be reachable at **https://api.ketchup.cc**.

---

## 6. Point portals at the backend

Portals are on **Vercel** and call the backend via **`VITE_API_URL`** (baked in at build time).

- Set **`VITE_API_URL`** to your **Railway URL** (e.g. `https://pretty-sparkle-production-be8b.up.railway.app`) or **`https://api.ketchup.cc`** if DNS points to Railway.
- **One command** to sync both portals to the Railway URL (from repo root):
  ```bash
  export VERCEL_TOKEN=your_token
  BACKEND_URL=https://your-railway-url.up.railway.app node scripts/set-vercel-env-and-domain.mjs
  ```
- Ensure **API keys match**: Ketchup Portal `VITE_API_KEY` = Railway `KETCHUP_API_KEY`; Government Portal `VITE_API_KEY` = Railway `GOVERNMENT_API_KEY`.

Then **redeploy both portals** so the new `VITE_API_URL` is applied:

```bash
./scripts/deploy-ketchup-portal.sh
./scripts/deploy-government-portal.sh
```

---

## 7. Verify

```bash
# Health
curl -s https://api.ketchup.cc/health

# Dashboard metrics (use your real KETCHUP_API_KEY)
curl -s -H "X-API-Key: YOUR_KETCHUP_API_KEY" https://api.ketchup.cc/api/v1/dashboard/metrics
```

Then open **https://app.ketchup.cc** and **https://gov.ketchup.cc** — dashboards should show data (not "—").

---

## 8. Data flow (backend on Railway)

```
Portal UI (app.ketchup.cc / gov.ketchup.cc)  [Vercel]
  → VITE_API_URL = https://api.ketchup.cc
  → Backend API (Railway)
  → Neon DB (DATABASE_URL)
```

---

## Troubleshooting

- **Dashboards show "—":** Check that `api.ketchup.cc` resolves to Railway and that Railway env has `DATABASE_URL`, `KETCHUP_API_KEY`, `GOVERNMENT_API_KEY`. Confirm portal `VITE_API_KEY` matches backend keys.
- **401/403 on API:** Portal `VITE_API_KEY` must equal backend `KETCHUP_API_KEY` (Ketchup) or `GOVERNMENT_API_KEY` (Government). Redeploy portals after changing env in Vercel.
- **Build fails / crash on start (ERR_MODULE_NOT_FOUND):** Set **Root Directory** to **empty** (repo root). Railway will then use the root **Dockerfile** (recommended) or **railway.toml**. If Root Directory was `backend`, Railway was running `node dist/backend/src/index.js` and crashing — the app must start via `railway-start.cjs` (bundle).
