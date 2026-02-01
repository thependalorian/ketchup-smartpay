# 🏛️ SmartPay Connect

**Namibian Payment System with Full PSD Compliance & Open Banking**

A production-ready e-wallet and payment platform compliant with Namibian Payment System Determinations (PSD-1, PSD-3, PSD-12) and Open Banking Standards v1.0.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install
cd backend && npm install

# Setup environment
cp backend/.env.local.bak backend/.env.local

# Run the application
npm run dev
```

Then in `backend`: run `pnpm run migrate` and `pnpm run seed` (see [GETTING_STARTED.md](./GETTING_STARTED.md) and [backend/MIGRATION_ORDER.md](./backend/MIGRATION_ORDER.md)).

**Access Points:**
- **Production:** https://www.ketchup.cc (Ketchup Portal), https://gov.ketchup.cc (Government Portal), https://api.ketchup.cc (API)
- **Development:** http://localhost:5173 (Ketchup Portal), http://localhost:5174 (Government Portal), http://localhost:3001 (Backend API)

---

## 📚 Documentation

**→ See [DOCUMENTATION.md](./DOCUMENTATION.md) for complete details**

### Quick Links

- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Project structure and file organization
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete technical documentation
- **[DNS_CONFIGURATION.md](./DNS_CONFIGURATION.md)** - Domain and DNS setup guide
- **[backend/README.md](./backend/README.md)** - Backend-specific documentation

---

## 🎯 Key Features

### 💰 Core Platform
- **Beneficiary Management** - 104,582 registered beneficiaries
- **Agent Network** - 487 active agents with liquidity management
- **Voucher Distribution** - Batch processing and tracking
- **E-Wallet System** - Real-time balances and P2P transfers
- **Transaction Processing** - Secure payment processing

### 🏛️ PSD Compliance (100% Automated)
- **PSD-1** - Payment Service Provider Licensing
- **PSD-3** - Electronic Money Issuance (N$1.5M capital, 100% trust account coverage)
- **PSD-12** - Cybersecurity Standards (99.9% uptime, 2FA, 24h incident reporting)

### 🌐 Open Banking
- **OAuth 2.0** - PKCE-enabled authorization
- **AIS** - Account Information Services
- **PIS** - Payment Initiation Services
- **Consent Management** - User-controlled permissions

### 🎮 Gamification
- **Achievements** - 5 rarity levels, 6 categories
- **Battle Pass** - Seasonal progression system
- **Leaderboards** - Competitive rankings
- **Daily Challenges** - Engagement mechanics

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- TailwindCSS + DaisyUI
- React Query
- React Router

**Backend:**
- Node.js + Express
- TypeScript
- Neon PostgreSQL (serverless)
- `tsx watch` for development

**Database:**
- Neon PostgreSQL (shared with buffr and g2p)
- This repo is the **Ketchup SmartPay API**; buffr and g2p are beneficiary/agent apps that use it and can share the same DB.

---

## 📊 Statistics

```
Total Tables:             216
PSD Compliance Tables:     14
Open Banking Tables:      ~30
Core Business Tables:     ~50
Gamification Tables:      ~25
API Endpoints:           ~100
Backend Services:         ~40
Frontend Components:      ~60
```

---

## 🏛️ Regulatory Compliance

### Automated Tasks

**Daily (00:00 - 02:00):**
- Trust account reconciliation (100% coverage)
- Dormant wallet checks (6-month inactivity)
- Capital requirements tracking (N$1.5M minimum)

**Continuous (Every 5 minutes):**
- System uptime monitoring (99.9% target)
- Service health checks

**Monthly (1st of each month):**
- Bank of Namibia report generation
- Monthly metrics compilation

**Real-time:**
- 2FA for every payment transaction
- Incident logging and reporting (24h to BoN)

### Compliance Dashboard

Access real-time compliance status at `/compliance`:
- Overall compliance score
- Trust account status
- Capital compliance
- System uptime (99.9% SLA)
- Open incidents
- Pending BoN reports

---

## 🔐 Security

- ✅ SSL/TLS encryption required
- ✅ Two-Factor Authentication (2FA) for all payments
- ✅ OAuth 2.0 with PKCE for Open Banking
- ✅ API key authentication
- ✅ Rate limiting and CORS
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Automated backups (RTO: 2 hours, RPO: 5 minutes)
- ✅ Complete audit trail

---

## 📖 API Documentation

### Core Endpoints

```
GET    /api/v1/beneficiaries
GET    /api/v1/agents
GET    /api/v1/vouchers
GET    /api/v1/transactions
```

### Compliance Endpoints

```
GET    /api/v1/compliance/dashboard
POST   /api/v1/compliance/trust-account/reconcile
POST   /api/v1/compliance/2fa/generate-otp
GET    /api/v1/compliance/uptime/status
POST   /api/v1/compliance/bon-reports/generate
```

### Open Banking Endpoints

```
GET    /api/v1/open-banking/accounts
POST   /api/v1/open-banking/payment-initiations
GET    /api/v1/open-banking/consents
```

**Full API documentation in [DOCUMENTATION.md](./DOCUMENTATION.md)**

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npx tsx test-psd-compliance.ts    # 24 PSD compliance tests
npx tsx test-webhooks.ts           # Webhook tests
```

