# Option A: 3-Project Architecture – Verification Checklist

This doc verifies that **Option A** (3 separate projects) is implemented correctly.

---

## 1. Project ↔ Domain ↔ Workflow

| Project | What | Domain | GitHub workflow | Vercel project ID secret |
|---------|------|--------|-----------------|--------------------------|
| **ketchup-smartpay-backend** | API only | api.ketchup.cc | `.github/workflows/backend.yml` | `VERCEL_BACKEND_PROJECT_ID` |
| **ketchup-portal** | Ketchup SPA | app.ketchup.cc | `.github/workflows/ketchup-portal.yml` | `VERCEL_KETCHUP_PROJECT_ID` |
| **government-portal** | Government SPA | gov.ketchup.cc | `.github/workflows/government-portal.yml` | `VERCEL_GOVERNMENT_PROJECT_ID` |

---

## 2. Configuration Files

| Project | Config | Purpose |
|---------|--------|---------|
| Backend | **Root** `vercel.json` (or `vercel.backend.json`) | buildCommand: `cd backend && pnpm run build:vercel`, rewrites `/(.*)` → `/api?path=$1`, functions `api/index.js`, outputDirectory: `api` |
| Ketchup portal | `apps/ketchup-portal/vercel.json` + root `vercel.ketchup.json` (for CLI deploy) | SPA: rewrites to `/index.html`, output: `apps/ketchup-portal/dist` |
| Government portal | `apps/government-portal/vercel.json` + root `vercel.gov.json` (for CLI deploy) | SPA: rewrites to `/index.html`, output: `apps/government-portal/dist` |

---

## 3. Backend Workflow (backend.yml)

- **Trigger:** Push to `main` when `backend/**` or `.github/workflows/backend.yml` changes.
- **Build:** `pnpm --filter ketchup-smartpay-backend run build:vercel` (from repo root).
- **Deploy:** Vercel from **repo root** (`working-directory: .`) so `api/index.js` and root `vercel.json` are included.  
  ⚠️ **Fixed:** Previously used `working-directory: ./backend`, which omitted `api/` and broke the serverless handler; now uses `.`.

---

## 4. Portal Workflows (ketchup-portal.yml, government-portal.yml)

- **Trigger:** Push to `main` when respective `apps/<portal>/**`, `packages/**`, or workflow file changes.
- **Build:** `pnpm install`, build shared packages, then `pnpm build --filter=<portal>`.
- **Deploy:** Vercel with `working-directory: ./apps/<portal>` so each project uses its app’s `vercel.json`.

---

## 5. Required GitHub Secrets

Set in **GitHub repo → Settings → Secrets and variables → Actions**:

| Secret | Used by | Description |
|--------|---------|-------------|
| `VERCEL_TOKEN` | All three workflows | Vercel API token (https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | All three | Team/org ID (e.g. `team_MPOdmWd6KnPpGhXI9UYg2Opo`) |
| `VERCEL_BACKEND_PROJECT_ID` | backend.yml | Vercel project ID for backend (api.ketchup.cc) |
| `VERCEL_KETCHUP_PROJECT_ID` | ketchup-portal.yml | Vercel project ID for ketchup-portal (app.ketchup.cc) |
| `VERCEL_GOVERNMENT_PROJECT_ID` | government-portal.yml | Vercel project ID for government-portal (gov.ketchup.cc) |

---

## 6. Custom Domains in Vercel

In each Vercel project, **Settings → Domains**:

- **Backend project:** Add `api.ketchup.cc`
- **Ketchup-portal project:** Add `app.ketchup.cc`
- **Government-portal project:** Add `gov.ketchup.cc`

Then add the CNAME (or A) records at your DNS provider as shown in Vercel.

---

## 7. Backend: Railway vs Vercel

- **PROJECTS.md** and **DEPLOYMENT_GUIDE.md** describe the backend as **Railway** (api.ketchup.cc).  
- **backend.yml** deploys the backend to **Vercel** when you use `VERCEL_BACKEND_PROJECT_ID`.

You can:

- **Use Railway only:** Leave `VERCEL_BACKEND_PROJECT_ID` unset or remove backend.yml; deploy backend with `railway up` and point api.ketchup.cc to Railway.
- **Use Vercel for backend:** Set the secret and let backend.yml deploy; point api.ketchup.cc to the Vercel backend project.

---

## 8. Quick Verification Commands

```bash
# From ketchup-smartpay/
./scripts/deploy.sh backend           # Railway (or run backend.yml for Vercel)
./scripts/deploy.sh ketchup-portal    # Vercel → app.ketchup.cc
./scripts/deploy.sh government-portal # Vercel → gov.ketchup.cc
```

After deploy:

```bash
curl -sI https://api.ketchup.cc/health   # Backend
curl -sI https://app.ketchup.cc          # Ketchup portal (expect 200, HTML)
curl -sI https://gov.ketchup.cc          # Government portal (expect 200, HTML)
```

---

## Summary

| Check | Status |
|-------|--------|
| 3 workflows (backend, ketchup-portal, government-portal) | ✅ |
| Backend deploys from repo root (api/ + vercel.json) | ✅ (fixed in backend.yml) |
| Portals deploy from apps/<portal> with correct build | ✅ |
| PROJECTS.md lists all 3 projects and deploy commands | ✅ |
| Domains: api / app / gov.ketchup.cc assigned per project | ⚠️ Confirm in Vercel Dashboard |
| GitHub secrets set for all 3 projects | ⚠️ Confirm in repo Settings |

Option A is implemented; the only change made was **backend.yml** `working-directory` from `./backend` to `.` so the backend Vercel deploy includes `api/` and root config.
