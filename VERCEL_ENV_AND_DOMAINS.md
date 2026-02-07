# Vercel Environment Variables & Domains

Reference for all `.env*` files and Vercel project setup. **Do not commit secret values**; set them in Vercel Dashboard or via `vercel env add`.

---

## Ketchup portals and the database

**Ketchup Portal and Government Portal do not pull data from the database.** They are Vite SPAs that run in the browser and have no server-side database connection. All data is fetched from the **backend API** (api.ketchup.cc) using `VITE_API_URL` and `VITE_API_KEY`. The **backend** (api.ketchup.cc) connects to the database; the portals only talk to the API.

- **Portals** → call **api.ketchup.cc** (with `VITE_API_KEY`) → **Backend** → **Database**
- `DATABASE_URL` and `BUFFR_*` on the portal projects are optional (e.g. for future server-side/API routes); the current portal UIs do not use them.

---

## Why is API data not available? (Dashboard shows —)

When **Compliance Score**, **PSD Status**, **Open Incidents**, or **System Uptime** (and other portal data) show **"—"**, the portals are **not getting responses** from the backend API.

### Root cause

1. **Backend not reachable**  
   The portals call `VITE_API_URL` (e.g. `https://api.ketchup.cc`). If that host is down, not deployed, or DNS is wrong, requests **time out or fail** and the UI shows "—".

2. **Backend not deployed at api.ketchup.cc**  
   The backend (Node/Express in `backend/`) runs on **Railway** (or another host), **not Vercel**.  
   - **api.ketchup.cc** must point (DNS CNAME or proxy) to that backend deployment.  
   - If nothing is deployed there, or the domain points elsewhere, the portals will never get data.

3. **Wrong or missing API key**  
   - **Government Portal:** Backend expects `X-API-Key` to match `GOVERNMENT_API_KEY` (see `backend/src/api/middleware/governmentAuth.ts` and `auth.ts`).  
   - **Ketchup Portal:** Backend accepts `API_KEY`, `KETCHUP_SMARTPAY_API_KEY`, or `KETCHUP_API_KEY`.  
   - If the portal’s `VITE_API_KEY` does not match the key configured on the backend, the API returns **401/403** and the UI shows "—".

4. **CORS**  
   If the backend does not allow the portal origins (e.g. `https://app.ketchup.cc`, `https://gov.ketchup.cc`), the browser blocks responses and the UI shows "—".

### What to do

| Step | Action |
|------|--------|
| 1 | **Confirm backend is running** – Open `https://api.ketchup.cc/health` in a browser or `curl https://api.ketchup.cc/health`. If it times out or errors, the backend is not reachable at that URL. |
| 2 | **Deploy/point backend** – Deploy `backend/` to Railway (or your host) and set **api.ketchup.cc** DNS (CNAME) or proxy to that deployment. |
| 3 | **Set backend env** – On the backend host set at least: `GOVERNMENT_API_KEY` (for gov portal), and one of `API_KEY` / `KETCHUP_SMARTPAY_API_KEY` / `KETCHUP_API_KEY` (for ketchup portal). Use the same values as in the portals’ `VITE_API_KEY`. |
| 4 | **Match portal API key** – In Vercel (or `.env.local`), set **Government Portal** `VITE_API_KEY` = backend `GOVERNMENT_API_KEY`; **Ketchup Portal** `VITE_API_KEY` = one of the ketchup keys above. Then redeploy the portals so the new key is baked in. |
| 5 | **Check browser Network tab** – On app.ketchup.cc or gov.ketchup.cc, open DevTools → Network. Reload and look for requests to `api.ketchup.cc`. If they are red (failed), check status: **timeout** = backend unreachable; **401/403** = wrong/missing API key; **CORS error** = backend CORS config. |

Once **api.ketchup.cc** is up, reachable, and accepting the portal API keys, dashboard and other API-driven data will load instead of "—".

---

## Option A: Configure ketchup-backend in Vercel (one-time)

**Full checklist:** See **[VERCEL_BACKEND_CONFIG.md](./VERCEL_BACKEND_CONFIG.md)** for every setting (General, Build, Deployment Protection, Domains) and optional automation with `VERCEL_TOKEN`.

