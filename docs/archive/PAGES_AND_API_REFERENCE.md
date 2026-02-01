# SmartPay Connect – Pages and API Reference

**Order:** 1. Ketchup Portal → 2. Government Portal → 3. Backend API  
**Purpose:** Single reference for all pages and correct backend routes.  
**Location:** `smartpay-connect/docs/PAGES_AND_API_REFERENCE.md`

---

### Redemption channels vs map locations

- **Redemption channels** (where vouchers are actually redeemed) are **only**: `post_office`, `mobile_unit`, `pos`, `mobile`, `atm`. These come from voucher `redemption_method` and appear in dashboard/analytics "redemption channels".
- **Banks are not redemption channels and are not on the map.** Map locations are NamPost, ATM, warehouse only. Dashboard/analytics redemption channels show only: post_office, mobile_unit, pos, mobile, atm. Legacy "bank" or null/unknown redemption_method values are allocated proportionally into these five channels (no "unknown" or "bank" in the UI).

---

## 1. Ketchup Portal (apps/ketchup-portal)

**Base URL (dev):** `http://localhost:5173` (or Vite port)  
**API base:** `VITE_API_URL` (default `http://localhost:3001/api/v1`)

### Pages and routes (match `App.tsx` and `Sidebar.tsx`)

| Route | Component | Sidebar label | Purpose |
|-------|-----------|---------------|---------|
| `/` | `Dashboard` | Dashboard | Main dashboard |
| `/beneficiaries` | `Beneficiaries` | Beneficiaries | Beneficiary list/CRUD, dependants, mark deceased |
| `/vouchers` | `Vouchers` | Vouchers | Voucher list/CRUD |
| `/batch-distribution` | `BatchDistribution` | Batch Distribution | Batch distribution |
| `/status-monitor` | `StatusMonitor` | Status Monitor | Status events |
| `/webhooks` | `WebhookMonitoring` | Webhook Monitoring | Webhook delivery/retry |
| `/reconciliation` | `Reconciliation` | Reconciliation | Voucher reconciliation |
| `/agents` | `Agents` | Agent Network | Agent list/CRUD |
| `/mobile-units` | `MobileUnits` | SmartPay Mobile | Fleet list, stats (active/down), liquidity; Equipment & Drivers tabs (Phase 2); Activity (Phase 3) — see `docs/MOBILE_UNITS_PLAN.md` |
| `/map` | `MapPage` | Network Map | Namibia map (agents + NamPost, ATM, warehouse; no banks). |
| `/regions` | `Regions` | Regions | Regions view |
| `/analytics` | `Analytics` | Analytics | Analytics / trends |
| `/reports` | `Reports` | Reports | Reports hub |
| `/open-banking` | `OpenBankingDashboard` | Banking Dashboard | Open Banking dashboard |
| `/open-banking/accounts` | `OpenBankingAccounts` | My Accounts | AIS accounts |
| `/open-banking/payments` | `OpenBankingPayments` | Send Payment | PIS payments |
| `/open-banking/consents` | `OpenBankingConsents` | Manage Consents | Consent management |
| `/settings` | `Settings` | Settings | Settings |
| `/help` | `Help` | Help | Help |
| `/notifications` | `Notifications` | (header Bell) | Alerts and notifications: requires-attention, recent status events |
| `*` | `NotFound` | — | 404 |

### Ketchup API usage (api-client base `/api/v1`)

- **Beneficiaries:** `GET/POST /beneficiaries`, `GET/PUT /beneficiaries/:id`, `GET /beneficiaries/:id/vouchers`, `GET/POST /beneficiaries/:id/dependants`, `GET/PATCH/DELETE /beneficiaries/:id/dependants/:dependantId`
- **Vouchers:** `GET/POST /vouchers`, `GET/PUT /vouchers/:id`
- **Agents:** `GET /agents`, `GET /agents/stats`
- **SmartPay Mobile:** `GET /mobile-units`, `GET /mobile-units/stats`, `GET /mobile-units/equipment/types`, `GET /mobile-units/:id`, `GET /mobile-units/:id/equipment`, `GET /mobile-units/:id/drivers`, `GET /mobile-units/:id/activity`, `POST /mobile-units/:id/equipment/issue`, `POST /mobile-units/:id/equipment/return`, `POST /mobile-units/:id/maintenance`. Ketchup uses `mobileUnitsAPI` from `@smartpay/api-client`.
- **Map:** `GET /map/locations`, `GET /map/locations/fixed`, `GET /map/locations/:id`
- **Fixed locations:** `GET /ketchup/locations`, `GET /ketchup/locations/:id`, `GET /ketchup/locations/types`
- **Distribution:** `POST /distribution/*`
- **Reconciliation:** `GET /reconciliation/*`
- **Webhooks:** `GET/POST /webhooks/*`
- **Dashboard:** `GET /dashboard/metrics`, `GET /dashboard/monthly-trend`, `GET /dashboard/redemption-channels`, `GET /dashboard/regional-stats`, `GET /dashboard/requires-attention?expiringWithinDays=7`
- **Status events:** `GET /status-events/*`
- **Open Banking:** `bon/v1/common/*`, `bon/v1/banking/*` (see api-client)