**Test Coverage:**
- ✅ PSD compliance services (100% pass rate)
- ✅ Trust account reconciliation
- ✅ Two-factor authentication
- ✅ System uptime monitoring
- ✅ Incident response
- ✅ Dormant wallet management
- ✅ Capital requirements
- ✅ BoN reporting

---

## 📁 Project Structure

```
smartpay-connect/
├── .github/workflows/           # CI/CD
│   ├── backend.yml
│   ├── government-portal.yml
│   └── ketchup-portal.yml
├── apps/
│   ├── government-portal/       # Government dashboard (React + Vite)
│   │   ├── src/
│   │   │   ├── components/layout/   # Header, Layout, Sidebar
│   │   │   ├── pages/               # AgentNetwork, Analytics, AuditReports, BeneficiaryRegistry,
│   │   │   │                        # Compliance, Dashboard, Help, RegionalPerformance, Reports,
│   │   │   │                        # Settings, VoucherMonitoring, NotFound
│   │   │   ├── App.tsx, main.tsx, index.css
│   │   │   └── ...
│   │   ├── index.html, package.json, vite.config.ts, tailwind.config.ts, vercel.json
│   │   └── README.md
│   └── ketchup-portal/          # Ketchup/SmartPay operator dashboard (React + Vite)
│       ├── src/
│       │   ├── components/
│       │   │   ├── dashboard/       # AgentNetworkHealth, LiveActivityFeed, MonthlyTrendChart,
│       │   │   │                    # RecentVouchers, RegionalMap, VoucherStatusChart
│       │   │   ├── layout/           # Header, Layout, Sidebar
│       │   │   └── map/              # NamibiaMap
│       │   ├── pages/               # Agents, Analytics, BatchDistribution, Beneficiaries, Dashboard,
│       │   │                        # MapPage, OpenBanking*, Reconciliation, Regions, Reports,
│       │   │                        # StatusMonitor, Vouchers, WebhookMonitoring, Help, Settings, NotFound
│       │   ├── services/
│       │   ├── App.tsx, main.tsx, index.css
│       │   └── ...
│       ├── KETCHUP_MISSING_AND_COMING_SOON.md, README.md
│       ├── index.html, package.json, vite.config.ts, tailwind.config.ts, vercel.json
│       └── ...
├── backend/                     # Node.js + Express API
│   ├── scripts/
│   │   ├── seed.ts               # Beneficiaries, agents, locations, vouchers, status_events, webhooks, reconciliation
│   │   └── validate-seed.ts
│   ├── src/
│   │   ├── api/
│   │   │   ├── middleware/       # auth, governmentAuth, ketchupAuth, openBankingAuth, rateLimit
│   │   │   └── routes/
│   │   │       ├── government/   # analytics, audit, compliance, monitoring, reports
│   │   │       ├── ketchup/       # agents, beneficiaries, distribution, map, reconciliation, vouchers, webhooks
│   │   │       ├── shared/       # dashboard, statusEvents, openbanking (accounts, consent, payments)
│   │   │       └── index.ts
│   │   ├── database/
│   │   │   ├── migrations/       # 001–009 (beneficiaries, vouchers, status_events, webhook_events,
│   │   │   │                    # reconciliation_records, open_banking, PSD compliance, agents, locations)
│   │   │   ├── run.ts            # Migration runner
│   │   │   └── connection.ts
│   │   ├── schedulers/           # complianceScheduler.ts (reconciliation, uptime, dormancy, capital, BoN)
│   │   ├── services/
│   │   │   ├── agents/           # AgentService
│   │   │   ├── beneficiary/      # BeneficiaryRepository, BeneficiaryService
│   │   │   ├── compliance/       # TrustAccount, DormantWallet, CapitalRequirements, SystemUptimeMonitor,
│   │   │   │                    # BankOfNamibiaReporting, IncidentResponse, TwoFactorAuth
│   │   │   ├── dashboard/        # DashboardService
│   │   │   ├── distribution/     # BuffrAPIClient, DistributionEngine
│   │   │   ├── openbanking/      # AccountInformation, OAuth, Participant, PaymentInitiation
│   │   │   ├── reconciliation/   # ReconciliationService
│   │   │   ├── reports/          # ReportService
│   │   │   ├── status/           # StatusMonitor
│   │   │   ├── voucher/          # VoucherRepository, VoucherService, VoucherGenerator
│   │   │   └── webhook/          # WebhookRepository
│   │   ├── utils/                # logger, webhookSignature
│   │   └── index.ts
│   ├── INTEGRATION.md, MIGRATION_ORDER.md, README.md, SEED_DATA.md, TEST_RESULTS.md
│   ├── package.json, tsconfig.json, vitest.config.ts
│   └── ...
├── docs/
│   ├── archive/                 # DATABASE_STRUCTURE, OPEN_BANKING_ARCHIVE, PSD_COMPLIANCE_ARCHIVE, etc.
│   └── ARCHIVE_CONSOLIDATION_SUMMARY.md
├── packages/
│   ├── api-client/              # Unified API client for Ketchup & Government
│   │   └── src/
│   │       ├── ketchup/         # agentAPI, beneficiaryAPI, dashboardAPI, distributionAPI, mapAPI,
│   │       │                    # openBankingAPI, reconciliationAPI, statusEventsAPI, voucherAPI, webhookAPI
│   │       ├── government/      # index
│   │       ├── shared/, client.ts, types.ts, index.ts
│   │       └── ...
│   ├── config/                 # constants, env, vite-env.d
│   ├── types/                   # compliance, openBanking, index
│   ├── ui/                      # shadcn-style components (51: button, card, dialog, table, etc.)
│   │   └── src/components/, hooks/, lib/, styles/
│   └── utils/                  # formatters, validators, utils
├── scripts/                    # build-all.sh, dev-all.sh, test-api-connections.mjs
├── shared/types/               # compliance, entities, openBanking, index
├── ARCHITECTURE.md, DOCUMENTATION.md, PROJECT_STRUCTURE.md, DNS_CONFIGURATION.md
├── README.md
```