If backend deploy fails with **Command "pnpm run build" exited with 2**, the Vercel project likely has **Root Directory = backend**. Clear it so the build runs from repo root (where `shared/` and `api/index.js` exist).

| Step | Action |
|------|--------|
| 1 | Open **https://vercel.com/buffr/ketchup-backend/settings** in your browser. |
| 2 | Under **General**, find **Root Directory**. |
| 3 | Clear the field (leave it empty) and click **Save**. |
| 4 | From repo root run: **`./scripts/deploy-backend.sh`** (or **`pnpm run deploy:backend`**). |

After this, backend deploys use repo root, build `backend` with `shared/` available, and serve the API via `api/index.js`.

### Next steps (in order)

| # | Action | Command / URL |
|---|--------|----------------|
| 1 | Clear Root Directory (one-time) | Open **https://vercel.com/buffr/ketchup-backend/settings** → General → Root Directory → clear → Save |
| 2 | Deploy backend | From repo root: **`./scripts/deploy-backend.sh`** |
| 3 | Validate production | **`curl https://ketchup-backend-buffr.vercel.app/health`** → expect `{"status":"healthy","database":"connected",...}` |

---

## Connect portals to backend (no connection?)

If the portals show "—" or no data, the **backend and portals are not connected**. Do the following in order.

### 1. Backend must serve the API (Vercel)

- **Root Directory must be empty** so the build runs from repo root (where `shared/` and `api/index.js` live). If it’s set to `backend`, the build fails (no `shared/`, no root `node_modules`).
- **Option A – Clear Root Directory in the dashboard (do this once):**
  1. Open **https://vercel.com/buffr/ketchup-backend/settings** (or Vercel → **buffr** → **ketchup-backend** → **Settings**).
  2. Under **General**, find **Root Directory**.
  3. Clear the value (leave it empty) and save.
  4. From repo root run: **`pnpm run deploy:backend`**.