---

## 2. Government Portal (apps/government-portal)

**Base URL (dev):** `http://localhost:5174` (or configured Vite port)  
**API base:** `VITE_API_URL` (e.g. `http://localhost:3001/api/v1`)

### Pages and routes (match `App.tsx` and `Sidebar.tsx`)

| Route | Component | Sidebar label | Purpose |
|-------|-----------|---------------|---------|
| `/` | `Dashboard` | Dashboard | Government dashboard |
| `/compliance` | `Compliance` | Compliance Overview | PSD compliance |
| `/vouchers` | `VoucherMonitoring` | Voucher Monitoring | Voucher monitoring |
| `/beneficiaries` | `BeneficiaryRegistry` | Beneficiary Registry | Beneficiary registry (read) |
| `/audit` | `AuditReports` | Audit Reports | Audit reports |
| `/analytics` | `Analytics` | Financial Analytics | Analytics |
| `/agents` | `AgentNetwork` | Agent Network Status | Agent network status |
| `/regions` | `RegionalPerformance` | Regional Performance | Regional performance |
| `/reports` | `Reports` | Reports | Reports |
| `/settings` | `Settings` | Settings | Settings |
| `/help` | `Help` | Help | Help |
| `*` | `NotFound` | — | 404 |

### Government API usage

- **Compliance:** `GET /api/v1/compliance/*`
- **Monitoring / audit / analytics / reports:** `GET /api/v1/government/*` or shared/dashboard/status-events as used by portal

### Analytics: trace to smallest unit (drill-down)

Analytics and monitoring always support traversing down to the **smallest data point** (individual voucher or beneficiary), not only aggregates:

| Level | Endpoint / API | Purpose |
|-------|----------------|---------|
| Country summary | `GET /government/monitoring/regions/summary` | Totals + status breakdown |
| Regions | `GET /government/monitoring/regions` | Per-region performance + status breakdown |
| Region vouchers | `GET /government/monitoring/regions/:region/vouchers` | Paginated vouchers in a region (drill from region row) |
| Single voucher | `GET /government/monitoring/vouchers/:id` | One voucher (drill from any voucher list) |
| Single beneficiary | `GET /government/monitoring/beneficiaries/:id` | One beneficiary (drill from voucher detail) |
| Beneficiary vouchers | `GET /government/monitoring/beneficiaries/:id/vouchers` | Paginated vouchers for one beneficiary |
| Transactions (analytics) | `GET /government/analytics/transactions` | Paginated individual redeemed vouchers; filter by `region`, `grantType`, `month`, `startDate`, `endDate` |

**Government portal UI:**

- **Regional Performance:** Country summary card → Regions table (click row) → Vouchers in region → View voucher → View beneficiary.
- **Analytics:** Financial summary / Spend trend / Grant types → click month or grant type → Individual transactions table → View voucher → View beneficiary.
- **API client exports:** `monitoringAPI` and `analyticsAPI` in `@smartpay/api-client/government` expose all drill-down methods; re-exported from `@smartpay/api-client`.

---

## 3. Backend API (backend)

**Base URL (dev):** `http://localhost:3001`  
**API prefix:** `/api/v1` (and `/bon/v1` for Open Banking)

### Route mounting (backend/src/index.ts)

Mount order and paths must match what the portals and api-client use.

#### Ketchup-facing (used by Ketchup portal / api-client)

