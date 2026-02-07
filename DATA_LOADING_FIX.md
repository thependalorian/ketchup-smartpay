# No Data Loading on app.ketchup.cc / gov.ketchup.cc

**Symptom:** Portals load but no data from backend/database.

**Root causes:**

1. **Backend (api.ketchup.cc) returns 500** – Health and data routes fail because **database connection fails** on Railway.
2. **Portals built without API URL** – If `VITE_API_URL` was not set in Vercel at **build time**, the app calls `http://localhost:3001` and gets network errors.

---

## Fix 1: Backend + database (Railway + Neon)

The backend at **api.ketchup.cc** (Railway service **pretty-sparkle**) must have a working **DATABASE_URL** and a successful DB connection.

### 1.1 Railway

- **Variables:** Railway Dashboard → pretty-sparkle → **Variables**. Ensure **DATABASE_URL** is set (Neon connection string).
- **Redeploy:** After changing variables, click **Redeploy** so the new deployment uses them.

### 1.2 Neon

- **Connection string:** Use the **pooler** URL from Neon (e.g. `...-pooler....neon.tech/neondb?sslmode=require`).
- **IP / access:** If Neon has “Restrict connections” or an IP allowlist, either allow all for testing or ensure Railway egress IPs are allowed (or use Neon’s “Allow all” if available).

### 1.3 Verify backend

```bash
# Should return 200 and database: "connected"
curl -s https://api.ketchup.cc/health
```

If you see **500** or `database: "disconnected"`, the backend still cannot reach the database; fix DATABASE_URL and/or Neon access, then redeploy Railway again.

---

## Fix 2: Portal env and redeploy (Vercel)

Portals need **VITE_API_URL** and **VITE_API_KEY** in Vercel so the **next build** bakes the correct API URL into the JS (Vite inlines env at build time).

### 2.1 Sync env to Vercel

From repo root, with a Vercel token (from https://vercel.com/account/tokens):

```bash
VERCEL_TOKEN=your_token node scripts/set-vercel-env-and-domain.mjs
```

This reads `apps/ketchup-portal/.env.local` and `apps/government-portal/.env.local` and sets env (including **VITE_API_URL** and **VITE_API_KEY**) on the ketchup-portal and government-portal Vercel projects.

### 2.2 Redeploy both portals

Env changes only apply to **new** builds. After syncing:

- **Option A:** Trigger new deployments from Vercel Dashboard (e.g. Redeploy latest for ketchup-portal and government-portal).
- **Option B:** From repo root:
  - `pnpm run deploy:ketchup`
  - `pnpm run deploy:government`

### 2.3 Verify in browser

- Open https://app.ketchup.cc and https://gov.ketchup.cc.
- Open DevTools → Network. Reload and check requests to **api.ketchup.cc** (e.g. `/api/v1/...`). They should return 200 (and data), not fail with network errors or 401/500.

If requests still go to **localhost:3001**, VITE_API_URL was not set (or not used) at build time; sync env again and redeploy.

---

## Checklist

| Step | Action |
|------|--------|
| 1 | Railway: DATABASE_URL set for pretty-sparkle; Redeploy. |
| 2 | Neon: Correct pooler URL; no blocking IP/restrictions (or allow Railway). |
| 3 | `curl https://api.ketchup.cc/health` → 200, `database: "connected"`. |
| 4 | Run `VERCEL_TOKEN=... node scripts/set-vercel-env-and-domain.mjs`. |
| 5 | Redeploy ketchup-portal and government-portal on Vercel. |
| 6 | Reload app.ketchup.cc / gov.ketchup.cc and confirm API calls to api.ketchup.cc return data. |
