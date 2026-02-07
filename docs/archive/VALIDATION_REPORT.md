# Ketchup SmartPay – Validation Report

**Generated:** Validation of migrations, APIs, webhooks, and imports/exports.  
**Location:** `ketchup-smartpay/docs/VALIDATION_REPORT.md`  
**File structure:** See `docs/FILE_STRUCTURE.md` for repo tree.

---

## 1. Migrations

### 1.1 Entry point

- **Single entry point:** `backend/src/database/migrations/run.ts`
- **Command:** From `ketchup-smartpay/backend`: `pnpm run migrate`
- **Order:** See `backend/MIGRATION_ORDER.md`

### 1.2 Tables created by `run.ts`

| Table | Purpose |
|-------|--------|
| `beneficiaries` | Core G2P; id_number, proxy_*, deceased_at |
| `beneficiary_dependants` | Dependants per beneficiary |
| `vouchers` | FK to beneficiaries; region, voucher_code, etc. |
| `status_events` | Voucher status history |
| `webhook_events` | Buffr webhook delivery log |
| `reconciliation_records` | Reconciliation results |
| `agents` | Agent network (008) |
| `locations` | NamPost, ATM, warehouse (009); no banks (CHECK type) |
| `communication_log` | Outbound SMS, USSD, Buffr in-app, email (011) |
| `equipment_types` | SmartPay Mobile reference (Phase 2) |
| `mobile_unit_equipment` | Equipment per unit; issue/return (Phase 2) |
| `mobile_unit_drivers` | Drivers per unit (Phase 2) |
| `maintenance_events` | Maintenance per unit (Phase 3) |

**Note:** The numbered `.sql` files (001–011) in `backend/src/database/migrations/` are reference; `run.ts` embeds the applied schema inline. Do not run 001–007 SQL by hand; use `pnpm run migrate`.

### 1.3 Optional / separate migrations

- **Open Banking (005):** Not applied in `run.ts`. If using Open Banking, run `005_open_banking_schema.sql` or equivalent separately.
- **PSD compliance (006, 007):** Not applied in `run.ts`. If using PSD compliance reporting tables, run those migrations separately.

### 1.4 Validation script

- **Script:** `backend/scripts/validate-seed.ts`
- **Command:** `pnpm run validate` (from `backend`)
- **Checks:** Counts for beneficiaries, agents, vouchers, status_events, webhook_events, reconciliation_records, locations, communication_log.
- **Pass criteria:** ≥1000 beneficiaries, ≥300 agents.

**Last run:** Passed (1002 beneficiaries, 300 agents, 3321 vouchers, 7557 status_events, 2944 webhook_events, 982 reconciliation_records, 127 locations, 0 communication_log).

### 1.5 Migrate then seed (30 mobile units)

From `ketchup-smartpay/backend`:

```bash
pnpm run migrate   # Creates all tables (run again if communication_log step timed out)
pnpm run seed      # 1000 beneficiaries, 300 cash-out agents, 30 mobile units (29 active, 1 down), locations, vouchers
pnpm run validate  # Confirms ≥1000 beneficiaries, ≥300 agents
```

**30 mobile units:** Seed inserts 30 agents with `type = 'mobile_unit'` (same as redemption channel), 29 `status = 'active'`, 1 `status = 'down'`. Names: "Mobile Unit 1" … "Mobile Unit 30". If Neon connection times out, re-run from a network where `DATABASE_URL` reaches Neon.

---

## 2. APIs

### 2.1 Backend mount (source of truth)

**File:** `backend/src/index.ts` (does **not** use `backend/src/api/routes/index.ts`; it mounts routers directly.)

| Mount path | Router | Purpose |
|------------|--------|---------|
| `/api/v1/beneficiaries` | beneficiariesRouter | Beneficiary CRUD |
| `/api/v1/vouchers` | vouchersRouter | Voucher CRUD, extend/cancel/reissue |
| `/api/v1/distribution` | distributionRouter | Batch distribution |
| `/api/v1/webhooks` | webhooksRouter | Buffr webhook ingest, GET/POST retry |
| `/api/v1/reconciliation` | reconciliationRouter | Reconciliation |
| `/api/v1/status-events` | statusEventsRouter | Status events |
| `/api/v1/reports` | reportsRouter | Reports |
| `/api/v1/dashboard` | dashboardRouter | Dashboard metrics, requires-attention |
| `/api/v1/agents` | agentsRouter | Agent CRUD |
| `/api/v1/map` | mapRouter | Map: agents + fixed locations |
| `/api/v1/ketchup/locations` | locationsRouter | Fixed locations (NamPost, ATM, warehouse) |
| `/api/v1/compliance` | complianceRouter | PSD compliance |
| `/api/v1/government/compliance` | complianceRouter | Same |
| `/api/v1/government/monitoring` | governmentMonitoring | Vouchers, beneficiaries, agents, regions, drill-down |
| `/api/v1/government/analytics` | governmentAnalytics | Financial, spend-trend, grant-types, transactions |
| `/api/v1/government/audit` | governmentAudit | Audit |
| `/bon/v1/common` | openBankingConsentRouter | OAuth, consent |
| `/bon/v1/banking` | openBankingAccountsRouter, openBankingPaymentsRouter | AIS, PIS |

