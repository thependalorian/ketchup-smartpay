# Project Structure - SmartPay Connect

## Domain Configuration
**Production URLs:**
- **Main Portal:** https://www.ketchup.cc
- **API:** https://api.ketchup.cc
- **Government Portal:** https://gov.ketchup.cc
- **Admin Dashboard:** https://admin.ketchup.cc
- **Development:** https://dev.ketchup.cc
- **Staging:** https://staging.ketchup.cc

## Project Root Structure

```
smartpay-connect/
├── 📄 .env.local                    # Root environment config
├── 📄 package.json                  # Workspace root
├── 📄 pnpm-workspace.yaml           # PNPM workspace config
├── 📄 pnpm-lock.yaml                # Lock file
├── 📄 eslint.config.js              # ESLint config
├── 📄 tsconfig.json                 # TypeScript base config
├── 📄 README.md                     # Main documentation
├── 📄 README.new.md                 # Updated documentation
├── 📄 DOCUMENTATION.md              # Complete docs
├── 📄 ARCHITECTURE.new.md           # Architecture docs
├── 📄 DNS_CONFIGURATION.md          # DNS setup guide
├── 📄 DNS_RECORDS.txt               # Copy-paste DNS records
├── 📄 PROJECT_STRUCTURE.md          # This file
│
├── 📁 .github/                      # GitHub workflows
│   └── 📁 workflows/
│       ├── backend.yml
│       ├── government-portal.yml
│       └── ketchup-portal.yml
│
├── 📁 apps/                         # Frontend applications
│   ├── 📁 ketchup-portal/           # Ketchup/SmartPay operator dashboard
│   │   ├── 📄 README.md
│   │   ├── 📄 index.html
│   │   ├── 📄 package.json
│   │   ├── 📄 vite.config.ts
│   │   ├── 📄 tailwind.config.ts
│   │   ├── 📄 vercel.json
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 postcss.config.js
│   │   ├── 📁 public/
│   │   │   └── favicon.ico
│   │   ├── 📁 src/
│   │   │   ├── 📄 main.tsx
│   │   │   ├── 📄 App.tsx
│   │   │   ├── 📄 index.css
│   │   │   ├── 📁 components/
│   │   │   │   ├── 📁 layout/       # Header, Layout, Sidebar
│   │   │   │   ├── 📁 dashboard/    # Dashboard widgets
│   │   │   │   ├── 📁 beneficiary/  # Beneficiary components
│   │   │   │   ├── 📁 notifications/
│   │   │   │   └── 📁 map/
│   │   │   └── 📁 pages/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Agents.tsx
│   │   │       ├── Beneficiaries.tsx
│   │   │       ├── Vouchers.tsx
│   │   │       ├── BatchDistribution.tsx
│   │   │       ├── Analytics.tsx
│   │   │       ├── Regions.tsx
│   │   │       ├── Reconciliation.tsx
│   │   │       ├── StatusMonitor.tsx
│   │   │       ├── WebhookMonitoring.tsx
│   │   │       ├── Notifications.tsx
│   │   │       ├── OpenBankingDashboard.tsx
│   │   │       ├── OpenBankingAccounts.tsx
│   │   │       ├── OpenBankingConsents.tsx
│   │   │       ├── OpenBankingPayments.tsx
│   │   │       ├── MobileUnits.tsx
│   │   │       ├── MapPage.tsx
│   │   │       ├── Help.tsx
│   │   │       ├── Settings.tsx
│   │   │       └── NotFound.tsx
│   │   └── 📁 .env.local            # Frontend environment
│   │
│   └── 📁 government-portal/        # Government oversight dashboard
│       ├── 📄 README.md
│       ├── 📄 index.html
│       ├── 📄 package.json
│       ├── 📄 vite.config.ts
│       ├── 📄 tailwind.config.ts
│       ├── 📄 vercel.json
│       ├── 📄 tsconfig.json
│       ├── 📄 postcss.config.js
│       ├── 📁 public/
│       │   └── favicon.ico
│       ├── 📁 src/
│       │   ├── 📄 main.tsx
│       │   ├── 📄 App.tsx
│       │   ├── 📄 index.css
│       │   ├── 📁 components/
│       │   │   ├── 📁 layout/       # Header, Layout, Sidebar
│       │   │   └── 📁 ...
│       │   └── 📁 pages/
│       │       ├── Dashboard.tsx
│       │       ├── AgentNetwork.tsx
│       │       ├── BeneficiaryRegistry.tsx
│       │       ├── VoucherMonitoring.tsx
│       │       ├── Compliance.tsx
│       │       ├── Analytics.tsx
│       │       ├── RegionalPerformance.tsx
│       │       ├── AuditReports.tsx
│       │       ├── Reports.tsx
│       │       ├── Help.tsx
│       │       ├── Settings.tsx
│       │       └── NotFound.tsx
│       └── 📁 .env.local
│
├── 📁 backend/                      # Node.js + Express API
│   ├── 📄 README.md
│   ├── 📄 package.json
│   ├── 📄 tsconfig.json
│   ├── 📄 vitest.config.ts
│   ├── 📄 INTEGRATION.md
│   ├── 📄 MIGRATION_ORDER.md
│   ├── 📄 SEED_DATA.md
│   ├── 📄 TEST_RESULTS.md
│   ├── 📄 .env.local
│   ├── 📁 src/
│   │   ├── 📄 index.ts              # Entry point
│   │   ├── 📁 api/
│   │   │   ├── 📁 routes/
│   │   │   │   ├── 📁 index.ts      # Route aggregator
│   │   │   │   ├── 📁 ketchup/      # Ketchup API routes
│   │   │   │   │   ├── agents.ts
│   │   │   │   │   ├── beneficiaries.ts
│   │   │   │   │   ├── distribution.ts
│   │   │   │   │   ├── locations.ts
│   │   │   │   │   ├── map.ts
│   │   │   │   │   ├── mobileUnits.ts
│   │   │   │   │   ├── notifications.ts
│   │   │   │   │   ├── reconciliation.ts
│   │   │   │   │   ├── vouchers.ts
│   │   │   │   │   └── webhooks.ts
│   │   │   │   ├── 📁 government/   # Government API routes
│   │   │   │   └── 📁 shared/
│   │   │   │       ├── dashboard.ts
│   │   │   │       ├── statusEvents.ts
│   │   │   │       └── 📁 openbanking/
│   │   │   │           ├── index.ts
│   │   │   │           ├── accounts.ts
│   │   │   │           ├── consent.ts
│   │   │   │           └── payments.ts
│   │   │   └── 📁 middleware/
│   │   │       ├── auth.ts
│   │   │       ├── ketchupAuth.ts
│   │   │       ├── governmentAuth.ts
│   │   │       ├── openBankingAuth.ts
│   │   │       └── rateLimit.ts
│   │   ├── 📁 services/
│   │   │   ├── 📁 agents/
│   │   │   │   └── AgentService.ts
│   │   │   ├── 📁 beneficiary/
│   │   │   │   ├── BeneficiaryRepository.ts
│   │   │   │   └── BeneficiaryService.ts
│   │   │   ├── 📁 voucher/
│   │   │   │   ├── VoucherRepository.ts
│   │   │   │   ├── VoucherService.ts
│   │   │   │   └── VoucherGenerator.ts
│   │   │   ├── 📁 distribution/
│   │   │   │   ├── DistributionEngine.ts
│   │   │   │   └── BuffrAPIClient.ts
│   │   │   ├── 📁 status/
│   │   │   │   └── StatusMonitor.ts
│   │   │   ├── 📁 dashboard/
│   │   │   │   └── DashboardService.ts
│   │   │   ├── 📁 reconciliation/
│   │   │   │   └── ReconciliationService.ts
│   │   │   ├── 📁 webhook/
│   │   │   │   └── WebhookRepository.ts
│   │   │   ├── 📁 notifications/
│   │   │   │   └── NotificationsService.ts
│   │   │   ├── 📁 mobileUnits/
│   │   │   │   └── MobileUnitService.ts
│   │   │   ├── 📁 dependant/
│   │   │   │   ├── DependantRepository.ts
│   │   │   │   └── DependantService.ts
│   │   │   ├── 📁 communication/
│   │   │   │   └── CommunicationService.ts
│   │   │   └── 📁 compliance/
│   │   │       ├── TrustAccountService.ts
│   │   │       ├── DormantWalletService.ts
│   │   │       ├── CapitalRequirementsService.ts
│   │   │       ├── SystemUptimeMonitorService.ts
│   │   │       ├── BankOfNamibiaReportingService.ts
│   │   │       ├── IncidentResponseService.ts
│   │   │       └── TwoFactorAuthService.ts
│   │   ├── 📁 database/
│   │   │   ├── 📄 connection.ts
│   │   │   └── 📁 migrations/
│   │   │       ├── run.ts
│   │   │       ├── 001_initial_schema.sql
│   │   │       ├── 002_webhook_events.sql
│   │   │       ├── 003_status_events.sql
│   │   │       ├── 004_reconciliation_records.sql
│   │   │       ├── 005_open_banking_schema.sql
│   │   │       ├── 006_psd_compliance_schema.sql
│   │   │       ├── 007_fix_psd_compliance_schema.sql
│   │   │       ├── 008_agents.sql
│   │   │       ├── 009_locations.sql
│   │   │       ├── 010_remove_bank_locations.sql
│   │   │       └── 011_communication_log.sql
│   │   ├── 📁 schedulers/
│   │   │   └── complianceScheduler.ts
│   │   └── 📁 utils/
│   │       ├── logger.ts
│   │       └── webhookSignature.ts
│   └── 📁 scripts/
│       ├── seed.ts
│       ├── validate-seed.ts
│       └── validate-audit-beneficiaries.ts
│
├── 📁 docs/                         # Documentation
│   ├── 📄 CURL_VALIDATION.md
│   ├── 📄 KETCHUP_VOUCHER_OPERATIONS.md
│   ├── 📄 FOOTNOTES_FUTURE.md
│   └── 📁 archive/                  # Historical docs
│       ├── START_HERE.md
│       ├── GETTING_STARTED.md
│       ├── DATABASE_STRUCTURE.md
│       ├── ARCHITECTURE_DECISION_RECORDS.md
│       ├── IMPLEMENTATION_COMPLETE.md
│       ├── IMPLEMENTATION_SUMMARY.md
│       ├── VALIDATION_REPORT.md
│       ├── VISUAL_GUIDE.md
│       └── ...
│
├── 📁 buffr/                        # Legacy Buffr app (separate)
│   ├── 📄 README.md
│   ├── 📄 app.json
│   ├── 📄 babel.config.js
│   ├── 📁 app/                      # Expo app routes
│   ├── 📁 assets/
│   ├── 📁 android/
│   ├── 📁 buffr_ai/                 # AI module
│   ├── 📁 buffr_ai_ts/              # TypeScript AI
│   ├── 📁 docs/
│   ├── 📁 fineract/                 # Fineract integration
│   ├── 📁 scripts/
│  tests__/
│ └── 📁 __
└── 📁 .git/                         # Git repository
```

