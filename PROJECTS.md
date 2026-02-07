# Projects in ketchup-smartpay

All three Ketchup SmartPay deployments live in this directory. Run all commands from repo root: **`ketchup-smartpay/`**.

---

## 1. ketchup-smartpay-backend

| | |
|---|---|
| **Path in repo** | `backend/` |
| **Domain** | https://api.ketchup.cc |
| **Platform** | Railway |
| **Deploy from here** | `./scripts/deploy-backend.sh` or `railway up` |

See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for env vars and setup.

---

## 2. ketchup-portal (Ketchup SmartPay UI)

| | |
|---|---|
| **Path in repo** | `apps/ketchup-portal/` |
| **Domain** | https://app.ketchup.cc |
| **Platform** | Vercel |
| **Deploy from here** | `./scripts/deploy-ketchup-portal.sh` |

Uses `vercel.ketchup.json` at root for build config. Env from `apps/ketchup-portal/.env.local` (synced via `node scripts/set-vercel-env-and-domain.mjs`).

---

## 3. government-portal (Government Oversight UI)

| | |
|---|---|
| **Path in repo** | `apps/government-portal/` |
| **Domain** | https://gov.ketchup.cc |
| **Platform** | Vercel |
| **Deploy from here** | `./scripts/deploy-government-portal.sh` |

Uses `vercel.gov.json` at root for build config. Env from `apps/government-portal/.env.local` (synced via `node scripts/set-vercel-env-and-domain.mjs`).

---

## Deploy any project from this directory

```bash
# From ketchup-smartpay/
./scripts/deploy.sh backend           # Railway backend → api.ketchup.cc
./scripts/deploy.sh ketchup-portal    # Vercel → app.ketchup.cc
./scripts/deploy.sh government-portal # Vercel → gov.ketchup.cc
```

Or use the individual scripts: `deploy-backend.sh`, `deploy-ketchup-portal.sh`, `deploy-government-portal.sh`.

---

## Summary

| Project | Directory | Domain | Deploy script |
|---------|-----------|--------|---------------|
| ketchup-smartpay-backend | `backend/` | api.ketchup.cc | `./scripts/deploy-backend.sh` |
| ketchup-portal | `apps/ketchup-portal/` | app.ketchup.cc | `./scripts/deploy-ketchup-portal.sh` |
| government-portal | `apps/government-portal/` | gov.ketchup.cc | `./scripts/deploy-government-portal.sh` |