---

## 🌍 Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Server
PORT=3001
NODE_ENV=development

# Buffr API
BUFFR_API_URL=http://localhost:3000
BUFFR_API_KEY=smartpay_...

# Ketchup SmartPay API (new domain)
KETCHUP_SMARTPAY_API_URL=https://api.ketchup.cc
KETCHUP_SMARTPAY_API_KEY=smartpay_...

# API Authentication
API_KEY=smartpay_...
```

---

## 📞 Support

### Common Issues

**Database connection failed:**
```bash
# Check environment variables
cat backend/.env.local

# Test connection
cd backend && npx tsx -e "import {neon} from '@neondatabase/serverless'; const sql=neon(process.env.DATABASE_URL!); console.log(await sql\`SELECT NOW()\`);"
```

**Backend not starting:**
```bash
# Check if port is in use
lsof -i :3001

# View logs
cd backend && npm run dev
```

### Bank of Namibia Contact

**PSD Compliance:**
- Email: assessments.npsd@bon.com.na
- Preliminary incident reports: Within 24 hours
- Impact assessments: Within 30 days
- Monthly reports: By 10th of following month
- Annual agent returns: By January 31

---

## 🎯 Status

**✅ Production Ready**

- ✅ 100% PSD Compliance (PSD-1, PSD-3, PSD-12)
- ✅ Full Open Banking Implementation
- ✅ 216 database tables operational
- ✅ Automated compliance tasks running
- ✅ Comprehensive test coverage
- ✅ Security hardened (SSL, 2FA, OAuth 2.0)
- ✅ Scalable architecture (Neon serverless)

---

## 📚 Additional Resources

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Complete technical documentation
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Project structure and file organization
- **[DNS_CONFIGURATION.md](./DNS_CONFIGURATION.md)** - Domain and DNS setup
- **[docs/BUSINESS.md](./docs/BUSINESS.md)** - PRD and business plan documents
- **[backend/README.md](./backend/README.md)** - Backend documentation

---

## 📄 License

Proprietary - SmartPay Connect

---

**Last Updated:** January 30, 2026  
**Version:** 2.0  
**Status:** Production Ready  
**Project structure:** Reflects monorepo (apps: ketchup-portal, government-portal; backend; packages: api-client, config, types, ui, utils).

**🏛️ Compliance • 🌐 Open Banking • 💰 E-Wallet • 🔐 Secure**
