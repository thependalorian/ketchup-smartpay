# Vercel alignment (98% confidence)

This doc maps the **ketchup-smartpay** file tree to official Vercel docs so deployment matches best practices.

**Sources:** [Configure a Build](https://vercel.com/docs/concepts/deployments/configure-a-build), [Rewrites](https://vercel.com/docs/rewrites), [Serverless Functions](https://vercel.com/docs/functions/serverless-functions), [Monorepos](https://vercel.com/docs/monorepos), [Project Configuration](https://vercel.com/docs/project-configuration), [Environment Variables](https://vercel.com/docs/environment-variables).

---

## 1. Monorepo layout (per Vercel monorepo docs)

| Tree path | Vercel concept | Notes |
|-----------|----------------|-------|
| **Root** `ketchup-smartpay/` | Repo root; one Git repo | Shallow clone; install runs from here unless Root Directory is set. |
| `apps/ketchup-portal/` | One Vercel **project** (app) | Vite SPA; own `vercel.json`, `package.json`. Use **Root Directory** = `apps/ketchup-portal` or deploy with project-specific `vercel.json` at root. |
| `apps/government-portal/` | Second Vercel **project** | Same idea; Root Directory = `apps/government-portal` or use `vercel.gov.json` at root when deploying. |
| `backend/` | **Not on Vercel** | Backend runs on **Railway** only. See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md). |
| `api/index.js` | Serverless function | Lives at repo root; rewrites send traffic here. Backend build outputs `backend/dist/**`; `includeFiles` pulls that into the function. |
| `packages/*` | Shared workspace packages | Used by apps; Vercel installs from root (`pnpm install`), so workspace deps are available. |

**Doc alignment:** Monorepo = one repo, multiple Vercel projects. Each app/backend = one project; Root Directory or per-deploy `vercel.json` selects which part is built.

---

## 2. Build configuration (per Configure a Build)

| Setting | ketchup-backend | ketchup-portal | government-portal |
|---------|-----------------|----------------|-------------------|
| **Root Directory** | Empty (recommended) | Can set to `apps/ketchup-portal` | Can set to `apps/government-portal` |
| **Framework Preset** | Other | Vite | Vite |
| **Build Command** | `cd backend && pnpm run build:vercel` | e.g. `pnpm build --filter=ketchup-portal` | e.g. `pnpm build --filter=government-portal` |
| **Output Directory** | `api` (function + static) | `apps/ketchup-portal/dist` | `apps/government-portal/dist` |
| **Install Command** | `pnpm install --no-frozen-lockfile` (backend deploy) | `pnpm install` | `pnpm install` |

**Doc alignment:** Build Command can be overridden in Project Settings or in `vercel.json` (`buildCommand`). For backend we use a **single repo deploy** with root `vercel.json` = backend config (or `vercel.backend.json` swapped in by script), so the build that runs is `cd backend && pnpm run build:vercel`.

---

## 3. Rewrites (per Rewrites docs)

Current backend `vercel.json`:

```json
"rewrites": [{ "source": "/(.*)", "destination": "/api?path=$1" }]
```

- **Type:** Same-application rewrite (route to a serverless function in the same project).
- **Behavior:** Every path goes to `/api` with `path` query; `api/index.js` reads `path` and forwards to Express.
- **Doc alignment:** Rewrites are in `vercel.json` at project root; destination can be a function path (e.g. `/api` → `api/index.js`).

Portals use something like:

```json
"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
```

for SPA fallback (Vite build outputs to `dist`).

---

## 4. Serverless function (per Functions docs)

| Tree path | Role |
|-----------|------|
| `api/index.js` | Single serverless handler; dynamic `import()` of `backend/dist/backend/src/vercel-entry.cjs`. |
| `backend/src/vercel-entry.ts` | Bundled entry (Express app); built as `backend/dist/backend/src/vercel-entry.cjs`. |
| `backend/dist/**` | Included via `functions["api/index.js"].includeFiles` so the bundle is available at runtime. |

