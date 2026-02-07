# Ketchup SmartPay – Exposed Secrets Audit

**Date:** 2025-02-01  
**Scope:** `ketchup-smartpay/` (backend, buffr, scripts, docs, fineract)

---

## CRITICAL – Act immediately

### 1. Neon database URL and password in repo

**Exposed:** Full `DATABASE_URL` with password `npg_B7JHyg6PlIvX` in:

| File | Location | Action |
|------|----------|--------|
| `DOCUMENTATION.md` | Line 157 | Redact to use `DATABASE_URL=postgresql://...` (no password in file) |
| `test-backend-start.sh` | Line 3 | Use `$DATABASE_URL` from env, no hardcoded URL |
| `buffr/scripts/run-migration.js` | Lines 13–14 | Remove hardcoded fallback; require `process.env.DATABASE_URL` or exit |

**Action:** Rotate the Neon DB password in Neon dashboard, then fix/redact these files so no credentials are stored in the repo.

---

### 2. Backup/env files with real credentials

**Exposed:** Real `DATABASE_URL` and `ENCRYPTION_KEY` in:

- `buffr/.env.local.backup`
- `buffr/.env.local.bak`
- `buffr/buffr_ai_ts/.env` (if ever committed)

These are covered by `.env*` in `.gitignore` but **must not be committed or shared**. If they were ever committed, treat them as leaked.

**Action:**

- Ensure `.env`, `.env.*`, and `*.bak` / `*.backup` are in `.gitignore` (root and buffr).
- Delete or move backup env files out of the repo; use a secrets manager or local-only copies.
- Rotate `ENCRYPTION_KEY` and any DB credentials that appear in these files.

---

### 3. Fineract – hardcoded DB passwords

**File:** `buffr/fineract/fineract-war/setenv.sh`

- `FINERACT_HIKARI_PASSWORD="skdcnwauicn2ucnaecasdsajdnizucawencascdca"`
- `FINERACT_DEFAULT_TENANTDB_PWD="skdcnwauicn2ucnaecasdsajdnizucawencascdca"`

**Action:** Replace with env-only (e.g. `"${FINERACT_HIKARI_PASSWORD}"`) or use a secret manager. If this is a demo password, still avoid committing real-looking secrets; use placeholders in the repo and inject real values at deploy time.

---

## HIGH – Weak default secrets in code

If `JWT_SECRET` or `ENCRYPTION_KEY` are unset, the app falls back to predictable values. That is unsafe in production.

| File | Fallback | Risk |
|------|----------|------|
| `buffr/utils/oauth2Consent.ts` | `'secret'`, `'refresh-secret'` | Token forgery if env not set |
| `buffr/utils/auth.ts` | `'buffr-jwt-secret-change-in-production'` | Same |
| `buffr/app/api/v1/auth/login/route.ts` | `'secret'`, `'refresh-secret'` | Same |
| `buffr/app/api/v1/auth/refresh/route.ts` | `'secret'`, `'refresh-secret'` | Same |
| `buffr/utils/encryption.ts` | `'default-key-change-in-production'` | Weak encryption if env not set |

**Action:** In production (or when `NODE_ENV=production`), require `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY` from env and **do not** use fallbacks. Fail startup or the relevant request if they are missing.

---

## LOWER / ACCEPTABLE

- **buffr/fineract/docker/server.xml** – `secret="xyz123"` is inside an XML comment; not active. Consider removing or redacting in comments.
- **Test files** – Fake tokens (e.g. `'test-secret-key'`, `'2fa-token-123'`, `openai_api_key="sk-test"`) in tests are acceptable; keep them out of production code paths.
- **buffr/fineract** – Integration test passwords (e.g. `QwE!5rTy#9uP0`) are test fixtures; ensure they are not reused for real systems.

---

## Checklist

- [ ] Rotate Neon DB password and update all envs/CI that use it.
- [ ] Redact or remove hardcoded `DATABASE_URL` from `DOCUMENTATION.md`, `test-backend-start.sh`, `buffr/scripts/run-migration.js`.
- [ ] Ensure `.env.local.bak`, `.env.local.backup`, and any `.env` with secrets are gitignored and never committed.
- [ ] Rotate `ENCRYPTION_KEY` if it appeared in backup files; update Vercel/env config.
- [ ] Replace Fineract hardcoded passwords in `setenv.sh` with env vars or placeholders.
- [ ] Remove JWT/encryption fallbacks in production; require env vars and fail fast if missing.
- [ ] If any of these files were ever in git history, consider secrets rotation and optionally `git filter-repo` / BFG to remove from history (then force-push with caution).
