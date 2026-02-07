# Validation results (post-deploy)

**Date:** 2026-02-06  
**URL validation run:** 2026-02-07

## URL validation (visited)

URLs were visited and validated with `curl` from the repo (see `validate-implementation.sh` and VERCEL_ENV_AND_DOMAINS.md).

| URL | HTTP | Response | Notes |
|-----|------|----------|--------|
| https://gov.ketchup.cc | 200 | HTML (Government Portal) | ✅ Government Portal live |
| https://app.ketchup.cc | 200 | HTML (Ketchup Portal) | ✅ Ketchup Portal live |
| https://api.ketchup.cc/health | 200 | `{"status":"healthy","source":"api-handler",...}` | ✅ **Fixed:** api.ketchup.cc linked to ketchup-backend |
| https://ketchup-backend-buffr.vercel.app/health | 200 | `{"status":"healthy","source":"api-handler",...}` | ✅ Backend API correct |

**api.ketchup.cc fix applied:** Ran `./scripts/add-backend-domain.sh` (with VERCEL_TOKEN). The script removed api.ketchup.cc from **ketchup-portal** and added it to **ketchup-backend**. The domain now serves the API. To repeat: `VERCEL_TOKEN=xxx ./scripts/add-backend-domain.sh`.

## Data not loading (app.ketchup.cc / gov.ketchup.cc)

Dashboards show "—" because the backend returns **503** for data routes. Cause: the serverless handler was falling back to unbundled `app.js`, which requires `backend/dist/backend/src/database/connection` (not present in the function). Fix: **api/index.js** was updated to load only the bundled **vercel-entry.js** (with path resolution for Vercel). See **[DATA_NOT_LOADING_FIX.md](./DATA_NOT_LOADING_FIX.md)** for full flow, env vars (portals + backend), and steps: **redeploy backend**, set **DATABASE_URL**, **KETCHUP_API_KEY**, **GOVERNMENT_API_KEY** in Vercel for ketchup-backend.

## Deploys completed

| Target | Status | URL |
|--------|--------|-----|
| Backend | Deployed | https://ketchup-backend-buffr.vercel.app |
| Ketchup Portal | Deployed | https://app.ketchup.cc |
| Government Portal | Deployed | https://gov.ketchup.cc |

## Backend API Fix

**Problem:** `GET /api/v1/*` routes returned **500** – `FUNCTION_INVOCATION_FAILED`

**Cause:** ESM import resolution issues in Vercel serverless function. The Express app's imports from `./api/routes/*` were not resolving correctly in the bundled function.

**Solution:**
1. Created bundled entry point: [`backend/src/vercel-entry.ts`](backend/src/vercel-entry.ts)
2. Updated [`api/index.js`](api/index.js) to use bundled entry with fallback
3. Added `esbuild` bundling script: `pnpm run build:vercel`
4. Updated [`vercel.backend.json`](vercel.backend.json) with proper build command and includeFiles

**Deploy Command:**
```bash
cd backend && pnpm run build:vercel
```

## Validation

### Backend

| Check | Expected |
|-------|----------|
| GET /health | 200 OK - Returns health status |
| GET /api/v1/dashboard | 200 OK - Returns dashboard data |
| GET /api/v1/vouchers | 200 OK - Returns vouchers list |

### Portals

| Check | Status |
|-------|--------|
| https://app.ketchup.cc | ✅ 200 OK |
| https://gov.ketchup.cc | ✅ 200 OK |

Portals should show dashboard data once backend API routes return 200.

## Commands used

```bash
# Build backend with bundling
cd backend && pnpm run build:vercel

# Deploy to Vercel
VERCEL_TOKEN=xxx ./scripts/deploy-backend.sh

# Validate
curl https://ketchup-backend-buffr.vercel.app/health
curl https://ketchup-backend-buffr.vercel.app/api/v1/dashboard
```