- **Option B – Use a token:** Set `VERCEL_TOKEN` (from https://vercel.com/account/tokens), then run **`pnpm run deploy:backend`**; the script will clear Root Directory via the API.

### 2. Point portals at the backend URL

Portals use **`VITE_API_URL`** (baked in at build time). Use **one** of these:

**Option A – Backend Vercel URL (no DNS):**

- In **`apps/ketchup-portal/.env.local`** and **`apps/government-portal/.env.local`** set:
  - `VITE_API_URL=https://ketchup-backend-buffr.vercel.app`
- Then run: **`pnpm run deploy:ketchup`** and **`pnpm run deploy:government`** so the new URL is synced and deployed.

**Option B – Custom domain api.ketchup.cc:**

- In Vercel → **ketchup-backend** → **Settings → Domains**, add **`api.ketchup.cc`**.
- If **api.ketchup.cc** was added to **ketchup-portal** by mistake: remove it from ketchup-portal (Settings → Domains → Remove), then add it to **ketchup-backend**.
- Or set **`VERCEL_TOKEN`** and run **`pnpm run add-backend-domain`** (or `node scripts/set-vercel-env-and-domain.mjs --domain-only`) to move api.ketchup.cc from ketchup-portal to ketchup-backend.
- In your DNS (ketchup.cc), add **CNAME** `api` → `cname.vercel-dns.com` (or the target Vercel shows).
- Keep `VITE_API_URL=https://api.ketchup.cc` in both portal `.env.local` files, then run the deploy scripts above.

### 3. API keys must match

- **Government portal:** Backend env **`GOVERNMENT_API_KEY`** must equal the government portal’s **`VITE_API_KEY`** (in Vercel and `.env.local`).
- **Ketchup portal:** Backend env **`API_KEY`** or **`KETCHUP_SMARTPAY_API_KEY`** must equal the ketchup portal’s **`VITE_API_KEY`** (in Vercel and `.env.local`).  
  Backend sync from `backend/.env.local` is done by `pnpm run deploy:backend`; ensure those keys are set there.

### 4. Verify connection

- Open **https://ketchup-backend-buffr.vercel.app/health** (or **https://api.ketchup.cc/health** if using Option B). You should see JSON, e.g. `{"status":"healthy","database":"connected",...}`. If you see HTML, Root Directory is still wrong.
- On **https://app.ketchup.cc** or **https://gov.ketchup.cc**, open DevTools → Network, reload, and check requests to the backend URL. They should return 200, not timeout or 401/403.

---

## 1. Environment files summary

| File | Project / use |
|------|----------------|
| `.env.local` (root) | Shared frontend API URL |
| `apps/ketchup-portal/.env.local` | **Ketchup Portal** (Vite) → Vercel project `ketchup-portal` |
| `apps/ketchup-portal/.env.example` | Template for ketchup-portal |
| `apps/government-portal/.env.local` | **Government Portal** (Vite) → Vercel project `government-portal` |
| `apps/government-portal/.env.example` | Template for government-portal |
| `buffr/.env.local` | **Buffr** (Next.js) → Vercel project `buffr` (if deployed) |
| `buffr/.env.example` | Template for buffr |
| `backend/.env.local` | **Backend API** (Node, port 3001) → Railway/other (not Vercel) |

---

## 2. Ketchup Portal (app.ketchup.cc)

**Vercel project:** `ketchup-portal` (team: buffr)

### Domain to add

- **Production:** `app.ketchup.cc`  
  DNS: CNAME `app` → `cname.vercel-dns.com` (already in DNS_RECORDS.txt)

Add in Vercel: **Project → Settings → Domains → Add** `app.ketchup.cc` → assign to **Production**.

### Environment variables (Production)

Set in **Vercel → ketchup-portal → Settings → Environment Variables** (or use `vercel env add` from repo root).

| Variable | Description | Example / note |
|----------|-------------|----------------|
| `VITE_API_URL` | Backend API base URL | `https://api.ketchup.cc` |
| `VITE_APP_URL` | Portal canonical URL | `https://app.ketchup.cc` |
| `VITE_API_KEY` | API key for backend | From `apps/ketchup-portal/.env.local`; used to call api.ketchup.cc (portals do not connect to DB) |
| `DATABASE_URL` | Optional | Not used by the portal UI; only for future server-side/API routes if added |
| `BUFFR_API_URL` | Optional | Not used by the portal UI; only for future server-side calls to Buffr if added |
| `BUFFR_API_KEY` | Optional | Not used by the portal UI; only for future server-side calls to Buffr if added |
| `VITE_APP_NAME` | App title | `SmartPay Ketchup Portal` |
| `VITE_ENVIRONMENT` | Environment | `production` |
| `VITE_APP_VERSION` | Optional | `2.0.0` |
| `VITE_ENABLE_ANALYTICS` | Optional | `true` |
| `VITE_ENABLE_SENTRY` | Optional | `false` |
| `VITE_SENTRY_DSN` | Optional | Leave empty if disabled |

---

## 3. Government Portal (gov.ketchup.cc)

**Vercel project:** `government-portal` (team: buffr)

### Domain

- **Production:** `gov.ketchup.cc` (added; DNS: CNAME `gov` → `cname.vercel-dns.com`)

### Environment variables (Production)

Configured via CLI; set real `VITE_API_KEY` in Vercel Dashboard if needed.

| Variable | Description | Example / note |
|----------|-------------|----------------|
| `VITE_API_URL` | Backend API base URL | `https://api.ketchup.cc` |
| `VITE_APP_URL` | Portal canonical URL | `https://gov.ketchup.cc` |
| `VITE_API_KEY` | Government portal API key | From `apps/government-portal/.env.local`; used to call api.ketchup.cc (portals do not connect to DB) |
| `DATABASE_URL` | Optional | Not used by the portal UI; only for future server-side/API routes if added |
| `BUFFR_API_URL` | Optional | Not used by the portal UI; only for future server-side calls to Buffr if added |
| `BUFFR_API_KEY` | Optional | Not used by the portal UI; only for future server-side calls to Buffr if added |
| `VITE_APP_NAME` | App title | `SmartPay Government Portal` |
| `VITE_ENVIRONMENT` | Environment | `production` |
| `VITE_APP_VERSION` | Optional | `2.0.0` |
| `VITE_ENABLE_ANALYTICS` | Optional | `true` |
| `VITE_ENABLE_SENTRY` | Optional | `false` |
| `VITE_SENTRY_DSN` | Optional | Leave empty if disabled |

### Deploy government-portal from repo root

From repo root (ketchup-smartpay), deploy to **government-portal** using the gov config and repo link:

1. Point local link to government-portal and use gov config:
   - `.vercel/repo.json`: set `projects` to `[{"id":"prj_N1WNHJMWTE7sXqmEXxAIZDZaKWA8","name":"government-portal","directory":"."}]`
   - `.vercel/project.json`: set `projectId` to `prj_N1WNHJMWTE7sXqmEXxAIZDZaKWA8`, `projectName` to `government-portal`
2. Deploy: `vercel --prod --yes -A vercel.gov.json`
3. Restore ketchup-portal as default: revert `.vercel/repo.json` and `.vercel/project.json` to ketchup-portal (see step 6 in “Quick add via CLI” for ketchup-portal).

---

## 4. Buffr (pay.buffr.ai / buffr.ai)

**Vercel project:** `buffr-host` (or create/link a project named `buffr`)

### Domains (from DNS)

- `buffr.ai`, `www.buffr.ai`, `app.buffr.ai`, `admin.buffr.ai` (CNAME → Vercel)

### Environment variables (Production)

Required for DB and Ketchup API. Set in **Vercel → buffr-host (or buffr) → Settings → Environment Variables**, or use the deploy script (syncs from `buffr/.env.local`).

| Variable | Description | Example / note |
|----------|-------------|----------------|
| **`DATABASE_URL`** | Neon PostgreSQL connection string | From Neon dashboard; `postgresql://...?sslmode=require` |
| **`KETCHUP_SMARTPAY_API_URL`** | Ketchup SmartPay backend base URL | `https://api.ketchup.cc` |
| **`KETCHUP_SMARTPAY_API_KEY`** | API key to connect to Ketchup SmartPay from Buffr | From backend or `buffr/.env.local`; used by Buffr to call api.ketchup.cc |
| `NEXT_PUBLIC_APP_URL` | Buffr app canonical URL | `https://pay.buffr.ai` or `https://app.buffr.ai` |
| `JWT_SECRET` | JWT signing secret | Required in production (from `buffr/.env.local`) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Required in production |
| `ENCRYPTION_KEY` | Data encryption at rest | Required in production |
| `NAMPOST_API_URL`, `NAMPOST_API_KEY` | Nampost integration | If used |
| `NAMPAY_BASE_URL`, `NAMPAY_API_KEY` | Nampay integration | If used |
| Other vars | See `buffr/.env.example` | IPS, Token Vault, Clerk, Fineract, USSD, etc. |

Add the rest from `buffr/.env.local` in **Vercel → buffr-host → Settings → Environment Variables** (sensitive ones as **Encrypted**).

### Quick add via CLI (Buffr)

From repo root, link to the Buffr project then add env (or use the deploy script which syncs from `buffr/.env.local`):

```bash
vercel link --project buffr-host --yes
vercel env add DATABASE_URL production
vercel env add KETCHUP_SMARTPAY_API_URL production
vercel env add KETCHUP_SMARTPAY_API_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add ENCRYPTION_KEY production
```

Then deploy so env takes effect: `pnpm run deploy:buffr`.

### Dedicated deploy script (env vars take effect)

From repo root (ketchup-smartpay), run:

```bash
pnpm run deploy:buffr
```

This script (see `scripts/deploy-buffr.sh`):

1. Links to Vercel project **buffr-host**
2. Syncs env from `buffr/.env.local` to Vercel **production** (so `DATABASE_URL`, `KETCHUP_SMARTPAY_API_KEY`, `JWT_*`, etc. take effect)
3. Deploys with `vercel --prod --yes`

Use `pnpm run deploy:buffr:no-sync` to deploy without syncing `.env.local`.

**Note:** In Vercel → buffr-host → Settings → General, set **Root Directory** to `buffr` so the build runs from the Buffr app.

---

## 5. Backend (api.ketchup.cc)

You can run the backend on **Railway** (or another host) or deploy it to **Vercel**.

### Option A: Deploy backend to Vercel

The backend is set up for Vercel:

- **Entry:** `backend/src/app.ts` exports the Express app (used as the serverless function). Local dev still uses `backend/src/index.ts` (listen + compliance schedulers).
- **Config:** `backend/vercel.json` sets the function entry and `maxDuration: 60`.

**Steps:**

1. In Vercel, create a **new project** (or use an existing one) and connect the same repo.
2. Set **Root Directory** to `backend` (Project Settings → General → Root Directory).
3. Set **Install Command** to run from repo root so the monorepo (and `shared/`) is installed, e.g. `cd .. && pnpm install`, or leave default if you use a single `backend/` clone.
4. Add **Environment variables** (Production): `DATABASE_URL`, `GOVERNMENT_API_KEY`, and one of `API_KEY` / `KETCHUP_SMARTPAY_API_KEY` / `KETCHUP_API_KEY`. Optionally: `BUFFR_API_URL`, `BUFFR_API_KEY`.
5. Deploy. The backend will be available at `https://<project>.vercel.app` (e.g. `https://ketchup-backend-xxx.vercel.app`).
6. Add a **custom domain** `api.ketchup.cc` in Vercel (Project → Settings → Domains) and point DNS (CNAME `api` → `cname.vercel-dns.com`).

**Schedulers on Vercel:** The compliance schedulers (daily reconciliation, uptime checks, etc.) do **not** run on Vercel (no long-running process). To run them on a schedule, use **Vercel Cron**: add a `vercel.json` cron that calls an internal endpoint (e.g. `POST /api/v1/compliance/cron/daily`) secured by a secret, and implement that route to run the same logic as the scheduler. Until then, only on-demand API and health checks run on Vercel.

### Option B: Run backend on Railway (or other host)

Run the backend as a long-running Node server (e.g. on Railway). Use `backend/.env.local` there. Point **api.ketchup.cc** DNS to that host.

### Dedicated deploy script (backend to Vercel)

From repo root, run:

```bash
pnpm run deploy:backend
```

This script (see `scripts/deploy-backend.sh`):

1. Links to Vercel project **ketchup-backend** (create this project and set **Root Directory** = `backend` in Project Settings).
2. Syncs env from `backend/.env.local` to Vercel **production** (so env vars take effect).
3. Deploys with `vercel --prod --yes`.
4. Restores the default Vercel link to **ketchup-portal** when done.

Use `pnpm run deploy:backend:no-sync` to deploy without syncing `.env.local` (use existing Vercel env only).

**First-time setup:** In Vercel Dashboard, open project `ketchup-backend`. Set **Settings → General → Root Directory** = `backend` and save. Without this, Vercel builds from repo root (ketchup-portal) and the backend URL will serve the portal app. After setting Root Directory, run `pnpm run deploy:backend` again so the Express backend is built and deployed.

---

## 6. Quick add via CLI (ketchup-portal)

From repo root (where `.vercel` is linked to `ketchup-portal`):

```bash
# Add domain (if supported)
vercel domains add app.ketchup.cc

# Add env vars (you will be prompted for value, or use echo)
vercel env add VITE_API_URL production
vercel env add VITE_APP_URL production
vercel env add VITE_API_KEY production
vercel env add DATABASE_URL production
vercel env add BUFFR_API_URL production
vercel env add BUFFR_API_KEY production
vercel env add VITE_APP_NAME production
vercel env add VITE_ENVIRONMENT production
```

Then redeploy so the new env and domain take effect: `vercel --prod`.

### Dedicated deploy script (env vars take effect)

From repo root, run:

```bash
pnpm run deploy:ketchup
```

This script (see `scripts/deploy-ketchup-portal.sh`):

1. Links to Vercel project **ketchup-portal**
2. Syncs env from `apps/ketchup-portal/.env.local` to Vercel **production** (so env vars take effect)
3. Deploys with `vercel --prod --yes`

Use `pnpm run deploy:ketchup:no-sync` to deploy without syncing `.env.local` (use existing Vercel env only).

---

## 7. Quick add via CLI (government-portal)

From repo root, after linking to government-portal (`vercel link --project government-portal --yes`):

```bash
vercel env add VITE_API_URL production
vercel env add VITE_APP_URL production
vercel env add VITE_API_KEY production
vercel env add VITE_APP_NAME production
vercel env add VITE_ENVIRONMENT production
vercel domains add gov.ketchup.cc
```

Deploy: `vercel --prod --yes -A vercel.gov.json` (ensure `.vercel/repo.json` and `.vercel/project.json` point to government-portal; see “Deploy government-portal from repo root” above).

### Dedicated deploy script (env vars take effect)

From repo root, run:

```bash
pnpm run deploy:government
```

This script (see `scripts/deploy-government-portal.sh`):

1. Points `.vercel` at **government-portal** (then restores **ketchup-portal** when done)
2. Syncs env from `apps/government-portal/.env.local` to Vercel **production**
3. Deploys with `vercel --prod --yes -A vercel.gov.json`
4. Restores the default Vercel link to **ketchup-portal**

Use `pnpm run deploy:government:no-sync` to deploy without syncing `.env.local`.

---

## Verification: gov.ketchup.cc and data flow

- **Web search:** `gov.ketchup.cc` is not indexed by search engines yet (new/small site). That is normal; the site is live.
- **Deployment:** Government portal is deployed correctly: Vercel project **government-portal** is **READY**, production alias **gov.ketchup.cc** is set. Latest deployment: `government-portal-hshj0a56z-buffr.vercel.app` → **gov.ketchup.cc**.
- **Data flow:** Ketchup portals **do not pull data from the database**. They are client-only (Vite SPAs). They pull data from the **backend API** (api.ketchup.cc) using `VITE_API_URL` and `VITE_API_KEY`. Only the backend connects to the database.
- **API key:** The government api-client (`packages/api-client` government module) sends `X-API-Key: VITE_API_KEY` so the backend can authenticate. Ensure `VITE_API_KEY` is set in Vercel for government-portal (synced via deploy script).
- **Quick check:** Open https://gov.ketchup.cc → Dashboard should show Compliance Score, PSD Status, Open Incidents, System Uptime (data from api.ketchup.cc). If you see “—” or errors, confirm api.ketchup.cc is up and accepts the government portal API key.

---

## Env validation (both portals)

**Required for production (used by the portal UI):**

| Variable | Ketchup Portal (app.ketchup.cc) | Government Portal (gov.ketchup.cc) |
|----------|----------------------------------|-----------------------------------|
| `VITE_API_URL` | `https://api.ketchup.cc` | `https://api.ketchup.cc` |
| `VITE_APP_URL` | `https://app.ketchup.cc` | `https://gov.ketchup.cc` |
| `VITE_API_KEY` | From ketchup-portal .env.local | From government-portal .env.local |
| `VITE_APP_NAME` | SmartPay Ketchup Portal | SmartPay Government Portal |
| `VITE_ENVIRONMENT` | `production` | `production` |

**Optional (same for both):** `VITE_APP_VERSION`, `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_SENTRY`, `VITE_SENTRY_DSN`. `DATABASE_URL`, `BUFFR_*` are optional (not used by portal UI).

**To fix/sync env in Vercel:** Run from repo root: `pnpm run deploy:ketchup` and `pnpm run deploy:government` (each syncs from the app's `.env.local` to Vercel production, then deploys).

**To validate:** Open https://app.ketchup.cc (title: "SmartPay Ketchup Portal") and https://gov.ketchup.cc (title: "SmartPay Government Portal - Ministry of Finance"). List env: `vercel link --project ketchup-portal --yes && vercel env ls production`; repeat with `government-portal`.

**Latest code validation (env usage fixes):**

- **api-client:** Ketchup and government clients use `VITE_API_URL` / `VITE_API_KEY` with typed access; empty or whitespace API key is treated as `undefined` so the `X-API-Key` header is not sent. Shared client uses `defaultApiBase()`; Open Banking uses `VITE_API_URL` with fallback.
- **Portals:** Settings pages use `import.meta.env.VITE_API_URL` for display. No other direct env usage in app code.
- **Type declarations:** `apps/ketchup-portal/src/vite-env.d.ts` and `apps/government-portal/src/vite-env.d.ts` declare `VITE_*` for TypeScript.
- **Redeploy:** Both portals were redeployed after these fixes (Ketchup → app.ketchup.cc, Government → gov.ketchup.cc).