## Key Configuration Files

### Environment Files
| File | Purpose |
|------|---------|
| `.env.local` | Root environment (frontend API URL) |
| `apps/ketchup-portal/.env.local` | Ketchup portal config |
| `apps/government-portal/.env.local` | Government portal config |
| `backend/.env.local` | Backend API config |

### Vercel Deployment
| File | Purpose |
|------|---------|
| `apps/ketchup-portal/vercel.json` | Ketchup portal Vercel config |
| `apps/government-portal/vercel.json` | Government portal Vercel config |

## Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** TailwindCSS + DaisyUI
- **State Management:** React Query
- **Routing:** React Router

### Backend
- **Runtime:** Node.js
- **Framework:** Express + TypeScript
- **Database:** Neon PostgreSQL (serverless)
- **Development:** `tsx watch`

### DevOps
- **Package Manager:** PNPM
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel
- **Testing:** Vitest

## API Endpoints

### Base URL
- **Development:** `http://localhost:3001`
- **Production:** `https://api.ketchup.cc`

### API Versioning
- All endpoints prefixed with `/api/v1`
- Open Banking endpoints: `/bon/v1`

### Key Endpoints
| Resource | Endpoints |
|----------|-----------|
| Beneficiaries | `/api/v1/beneficiaries` |
| Vouchers | `/api/v1/vouchers` |
| Agents | `/api/v1/agents` |
| Distribution | `/api/v1/distribution` |
| Compliance | `/api/v1/compliance` |
| Open Banking | `/api/v1/open-banking` |
