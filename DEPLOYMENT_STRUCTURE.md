# Ketchup SmartPay – Deployment structure and access

## Repo layout (deployable parts)

```
ketchup-smartpay/
├── api/
│   └── index.js              # Vercel serverless entry (backend project only)
├── backend/                   # Express API (built → backend/dist)
│   ├── src/
│   │   ├── app.ts
│   │   ├── api/, database/, utils/
│   │   └── ...
│   └── package.json
├── apps/
│   ├── ketchup-portal/       # Vite SPA → Vercel project ketchup-portal
│   └── government-portal/     # Vite SPA → Vercel project government-portal
├── packages/                  # Shared (api-client, config, types, ui, utils)
├── shared/                    # Shared types (backend + apps)
├── scripts/
│   ├── deploy-backend.sh
│   ├── deploy-ketchup-portal.sh
│   └── deploy-government-portal.sh
├── vercel.backend.json        # Used when deploying backend
├── vercel.json                # Default (ketchup-portal)
├── vercel.gov.json            # Used when deploying government-portal
└── buffr/                     # Separate app (excluded from backend/portal deploys)
```

## Vercel projects (team: buffr)

| Project            | Purpose        | Production URL           | Custom domain    |
|--------------------|----------------|--------------------------|------------------|
| **ketchup-backend**| Express API    | ketchup-backend-buffr.vercel.app | api.ketchup.cc (optional) |
| **ketchup-portal** | SmartPay UI    | ketchup-portal-buffr.vercel.app  | **app.ketchup.cc** |
| **government-portal** | Government UI | government-portal-buffr.vercel.app | **gov.ketchup.cc** |

## What works today

- **Backend**
  - **GET /health** – Live at `https://ketchup-backend-buffr.vercel.app/health` (returns `{"status":"healthy","source":"api-handler",...}`).
  - Other API routes (e.g. `/api/v1/dashboard`) return **503** in serverless because the Express app’s ESM imports (e.g. `./database/connection`) are not resolved in the function bundle. Fix: bundle the backend into a single file or ensure all `backend/dist/**` files are included and resolve correctly.
- **Portals**
  - **app.ketchup.cc** – Ketchup Portal (Vite), READY.
  - **gov.ketchup.cc** – Government Portal (Vite), READY.
  - Set `VITE_API_URL` to `https://ketchup-backend-buffr.vercel.app` (or api.ketchup.cc) so the UIs call the backend; until full API routes work, only /health will succeed.

## Deploy commands (from repo root)

| Target   | Command |
|----------|--------|
| Backend  | `VERCEL_TOKEN=xxx ./scripts/deploy-backend.sh` |
| Ketchup portal | `./scripts/deploy-ketchup-portal.sh` |
| Government portal | `./scripts/deploy-government-portal.sh` |

**Backend and project selection:** The repo’s `.vercel` may be linked to **ketchup-portal** or **government-portal**. To always deploy the backend to **ketchup-backend**, the script sets `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (see [Vercel monorepo FAQ](https://vercel.com/docs/monorepos/monorepo-faq)). You can override: `VERCEL_PROJECT_ID=prj_bpoWBmxYRth7YbAVTJVsjP1Xmzaw vercel --prod --yes -A vercel.backend.json`.

## Backend routing (vercel.backend.json)

- Rewrite: `(.*)` → `/api?path=$1` so every path hits the same serverless function.
- `api/index.js` reads `path` from the query and sets `req.url` for the Express app.
- `/health` is answered directly by the handler so it always works; other paths load the Express app (and currently 503 in serverless until the bundle issue is fixed).

## References

- **VERCEL_BACKEND_CONFIG.md** – Backend project settings (Root Directory, Build, Deployment Protection).
- **VERCEL_ENV_AND_DOMAINS.md** – Env vars, domains, and connecting portals to the backend.