| Mount path | Router | Auth | Purpose |
|------------|--------|------|---------|
| `/api/v1/beneficiaries` | `beneficiariesRouter` | (in router) | Beneficiary CRUD |
| `/api/v1/vouchers` | `vouchersRouter` | (in router) | Voucher CRUD |
| `/api/v1/distribution` | `distributionRouter` | (in router) | Batch distribution |
| `/api/v1/webhooks` | `webhooksRouter` | (in router) | Webhook ingest/listing |
| `/api/v1/reconciliation` | `reconciliationRouter` | (in router) | Reconciliation |
| `/api/v1/agents` | `agentsRouter` | (in router) | Agent CRUD / map |
| `/api/v1/map` | `mapRouter` | ketchupAuth per route | Map: agents + fixed locations |
| `/api/v1/ketchup/locations` | `locationsRouter` | (in router) | Fixed locations CRUD/list |
| `/api/v1/dashboard` | `dashboardRouter` | (in router) | Dashboard metrics |
| `/api/v1/status-events` | `statusEventsRouter` | (in router) | Status events |
| `/api/v1/reports` | `reportsRouter` | (in router) | Reports |

#### Government-facing

| Mount path | Router | Auth | Purpose |
|------------|--------|------|---------|
| `/api/v1/compliance` | `complianceRouter` | (in router) | PSD compliance |
| `/api/v1/government/compliance` | `complianceRouter` | (in router) | Same; Government portal base path |
| `/api/v1/government/monitoring` | `governmentMonitoring` | — | Vouchers, beneficiaries, agents, regions |
| `/api/v1/government/analytics` | `governmentAnalytics` | — | Financial, spend-trend, grant-types |
| `/api/v1/government/audit` | `governmentAudit` | — | Beneficiaries, transactions, compliance audit |

#### Open Banking (BON)

| Mount path | Router | Purpose |
|------------|--------|---------|
| `/bon/v1/common` | `openBankingConsentRouter` | OAuth, consent (PAR, authorize, token, revoke) |
| `/bon/v1/banking` | `openBankingAccountsRouter` | AIS accounts/balance/transactions |
| `/bon/v1/banking` | `openBankingPaymentsRouter` | PIS payments |

#### Health

| Path | Purpose |
|------|---------|
| `GET /health` | Health + DB status |
| `GET /api/v1/health` | (if added in routes) |

---

## Implementation checklist

- **Ketchup:** All sidebar links match `App.tsx` routes; api-client paths use `/api/v1` + endpoint (e.g. `/map/locations`, `/beneficiaries`).
- **Government:** All sidebar links match `App.tsx` routes; portal uses government/shared endpoints as implemented.
- **Backend:** Mount paths in `backend/src/index.ts` match api-client and portal usage; map and ketchup locations routes are under `/api/v1/map` and `/api/v1/ketchup/locations`.

**Dependants & death (implemented):**
- Backend: `backend/src/services/dependant/DependantRepository.ts`, `DependantService.ts`; dependants routes in `backend/src/api/routes/ketchup/beneficiaries.ts` (`GET/POST /:id/dependants`, `GET/PATCH/DELETE /:id/dependants/:dependantId`). Issuance guard in `backend/src/services/voucher/VoucherService.ts` (reject issue if beneficiary status is deceased).
- Ketchup UI: `apps/ketchup-portal/src/pages/Beneficiaries.tsx` — View dialog includes Dependants section (list/add/edit/delete) and "Mark deceased" (with confirmation); status filter and badge include deceased.
- **Government portal BeneficiaryRegistry (optional, implemented):** Status badge (red for deceased) and status filter (All / Active / Pending / Verified / Deceased). Backend `GET /api/v1/government/monitoring/beneficiaries` supports query param `status` (e.g. `?status=deceased`).
- **Optional backend:** `StatusMonitor.recordBeneficiaryDeceased()` records a beneficiary.deceased event in `status_events` when a beneficiary is marked deceased (triggered from `BeneficiaryService.update`). `DistributionEngine.distributeToBuffr()` skips distribution when beneficiary status is deceased. `ReportService.generateMonthlyReport()` includes `deceased_beneficiaries` in summary. Seed: `seedDependantsAndDeceased()` adds 2 deceased beneficiaries and sample dependants.

---

## Services, hooks and integrations to keep in sync

After adding **dependants**, **deceased**, **agents**, and **locations** (NamPost, ATM, warehouse only), the following backend services and frontend hooks should stay aligned.

### Backend services

