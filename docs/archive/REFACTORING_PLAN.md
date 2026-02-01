# 🏗️ SMARTPAY CONNECT - MODULAR ARCHITECTURE REFACTORING PLAN

**Version:** 1.0  
**Date:** January 29, 2026  
**Status:** Proposed Architecture

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Modular Architecture](#proposed-modular-architecture)
4. [Monorepo Structure](#monorepo-structure)
5. [User Flows](#user-flows)
6. [Wireframes & Architecture Diagrams](#wireframes--architecture-diagrams)
7. [Migration Strategy](#migration-strategy)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Specifications](#technical-specifications)

---

## 📊 EXECUTIVE SUMMARY

### Current Problems
- ❌ Monolithic frontend with mixed Ketchup and Government pages
- ❌ Single App.tsx with profile switching complexity
- ❌ Bundle includes both applications (larger size)
- ❌ Cannot deploy portals independently
- ❌ Shared components may conflict
- ❌ Hard to scale teams independently

### Proposed Solution
- ✅ **Two separate frontends** (Ketchup Portal + Government Portal)
- ✅ **Shared packages** for UI components, types, API clients
- ✅ **Monorepo structure** for better code management
- ✅ **Independent deployments** (different Vercel projects)
- ✅ **Modular architecture** for scalability
- ✅ **Unified backend** with route segregation

### Key Benefits
| Benefit | Description |
|---------|-------------|
| **Independent Deployments** | Deploy Ketchup and Government portals separately |
| **Reduced Bundle Size** | Each portal only includes its own code |
| **Team Scalability** | Teams can work independently on each portal |
| **Code Reusability** | Shared packages prevent duplication |
| **Better Security** | Separate access control per portal |
| **Faster Development** | No profile switching logic needed |

---

## 🔍 CURRENT STATE ANALYSIS

### Existing Project Structure

```
smartpay-connect/
├── src/                          # Monolithic frontend
│   ├── components/
│   │   ├── dashboard/           # Mixed dashboard components
│   │   ├── layout/              # Header, Sidebar (profile switching)
│   │   ├── openbanking/         # Open banking components
│   │   └── ui/                  # 50+ UI components
│   ├── pages/
│   │   ├── government/          # 9 government pages
│   │   ├── Index.tsx            # Ketchup dashboard
│   │   ├── Beneficiaries.tsx    # Ketchup pages
│   │   ├── Vouchers.tsx
│   │   └── ... (18+ pages)
│   ├── contexts/
│   │   ├── ProfileContext.tsx   # Profile switching logic
│   │   └── OpenBankingContext.tsx
│   ├── services/                # 10 API service files
│   └── App.tsx                  # Mixed routing
├── backend/                      # Unified backend
│   └── src/
│       ├── api/routes/          # All routes mixed
│       ├── services/            # 40+ services
│       └── database/            # 216 tables
└── shared/                       # Shared types
    └── types/
```

### Current Issues Identified

**1. Mixed Routing (App.tsx):**
```typescript
// Current: Profile-based routing with ProfileRoute wrapper
<Route path="/" element={<ProfileRoute profile="ketchup"><Index /></ProfileRoute>} />
<Route path="/government" element={<ProfileRoute profile="government"><GovernmentDashboard /></ProfileRoute>} />
```

**2. Profile Switching Complexity:**
- ProfileContext manages state
- ProfileSwitcher component in Header
- Each route wrapped in ProfileRoute
- Profile persisted to localStorage
- Navigation items change based on profile

**3. Bundle Size:**
- Both Ketchup and Government code in single bundle
- Unused code loaded for each profile
- Larger initial load time

**4. Deployment:**
- Single Vercel deployment for both portals
- Cannot version independently
- Shared deployment pipeline

**5. Team Conflicts:**
- Ketchup and Government teams work in same codebase
- Merge conflicts on shared components
- Hard to assign ownership

---

## 🏛️ PROPOSED MODULAR ARCHITECTURE

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       SMARTPAY CONNECT                          │
│                    MODULAR ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│  KETCHUP PORTAL     │         │  GOVERNMENT PORTAL  │
│  (Operations)       │         │  (Oversight)        │
├─────────────────────┤         ├─────────────────────┤
│ • Dashboard         │         │ • Compliance        │
│ • Beneficiaries     │         │ • Monitoring        │
│ • Vouchers          │         │ • Audit Reports     │
│ • Distribution      │         │ • Analytics         │
│ • Agents            │         │ • Registry          │
│ • Open Banking      │         │ • Financial Data    │
│ • Reconciliation    │         │ • Alerts            │
└──────────┬──────────┘         └──────────┬──────────┘
           │                               │
           └───────────┬───────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │     SHARED PACKAGES         │
        ├─────────────────────────────┤
        │ • @smartpay/ui              │
        │ • @smartpay/types           │
        │ • @smartpay/api-client      │
        │ • @smartpay/utils           │
        │ • @smartpay/config          │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │      BACKEND API            │
        ├─────────────────────────────┤
        │ • Ketchup Routes (/api/v1)  │
        │ • Gov Routes (/api/v1/gov)  │
        │ • Shared Services           │
        │ • Database (216 tables)     │
        └─────────────────────────────┘
```

### Architecture Principles

**1. Separation of Concerns:**
- Ketchup Portal: Operational tasks (create, update, distribute)
- Government Portal: Oversight tasks (monitor, audit, report)

**2. Shared Packages:**
- UI Components: Reusable across both portals
- Types: Single source of truth
- API Client: Unified backend communication

**3. Independent Deployments:**
- Ketchup: https://ketchup.smartpay-connect.com
- Government: https://gov.smartpay-connect.com
- Backend: https://api.smartpay-connect.com

**4. Unified Backend:**
- Single database
- Shared business logic
- Route segregation by prefix

---

## 📦 MONOREPO STRUCTURE

### Proposed Directory Structure

```
smartpay-connect/                       # Root monorepo
├── apps/                               # Applications
│   ├── ketchup-portal/                 # Ketchup frontend (NEW)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── dashboard/          # Ketchup-specific dashboards
│   │   │   │   ├── distribution/       # Distribution components
│   │   │   │   ├── reconciliation/     # Reconciliation components
│   │   │   │   └── layout/             # Ketchup layout
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Beneficiaries.tsx
│   │   │   │   ├── Vouchers.tsx
│   │   │   │   ├── BatchDistribution.tsx
│   │   │   │   ├── StatusMonitor.tsx
│   │   │   │   ├── WebhookMonitoring.tsx
│   │   │   │   ├── Reconciliation.tsx
│   │   │   │   ├── Agents.tsx
│   │   │   │   ├── Regions.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   └── Reports.tsx
│   │   │   ├── services/               # Ketchup API services
│   │   │   ├── contexts/               # Ketchup-specific contexts
│   │   │   ├── hooks/                  # Ketchup-specific hooks
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── government-portal/              # Government frontend (NEW)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── compliance/         # Compliance widgets
│   │   │   │   ├── audit/              # Audit components
│   │   │   │   ├── analytics/          # Analytics components
│   │   │   │   └── layout/             # Government layout
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Compliance.tsx
│   │   │   │   ├── VoucherMonitoring.tsx
│   │   │   │   ├── BeneficiaryRegistry.tsx
│   │   │   │   ├── AuditReports.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   ├── AgentNetwork.tsx
│   │   │   │   ├── RegionalPerformance.tsx
│   │   │   │   └── Reports.tsx
│   │   │   ├── services/               # Government API services
│   │   │   ├── contexts/               # Government-specific contexts
│   │   │   ├── hooks/                  # Government-specific hooks
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── backend/                        # Backend API (EXISTING - REFACTORED)
│       ├── src/
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── ketchup/        # Ketchup-specific routes (NEW)
│       │   │   │   │   ├── beneficiaries.ts
│       │   │   │   │   ├── vouchers.ts
│       │   │   │   │   ├── distribution.ts
│       │   │   │   │   ├── agents.ts
│       │   │   │   │   ├── reconciliation.ts
│       │   │   │   │   └── webhooks.ts
│       │   │   │   ├── government/     # Government-specific routes (NEW)
│       │   │   │   │   ├── compliance.ts
│       │   │   │   │   ├── monitoring.ts
│       │   │   │   │   ├── audit.ts
│       │   │   │   │   ├── analytics.ts
│       │   │   │   │   └── reports.ts
│       │   │   │   ├── shared/         # Shared routes (NEW)
│       │   │   │   │   ├── dashboard.ts
│       │   │   │   │   ├── statusEvents.ts
│       │   │   │   │   └── openbanking/
│       │   │   │   └── index.ts        # Main router
│       │   │   └── middleware/
│       │   │       ├── auth.ts
│       │   │       ├── ketchupAuth.ts  # Ketchup-specific auth (NEW)
│       │   │       ├── governmentAuth.ts # Gov-specific auth (NEW)
│       │   │       └── rateLimit.ts
│       │   ├── services/               # Business logic (EXISTING)
│       │   ├── database/               # Database layer (EXISTING)
│       │   └── index.ts
│       └── package.json
│
├── packages/                           # Shared packages
│   ├── ui/                             # Shared UI components (NEW)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── MetricCard.tsx
│   │   │   │   ├── StatusBadge.tsx
│   │   │   │   └── ... (50+ components from src/components/ui/)
│   │   │   ├── index.ts
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── types/                          # Shared TypeScript types (NEW)
│   │   ├── src/
│   │   │   ├── beneficiary.ts
│   │   │   ├── voucher.ts
│   │   │   ├── agent.ts
│   │   │   ├── transaction.ts
│   │   │   ├── compliance.ts
│   │   │   ├── openBanking.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api-client/                     # Unified API client (NEW)
│   │   ├── src/
│   │   │   ├── client.ts               # Base HTTP client
│   │   │   ├── ketchup/                # Ketchup API methods
│   │   │   │   ├── beneficiaries.ts
│   │   │   │   ├── vouchers.ts
│   │   │   │   ├── distribution.ts
│   │   │   │   └── agents.ts
│   │   │   ├── government/             # Government API methods
│   │   │   │   ├── compliance.ts
│   │   │   │   ├── monitoring.ts
│   │   │   │   └── analytics.ts
│   │   │   ├── shared/                 # Shared API methods
│   │   │   │   ├── dashboard.ts
│   │   │   │   └── openbanking.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── utils/                          # Shared utilities (NEW)
│   │   ├── src/
│   │   │   ├── formatters.ts           # Currency, date formatters
│   │   │   ├── validators.ts           # Input validation
│   │   │   ├── helpers.ts              # General helpers
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                         # Shared configuration (NEW)
│       ├── src/
│       │   ├── env.ts                  # Environment variables
│       │   ├── constants.ts            # App constants
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                               # Documentation
│   ├── architecture/
│   │   ├── KETCHUP_PORTAL.md
│   │   ├── GOVERNMENT_PORTAL.md
│   │   └── SHARED_PACKAGES.md
│   ├── api/
│   │   ├── KETCHUP_API.md
│   │   └── GOVERNMENT_API.md
│   └── user-flows/
│       ├── KETCHUP_FLOWS.md
│       └── GOVERNMENT_FLOWS.md
│
├── scripts/                            # Build & deployment scripts
│   ├── build-all.sh
│   ├── deploy-ketchup.sh
│   ├── deploy-government.sh
│   └── migrate.sh
│
├── .github/                            # GitHub workflows
│   └── workflows/
│       ├── ketchup-portal.yml
│       ├── government-portal.yml
│       └── backend.yml
│
├── package.json                        # Root package.json (monorepo)
├── pnpm-workspace.yaml                 # PNPM workspace config
├── turbo.json                          # Turborepo config
├── tsconfig.base.json                  # Base TypeScript config
└── README.md                           # Updated README
```

### Package Dependencies

```json
// Root package.json
{
  "name": "smartpay-connect",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "dev:ketchup": "turbo run dev --filter=ketchup-portal",
    "dev:government": "turbo run dev --filter=government-portal",
    "dev:backend": "turbo run dev --filter=backend",
    "build": "turbo run build",
    "build:ketchup": "turbo run build --filter=ketchup-portal",
    "build:government": "turbo run build --filter=government-portal",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^1.13.0",
    "typescript": "^5.8.3"
  }
}
```

---

## 👥 USER FLOWS

### A. KETCHUP PORTAL USER FLOWS

#### Flow 1: Beneficiary Registration & Voucher Distribution

```
┌─────────────────────────────────────────────────────────────────┐
│                  BENEFICIARY REGISTRATION FLOW                  │
└─────────────────────────────────────────────────────────────────┘

Actor: Ketchup Operations Staff

1. LOGIN
   └─► Navigate to: https://ketchup.smartpay-connect.com
       └─► Enter credentials (email + password)
           └─► 2FA verification
               └─► Dashboard

2. VIEW BENEFICIARIES
   └─► Click "Beneficiaries" in sidebar
       └─► View table: 104,582 beneficiaries
           ├─► Filter: Region, Grant Type, Status
           ├─► Sort: Name, Date Added, Region
           └─► Search: ID, Name, Phone

3. ADD NEW BENEFICIARY
   └─► Click "Add Beneficiary" button
       └─► Fill form:
           ├─► Personal Info (Name, ID, Phone)
           ├─► Address (Region, District, Village)
           ├─► Grant Type (BPSIG, OVC, Disability, etc.)
           └─► Verification Documents
       └─► Click "Save"
           └─► Validate data
               └─► Create record in database
                   └─► Success notification

4. CREATE VOUCHER BATCH
   └─► Navigate to "Vouchers" > "Batch Distribution"
       └─► Select distribution criteria:
           ├─► Region: Select multiple
           ├─► Grant Type: Select type
           ├─► Amount: N$XXX per voucher
           └─► Month: January 2026
       └─► Preview batch:
           ├─► Total beneficiaries: 15,234
           ├─► Total amount: N$15,234,000
           └─► Distribution date: Feb 1, 2026
       └─► Click "Create Batch"
           └─► Generate 15,234 unique voucher codes
               └─► Link to beneficiaries
                   └─► Update status: "Pending"
                       └─► Send to Buffr API for distribution

5. MONITOR DISTRIBUTION
   └─► Navigate to "Status Monitor"
       └─► View real-time status:
           ├─► Pending: 1,234 vouchers
           ├─► Processing: 8,000 vouchers
           ├─► Distributed: 5,500 vouchers
           └─► Failed: 500 vouchers (view details)
       └─► Click "Failed" vouchers
           └─► View error reasons
               └─► Retry individually or in bulk

6. WEBHOOK MONITORING
   └─► Navigate to "Webhook Monitoring"
       └─► View incoming webhooks from Buffr
           ├─► Status updates
           ├─► Redemption notifications
           └─► Error reports
       └─► Filter by status, date, event type

7. RECONCILIATION
   └─► Navigate to "Reconciliation"
       └─► Select date range
           └─► View reconciliation summary:
               ├─► Total distributed: N$15,234,000
               ├─► Total redeemed: N$14,500,000
               ├─► Outstanding: N$734,000
               └─► Discrepancies: 23 records
           └─► Export report (CSV/PDF)
               └─► Submit to Ministry of Finance
```

#### Flow 2: Agent Network Management

```
┌─────────────────────────────────────────────────────────────────┐
│                  AGENT NETWORK MANAGEMENT FLOW                  │
└─────────────────────────────────────────────────────────────────┘

Actor: Ketchup Operations Manager

1. VIEW AGENT NETWORK
   └─► Navigate to "Agent Network"
       └─► View map: 487 agents across Namibia
           ├─► Filter by region
           ├─► Filter by status (Active/Inactive)
           └─► Color-coded by liquidity level

2. VIEW AGENT DETAILS
   └─► Click on agent marker/row
       └─► View agent profile:
           ├─► Basic Info (Name, Location, Contact)
           ├─► Performance Metrics
           │   ├─► Transactions processed: 1,234
           │   ├─► Success rate: 98.5%
           │   └─► Average processing time: 3.2 min
           ├─► Liquidity Status
           │   ├─► Current balance: N$250,000
           │   ├─► Reserved: N$50,000
           │   └─► Available: N$200,000
           └─► Recent Transactions (last 10)

3. ADD NEW AGENT
   └─► Click "Add Agent" button
       └─► Fill registration form:
           ├─► Business Info
           ├─► Owner Details
           ├─► Bank Account
           ├─► Location
           └─► Upload documents
       └─► Submit for approval
           └─► Review by compliance team
               └─► Activate agent

4. MANAGE AGENT LIQUIDITY
   └─► Select agent
       └─► View liquidity dashboard
           └─► Options:
               ├─► Fund agent (add liquidity)
               ├─► Withdraw funds
               └─► Set liquidity alerts
       └─► Click "Fund Agent"
           └─► Enter amount: N$500,000
               └─► Select funding source
                   └─► Confirm transfer
                       └─► Update balance real-time

5. MONITOR AGENT PERFORMANCE
   └─► Navigate to "Agent Network" > "Analytics"
       └─► View performance dashboard:
           ├─► Top 10 agents by volume
           ├─► Regional performance comparison
           ├─► Transaction success rates
           └─► Agent liquidity trends
       └─► Export report for management review
```

#### Flow 3: Open Banking Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                 OPEN BANKING INTEGRATION FLOW                   │
└─────────────────────────────────────────────────────────────────┘

Actor: Beneficiary (end user)

1. INITIATE CONSENT
   └─► Beneficiary visits Ketchup portal
       └─► Navigate to "Open Banking" section
           └─► Click "Connect Bank Account"
               └─► Redirect to OAuth consent page
                   ├─► Select bank (FNB, Standard Bank, etc.)
                   ├─► Login to bank
                   └─► Authorize SmartPay to:
                       ├─► View account balances
                       ├─► View transaction history
                       └─► Initiate payments

2. VIEW CONNECTED ACCOUNTS
   └─► Return to SmartPay portal
       └─► Navigate to "My Accounts"
           └─► View all connected accounts:
               ├─► Bank 1: Savings Account (Balance: N$5,234)
               ├─► Bank 2: Current Account (Balance: N$1,890)
               └─► SmartPay E-Wallet (Balance: N$750)

3. INITIATE PAYMENT
   └─► Navigate to "Send Payment"
       └─► Fill payment form:
           ├─► From: Select account
           ├─► To: Enter beneficiary details
           ├─► Amount: N$500
           └─► Reference: "Voucher redemption"
       └─► Review payment
           └─► Confirm with 2FA (SMS OTP)
               └─► Payment initiated
                   └─► Status: "Processing"
                       └─► Webhook notification when completed

4. MANAGE CONSENTS
   └─► Navigate to "Manage Consents"
       └─► View all active consents:
           ├─► Bank 1: AIS (Expires: Dec 31, 2026)
           ├─► Bank 2: PIS (Expires: Jun 30, 2026)
           └─► TPP Provider X (Expires: Mar 15, 2026)
       └─► Options:
           ├─► Revoke consent
           ├─► Extend consent
           └─► View consent history
```

---

### B. GOVERNMENT PORTAL USER FLOWS

#### Flow 1: Compliance Monitoring & Reporting

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPLIANCE MONITORING & REPORTING FLOW             │
└─────────────────────────────────────────────────────────────────┘

Actor: Ministry of Finance Compliance Officer

1. LOGIN
   └─► Navigate to: https://gov.smartpay-connect.com
       └─► Enter government credentials
           └─► Multi-factor authentication (MFA)
               └─► Government Dashboard

2. VIEW COMPLIANCE DASHBOARD
   └─► Dashboard displays:
       ├─► Overall Compliance Score: 98.5%
       ├─► PSD-1 Status: ✅ Compliant
       ├─► PSD-3 Status: ✅ Compliant (Trust: 100%)
       ├─► PSD-12 Status: ✅ Compliant (Uptime: 99.92%)
       └─► Open Incidents: 2 (view details)

3. MONITOR TRUST ACCOUNT COMPLIANCE
   └─► Click "Compliance Overview" > "Trust Account"
       └─► View detailed metrics:
           ├─► Total E-Money Issued: N$1,234,567,890
           ├─► Trust Account Balance: N$1,234,567,890
           ├─► Coverage Ratio: 100.00%
           ├─► Last Reconciliation: Today 00:05 AM
           └─► Status: ✅ COMPLIANT
       └─► View reconciliation history (30 days)
           ├─► Chart: Daily coverage ratio
           └─► Table: Daily reconciliation records

4. REVIEW CAPITAL REQUIREMENTS
   └─► Navigate to "Compliance Overview" > "Capital"
       └─► View metrics:
           ├─► Initial Capital: N$1,500,000 (Required)
           ├─► Current Capital: N$2,150,000 ✅
           ├─► 6-Month Avg Liabilities: N$1,200,000,000
           ├─► Required Capital (2%): N$24,000,000
           └─► Capital Held: N$28,000,000 ✅
       └─► Status: ✅ COMPLIANT

5. MONITOR SYSTEM UPTIME
   └─► Navigate to "Compliance Overview" > "System Health"
       └─► View uptime dashboard:
           ├─► Current Month Uptime: 99.92%
           ├─► Target: 99.90% ✅
           ├─► Total Downtime: 3.2 hours
           ├─► Last Incident: Jan 15, 2026 (15 min)
           └─► Chart: 30-day uptime trend
       └─► View incident log
           └─► Filter by severity, date, service

6. REVIEW CYBERSECURITY INCIDENTS
   └─► Navigate to "Compliance Overview" > "Incidents"
       └─► View incident dashboard:
           ├─► Open Incidents: 2
           ├─► Resolved (24h): 15
           ├─► Pending BoN Reports: 1
           └─► Average Resolution Time: 4.5 hours
       └─► Click on incident
           └─► View incident details:
               ├─► Severity: Medium
               ├─► Type: Unauthorized access attempt
               ├─► Date: Jan 28, 2026 14:30
               ├─► Status: Under Investigation
               ├─► Preliminary Report: Sent to BoN ✅
               └─► Action Plan: Implement additional monitoring

7. GENERATE BoN MONTHLY REPORT
   └─► Navigate to "Reports" > "Bank of Namibia"
       └─► Select report type: "Monthly Report"
           └─► Select month: January 2026
               └─► Preview report:
                   ├─► E-Money Statistics
                   ├─► Trust Account Status
                   ├─► Capital Compliance
                   ├─► System Uptime
                   ├─► Incident Summary
                   └─► Agent Network Stats
               └─► Generate PDF/Excel
                   └─► Download
                       └─► Submit to: assessments.npsd@bon.com.na
```

#### Flow 2: Voucher Distribution Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│             VOUCHER DISTRIBUTION MONITORING FLOW                │
└─────────────────────────────────────────────────────────────────┘

Actor: Ministry of Finance Program Manager

1. VIEW DISTRIBUTION OVERVIEW
   └─► Navigate to "Voucher Monitoring"
       └─► View summary dashboard:
           ├─► Total Vouchers (Month): 104,582
           ├─► Total Value: N$104,582,000
           ├─► Distributed: 102,345 (97.9%)
           ├─► Redeemed: 98,234 (93.9%)
           ├─► Pending: 2,237 (2.1%)
           └─► Failed: 1,345 (1.3%)

2. DRILL DOWN BY REGION
   └─► Click on region filter
       └─► Select "Khomas Region"
           └─► View regional metrics:
               ├─► Total Vouchers: 25,345
               ├─► Distribution Rate: 99.2%
               ├─► Redemption Rate: 95.8%
               └─► Average Redemption Time: 3.2 days
           └─► View agent performance in region
               ├─► Top 5 agents by volume
               └─► Agents with issues (low success rate)

3. ANALYZE FAILED DISTRIBUTIONS
   └─► Click "Failed Distributions" tab
       └─► View failure reasons:
           ├─► Invalid Phone Number: 678 (50.4%)
           ├─► Network Error: 345 (25.7%)
           ├─► Beneficiary Not Found: 234 (17.4%)
           └─► Other: 88 (6.5%)
       └─► Export failure list
           └─► Share with Ketchup operations for resolution

4. MONITOR REDEMPTION PATTERNS
   └─► Navigate to "Analytics" tab
       └─► View redemption analytics:
           ├─► Peak redemption times
           ├─► Average time to redemption
           ├─► Redemption by grant type
           └─► Geographic redemption heatmap
       └─► Identify trends and anomalies
           └─► Flag suspicious patterns for audit

5. SET UP ALERTS
   └─► Navigate to "Settings" > "Alerts"
       └─► Configure alert rules:
           ├─► Distribution rate < 95% (notify immediately)
           ├─► Failed distributions > 1000 (daily digest)
           ├─► Large redemptions > N$50,000 (real-time)
           └─► Agent success rate < 90% (weekly report)
       └─► Set notification channels:
           ├─► Email: compliance@finance.gov.na
           ├─► SMS: +264 XX XXX XXXX
           └─► Dashboard notifications
```

#### Flow 3: Audit & Financial Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                AUDIT & FINANCIAL ANALYTICS FLOW                 │
└─────────────────────────────────────────────────────────────────┘

Actor: Government Auditor

1. ACCESS AUDIT DASHBOARD
   └─► Navigate to "Audit Reports"
       └─► View audit summary:
           ├─► Last Audit: Jan 20, 2026
           ├─► Next Scheduled: Feb 20, 2026
           ├─► Open Findings: 3 (Medium priority)
           └─► Resolved Findings: 47 (last 6 months)

2. PERFORM BENEFICIARY REGISTRY AUDIT
   └─► Click "Beneficiary Registry Audit"
       └─► Run automated checks:
           ├─► Duplicate Entries: 12 found ⚠️
           ├─► Invalid IDs: 5 found ⚠️
           ├─► Missing Information: 234 records ⚠️
           └─► Inactive Beneficiaries: 1,567 (review)
       └─► Generate audit report
           └─► Assign to Ketchup for remediation
               └─► Track resolution progress

3. REVIEW FINANCIAL ANALYTICS
   └─► Navigate to "Financial Analytics"
       └─► View comprehensive dashboard:
           ├─► Monthly Spend Trend (12 months)
           │   └─► Chart: Line graph of spend over time
           ├─► Spend by Grant Type
           │   ├─► BPSIG: N$45M (43%)
           │   ├─► OVC: N$28M (27%)
           │   ├─► Disability: N$18M (17%)
           │   └─► Veterans: N$14M (13%)
           ├─► Spend by Region
           │   └─► Choropleth map with spend intensity
           ├─► Efficiency Metrics
           │   ├─► Cost per distribution: N$2.50
           │   ├─► Admin overhead: 1.8%
           │   └─► Redemption rate: 93.9%
           └─► Projections
               ├─► Next month forecast: N$108M
               └─► Annual budget utilization: 87.3%

4. CONDUCT TRANSACTION AUDIT
   └─► Navigate to "Audit Reports" > "Transaction Audit"
       └─► Set audit parameters:
           ├─► Date Range: Jan 1 - Jan 31, 2026
           ├─► Amount Threshold: > N$10,000
           └─► Status: All
       └─► Run audit
           └─► Review flagged transactions:
               ├─► Large transactions: 234 (review)
               ├─► Duplicate transactions: 5 (investigate)
               ├─► Suspicious patterns: 2 (escalate)
               └─► Failed transactions: 1,345 (categorize)
       └─► Drill down into flagged items
           └─► View full transaction history
               └─► Mark as "Reviewed" or "Requires Action"

5. EXPORT AUDIT REPORTS
   └─► Select report type:
       ├─► Beneficiary Registry Audit
       ├─► Financial Summary
       ├─► Transaction Audit
       └─► Compliance Audit
   └─► Select format: PDF / Excel / CSV
       └─► Add report comments
           └─► Generate & download
               └─► Archive in document management system
```

#### Flow 4: Agent Network Oversight

```
┌─────────────────────────────────────────────────────────────────┐
│                 AGENT NETWORK OVERSIGHT FLOW                    │
└─────────────────────────────────────────────────────────────────┘

Actor: Ministry of Finance Agent Oversight Officer

1. VIEW AGENT NETWORK STATUS
   └─► Navigate to "Agent Network Status"
       └─► View network overview:
           ├─► Total Agents: 487
           ├─► Active: 456 (93.6%)
           ├─► Inactive: 31 (6.4%)
           ├─► Under Review: 5 (1.0%)
           └─► Suspended: 2 (0.4%)

2. MONITOR AGENT PERFORMANCE
   └─► Click on "Performance Dashboard"
       └─► View agent performance metrics:
           ├─► Top Performers (by volume)
           │   └─► Table: Top 20 agents
           ├─► Bottom Performers (by success rate)
           │   └─► Table: Bottom 20 agents (flag for review)
           ├─► Regional Performance
           │   └─► Map: Color-coded by avg success rate
           └─► Performance Trends (6 months)
               └─► Chart: Network-wide success rate over time

3. REVIEW AGENT COMPLIANCE
   └─► Navigate to "Agent Compliance"
       └─► View compliance dashboard:
           ├─► Annual Returns Submitted: 485 / 487 ✅
           ├─► Missing Returns: 2 ⚠️ (send reminder)
           ├─► License Renewals Due: 12 (next 30 days)
           └─► Compliance Score: 97.8%
       └─► Click on non-compliant agent
           └─► View agent compliance details
               ├─► Missing documents
               ├─► Overdue submissions
               └─► Action required
           └─► Send compliance notice
               └─► Set follow-up reminder

4. INVESTIGATE AGENT ISSUES
   └─► Navigate to "Agent Network Status" > "Under Review"
       └─► View agents flagged for review:
           ├─► Agent 234: Multiple failed transactions
           ├─► Agent 456: Unusual transaction patterns
           └─► Agent 789: Customer complaints
       └─► Click on agent
           └─► View investigation dashboard:
               ├─► Transaction history (last 3 months)
               ├─► Complaint log
               ├─► Financial records
               └─► Communication log
           └─► Add investigation notes
               └─► Make decision:
                   ├─► Clear and reactivate
                   ├─► Request additional info
                   ├─► Suspend pending investigation
                   └─► Terminate contract

5. GENERATE AGENT NETWORK REPORTS
   └─► Navigate to "Reports" > "Agent Network"
       └─► Select report type:
           ├─► Monthly Agent Performance
           ├─► Agent Compliance Summary
           ├─► Regional Network Status
           └─► Annual Agent Returns (for BoN)
       └─► Select date range
           └─► Generate report
               └─► Preview
                   └─► Download PDF/Excel
                       └─► Share with stakeholders
```

---

## 📐 WIREFRAMES & ARCHITECTURE DIAGRAMS

### System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          SMARTPAY CONNECT ARCHITECTURE                        │
└───────────────────────────────────────────────────────────────────────────────┘

                                  INTERNET
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│  KETCHUP USER │          │  GOVT USER    │          │  BENEFICIARY  │
│  (Operations) │          │  (Oversight)  │          │  (End User)   │
└───────┬───────┘          └───────┬───────┘          └───────┬───────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE NETWORK                         │
├─────────────────────────────────────────────────────────────────────┤
│  DNS Routing & SSL Termination                                     │
└─────────────────────────────────────────────────────────────────────┘
        │                          │                          │
        ▼                          ▼                          ▼
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│ KETCHUP PORTAL  │      │ GOVERNMENT PORTAL│      │  PUBLIC PORTAL  │
│                 │      │                  │      │                 │
│ ketchup.smart-  │      │ gov.smartpay-    │      │ pay.smartpay-   │
│ pay-connect.com │      │ connect.com      │      │ connect.com     │
├─────────────────┤      ├──────────────────┤      ├─────────────────┤
│ • Dashboard     │      │ • Compliance     │      │ • Redeem Voucher│
│ • Beneficiaries │      │ • Monitoring     │      │ • Check Balance │
│ • Vouchers      │      │ • Audit          │      │ • Open Banking  │
│ • Distribution  │      │ • Analytics      │      │ • Support       │
│ • Agents        │      │ • Reports        │      └─────────────────┘
│ • Reconciliation│      │ • Alerts         │
└────────┬────────┘      └────────┬─────────┘
         │                        │
         │                        │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   SHARED PACKAGES      │
         ├────────────────────────┤
         │ • @smartpay/ui         │
         │ • @smartpay/types      │
         │ • @smartpay/api-client │
         │ • @smartpay/utils      │
         │ • @smartpay/config     │
         └────────────┬───────────┘
                      │
                      ▼
         ┌────────────────────────────────────┐
         │         BACKEND API                │
         │  api.smartpay-connect.com          │
         ├────────────────────────────────────┤
         │  Node.js + Express + TypeScript    │
         ├────────────────────────────────────┤
         │  API Routes:                       │
         │  • /api/v1/ketchup/*               │
         │  • /api/v1/government/*            │
         │  • /api/v1/shared/*                │
         │  • /api/v1/open-banking/*          │
         └────────────┬───────────────────────┘
                      │
         ┌────────────┴───────────┐
         │                        │
         ▼                        ▼
┌────────────────┐      ┌──────────────────┐
│ NEON POSTGRES  │      │  EXTERNAL APIs   │
│                │      │                  │
│ • 216 Tables   │      │ • Buffr API      │
│ • Serverless   │      │ • Bank APIs      │
│ • Auto-scaling │      │ • SMS Gateway    │
│ • SSL/TLS      │      │ • Email Service  │
└────────────────┘      └──────────────────┘
```

### Data Flow Diagram

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                       VOUCHER DISTRIBUTION DATA FLOW                          │
└───────────────────────────────────────────────────────────────────────────────┘

1. CREATE BATCH
   ┌─────────────────┐
   │ Ketchup Staff   │
   │ (Browser)       │
   └────────┬────────┘
            │ POST /api/v1/ketchup/distribution/batch
            │ { region, grantType, amount, beneficiaryIds[] }
            ▼
   ┌─────────────────┐
   │ Backend API     │
   │ DistributionSvc │
   └────────┬────────┘
            │ 1. Validate input
            │ 2. Generate voucher codes (15,234)
            │ 3. Create voucher records
            │ 4. Link to beneficiaries
            ▼
   ┌─────────────────┐
   │ Neon Database   │
   │ vouchers table  │
   └────────┬────────┘
            │ Return batch_id
            ▼
   ┌─────────────────┐
   │ Backend API     │
   │ BuffrAPIClient  │
   └────────┬────────┘
            │ POST to Buffr API
            │ { batchId, vouchers[] }
            ▼
   ┌─────────────────┐
   │ Buffr API       │
   │ (External)      │
   └────────┬────────┘
            │ Process distribution
            │ Update status: "Processing"
            ▼

2. DISTRIBUTION STATUS UPDATES (Webhooks)
   ┌─────────────────┐
   │ Buffr API       │
   │ (External)      │
   └────────┬────────┘
            │ POST /api/v1/webhooks/buffr
            │ { voucherId, status, timestamp }
            ▼
   ┌─────────────────┐
   │ Backend API     │
   │ WebhookService  │
   └────────┬────────┘
            │ 1. Verify signature
            │ 2. Parse payload
            │ 3. Update voucher status
            ▼
   ┌─────────────────┐
   │ Neon Database   │
   │ vouchers,       │
   │ webhook_events  │
   └────────┬────────┘
            │ Status: "Distributed"
            ▼
   ┌─────────────────┐
   │ Status Monitor  │
   │ (Real-time UI)  │
   └─────────────────┘
            │ WebSocket update
            ▼
   ┌─────────────────┐
   │ Ketchup Staff   │
   │ (Dashboard)     │
   └─────────────────┘

3. GOVERNMENT MONITORING
   ┌─────────────────┐
   │ Govt Officer    │
   │ (Browser)       │
   └────────┬────────┘
            │ GET /api/v1/government/monitoring/vouchers
            │ ?batchId=xxx
            ▼
   ┌─────────────────┐
   │ Backend API     │
   │ MonitoringSvc   │
   └────────┬────────┘
            │ Query vouchers
            ▼
   ┌─────────────────┐
   │ Neon Database   │
   │ Read-only view  │
   └────────┬────────┘
            │ Return aggregated stats
            ▼
   ┌─────────────────┐
   │ Government      │
   │ Dashboard       │
   └─────────────────┘
```

### Component Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                       KETCHUP PORTAL COMPONENT TREE                           │
└───────────────────────────────────────────────────────────────────────────────┘

App
└── Router
    ├── Layout
    │   ├── Header
    │   │   ├── Logo
    │   │   ├── Search
    │   │   ├── Notifications
    │   │   └── UserMenu
    │   ├── Sidebar
    │   │   ├── NavItem (Dashboard)
    │   │   ├── NavItem (Beneficiaries)
    │   │   ├── NavItem (Vouchers)
    │   │   ├── NavItem (Distribution)
    │   │   ├── NavItem (Agents)
    │   │   ├── NavItem (Reconciliation)
    │   │   └── NavItem (Analytics)
    │   └── Main Content
    │       └── Routes
    │           ├── Dashboard Page
    │           │   ├── MetricCard (Beneficiaries)
    │           │   ├── MetricCard (Vouchers)
    │           │   ├── MetricCard (Distribution)
    │           │   ├── MonthlyTrendChart
    │           │   ├── VoucherStatusChart
    │           │   ├── RegionalMap
    │           │   ├── RecentVouchers
    │           │   ├── AgentNetworkHealth
    │           │   └── LiveActivityFeed
    │           ├── Beneficiaries Page
    │           │   ├── BeneficiaryTable
    │           │   │   ├── DataTable (@smartpay/ui)
    │           │   │   ├── Filters
    │           │   │   ├── Search
    │           │   │   └── Pagination
    │           │   ├── AddBeneficiaryDialog
    │           │   └── BeneficiaryDetailsSheet
    │           ├── Vouchers Page
    │           │   ├── VoucherTable
    │           │   ├── VoucherFilters
    │           │   └── VoucherActions
    │           ├── Distribution Page
    │           │   ├── CreateBatchForm
    │           │   │   ├── RegionSelect
    │           │   │   ├── GrantTypeSelect
    │           │   │   ├── AmountInput
    │           │   │   └── BeneficiarySelector
    │           │   ├── BatchPreview
    │           │   └── DistributionHistory
    │           ├── Status Monitor Page
    │           │   ├── StatusOverview
    │           │   ├── RealtimeStatusChart
    │           │   ├── FailedVouchersTable
    │           │   └── RetryActions
    │           ├── Webhook Monitoring Page
    │           │   ├── WebhookEventStream
    │           │   ├── WebhookFilters
    │           │   └── WebhookDetails
    │           ├── Reconciliation Page
    │           │   ├── ReconciliationSummary
    │           │   ├── DiscrepancyTable
    │           │   └── ExportReport
    │           ├── Agents Page
    │           │   ├── AgentMap
    │           │   ├── AgentList
    │           │   ├── AgentDetailsPanel
    │           │   └── LiquidityManagement
    │           └── Analytics Page
    │               ├── SpendChart
    │               ├── RegionalPerformance
    │               ├── EfficiencyMetrics
    │               └── ExportDashboard

┌───────────────────────────────────────────────────────────────────────────────┐
│                    GOVERNMENT PORTAL COMPONENT TREE                           │
└───────────────────────────────────────────────────────────────────────────────┘

App
└── Router
    ├── Layout
    │   ├── Header (Government Branding)
    │   ├── Sidebar (Government Nav)
    │   └── Main Content
    │       └── Routes
    │           ├── Dashboard Page
    │           │   ├── ComplianceScoreCard
    │           │   ├── SystemHealthCard
    │           │   ├── AlertsPanel
    │           │   └── QuickStats
    │           ├── Compliance Overview Page
    │           │   ├── PSD1Compliance
    │           │   ├── PSD3Compliance
    │           │   │   ├── TrustAccountStatus
    │           │   │   ├── CapitalRequirements
    │           │   │   └── DormantWallets
    │           │   ├── PSD12Compliance
    │           │   │   ├── SystemUptime
    │           │   │   ├── TwoFactorAuth
    │           │   │   └── IncidentLog
    │           │   └── ComplianceTimeline
    │           ├── Voucher Monitoring Page
    │           │   ├── DistributionOverview
    │           │   ├── RegionalBreakdown
    │           │   ├── FailureAnalysis
    │           │   └── RedemptionAnalytics
    │           ├── Beneficiary Registry Page
    │           │   ├── RegistryStats
    │           │   ├── BeneficiarySearch
    │           │   └── DataQualityReport
    │           ├── Audit Reports Page
    │           │   ├── AuditDashboard
    │           │   ├── BeneficiaryAudit
    │           │   ├── TransactionAudit
    │           │   ├── FinancialAudit
    │           │   └── ComplianceAudit
    │           ├── Financial Analytics Page
    │           │   ├── SpendTrend
    │           │   ├── BudgetUtilization
    │           │   ├── GrantTypeBreakdown
    │           │   ├── RegionalSpend
    │           │   └── Projections
    │           ├── Agent Network Status Page
    │           │   ├── NetworkOverview
    │           │   ├── PerformanceDashboard
    │           │   ├── ComplianceTracking
    │           │   └── IssuesManagement
    │           ├── Regional Performance Page
    │           │   ├── RegionalComparison
    │           │   ├── PerformanceMap
    │           │   └── RegionalDrilldown
    │           └── Reports Page
    │               ├── ReportLibrary
    │               ├── GenerateReport
    │               └── ScheduledReports
```

### Database Schema (Key Tables)

```sql
-- Core Business Tables
beneficiaries (104,582 records)
├── id (PK)
├── national_id (UNIQUE)
├── name
├── phone
├── region
├── grant_type
├── status
└── created_at

vouchers
├── id (PK)
├── voucher_code (UNIQUE)
├── beneficiary_id (FK)
├── batch_id (FK)
├── amount
├── status (pending/distributed/redeemed/expired)
├── distribution_date
├── redemption_date
└── agent_id (FK, nullable)

agents (487 records)
├── id (PK)
├── name
├── location
├── region
├── status
├── liquidity_balance
├── success_rate
└── created_at

-- PSD Compliance Tables
trust_account_reconciliation
├── id (PK)
├── reconciliation_date
├── e_money_issued
├── trust_account_balance
├── coverage_ratio
├── status
└── created_at

capital_requirements_tracking
├── id (PK)
├── check_date
├── initial_capital
├── current_capital
├── avg_outstanding_liabilities
├── required_capital
├── status
└── created_at

system_uptime_logs
├── id (PK)
├── timestamp
├── service_name
├── status (up/down)
├── response_time
└── error_message

cybersecurity_incidents
├── id (PK)
├── incident_date
├── severity
├── type
├── description
├── preliminary_report_sent
├── bon_notified_at
├── status
└── resolution_date

-- Open Banking Tables
oauth_clients (TPPs)
├── client_id (PK)
├── client_secret
├── name
├── redirect_uris
└── scopes

consents
├── id (PK)
├── user_id (FK)
├── client_id (FK)
├── scope
├── status
├── granted_at
├── expires_at
└── revoked_at

accounts
├── id (PK)
├── user_id (FK)
├── account_type
├── balance
└── currency

payment_initiations
├── id (PK)
├── consent_id (FK)
├── from_account_id (FK)
├── to_account_id (FK)
├── amount
├── status
└── created_at
```

---

## 🚀 MIGRATION STRATEGY

### Phase 1: Setup Monorepo (Week 1-2)

**Tasks:**
1. Initialize monorepo structure
   ```bash
   # Create new directory structure
   mkdir -p apps/{ketchup-portal,government-portal}
   mkdir -p packages/{ui,types,api-client,utils,config}
   ```

2. Configure workspace manager (PNPM or Yarn Workspaces)
   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

3. Setup Turborepo for build orchestration
   ```json
   {
     "pipeline": {
       "build": {
         "dependsOn": ["^build"],
         "outputs": ["dist/**"]
       },
       "dev": {
         "cache": false
       }
     }
   }
   ```

4. Configure shared TypeScript config
   ```json
   // tsconfig.base.json
   {
     "compilerOptions": {
       "target": "ES2022",
       "lib": ["ES2022", "DOM"],
       "jsx": "react-jsx",
       "module": "ESNext",
       "moduleResolution": "bundler",
       "paths": {
         "@smartpay/ui": ["./packages/ui/src"],
         "@smartpay/types": ["./packages/types/src"],
         "@smartpay/api-client": ["./packages/api-client/src"],
         "@smartpay/utils": ["./packages/utils/src"],
         "@smartpay/config": ["./packages/config/src"]
       }
     }
   }
   ```

**Deliverables:**
- ✅ Monorepo structure created
- ✅ Workspace manager configured
- ✅ Build system (Turborepo) setup
- ✅ Shared configs in place

---

### Phase 2: Extract Shared Packages (Week 2-3)

**Tasks:**

**2.1 Create @smartpay/ui Package:**
```bash
# Move UI components from src/components/ui/ to packages/ui/
mv src/components/ui/* packages/ui/src/components/

# Update package.json
{
  "name": "@smartpay/ui",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/components/button.tsx",
    "./card": "./src/components/card.tsx"
  }
}
```

**2.2 Create @smartpay/types Package:**
```bash
# Move types from src/types/ and shared/types/
mkdir -p packages/types/src
mv src/types/* packages/types/src/
mv shared/types/* packages/types/src/

# Create index.ts with all exports
```

**2.3 Create @smartpay/api-client Package:**
```bash
# Extract API service logic
mkdir -p packages/api-client/src/{client,ketchup,government,shared}

# Create base HTTP client
# Move service methods from src/services/
```

**2.4 Create @smartpay/utils Package:**
```bash
# Extract utility functions
mkdir -p packages/utils/src
# Move formatters, validators, helpers
```

**Deliverables:**
- ✅ @smartpay/ui package with 50+ components
- ✅ @smartpay/types package with all types
- ✅ @smartpay/api-client package with unified client
- ✅ @smartpay/utils package with helpers
- ✅ All packages building successfully

---

### Phase 3: Create Ketchup Portal (Week 3-4)

**Tasks:**

**3.1 Initialize Ketchup Portal:**
```bash
cd apps/ketchup-portal
npm create vite@latest . -- --template react-ts
```

**3.2 Copy Ketchup-specific code:**
```bash
# Copy pages
cp ../../src/pages/Index.tsx src/pages/Dashboard.tsx
cp ../../src/pages/Beneficiaries.tsx src/pages/
cp ../../src/pages/Vouchers.tsx src/pages/
# ... copy all Ketchup pages

# Copy components
cp -r ../../src/components/dashboard src/components/
# ... copy Ketchup-specific components

# Copy services
cp -r ../../src/services/* src/services/
```

**3.3 Update imports to use shared packages:**
```typescript
// Before
import { Button } from '@/components/ui/button';
import { Beneficiary } from '@/types';

// After
import { Button } from '@smartpay/ui';
import { Beneficiary } from '@smartpay/types';
```

**3.4 Remove ProfileContext and ProfileRoute:**
- No more profile switching
- Direct routing
- Simplified App.tsx

**3.5 Update branding:**
- Ketchup-specific logo
- Ketchup color scheme
- Ketchup branding in Header/Sidebar

**Deliverables:**
- ✅ Ketchup portal fully functional
- ✅ All Ketchup pages working
- ✅ Using shared packages
- ✅ Independent from Government portal

---

### Phase 4: Create Government Portal (Week 4-5)

**Tasks:**

**4.1 Initialize Government Portal:**
```bash
cd apps/government-portal
npm create vite@latest . -- --template react-ts
```

**4.2 Copy Government-specific code:**
```bash
# Copy pages from src/pages/government/
cp ../../src/pages/government/GovernmentDashboard.tsx src/pages/Dashboard.tsx
cp ../../src/pages/government/GovernmentCompliance.tsx src/pages/Compliance.tsx
# ... copy all Government pages

# Create Government-specific components
# Compliance widgets, audit components, etc.
```

**4.3 Update imports to use shared packages:**
```typescript
import { Card, Button } from '@smartpay/ui';
import { ComplianceMetrics } from '@smartpay/types';
import { complianceAPI } from '@smartpay/api-client';
```

**4.4 Update branding:**
- Government logo (Namibia coat of arms)
- Government color scheme (official colors)
- "Ministry of Finance" branding

**Deliverables:**
- ✅ Government portal fully functional
- ✅ All Government pages working
- ✅ Using shared packages
- ✅ Independent from Ketchup portal

---

### Phase 5: Refactor Backend API Routes (Week 5-6)

**Tasks:**

**5.1 Segregate routes by prefix:**
```
/api/v1/ketchup/*      - Ketchup-specific routes
/api/v1/government/*   - Government-specific routes
/api/v1/shared/*       - Shared routes (dashboard, etc.)
/api/v1/open-banking/* - Open Banking routes
```

**5.2 Implement route-level authentication:**
```typescript
// Ketchup routes
router.use('/api/v1/ketchup', ketchupAuth, ketchupRoutes);

// Government routes
router.use('/api/v1/government', governmentAuth, governmentRoutes);
```

**5.3 Separate database access patterns:**
- Ketchup: Full CRUD operations
- Government: Read-only views (mostly)
- Audit logging for Government access

**5.4 Create API documentation:**
- Ketchup API docs: `/docs/api/KETCHUP_API.md`
- Government API docs: `/docs/api/GOVERNMENT_API.md`

**Deliverables:**
- ✅ Backend routes segregated
- ✅ Route-level authentication
- ✅ API documentation updated
- ✅ Both portals using correct endpoints

---

### Phase 6: Setup Independent Deployments (Week 6-7)

**Tasks:**

**6.1 Create Vercel projects:**
```bash
# Ketchup Portal
vercel --name=smartpay-ketchup-portal

# Government Portal
vercel --name=smartpay-government-portal

# Backend API
vercel --name=smartpay-backend-api
```

**6.2 Configure custom domains:**
- Ketchup: https://ketchup.smartpay-connect.com
- Government: https://gov.smartpay-connect.com
- Backend: https://api.smartpay-connect.com

**6.3 Setup environment variables:**
```env
# Ketchup Portal
VITE_API_URL=https://api.smartpay-connect.com/api/v1/ketchup
VITE_APP_NAME=Ketchup SmartPay

# Government Portal
VITE_API_URL=https://api.smartpay-connect.com/api/v1/government
VITE_APP_NAME=Ministry of Finance Portal

# Backend
DATABASE_URL=...
KETCHUP_API_KEY=...
GOVERNMENT_API_KEY=...
```

**6.4 Setup CI/CD pipelines:**
```yaml
# .github/workflows/ketchup-portal.yml
name: Deploy Ketchup Portal
on:
  push:
    branches: [main]
    paths:
      - 'apps/ketchup-portal/**'
      - 'packages/**'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm build --filter=ketchup-portal
      - uses: amondnet/vercel-action@v25
```

**Deliverables:**
- ✅ 3 Vercel projects created
- ✅ Custom domains configured
- ✅ Environment variables set
- ✅ CI/CD pipelines working

---

### Phase 7: Testing & Validation (Week 7-8)

**Tasks:**

**7.1 Functional Testing:**
- Test all Ketchup flows end-to-end
- Test all Government flows end-to-end
- Verify API segregation working
- Test Open Banking integration

**7.2 Performance Testing:**
- Measure bundle sizes (should be smaller)
- Test load times
- Verify caching working
- Test concurrent users

**7.3 Security Testing:**
- Verify route-level authentication
- Test CORS configuration
- Audit API access patterns
- Verify government access is read-only

**7.4 User Acceptance Testing:**
- Ketchup team tests their portal
- Government team tests their portal
- Collect feedback
- Make final adjustments

**Deliverables:**
- ✅ All tests passing
- ✅ Performance metrics improved
- ✅ Security verified
- ✅ User feedback incorporated

---

### Phase 8: Documentation & Training (Week 8)

**Tasks:**

**8.1 Update documentation:**
- README.md with new structure
- Architecture diagrams
- API documentation
- Deployment guides

**8.2 Create training materials:**
- Ketchup portal user guide
- Government portal user guide
- Developer onboarding docs
- Troubleshooting guides

**8.3 Conduct training sessions:**
- Ketchup operations team
- Government oversight team
- Development team
- Support team

**Deliverables:**
- ✅ Complete documentation
- ✅ Training materials ready
- ✅ Teams trained
- ✅ Support ready

---

### Phase 9: Go-Live & Monitoring (Week 9)

**Tasks:**

**9.1 Gradual rollout:**
- Day 1: Internal testing (both portals)
- Day 2-3: Pilot users (10% traffic)
- Day 4-5: Expanded rollout (50% traffic)
- Day 6-7: Full rollout (100% traffic)

**9.2 Monitoring:**
- Setup error tracking (Sentry)
- Setup performance monitoring
- Setup uptime monitoring
- Setup user analytics

**9.3 Support:**
- Dedicated support team available
- Hotline for critical issues
- Slack channel for quick responses

**9.4 Fallback plan:**
- Keep old system available for 2 weeks
- Ability to rollback if needed
- Data migration verification

**Deliverables:**
- ✅ Both portals live
- ✅ Monitoring active
- ✅ Support ready
- ✅ Users migrated

---

## 📋 IMPLEMENTATION ROADMAP

### Timeline Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                    9-WEEK IMPLEMENTATION TIMELINE                  │
└────────────────────────────────────────────────────────────────────┘

Week 1-2:  Setup Monorepo
           └─► Initialize structure, configure tools

Week 2-3:  Extract Shared Packages
           └─► Create @smartpay/* packages

Week 3-4:  Create Ketchup Portal
           └─► Copy & refactor Ketchup pages

Week 4-5:  Create Government Portal
           └─► Copy & refactor Government pages

Week 5-6:  Refactor Backend
           └─► Segregate routes, authentication

Week 6-7:  Setup Deployments
           └─► Vercel projects, domains, CI/CD

Week 7-8:  Testing & Validation
           └─► Functional, performance, security tests

Week 8:    Documentation & Training
           └─► Docs, guides, training sessions

Week 9:    Go-Live & Monitoring
           └─► Gradual rollout, monitoring, support
```

### Resource Allocation

| Phase | Backend Dev | Frontend Dev | DevOps | QA | Duration |
|-------|-------------|--------------|--------|----|---------
| 1. Setup Monorepo | 0.5 | 0.5 | 1 | 0 | 2 weeks |
| 2. Shared Packages | 0.5 | 1 | 0 | 0 | 1 week |
| 3. Ketchup Portal | 0 | 2 | 0 | 0.5 | 1 week |
| 4. Government Portal | 0 | 2 | 0 | 0.5 | 1 week |
| 5. Backend Refactor | 2 | 0 | 0 | 0.5 | 2 weeks |
| 6. Deployments | 0.5 | 0.5 | 1 | 0 | 1 week |
| 7. Testing | 0.5 | 0.5 | 0 | 2 | 1 week |
| 8. Documentation | 1 | 1 | 0 | 0 | 1 week |
| 9. Go-Live | 1 | 1 | 1 | 1 | 1 week |

**Total Team:** 3 Developers + 1 DevOps + 1 QA + 1 PM

---

## 🔧 TECHNICAL SPECIFICATIONS

### Frontend Technology Stack

**Ketchup Portal:**
- Framework: React 18 + TypeScript
- Build Tool: Vite
- Router: React Router v6
- State Management: React Query + Context API
- Styling: Tailwind CSS + DaisyUI
- UI Components: @smartpay/ui (custom)
- Charts: Recharts
- Forms: React Hook Form + Zod
- Date Handling: date-fns

**Government Portal:**
- Framework: React 18 + TypeScript
- Build Tool: Vite
- Router: React Router v6
- State Management: React Query + Context API
- Styling: Tailwind CSS + DaisyUI (Government theme)
- UI Components: @smartpay/ui (custom)
- Charts: Recharts
- Forms: React Hook Form + Zod
- Date Handling: date-fns

### Backend Technology Stack

- Runtime: Node.js 18+
- Framework: Express
- Language: TypeScript
- Database: Neon PostgreSQL (serverless)
- ORM: None (using `@neondatabase/serverless` directly)
- Authentication: JWT + API Keys
- Validation: Zod
- Testing: Vitest
- Logging: Winston

### Shared Packages

**@smartpay/ui:**
- 50+ React components
- Tailwind CSS styling
- DaisyUI integration
- Radix UI primitives

**@smartpay/types:**
- TypeScript type definitions
- Zod schemas for validation
- Shared interfaces

**@smartpay/api-client:**
- Axios-based HTTP client
- Type-safe API methods
- Error handling
- Retry logic

**@smartpay/utils:**
- Currency formatters
- Date formatters
- Validators
- General helpers

**@smartpay/config:**
- Environment variables
- Constants
- Feature flags

### Infrastructure

**Hosting:**
- Frontend: Vercel (Edge Network)
- Backend: Vercel Serverless Functions
- Database: Neon PostgreSQL (Serverless)

**Domains:**
- Ketchup: ketchup.smartpay-connect.com
- Government: gov.smartpay-connect.com
- Backend: api.smartpay-connect.com

**CI/CD:**
- GitHub Actions for automated testing
- Vercel for deployment
- Turborepo for build caching

**Monitoring:**
- Error Tracking: Sentry
- Performance: Vercel Analytics
- Uptime: Uptime Robot
- Logs: Vercel Logs

---

## 📊 SUCCESS METRICS

### Performance Metrics

**Before (Monolithic):**
- Bundle Size: ~2.5MB
- Initial Load: ~3.5s
- Time to Interactive: ~5s

**After (Modular) - Target:**
- Ketchup Bundle: ~1.2MB (52% reduction)
- Government Bundle: ~800KB (68% reduction)
- Initial Load: ~2s (43% reduction)
- Time to Interactive: ~3s (40% reduction)

### Development Metrics

**Before:**
- Build Time: 45s
- Deploy Time: 2 min
- Merge Conflicts: 15/month

**After - Target:**
- Build Time: 20s (Turborepo caching)
- Deploy Time: 1 min (independent)
- Merge Conflicts: 3/month

### User Experience Metrics

**Target:**
- Page Load Speed: < 2s
- API Response Time: < 200ms
- Uptime: 99.9%
- User Satisfaction: > 4.5/5

---

## 🎯 NEXT STEPS

1. **Review this plan** with stakeholders
2. **Approve budget** and resources
3. **Assign team members** to phases
4. **Kickoff meeting** with all teams
5. **Begin Phase 1:** Setup Monorepo

---

## 📞 CONTACTS

**Project Lead:** [Name]  
**Backend Lead:** [Name]  
**Frontend Lead:** [Name]  
**DevOps Lead:** [Name]  
**QA Lead:** [Name]

---

**Document Version:** 1.0  
**Last Updated:** January 29, 2026  
**Status:** ✅ Ready for Review

---

**🏛️ SmartPay Connect - Modular Architecture for the Future**
