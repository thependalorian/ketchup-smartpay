# Test Audit – Actual Implementation & Database

**Purpose:** Documents that backend and related tests use the real database and implementation (no mocks for DB).  
**Last updated:** January 2026.

---

## Backend (smartpay-connect/backend)

- **Runner:** Vitest (`pnpm test`).
- **Database:** Real Neon PostgreSQL via `DATABASE_URL` (from `.env.local` or `.env.test`). No DB mocks.
- **Setup:** `src/test/setup.ts` loads env, runs `setupTestDatabase()` (checks tables exist), and `cleanTestData()` before each test (cleans test UUID range in `webhook_events`, `status_events`, `reconciliation_records`).
- **Requirements:** Run `pnpm run migrate` and optionally `pnpm run seed` before tests.

### Test files

| File | Type | DB / implementation |
|------|------|----------------------|
| `AgentService.test.ts` | Integration | Real DB (`agents` table). |
| `DashboardService.test.ts` | Integration | Real DB (`beneficiaries`, `vouchers`, `agents`). |
| `WebhookRepository.test.ts` | Integration | Real DB (`webhook_events`). Uses test UUID range. |
| `ReconciliationService.test.ts` | Integration | Real DB (`vouchers`, `beneficiaries`, `reconciliation_records`). `BuffrAPIClient` is mocked to avoid external API; for real Buffr set `BUFFR_API_URL` and remove mock. |
| `webhookSignature.test.ts` | Unit | No DB; tests HMAC helpers only. |

### Schema alignment

- Tests use the schema from `src/database/migrations/run.ts` and `001_initial_schema.sql`: `vouchers.beneficiary_id`, `vouchers.id` VARCHAR(100), `reconciliation_records.voucher_id` VARCHAR(100).
- Test data uses a fixed UUID range (`550e8400-e29b-41d4-a716-446655440000`–`099`) for cleanup.

---

## API client (smartpay-connect/packages/api-client)

- **Runner:** Vitest.
- **Behavior:** Unit tests mock `fetch`; they assert request URL/body/headers. Base URL matches actual backend: `http://localhost:3001/api/v1` (from `VITE_API_URL` default `http://localhost:3001`).
- **Integration:** To test against a real backend, set `VITE_API_URL` and run without mocking `fetch` in a separate suite or project.

---

## Buffr (buffr/__tests__)

- **Runner:** Jest.
- **Setup:** `__tests__/setup.ts` uses real `DATABASE_URL` when set (e.g. `.env.local` or CI); otherwise falls back to a mock URL for unit-only runs.
- **Backend:** For tests that call the SmartPay Connect backend, set `KETCHUP_SMARTPAY_API_URL` (e.g. `http://localhost:3001`).
- **Tests:** Many buffr tests validate Open Banking response shape and contracts (no live DB/API); integration tests that hit DB or backend should set the env vars above.

---

## Summary

- **Backend:** All backend tests that touch data use the real DB and migrations; only external HTTP (Buffr) is mocked where noted.
- **API client:** Unit tests use the same base URL as the real backend; integration tests can use real backend by setting `VITE_API_URL` and not mocking `fetch`.
- **Buffr:** Uses real `DATABASE_URL` and optional `KETCHUP_SMARTPAY_API_URL` when set for actual implementation and backend.