| Service | File | What to keep in sync |
|--------|------|----------------------|
| **VoucherService** | `backend/src/services/voucher/VoucherService.ts` | Reject issuance when beneficiary status is deceased. |
| **DashboardService** | `backend/src/services/dashboard/DashboardService.ts` | Counts active (excludes deceased); returns `deceasedBeneficiaries` for reporting. |
| **PaymentInitiationService (PIS)** | `backend/src/services/openbanking/PaymentInitiationService.ts` | `listBeneficiaries(accountId)` excludes saved payees when the account holder (beneficiary) is deceased. |
| **AccountInformationService (AIS)** | `backend/src/services/openbanking/AccountInformationService.ts` | No beneficiary list; no change for deceased. |
| **DistributionEngine** | `backend/src/services/distribution/DistributionEngine.ts` | Skips distribution when beneficiary is deceased (optional product rule applied). |
| **BeneficiaryRepository** | `backend/src/services/beneficiary/BeneficiaryRepository.ts` | `findEligible()` uses status = active (excludes deceased). |
| **ReportService** | `backend/src/services/reports/ReportService.ts` | Monthly report summary includes `deceased_beneficiaries`. |
| **Government monitoring** | `backend/src/api/routes/government/monitoring.ts` | `GET /beneficiaries` supports `?status=deceased`; registry shows status badge and filter in government portal. |
| **StatusMonitor** | `backend/src/services/status/StatusMonitor.ts` | `recordBeneficiaryDeceased(beneficiaryId, fromStatus)` writes to `status_events` when marking deceased. |
| **Government audit** | `backend/src/api/routes/government/audit.ts` | `GET /audit/beneficiaries` uses actual schema: `id_number` (not `national_id`), no `email`; returns `missing_id_number`, `unique_ids`, `duplicate_or_null_ids`, `deceased_count`; optional `startDate`/`endDate` filter on `created_at`. |

### Locations and seed

| Item | File | Status |
|------|------|--------|
| **Locations table** | `backend/src/database/migrations/run.ts` | Table `locations` (type: nampost_office, atm, warehouse; no banks). |
| **Locations seed** | `backend/scripts/seed.ts` | Seeds NamPost offices, ATMs, warehouses (no banks). |
| **Map API** | `backend/src/api/routes/ketchup/map.ts` | Returns agents and fixed locations. |

### Frontend (Ketchup / Government)

| Area | What to keep in sync |
|------|----------------------|
| **React Query hooks** | Beneficiaries: useQuery for dependants, useMutation for create/update/delete dependants and Mark deceased. |
| **Open Banking (AIS/PIS)** | PIS list payees from `listBeneficiaries`; backend now excludes deceased account holders. |
| **Dashboard** | Use `activeBeneficiaries` and optionally `deceasedBeneficiaries` from dashboard metrics. |

### Optional follow-ups (done)

- **Beneficiary.deceased event:** When a beneficiary is marked deceased, `BeneficiaryService.update` calls `StatusMonitor.recordBeneficiaryDeceased()`; the event is stored in `status_events` with `voucher_id = 'beneficiary-{id}'` and `to_status = 'deceased'` for audit and downstream subscribers.
- **Government portal BeneficiaryRegistry:** Status badge (red for deceased) and status filter (All / Active / Pending / Verified / Deceased) implemented.

---

## Voucher operations, monitoring, alerts, and beneficiary communications

### How Ketchup is notified (voucher failed, expired, not redeemed)

- **Webhooks (Buffr → backend):** Buffr sends `voucher.redeemed`, `voucher.delivered`, `voucher.expired`, `voucher.cancelled`, and **`voucher.failed`** (e.g. delivery or redemption failed) to `POST /api/v1/webhooks/buffr`. Backend updates voucher status and writes to `status_events` (triggered_by: webhook).
- **Status events:** All status changes (webhook, manual, system) are stored in `status_events`; Ketchup can query `GET /api/v1/status-events` and the **Live Activity Feed** on the dashboard.
- **Requires-attention API:** `GET /api/v1/dashboard/requires-attention?expiringWithinDays=7` returns counts and samples for **failed**, **expired**, and **expiring soon** vouchers (by region and sample voucher IDs). Ketchup Dashboard shows the **Requires Attention** widget; sample IDs link to `/vouchers?view=<id>`.

### Voucher operations (Ketchup)

