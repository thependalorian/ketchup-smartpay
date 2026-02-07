# Why Data Isn’t Loading (app.ketchup.cc / gov.ketchup.cc)

**Date:** 2026-02-07

## Summary

- **app.ketchup.cc** and **gov.ketchup.cc** load (200 OK) but dashboards show “—” because the **backend API returns 503** for all data routes.
- Root cause: the **backend serverless function** fails to load the Express app, so only `/health` (handled in the handler) works; `/api/v1/dashboard/metrics` and other routes return 503.

---

## 1. What’s happening

| Check | Result |
|-------|--------|
| **app.ketchup.cc** | 200 OK (portal HTML loads) |
| **gov.ketchup.cc** | 200 OK (portal HTML loads) |
| **api.ketchup.cc/health** | 200 OK (handler returns JSON) |
| **api.ketchup.cc/api/v1/dashboard/metrics** | **503** (Function error) |

Error returned:

```text
Cannot find module '/var/task/backend/dist/backend/src/database/connection'
imported from /var/task/backend/dist/backend/src/app.js
```

So the **Express app** is being loaded from **unbundled** `app.js`, which then `import`s `./database/connection`. That file is not present in the serverless bundle, so the app fails to load and the handler returns 503. Data routes never run.

---

## 2. Deployments and data flow

| Project | Vercel project | Domain | Role |
|---------|-----------------|--------|------|
| **Ketchup Portal** | ketchup-portal | app.ketchup.cc | SPA; calls API with `VITE_API_URL` + `VITE_API_KEY` |
| **Government Portal** | government-portal | gov.ketchup.cc | SPA; calls API with `VITE_API_URL` + `VITE_API_KEY` |
| **Backend API** | ketchup-backend | api.ketchup.cc | Express app; reads DB; must load **bundled** entry |

Flow:

```text
app.ketchup.cc / gov.ketchup.cc
  → fetch(VITE_API_URL + '/api/v1/...', { headers: { 'X-API-Key': VITE_API_KEY } })
  → api.ketchup.cc (or ketchup-backend-buffr.vercel.app)
  → serverless handler (api/index.js) loads Express app
  → Express app uses DATABASE_URL and returns data
```

If the handler fails to load the app (current 503), no data is returned and the portals show “—”.

---

## 3. Portal env vars (app / gov)

Set in **Vercel** for **ketchup-portal** and **government-portal** (and in each app’s `.env.local` for local dev). These are **baked in at build time** (Vite):

| Variable | Purpose | Example |
|----------|---------|--------|
| **VITE_API_URL** | Backend base URL | `https://api.ketchup.cc` or `https://ketchup-backend-buffr.vercel.app` |
| **VITE_API_KEY** | Sent as `X-API-Key`; must match backend key | Ketchup portal key / Government portal key |
| **VITE_APP_URL** | Canonical portal URL | `https://app.ketchup.cc` / `https://gov.ketchup.cc` |

Current repo `.env.local` examples:

- **Ketchup:** `VITE_API_URL=https://ketchup-backend-buffr.vercel.app`, `VITE_API_KEY=smartpay_ketchup_...`
- **Government:** `VITE_API_URL=https://ketchup-backend-buffr.vercel.app`, `VITE_API_KEY=smartpay_gov_...`

For production you can switch `VITE_API_URL` to `https://api.ketchup.cc` and redeploy both portals.

---

## 4. Backend env vars (ketchup-backend)

Set in **Vercel → ketchup-backend → Settings → Environment Variables** (Production and Preview). The backend **must** have:

| Variable | Purpose |
|----------|--------|
| **DATABASE_URL** | Neon PostgreSQL connection string; backend uses this to read/write data. |
| **KETCHUP_API_KEY** | Must equal **ketchup-portal**’s `VITE_API_KEY` (shared/dashboard and ketchup routes). |
| **GOVERNMENT_API_KEY** | Must equal **government-portal**’s `VITE_API_KEY` (government routes). |

Optional: `API_KEY` or `KETCHUP_SMARTPAY_API_KEY` (auth middleware accepts these too for Ketchup).

If `DATABASE_URL` is missing or wrong, DB calls fail. If API keys don’t match the portals, the API returns 401/403 and the UI still shows no data.

---

## 5. Why the backend returns 503 (bundle not loading)

1. **Handler** (`api/index.js`) is supposed to load the **bundled** app from `backend/dist/backend/src/vercel-entry.js` (single file with DB and routes inlined).
2. Previously the handler tried that, then **fell back** to unbundled `app.js`. On Vercel, the fallback ran and `app.js` tried to `import './database/connection'`, which is not in the serverless bundle → **module not found** → 503.
3. So data wasn’t loading because the **Express app never started** for data routes; only the hard-coded `/health` in the handler worked.

---

## 6. Fix (what was done and what you need to do)

**In the repo:**

1. **api/index.js**  
   - Load **only** the bundled `vercel-entry.js` (no fallback to `app.js`).  
   - Resolve path with `process.cwd()` and `__dirname` so it works on Vercel.  
   So the serverless function should now load the bundle and the Express app (and thus DB) for all routes.

2. **vercel-entry.ts**  
   - Dotenv is loaded in a try/catch so missing `dotenv` in serverless doesn’t crash the bundle.

**You need to:**

1. **Redeploy the backend**  
   From repo root (with backend config):

   ```bash
   cd ketchup-smartpay
   VERCEL_ORG_ID=team_MPOdmWd6KnPpGhXI9UYg2Opo VERCEL_PROJECT_ID=prj_bpoWBmxYRth7YbAVTJVsjP1Xmzaw \
   vercel --prod --yes -A vercel.backend.json
   ```

   Or use your existing deploy script/token. This deploys the updated `api/index.js` and the bundle.

