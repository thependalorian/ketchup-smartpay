# File Tree: Ketchup SmartPay

**Generated:** 1/31/2026  
**Root Path:** `ketchup-smartpay`  
**Purpose:** Single reference for repo structure. Update when adding apps, packages, or backend routes.

---

```
├── .github
│   └── workflows
│       ├── backend.yml
│       ├── government-portal.yml
│       └── ketchup-portal.yml
├── apps
│   ├── government-portal
│   │   ├── public
│   │   │   └── favicon.ico
│   │   ├── src
│   │   │   ├── components
│   │   │   │   ├── layout (Header.tsx, Layout.tsx, Sidebar.tsx)
│   │   │   │   ├── BeneficiaryDetailDialog.tsx
│   │   │   │   └── VoucherDetailDialog.tsx
│   │   │   ├── pages
│   │   │   │   ├── AgentNetwork.tsx, Analytics.tsx, AuditReports.tsx, BeneficiaryRegistry.tsx
│   │   │   │   ├── Compliance.tsx, Dashboard.tsx, Help.tsx, NotFound.tsx
│   │   │   │   ├── RegionalPerformance.tsx, Reports.tsx, Settings.tsx, VoucherMonitoring.tsx
│   │   │   ├── App.tsx, index.css, main.tsx
│   │   ├── README.md, index.html, package.json, postcss.config.js, tailwind.config.ts
│   │   ├── tsconfig.json, tsconfig.node.json, vercel.json, vite.config.ts
│   └── ketchup-portal
│       ├── public (favicon.ico, placeholder.svg)
│       ├── src
│       │   ├── components
│       │   │   ├── beneficiary (BeneficiarySelector.tsx, index.ts)
│       │   │   ├── dashboard
│       │   │   │   ├── AgentNetworkHealth.tsx, LiveActivityFeed.tsx, MonthlyTrendChart.tsx
│       │   │   │   ├── RecentVouchers.tsx, RegionalMap.tsx, RequiresAttentionAlerts.tsx, VoucherStatusChart.tsx
│       │   │   ├── layout (Header.tsx, Layout.tsx, Sidebar.tsx)
│       │   │   └── map (NamibiaMap.tsx)
│       │   ├── constants (channelColors.ts)
│       │   ├── pages
│       │   │   ├── Agents.tsx, Analytics.tsx, BatchDistribution.tsx, Beneficiaries.tsx, Dashboard.tsx
│       │   │   ├── Help.tsx, MapPage.tsx, MobileUnits.tsx, NotFound.tsx
│       │   │   ├── OpenBankingAccounts.tsx, OpenBankingConsents.tsx, OpenBankingDashboard.tsx, OpenBankingPayments.tsx
│       │   │   ├── Reconciliation.tsx, Regions.tsx, Reports.tsx, Settings.tsx
│       │   │   ├── StatusMonitor.tsx, Vouchers.tsx, WebhookMonitoring.tsx
│       │   ├── services
│       │   ├── App.tsx, index.css, main.tsx
│       ├── KETCHUP_MISSING_AND_COMING_SOON.md, README.md, index.html, package.json
│       ├── postcss.config.js, tailwind.config.ts, tsconfig.json, tsconfig.node.json, vercel.json, vite.config.ts
├── backend
│   ├── scripts
│   │   ├── seed.ts, validate-audit-beneficiaries.ts, validate-seed.ts
│   ├── src
│   │   ├── api
│   │   │   ├── middleware (auth.ts, governmentAuth.ts, ketchupAuth.ts, openBankingAuth.ts, rateLimit.ts)
│   │   │   └── routes
│   │   │       ├── government (analytics.ts, audit.ts, compliance.ts, monitoring.ts, reports.ts)
│   │   │       ├── ketchup
│   │   │       │   ├── agents.ts, beneficiaries.ts, distribution.ts, locations.ts, map.ts
│   │   │       │   ├── mobileUnits.ts, reconciliation.ts, vouchers.ts, webhooks.ts
│   │   │       ├── shared (dashboard.ts, statusEvents.ts; openbanking/ accounts, consent, payments, index)
│   │   │       └── index.ts
│   │   ├── database
│   │   │   ├── migrations
│   │   │   │   ├── 001_initial_schema.sql … 011_communication_log.sql
│   │   │   │   └── run.ts
│   │   │   ├── repositories
│   │   │   └── connection.ts
│   │   ├── schedulers (complianceScheduler.ts)
│   │   ├── services
│   │   │   ├── agents (AgentService.test.ts, AgentService.ts)
│   │   │   ├── beneficiary (BeneficiaryRepository.ts, BeneficiaryService.ts)
│   │   │   ├── communication (CommunicationService.ts)
│   │   │   ├── compliance (BankOfNamibiaReportingService, CapitalRequirementsService, DormantWalletService, etc.)
│   │   │   ├── dashboard (DashboardService.test.ts, DashboardService.ts)
│   │   │   ├── dependant (DependantRepository.ts, DependantService.ts)
│   │   │   ├── distribution (BuffrAPIClient.ts, DistributionEngine.ts)
│   │   │   ├── mobileUnits (MobileUnitService.ts)
│   │   │   ├── openbanking (AccountInformationService, OAuthService, ParticipantService, PaymentInitiationService)
│   │   │   ├── reconciliation (ReconciliationService.test.ts, ReconciliationService.ts)
│   │   │   ├── reports (ReportService.ts)
│   │   │   ├── status (StatusMonitor.ts)
│   │   │   ├── voucher (VoucherGenerator, VoucherRepository, VoucherService, validateIssueVoucher)
│   │   │   └── webhook (WebhookRepository.test.ts, WebhookRepository.ts)
│   │   ├── test (setup.ts)
│   │   ├── utils (logger.ts, webhookSignature.test.ts, webhookSignature.ts)
│   │   └── index.ts
│   ├── INTEGRATION.md, MIGRATION_ORDER.md, README.md, SEED_DATA.md, TEST_AUDIT.md, TEST_RESULTS.md
│   ├── package.json, tsconfig.json, vitest.config.ts
│   ├── export-db-structure.ts, get-db-structure.ts, run-fix-migration.ts, run-open-banking-migration.ts
│   ├── run-psd-compliance-migration.ts, test-database.ts, test-open-banking.ts, test-psd-compliance.ts
├── docs
│   ├── archive (ARCHITECTURE_COMPARISON, IMPLEMENTATION_*, OPEN_BANKING_ARCHIVE, PSD_*, REFACTORING_*, etc.)
│   ├── CURL_VALIDATION.md, FOOTNOTES_FUTURE.md, KETCHUP_VOUCHER_OPERATIONS.md
│   ├── FILE_STRUCTURE.md, MOBILE_UNITS_PLAN.md, PAGES_AND_API_REFERENCE.md, VALIDATION_REPORT.md
├── packages
│   ├── api-client
│   │   ├── src
│   │   │   ├── government (index.ts)
│   │   │   ├── ketchup
│   │   │   │   ├── agentAPI.ts, api.ts, api.test.ts, beneficiaryAPI.ts, dashboardAPI.ts, distributionAPI.ts
│   │   │   │   ├── locationsAPI.ts, mapAPI.ts, mobileUnitsAPI.ts, openBankingAPI.ts
│   │   │   │   ├── reconciliationAPI.ts, statusEventsAPI.ts, voucherAPI.ts, webhookAPI.ts, index.ts
│   │   │   ├── shared (index.ts)
│   │   │   ├── client.ts, index.ts, types.ts
│   │   ├── package.json, tsconfig.json
│   ├── config (src: constants, env, index, vite-env.d; package.json, tsconfig.json)
│   ├── types (src: compliance, index, openBanking; package.json, tsconfig.json)
│   ├── ui
│   │   ├── src
│   │   │   ├── components (MetricCard, StatusBadge, accordion, alert-dialog, button, card, dialog, table, tabs, etc.)
│   │   │   ├── hooks (use-mobile, use-toast)
│   │   │   ├── lib (utils.ts)
│   │   │   ├── styles (globals.css)
│   │   │   └── index.ts
│   │   ├── package.json, tsconfig.json
│   └── utils (src: formatters, index, utils, validators; package.json, tsconfig.json)
├── scripts
│   ├── build-all.sh, dev-all.sh, test-api-connections.mjs, validate-api-curl.sh
├── shared
│   └── types (compliance.ts, entities.ts, index.d.ts, index.ts, index.js, openBanking.ts)
├── .gitignore, ARCHITECTURE_DECISION_RECORDS.md, DOCUMENTATION.md, GETTING_STARTED.md
├── MIGRATION_CHECKLIST.md, README.md, START_HERE.md, VISUAL_GUIDE.md
├── bun.lockb, components.json, eslint.config.js, package-lock.json, package.json
├── pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.base.json, tsconfig.json, tsconfig.node.json
├── turbo.json, test-backend-start.sh, validate-implementation.sh
```

---

## Key locations

| Area | Path |
|------|------|
| Ketchup portal pages | `apps/ketchup-portal/src/pages/` |
| Ketchup sidebar | `apps/ketchup-portal/src/components/layout/Sidebar.tsx` |
| Ketchup App routes | `apps/ketchup-portal/src/App.tsx` |
| Government portal pages | `apps/government-portal/src/pages/` |
| Backend API routes | `backend/src/api/routes/` (ketchup, government, shared) |
| Backend services | `backend/src/services/` |
| Migrations | `backend/src/database/migrations/run.ts` (and SQL files) |
| API client (Ketchup) | `packages/api-client/src/ketchup/` |
| Shared types | `shared/types/` |

---

*Regenerate or amend this file when adding new apps, packages, or backend modules.*
