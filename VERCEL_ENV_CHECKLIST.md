# Vercel Environment Variables Checklist

**Purpose:** Ensure all required env vars from `*.env*` in ketchup-smartpay are set in the correct Vercel projects.

**Sync script:** `VERCEL_TOKEN=xxx node scripts/set-vercel-env-and-domain.mjs` syncs **portal** env from `apps/*/\.env.local` and **backend** env from `backend/.env.local` to the corresponding Vercel projects. Run from repo root.

---

## 1. ketchup-backend (api.ketchup.cc)

**Vercel project:** ketchup-backend · **Settings → Environment Variables**

| Variable | Required | Source | Notes |
|----------|----------|--------|--------|
| **DATABASE_URL** | ✅ Yes | backend/.env.local | Neon PostgreSQL; backend connects to DB. |
| **KETCHUP_API_KEY** | ✅ Yes | backend/.env.local | Must equal ketchup-portal's VITE_API_KEY. |
| **GOVERNMENT_API_KEY** | ✅ Yes | backend/.env.local | Must equal government-portal's VITE_API_KEY. |
| API_KEY | Optional | backend/.env.local | Auth accepts this or KETCHUP_SMARTPAY_API_KEY. |
| KETCHUP_SMARTPAY_API_KEY | Optional | backend/.env.local | Same as KETCHUP_API_KEY for Ketchup auth. |
| BUFFR_API_KEY | Optional | backend/.env.local | Buffr integration. |
| BUFFR_API_URL | Optional | backend/.env.local | e.g. https://pay.buffr.ai |
| NODE_ENV | Optional | — | production / development |
| PORT | Optional | — | Local dev only |

**Action:** Run `VERCEL_TOKEN=xxx node scripts/set-vercel-env-and-domain.mjs` to sync from `backend/.env.local` to ketchup-backend. Or set **DATABASE_URL**, **KETCHUP_API_KEY**, **GOVERNMENT_API_KEY** manually in Vercel → ketchup-backend → Environment Variables.

---

## 2. ketchup-portal (app.ketchup.cc)

**Vercel project:** ketchup-portal · **Settings → Environment Variables**

| Variable | Required | Source | Notes |
|----------|----------|--------|--------|
| **VITE_API_URL** | ✅ Yes | apps/ketchup-portal/.env.local | Backend base URL, e.g. https://api.ketchup.cc or https://ketchup-backend-buffr.vercel.app |
| **VITE_API_KEY** | ✅ Yes | apps/ketchup-portal/.env.local | Must equal backend KETCHUP_API_KEY. |
| VITE_APP_URL | Recommended | .env.local | https://app.ketchup.cc |
| VITE_APP_NAME | Optional | .env.local | SmartPay Ketchup Portal |
| VITE_ENVIRONMENT | Optional | .env.local | production |
| VITE_APP_VERSION | Optional | .env.local | 2.0.0 |
| VITE_ENABLE_ANALYTICS | Optional | .env.local | true / false |
| VITE_ENABLE_SENTRY | Optional | .env.local | true / false |
| VITE_SENTRY_DSN | Optional | .env.local | Sentry DSN |
| DATABASE_URL | Optional | .env.local | Not used by portal at runtime (backend uses it). |
| BUFFR_API_URL | Optional | .env.local | https://pay.buffr.ai |
| BUFFR_API_KEY | Optional | .env.local | Buffr API key |

**Action:** Run `VERCEL_TOKEN=xxx node scripts/set-vercel-env-and-domain.mjs` to sync from `apps/ketchup-portal/.env.local`. Then redeploy: `pnpm run deploy:ketchup` (or push to trigger deploy).

---

## 3. government-portal (gov.ketchup.cc)

**Vercel project:** government-portal · **Settings → Environment Variables**

| Variable | Required | Source | Notes |
|----------|----------|--------|--------|
| **VITE_API_URL** | ✅ Yes | apps/government-portal/.env.local | Backend base URL. |
| **VITE_API_KEY** | ✅ Yes | apps/government-portal/.env.local | Must equal backend GOVERNMENT_API_KEY. |
| VITE_APP_URL | Recommended | .env.local | https://gov.ketchup.cc |
| VITE_APP_NAME | Optional | .env.local | SmartPay Government Portal |
| VITE_ENVIRONMENT | Optional | .env.local | production |
| VITE_APP_VERSION | Optional | .env.local | 2.0.0 |
| VITE_ENABLE_ANALYTICS | Optional | .env.local | true / false |
| VITE_ENABLE_SENTRY | Optional | .env.local | true / false |
| VITE_SENTRY_DSN | Optional | .env.local | Sentry DSN |
| DATABASE_URL | Optional | .env.local | Not used by portal at runtime. |
| BUFFR_API_URL | Optional | .env.local | https://pay.buffr.ai |
| BUFFR_API_KEY | Optional | .env.local | Buffr API key |

**Action:** Run `VERCEL_TOKEN=xxx node scripts/set-vercel-env-and-domain.mjs` to sync from `apps/government-portal/.env.local`. Then redeploy: `pnpm run deploy:government` (or push to trigger deploy).

---

## 4. Root .env.local

**File:** ketchup-smartpay/.env.local

| Variable | Used by | Notes |
|----------|---------|--------|
| VITE_API_URL | Shared frontend config | e.g. https://api.ketchup.cc/api/v1 — not synced to a single Vercel project; portal projects use their own .env.local. |

No Vercel project is keyed off root .env.local alone; portals use apps/*/.env.local.

---

## 5. Quick verification

After setting env in Vercel and redeploying:

```bash
# Backend health
curl -s https://api.ketchup.cc/health

# Data route (use KETCHUP_API_KEY value from backend/.env.local)
curl -s -H "X-API-Key: YOUR_KETCHUP_KEY" https://api.ketchup.cc/api/v1/dashboard/metrics
```

- Health returns JSON → backend is up.
- Dashboard returns JSON with metrics → DATABASE_URL and API key are correct.
- 401 → API key mismatch (backend KETCHUP_API_KEY ≠ portal VITE_API_KEY).
- 503 → Backend bundle not loading; redeploy backend with updated api/index.js (see DATA_NOT_LOADING_FIX.md).

---

## 6. Env keys summary (from *.env* in repo)

| File | Keys (required in bold) |
|------|--------------------------|
| backend/.env.local | **DATABASE_URL**, **GOVERNMENT_API_KEY**, **KETCHUP_API_KEY**, API_KEY, BUFFR_*, KETCHUP_SMARTPAY_*, NODE_ENV, PORT |
| apps/ketchup-portal/.env.local | **VITE_API_URL**, **VITE_API_KEY**, VITE_APP_*, VITE_ENABLE_*, DATABASE_URL, BUFFR_* |
| apps/government-portal/.env.local | **VITE_API_URL**, **VITE_API_KEY**, VITE_APP_*, VITE_ENABLE_*, DATABASE_URL, BUFFR_* |
| .env.local (root) | VITE_API_URL |

Ensure every **bold** key is set in the corresponding Vercel project (backend → ketchup-backend; ketchup-portal → ketchup-portal; government-portal → government-portal).