| Operation | Method | Endpoint | Body | When allowed |
|-----------|--------|----------|------|----------------|
| **Extend expiry** | PATCH | `/api/v1/vouchers/:id/extend` | `{ expiryDate: ISO string }` | issued, delivered |
| **Cancel** | PATCH | `/api/v1/vouchers/:id/cancel` | — | issued, delivered |
| **Reissue** | POST | `/api/v1/vouchers/:id/reissue` | `{ cancelOld?: boolean }` | any except redeemed (creates new voucher; optionally cancels old) |
| **Delete** | DELETE | `/api/v1/vouchers/:id` | — | any except redeemed (audit trail; removes voucher and related status_events, webhook_events, reconciliation_records) |

Ketchup Portal **Vouchers** page: voucher detail dialog shows **Extend** (date input), **Cancel voucher**, and **Reissue new voucher** when status is issued or delivered, and **Delete voucher** (with confirmation) in a danger zone when status is not redeemed.

### Communications to beneficiaries (SMS, USSD, Buffr app)

- **Backend:** `communication_log` table (migration `011_communication_log.sql`) stores every outbound communication (channel: `sms`, `ussd`, `buffr_in_app`, `email`). **CommunicationService** (`backend/src/services/communication/CommunicationService.ts`) provides:
  - `sendSMS(options)` – stub; logs to `communication_log`; wire to SMS gateway (e.g. Twilio, Africa's Talking) via `SMS_GATEWAY_URL` when ready.
  - `sendUSSD(options)` – stub; logs only; wire to USSD gateway via `USSD_GATEWAY_URL` when ready.
  - `sendBuffrInApp(options)` – stub; logs only; wire to Buffr notify API via `BUFFR_NOTIFY_URL` when ready.
- **When to send:** Ketchup (or scheduled jobs) can call CommunicationService when extending/reissuing vouchers (e.g. "Your voucher VC-xxx has been extended to DD/MM") or when StatusMonitor runs expiry warnings (e.g. "Your voucher expires in 3 days. Redeem at any NamPost."). Template and channel (SMS vs USSD vs Buffr in-app) can be chosen by beneficiary preference or default (e.g. Buffr if `buffr_user_id` set, else SMS).
- **Monitoring/alerts:** Dashboard **Requires Attention** widget and `GET /dashboard/requires-attention` give Ketchup a single place to see failed, expired, and expiring-soon vouchers; from there they can open voucher detail and use Extend / Cancel / Reissue and (when wired) trigger beneficiary notifications.

### File tree reference (communications, alerts, migrations)

Key paths for voucher operations, alerts, and beneficiary communications:

| Area | Path |
|------|------|
| **Ketchup dashboard alerts** | `apps/ketchup-portal/src/components/dashboard/RequiresAttentionAlerts.tsx` |
| **Voucher detail actions** | `apps/ketchup-portal/src/pages/Vouchers.tsx` (Extend / Cancel / Reissue in dialog) |
| **Dashboard API (requires-attention)** | `backend/src/api/routes/shared/dashboard.ts` → `GET /dashboard/requires-attention` |
| **Dashboard service** | `backend/src/services/dashboard/DashboardService.ts` → `getRequiresAttention()` |
| **Communication service** | `backend/src/services/communication/CommunicationService.ts` (SMS, USSD, Buffr in-app stubs) |
| **Communication log table** | `backend/src/database/migrations/011_communication_log.sql`; also in `run.ts` |
| **Webhooks (voucher.failed)** | `backend/src/api/routes/ketchup/webhooks.ts` → `handleVoucherFailed` |
| **Voucher operations** | `backend/src/api/routes/ketchup/vouchers.ts` (extend, cancel, reissue); `backend/src/services/voucher/VoucherService.ts` |

**File structure:** See `docs/FILE_STRUCTURE.md` for full repo tree (`apps/ketchup-portal`, `apps/government-portal`, `packages/api-client`, `backend`).

---

## Appendix: Integration with Buffr

For how Buffr integrates with SmartPay Connect and G2P (shared backend, DB, migration order), see:

- [smartpay-connect/backend/INTEGRATION.md](../../smartpay-connect/backend/INTEGRATION.md)
- [AUDIT_RESULTS_3_PROJECTS.md](../../AUDIT_RESULTS_3_PROJECTS.md) (repo root)

**Last Updated:** January 29, 2026  
**Status:** Complete reference for all SmartPay Connect pages and APIs