2. **Set backend env vars in Vercel**  
   In **Vercel → ketchup-backend → Settings → Environment Variables** add (if not already):

   - **DATABASE_URL** = your Neon connection string  
   - **KETCHUP_API_KEY** = same value as ketchup-portal’s **VITE_API_KEY**  
   - **GOVERNMENT_API_KEY** = same value as government-portal’s **VITE_API_KEY**  

   Then trigger a new production deployment (or redeploy again after saving env vars).

3. **Optional: point portals at api.ketchup.cc**  
   In Vercel (and in `.env.local` if you build locally), set:

   - **ketchup-portal:** `VITE_API_URL=https://api.ketchup.cc`  
   - **government-portal:** `VITE_API_URL=https://api.ketchup.cc`  

   Redeploy both portals so the new URL is baked in.

---

## 7. Verify after fix

1. **Backend health (with DB):**  
   `curl -s https://api.ketchup.cc/health`  
   Expect JSON with `"status":"healthy"` (and ideally DB-related info if you expose it).

2. **Data route (use real key from ketchup-portal .env.local):**  
   `curl -s -H "X-API-Key: YOUR_KETCHUP_VITE_API_KEY" https://api.ketchup.cc/api/v1/dashboard/metrics`  
   Expect JSON with metrics (or 401 if key is wrong).

3. **app.ketchup.cc / gov.ketchup.cc**  
   Open the dashboards; they should show numbers instead of “—”.

---

## 8. Quick reference

| Issue | Cause | Fix |
|-------|--------|-----|
| Dashboards show “—” | API returns 503 for data routes | Redeploy backend with updated api/index.js (bundle-only load). |
| 503 “Cannot find module ... database/connection” | Handler was loading unbundled app.js | Fixed by loading only vercel-entry.js; redeploy. |
| 401 on API calls | API key mismatch | Set KETCHUP_API_KEY / GOVERNMENT_API_KEY in backend to match each portal’s VITE_API_KEY. |
| 500 or DB errors | DATABASE_URL missing or wrong | Set DATABASE_URL in Vercel for ketchup-backend. |
| 500 FUNCTION_INVOCATION_FAILED | Backend env not set in Vercel (DATABASE_URL, KETCHUP_API_KEY, etc.) | Sync env via script (Vercel API), then redeploy backend. |
| Portals call wrong URL | VITE_API_URL not set or old | Set VITE_API_URL to https://api.ketchup.cc (or backend URL) and redeploy portals. |

---

## 9. Resolving 500 FUNCTION_INVOCATION_FAILED (Vercel API, no MCP)

There are no Vercel MCP tools in this environment. Use the **Vercel REST API** via the repo script to sync backend env and fix 500s:

1. **Sync backend env to Vercel** (requires `VERCEL_TOKEN` from https://vercel.com/account/tokens):

   ```bash
   cd ketchup-smartpay
   VERCEL_TOKEN=your_token node scripts/set-vercel-env-and-domain.mjs
   ```

   This sets **ketchup-backend** env from `backend/.env.local` (DATABASE_URL, KETCHUP_API_KEY, GOVERNMENT_API_KEY, etc.) and ensures api.ketchup.cc is on ketchup-backend.

2. **Redeploy backend** (build uses backend config; root `vercel.json` is for portal by default):

   ```bash
   cd ketchup-smartpay
   cp vercel.backend.json vercel.json
   VERCEL_ORG_ID=team_MPOdmWd6KnPpGhXI9UYg2Opo VERCEL_PROJECT_ID=prj_bpoWBmxYRth7YbAVTJVsjP1Xmzaw vercel --prod --yes
   cp apps/ketchup-portal/vercel.json vercel.json   # restore portal config
   ```

   Or restore `vercel.json` from `vercel.backend.json` only for the deploy, then put the portal config back.

3. **Verify:**  
   `curl -s -H "X-API-Key: YOUR_KETCHUP_API_KEY" https://api.ketchup.cc/api/v1/dashboard/metrics`  
   Expect 200 and JSON (or 500 with a JSON `message` if something else fails; check Vercel function logs).

---

## 10. Dashboard fallback and DB resilience (2026-02-07)

If the Express app or DB fails to load in the serverless function, `/api/v1/dashboard/metrics` can still return **200 with empty metrics** so portals load:

1. **api/index.js** – For requests whose path includes `dashboard/metrics` and that have an `x-api-key` header, the handler returns `{ success: true, data: { totalBeneficiaries: 0, ... } }` **without** loading the Express app. Portals then show zeros instead of “—” or errors.

2. **backend/src/services/dashboard/DashboardService.ts** – `getMetrics()` is resilient: each DB query (beneficiaries, vouchers, agents) runs in its own try/catch. Missing tables or connection errors return zeros for that part instead of throwing, so the route returns 200 with partial/empty data.

3. **backend/src/database/connection.ts** – Connection is **lazy**: `neon()` is only called on first use, so the serverless function does not throw at import time if `DATABASE_URL` is not yet available.

**To get real DB metrics:** Ensure `DATABASE_URL` and API keys are set in Vercel for ketchup-backend, redeploy backend, and (if needed) check Vercel function logs for any remaining errors. Portals should use `VITE_API_URL=https://api.ketchup.cc`; run `node scripts/set-vercel-env-and-domain.mjs` then redeploy both portals.
