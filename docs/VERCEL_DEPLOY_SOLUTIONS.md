# Vercel deploy – solutions (from terminal issues)

## 1. Deploy goes to wrong project (e.g. ketchup-portal instead of ketchup-backend)

**Cause:** `.vercel/project.json` links the repo to one project; `vercel --prod -A vercel.backend.json` still uses that link.

**Fix (no need to delete `.vercel`):** Use env vars so the CLI targets the right project ([Vercel docs](https://vercel.com/docs/monorepos/monorepo-faq)):

```bash
VERCEL_ORG_ID=team_MPOdmWd6KnPpGhXI9UYg2Opo \
VERCEL_PROJECT_ID=prj_bpoWBmxYRth7YbAVTJVsjP1Xmzaw \
vercel --token=YOUR_TOKEN --prod --yes -A vercel.backend.json
```

`scripts/deploy-backend.sh` now sets these by default so backend always deploys to **ketchup-backend**.

---

## 2. `--name` is deprecated

**Cause:** `vercel --name=ketchup-backend` is deprecated ([vercel.link/name-flag](https://vercel.link/name-flag)).

**Fix:** Use **project linking** or env vars:

- **Link once:** `vercel link --yes --project ketchup-backend` (then `vercel --prod` uses that project), or  
- **Override per deploy:** `VERCEL_PROJECT_ID=prj_bpoWBmxYRth7YbAVTJVsjP1Xmzaw vercel --prod --yes`.

---

## 3. `FUNCTION_INVOCATION_FAILED` on API routes (e.g. `/api/v1/dashboard`)

**Cause:** The serverless function fails at runtime—e.g. Node crash, unhandled rejection, or (here) the Express app failing when loaded (ESM resolution, missing files, or DB in the bundle). [Vercel: FUNCTION_INVOCATION_FAILED](https://vercel.com/docs/errors/FUNCTION_INVOCATION_FAILED).

**Current behavior:** `/health` works because `api/index.js` responds without loading Express. Other routes load the Express app and fail in the function.

**Fixes (pick one):**

1. **Bundle backend into a single file** so the function has one entry and all deps resolved (e.g. `build:vercel` → single bundle).
2. **Ensure `backend/dist/**` is included** and that dynamic imports resolve in the serverless env (e.g. `includeFiles` in `vercel.backend.json`).
3. **Run the backend elsewhere** (e.g. Railway, Render) and point **api.ketchup.cc** there so portals hit a long-running Node process instead of serverless.

---

## 4. `AuditReports.tsx` (Untitled-5)

If the question was about **where** `AuditReports.tsx` lives: it’s under the government-portal (or ketchup-portal) app tree, e.g. `apps/government-portal/src/...` or `apps/ketchup-portal/src/...`. Search the repo for the file to get the exact path.