### 2.2 API client vs backend

- **Ketchup:** Uses `packages/api-client/src/ketchup/api.ts` with `baseURL = VITE_API_URL || 'http://localhost:3001'` + `/api/v1`. Paths are `/beneficiaries`, `/vouchers`, `/dashboard`, etc. **Matches** backend (`/api/v1/beneficiaries`, etc.).
- **Government:** Uses `createGovernmentClient()` in `packages/api-client/src/client.ts` with `baseURL = .../api/v1/government`. Paths are `/monitoring/...`, `/compliance/...`, `/analytics/...`. **Matches** backend (`/api/v1/government/monitoring`, etc.).
- **Shared:** `packages/api-client/src/shared/index.ts` re-exports `dashboardAPI` and `openBankingAPI` from ketchup. Dashboard calls use ketchup’s apiClient (baseURL `/api/v1`), so dashboard paths resolve to `/api/v1/dashboard/*`. **Matches** backend.

### 2.3 Unused file

- `backend/src/api/routes/index.ts` defines a different structure (`/v1/ketchup/...`, `/v1/government/...`, `/v1/shared/...`) and is **not** used by `backend/src/index.ts`. The main server imports and mounts each router directly. No change needed unless you later switch to a single router.

---

## 3. Webhooks

### 3.1 Endpoint

- **POST** `/api/v1/webhooks/buffr` – Receives webhooks from Buffr (no auth in production relies on signature).

### 3.2 Events handled

| Event | Handler | Action |
|-------|--------|--------|
| `voucher.redeemed` | handleVoucherRedeemed | status_events + voucher status, redemption_method |
| `voucher.expired` | handleVoucherExpired | status_events + voucher status |
| `voucher.delivered` | handleVoucherDelivered | status_events + voucher status |
| `voucher.cancelled` | handleVoucherCancelled | status_events + voucher status |
| `voucher.failed` | handleVoucherFailed | status_events + voucher status |

### 3.3 Other webhook routes

- **GET** `/api/v1/webhooks` – List webhook events (auth required).
- **GET** `/api/v1/webhooks/:id` – Get event by id (auth required).
- **POST** `/api/v1/webhooks/:id/retry` – Retry failed delivery (auth required).

### 3.4 Signature

- Verification via `backend/src/utils/webhookSignature.ts`; in production invalid signature returns 401.

---

## 4. Imports and exports

### 4.1 Package exports (`packages/api-client`)

- **Main:** `packages/api-client/package.json` exports:
  - `.` → `./src/index.ts`
  - `./ketchup` → `./src/ketchup/index.ts`
  - `./government` → `./src/government/index.ts`
- **Root index** (`src/index.ts`): `export * from './client'`, `'./ketchup'`, `'./government'`, `'./shared'`, `'./types'`.

### 4.2 Ketchup (`@smartpay/api-client/ketchup` or `@smartpay/api-client`)

Exports: agentAPI, beneficiaryAPI, voucherAPI, distributionAPI, reconciliationAPI, webhookAPI, dashboardAPI, statusEventsAPI, mapAPI, locationsAPI, openBankingAPI.

### 4.3 Government (`@smartpay/api-client/government`)

Exports: complianceAPI, monitoringAPI, analyticsAPI, auditAPI, reportsAPI.  
Drill-down: getVoucherById, getBeneficiaryById, getBeneficiaryVouchers, getRegionalSummary, getRegionalPerformance, getRegionVouchers, getTransactions.

### 4.4 Shared (`@smartpay/api-client` via shared)

Re-exports: dashboardAPI, openBankingAPI (from ketchup).

### 4.5 Portal usage

- **Ketchup portal:** Imports from `@smartpay/api-client`, `@smartpay/api-client/ketchup` (dashboardAPI, voucherAPI, beneficiaryAPI, agentAPI, mapAPI, locationsAPI, statusEventsAPI, reconciliationAPI, distributionAPI, webhookAPI). **Consistent.**
- **Government portal:** Imports from `@smartpay/api-client/government` (monitoringAPI, analyticsAPI, complianceAPI, auditAPI, reportsAPI). **Consistent.**

### 4.6 Fix applied

