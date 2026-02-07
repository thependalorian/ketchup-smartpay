# Configure ketchup-backend in Vercel

Use this checklist so the backend builds correctly and is **publicly reachable** (no login) for app.ketchup.cc and gov.ketchup.cc.

---

## Quick link

**Settings:** [https://vercel.com/buffr/ketchup-backend/settings](https://vercel.com/buffr/ketchup-backend/settings)

---

## 1. General

| Setting | Value | Why |
|--------|--------|-----|
| **Root Directory** | *(empty)* | Build must run from repo root so `shared/` and `api/index.js` exist. If set to `backend`, build fails. |
| **Framework Preset** | **Other** (or leave unset) | Backend is Express, not Vite. Avoids wrong build/output. |

**Steps:**

1. Open **Settings** → **General**.
2. **Root Directory:** clear the field (leave empty) → **Save**.
3. If you see **Framework Preset**, set to **Other** or ensure it’s not **Vite** → **Save**.

---

## 2. Build & Development

| Setting | Value | Why |
|--------|--------|-----|
| **Build Command** | `cd backend && pnpm run build` | Builds backend from root (so `shared/` is available). |
| **Output Directory** | *(empty)* | No static output; API is serverless via `api/index.js`. |
| **Install Command** | `pnpm install` | Installs from repo root (pnpm workspace with backend). |

**Steps:**

1. Open **Settings** → **Build & Development**.
2. **Build Command:** Override → set to `cd backend && pnpm run build` → **Save**.
3. **Output Directory:** leave empty (or Override and clear) → **Save**.
4. **Install Command:** `pnpm install` (or leave default) → **Save**.

---

## 3. Deployment Protection (make production public)

Portals (app.ketchup.cc, gov.ketchup.cc) call the backend without logging in. Production must be **public**; you can keep protection on **Preview** only.

| Setting | Value | Why |
|--------|--------|-----|
| **Vercel Authentication (SSO)** | **Only Preview Deployments** | Production URL (and custom domain) stay public; only preview URLs require login. |

**Steps:**

1. Open **Settings** → **Deployment Protection**.
2. Under **Vercel Authentication**, set to **Only Preview Deployments** (not “All” or “Production and Preview”).
3. **Save**.

If you use **Password Protection**, set it to **Only Preview Deployments** as well, or disable it for production.

---

## 4. Domains (optional: api.ketchup.cc)

| Setting | Action |
|--------|--------|
| **Domains** | Add **api.ketchup.cc** if you want the API on that host. Then in DNS (ketchup.cc): **CNAME** `api` → `cname.vercel-dns.com` (or the target Vercel shows). |

**Steps:**

1. Open **Settings** → **Domains**.
2. Add **api.ketchup.cc**.
3. In your DNS provider, add CNAME as above.

---

## 5. Environment variables

Backend needs at least:

- `DATABASE_URL`
- `GOVERNMENT_API_KEY` (for gov portal)
- One of: `API_KEY`, `KETCHUP_SMARTPAY_API_KEY`, `KETCHUP_API_KEY` (for ketchup portal)

These are synced from `backend/.env.local` when you run `./scripts/deploy-backend.sh` (unless you use `--no-sync`).

---

## Try Option B first, then Option A if it fails

**Option B (automated)** – Set **VERCEL_TOKEN** and run the deploy script. It will apply the correct settings via the API (Root Directory, Build Command, SSO = Preview only).  
**Option A (manual)** – If the API returns an error or deploy still fails, follow the manual steps in sections 1–3 above in the Vercel dashboard.

### Option B: Automated config (with VERCEL_TOKEN)

1. Create a token: [Vercel Account → Tokens](https://vercel.com/account/tokens).
2. From repo root run:

```bash
export VERCEL_TOKEN="your_token_here"
./scripts/deploy-backend.sh
```

The script will PATCH the project (Root Directory empty, Build Command, SSO = Preview only). If you see "Project settings updated (production will be public)", Option B worked.
3. If you see "API returned ..." or the build fails, use **Option A** (manual steps in sections 1–3 above).

---

## Checklist summary

| # | Where | What |
|---|--------|--------|
| 1 | General | Root Directory = empty, Framework = Other |
| 2 | Build & Development | Build Command = `cd backend && pnpm run build`, Output = empty |
| 3 | Deployment Protection | Vercel Authentication = **Only Preview Deployments** |
| 4 | Domains | Optional: add api.ketchup.cc + DNS CNAME |
| 5 | Deploy | Run `./scripts/deploy-backend.sh` |

After this, **https://ketchup-backend-buffr.vercel.app/health** (and **https://api.ketchup.cc/health** if you added the domain) should return JSON without requiring login.