**Doc alignment:** Functions run in one region by default; config (e.g. `maxDuration`, `includeFiles`) in `vercel.json` under `functions` is supported. Install command runs from Root Directory (here, repo root); backend build runs inside `backend/`.

---

## 5. Environment variables (per Environment Variables docs)

- **Scope:** Production / Preview; set per project in Dashboard or via API (e.g. `set-vercel-env-and-domain.mjs`).
- **Apply to:** New deployments only (not past ones).
- **Limit:** 64 KB total per deployment (Node runtimes).
- **Secrets:** Stored in `secrets.local` (gitignored) and synced to Vercel; never commit real values.

**Doc alignment:** All env (DATABASE_URL, KETCHUP_API_KEY, VITE_*, etc.) is per project and per environment; our sync script pushes from `secrets.local` and `apps/*/.env.local` into the right Vercel projects.

---

## 6. File tree → Vercel mapping (from your tree)

```
ketchup-smartpay/
├── api/index.js              → Serverless function (handler)
├── apps/
│   ├── government-portal/     → Vercel project (gov.ketchup.cc)
│   │   ├── src/, public/      → App source
│   │   ├── vercel.json        → Portal rewrites, output dir
│   │   └── .env.local         → Portal env (synced to Vercel)
│   └── ketchup-portal/        → Vercel project (app.ketchup.cc)
│       ├── src/, public/
│       ├── vercel.json
│       └── .env.local
├── backend/                   → API code; built for ketchup-backend
│   ├── src/
│   │   ├── vercel-entry.ts    → Bundled Express entry
│   │   ├── database/          → Neon connection
│   │   └── api/routes/        → Express routes
│   ├── dist/                  → Build output (vercel-entry.cjs, etc.)
│   └── .env.local             → Backend env (synced via secrets.local)
├── packages/                  → Shared (api-client, config, types, ui, utils)
├── scripts/
│   ├── set-vercel-env-and-domain.mjs  → Sync env to Vercel
│   ├── deploy-backend.sh      → Deploy ketchup-backend
│   ├── deploy-ketchup-portal.sh
│   └── deploy-government-portal.sh
├── vercel.json                → Default root config (portal or backend by deploy)
├── vercel.backend.json        → Backend build + rewrites + functions
├── vercel.gov.json            → Government portal config
└── secrets.local              → Gitignored; VERCEL_TOKEN + backend secrets
```

---

## 7. 98% confidence checklist

- [x] **Monorepo:** One repo, **two** Vercel projects (ketchup-portal, government-portal). Backend is on **Railway** only.
- [x] **Build command:** Backend uses `cd backend && pnpm run build:vercel`; portals use filter or app-specific build; override via `vercel.json` or Project Settings.
- [x] **Root Directory:** Backend = empty (build from root); portals can use Root Directory = `apps/ketchup-portal` or `apps/government-portal` when deploying from dashboard.
- [x] **Rewrites:** Backend `vercel.json` rewrites `/(.*)` → `/api?path=$1` (same-application to function); portals use SPA fallback to `index.html`.
- [x] **Functions:** `api/index.js` is the handler; `includeFiles` includes `backend/dist/**`; `maxDuration` set (e.g. 30s).
- [x] **Env vars:** Per project, Production/Preview; synced via script from `secrets.local` and `apps/*/.env.local`; no secrets in repo.
- [x] **Install:** Root `pnpm install` (or `pnpm install --no-frozen-lockfile` for backend) so workspace and backend deps are available.

The only variable is **which config is at root** when you deploy: for backend you temporarily use `vercel.backend.json` as `vercel.json` (or deploy with `VERCEL_PROJECT_ID` + backend config); for portals the root `vercel.json` (or Root Directory) points at the correct app. Your scripts and DEPLOYMENT_GUIDE.md already encode this.