- **openBankingAPI** added to `packages/api-client/src/ketchup/index.ts` so it is exported from both `@smartpay/api-client` (via shared) and `@smartpay/api-client/ketchup`.

---

## 5. Summary

| Area | Status | Notes |
|------|--------|--------|
| Migrations | OK | run.ts creates all core tables; validate script passed. Open Banking/PSD tables optional. |
| APIs | OK | Backend mount paths match Ketchup and Government client base URLs and paths. |
| Webhooks | OK | POST /buffr and all five voucher events implemented; GET/list/retry present. |
| Imports/exports | OK | api-client exports and portal imports aligned; openBankingAPI added to ketchup index. |

**Recommendation:** After any schema change, run `pnpm run migrate` from `backend`, then `pnpm run validate`. For API changes, keep `backend/src/index.ts` and `packages/api-client` (client base URLs and paths) in sync with this report and `docs/PAGES_AND_API_REFERENCE.md`.

---

## 6. Curl API validation

### 6.1 Script

- **Script:** `scripts/validate-api-curl.sh`
- **Usage:** `./scripts/validate-api-curl.sh [BASE_URL]` (default `http://localhost:3001`)
- **Requires:** Backend running (e.g. `pnpm run dev` from `backend`).

### 6.2 Endpoints validated

Auth is skipped when no API key is configured (`API_KEY`, `KETCHUP_SMARTPAY_API_KEY`, etc.). If you get 401, set `API_KEY` and pass `-H "X-API-Key: $API_KEY"` in curl.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health + DB status |
| `/api/v1/beneficiaries?limit=2` | GET | Beneficiaries list |
| `/api/v1/vouchers?limit=2` | GET | Vouchers list |
| `/api/v1/mobile-units` | GET | SmartPay Mobile list (agents type=mobile_unit) |
| `/api/v1/mobile-units/stats` | GET | SmartPay Mobile stats (total, active, down) |
| `/api/v1/mobile-units/equipment/types` | GET | Equipment types reference |
| `/api/v1/government/monitoring/regions/summary` | GET | Regions summary |
| `/api/v1/government/monitoring/regions` | GET | Regions list |
| `/api/v1/government/audit/beneficiaries` | GET | Audit beneficiaries |
| `/api/v1/government/analytics/financial` | GET | Analytics financial |
| `/api/v1/government/audit/transactions` | GET | Audit transactions (redeemed vouchers) |
| `/api/v1/government/audit/compliance` | GET | Audit compliance (empty if PSD 006 not run) |

### 6.2a Curl examples: SmartPay Mobile (database retrieval)

From a terminal (backend running on port 3001). If 401, add `-H "X-API-Key: YOUR_KEY"`.

```bash
# List mobile units (from agents where type=mobile_unit)
curl -s "http://localhost:3001/api/v1/mobile-units" | jq .

# Stats (total, active, down, volume, success rate)
curl -s "http://localhost:3001/api/v1/mobile-units/stats" | jq .

# Equipment types (from equipment_types table)
curl -s "http://localhost:3001/api/v1/mobile-units/equipment/types" | jq .

# Single unit (replace UNIT_ID with an agent id from list)
curl -s "http://localhost:3001/api/v1/mobile-units/UNIT_ID" | jq .

# Unit equipment, drivers, activity
curl -s "http://localhost:3001/api/v1/mobile-units/UNIT_ID/equipment" | jq .
curl -s "http://localhost:3001/api/v1/mobile-units/UNIT_ID/drivers" | jq .
curl -s "http://localhost:3001/api/v1/mobile-units/UNIT_ID/activity" | jq .
```

**Why “No mobile units found” / Total 0?** The page reads from the **agents** table where `type = 'mobile_unit'`. You must run **migrate** then **seed** from `backend` so that 30 mobile units are inserted. From `ketchup-smartpay/backend`: `pnpm run migrate` then `pnpm run seed`. After that, list and stats will return data.

**Where are Equipment, Drivers, Activity?** They are inside the **unit detail modal**. Click **View** on a row in the SmartPay Mobile table to open the modal; the **Info**, **Equipment**, **Drivers**, and **Activity** tabs are there. With 0 units there are no rows, so you cannot open the modal until the database has mobile units (run seed).

### 6.3 Fixes applied (conditional SQL)

- **Government audit beneficiaries:** Optional `startDate`/`endDate` built with separate branches (no empty `sql\`\`` fragments) to avoid Neon `$1` syntax errors.
- **Government analytics financial:** Same pattern for optional date filters.
- **Government audit transactions:** Switched to querying `vouchers` (status = redeemed) with optional filters; no `transactions` table in core migrations.
- **Government audit compliance:** Uses `coverage_percentage` (006 schema); returns `[]` when table `trust_account_reconciliation` does not exist (optional PSD migration).
