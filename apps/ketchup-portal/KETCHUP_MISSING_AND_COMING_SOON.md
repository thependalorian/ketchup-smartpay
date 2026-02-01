# Ketchup Portal – Missing Interfaces & “Coming Soon” Pages

**Purpose:** List of placeholder (“coming soon”) pages and any missing or newly added types in the Ketchup portal.  
**Location:** `smartpay-connect/apps/ketchup-portal/`

---

## 1. Former “Coming soon” placeholder pages (now implemented)

The following routes previously showed “coming soon” and are now implemented with real UI:

| Route | File | Implementation |
|-------|------|----------------|
| `/vouchers` | `Vouchers.tsx` | Table with search, status filter, pagination. |
| `/batch-distribution` | `BatchDistribution.tsx` | Batch form (paste IDs) + single voucher issue. |
| `/status-monitor` | `StatusMonitor.tsx` | Status events table, search and voucher ID filter. |
| `/webhooks` | `WebhookMonitoring.tsx` | Webhook events table, retry for failed. |
| `/reconciliation` | `Reconciliation.tsx` | Run reconciliation by date, records table, match filter. |
| `/agents` | `Agents.tsx` | Agent table, search, region/status filters, stats cards. |
| `/mobile-units` | `MobileUnits.tsx` | **SmartPay Mobile** – Fleet list, stats (total/active/down), liquidity/volume/success rate; view-detail modal. Uses `mobileUnitsAPI` (agents with `type=mobile_unit`). Phase 2: Equipment/Drivers/Activity per `docs/MOBILE_UNITS_PLAN.md`. |
| `/regions` | `Regions.tsx` | Regional stats table from `dashboardAPI.getRegionalStats()`. |
| `/analytics` | `Analytics.tsx` | Monthly trend + redemption channels tables. |
| `/reports` | `Reports.tsx` | Hub with links to Reconciliation, Analytics, Regions. |
| `/settings` | `Settings.tsx` | API base URL (VITE_API_URL), portal info. |
| `/open-banking` | `OpenBankingDashboard.tsx` | Hub with links to Accounts, Payments, Consents. |
| `/open-banking/accounts` | `OpenBankingAccounts.tsx` | Accounts list + “Link account” (token TBD). |
| `/open-banking/payments` | `OpenBankingPayments.tsx` | Payment form + recent payments placeholder. |
| `/open-banking/consents` | `OpenBankingConsents.tsx` | Placeholder + “New consent” (API TBD). |
| `/beneficiaries` | `Beneficiaries.tsx` | Table with search, region/status filters (incl. deceased), pagination. View dialog: details, **Dependants** (list/add/edit/delete), **Mark deceased** (with confirmation). Edit: status includes deceased. |
| `/help` | `Help.tsx` | Quick links, FAQ, link to Settings. |

**Still minimal / token-dependent:** Open Banking Accounts and Consents depend on access token flow; Settings shows read-only API URL.

---

## 2. Fully implemented (no placeholders)

- **Dashboard** (`/`) – Metrics, charts, recent vouchers, live activity, agent health, map preview.
- **SmartPay Mobile** (`/mobile-units`) – Fleet list, stats (total/active/down), liquidity/volume/success rate, view-detail modal; uses `mobileUnitsAPI` (agents with `type=mobile_unit`).
- **Map** (`/map`) – Namibia map with agent/location data from `GET /api/v1/map/locations`.
- **Open Banking dashboard** (`/open-banking`) – Hub with links to Accounts, Payments, Consents.
- **Help** (`/help`) – Quick links, FAQ, link to Settings.
- **Settings** (`/settings`) – API base URL display, portal info.
- **Reports** (`/reports`) – Hub linking to Reconciliation, Analytics, Regions.
- **NotFound** – 404 page.

---

## 3. TypeScript / API client types

**Fixed:** The ketchup api-client previously imported from `../types` (e.g. in `beneficiaryAPI.ts`, `voucherAPI.ts`, `webhookAPI.ts`, `reconciliationAPI.ts`), but `packages/api-client/src/types` did not exist.

**Added:** `packages/api-client/src/types.ts` that:

- Re-exports from `@smartpay/types`: `Beneficiary`, `Voucher`, `Agent`, `ApiResponse` / `APIResponse`, `DashboardMetrics`, etc.
- Defines DTOs/filters used only by the api-client: `CreateBeneficiaryDTO`, `UpdateBeneficiaryDTO`, `BeneficiaryFilters`, `IssueVoucherDTO`, `IssueBatchDTO`, `VoucherFilters`, `PaginatedResponse<T>`.

So **no interfaces are missing** for the current ketchup portal usage; the “missing” piece was the **types module** that other ketchup APIs were importing from, which is now in place.

---

## 4. Interfaces and types used by Ketchup (summary)

| Source | Types / APIs |
|--------|----------------|
| `@smartpay/api-client/ketchup` | `mapAPI`, `MapLocation`, `LocationType`, `LocationStatus`; `statusEventsAPI`, `StatusEvent`; `voucherAPI`, `beneficiaryAPI`, `dashboardAPI`, etc. |
| `@smartpay/types` | `Beneficiary`, `Voucher`, `Agent`, `DashboardMetrics`, `ApiResponse`, etc. |
| `packages/api-client/src/types.ts` | `CreateBeneficiaryDTO`, `UpdateBeneficiaryDTO`, `BeneficiaryFilters`, `IssueVoucherDTO`, `IssueBatchDTO`, `VoucherFilters`, `PaginatedResponse`. |

---

## 5. Next steps (optional) – implemented

The following enhancements have been implemented:

1. **Beneficiaries** – Add Beneficiary modal (create), View detail dialog (with Edit, **Dependants** section, **Mark deceased**). Edit beneficiary modal (status includes deceased). Dependants: list, add, edit, delete via `beneficiaryAPI.getDependants`, `createDependant`, `updateDependant`, `deleteDependant`. Mark deceased sets `status: 'deceased'` and `deceasedAt`; backend blocks voucher issuance to deceased beneficiaries.
2. **Vouchers** – View voucher detail dialog (`voucherAPI.getById`), Issue voucher modal (beneficiary select, amount, grant type, expiry days). Uses `voucherAPI.issue`, `getById`; beneficiary list from `beneficiaryAPI.getAll`.
3. **Agents** – View agent detail dialog (row data; no `getById` API).
4. **Settings** – Dark mode toggle (Switch), persisted in `localStorage` under `ketchup-portal-theme`; applies `dark` class on `document.documentElement`.
5. **Reports** – Export CSV: Reconciliation page has “Export CSV” for current records; Analytics page has “Export CSV” for monthly trend and for redemption channels tables.

**Still optional / backend-dependent:**

- **Open Banking Accounts / Consents** – Wire to access-token flow when backend supports it.
- **Settings** – More options (e.g. notifications) when backend/design is defined.
- **Reports** – PDF export when needed.

All of the above reuse types from `@smartpay/api-client/ketchup`, `@smartpay/api-client` (types re-exported from `packages/api-client/src/types.ts`), and `@smartpay/types`.
