# 📋 Consolidated Product Requirements Document (PRD)
## SmartPay Connect - Namibia G2P Voucher Platform

**Version:** 3.2 (Post–migrations & seed validation)  
**Date:** February 1, 2026  
**Last Updated:** February 1, 2026  
**Status:** Production Ready with Enhancement Opportunities  
**Document Owner:** Product Team  
**Technical Lead:** George Nekwaya

---

> **Critical Review Applied:** This PRD has been enhanced based on global G2P best practices (UPI, G2P 4.0, SASSA) and Namibia's regulatory context. See Section 10 for gap analysis and action items.

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Journeys & Personas](#user-journeys--personas)
4. [System Architecture](#system-architecture)
5. [Features & Requirements](#features--requirements)
6. [Integration Requirements](#integration-requirements)
7. [Security & Compliance](#security--compliance)
8. [Agent & Merchant Network](#agent--merchant-network)
9. [Implementation Roadmap](#implementation-roadmap)
10. [Gap Analysis & Global Best Practices](#gap-analysis--global-best-practices)
11. [Appendices](#appendices)

---

## Executive Summary

### Product Vision

**SmartPay Connect** is a comprehensive **Government-to-People (G2P) voucher platform** for Namibia that manages the complete lifecycle of digital vouchers for social grants, subsidies, and public services. The platform serves as the digital infrastructure connecting:

- **Ministry of Finance** (funding source)
- **Ketchup Software Solutions** (voucher issuer - SmartPay)
- **Buffr Platform** (voucher receiver and distribution network)
- **NamPost & Agent Network** (cash-out and redemption)
- **100,000+ beneficiaries** across Namibia

**Production URLs:**
- Ketchup Portal: https://www.ketchup.cc
- Government Portal: https://gov.ketchup.cc
- API: https://api.ketchup.cc

### Problem Statement

| Challenge | Impact | Global Reference |
|-----------|--------|------------------|
| 72% of grant recipients prefer cash payments | High theft risk, cash handling costs | Similar to India's pre-UPI scenario |
| NamPost branch bottlenecks during peak periods | Congestion, delays | SASSA 2018 grant payment crisis |
| 70% of beneficiaries are unbanked | Limited digital access | Indonesia G2P 4.0 target demographic |
| High cash management costs | ~N$1.38 billion annually | Significant cost burden |
| Manual, inefficient voucher distribution | Administrative overhead | Legacy system inefficiency |

### Market Opportunity

| Metric | Value | Source |
|--------|-------|--------|
| Annual Disbursement | N$7.2 billion (FY2025/26) | Ministry of Finance |
| Monthly Flow | ~N$600 million | Projected |
| Target Beneficiaries | 100,000+ | Historical enrollments |
| Unbanked Population | 70% | Critical for USSD support |
| NamPost Branches | 137-147 | Distribution network |

### Solution Overview

The platform provides a **comprehensive multi-channel digital wallet and payment platform** inspired by global best practices:

**Inspired by India UPI:**
- Unified multi-channel wallet (same wallet, app/USSD access)
- Real-time fraud prevention with ML
- Merchant QR codes (NAMQR standard)
- Instant settlement

**Inspired by Indonesia G2P 4.0:**
- Beneficiary-centric design
- Inclusive multi-channel delivery
- Biometric-verified payments
- Life-event driven automation

**Inspired by SASSA:**
- Biometric integration (fingerprint/face)
- Agent network management
- Cash-out optimization
- Compliance-first approach

### Key Value Propositions

| Stakeholder | Value Proposition | Success Metric |
|-------------|-------------------|----------------|
| **Government** | Reduced costs, real-time tracking, automated compliance, fraud prevention | 50% reduction in cash handling costs by Y2 |
| **Beneficiaries** | Multiple redemption options, instant notifications, secure 2FA, accessibility | 60% digital adoption by Y1 |
| **NamPost** | Digital verification, reduced cash handling, automated reconciliation | 40% reduction in branch congestion |
| **Ketchup Software** | Real-time API integration, automated delivery, complete tracking | 99.9% voucher delivery success rate |

### Business Case & Financial Model

**Revenue Streams:**
1. Government fees on voucher disbursements (0.1-0.5%)
2. Merchant Discount Rate (MDR): 0.5-3%
3. Cash-out fees at NamPost/agents (N$2-5 per transaction)
4. Cashback processing fees
5. Network interchange fees
6. Bill payment fees
7. Data & analytics services (N$500K - N$2M annually)
8. Platform fees (N$1M - N$5M annually)

**Total Ecosystem Revenue Potential:** **N$24.5M - N$127M annually**

**Unit Economics:**
- **CAC (Customer Acquisition Cost):** N$50-100 per beneficiary
- **CLTV (Customer Lifetime Value):** N$500-1,000 over 5 years
- **LTV:CAC Ratio:** Target 5:1+ for healthy unit economics
- **BEV (Break-Even Volume):** ~240,000 transactions/month

---

## Product Overview

### Core Components

#### 1. Ketchup SmartPay (Voucher Issuer)
**Location:** `smartpay-connect/` (backend + portals)

**Responsibilities:**
- Beneficiary database management (100,000+ records)
- Voucher generation and issuance
- Distribution to Buffr Platform
- Status monitoring and tracking
- Compliance reporting to government

**Key Services:**
- [`backend/src/services/beneficiary/`](backend/src/services/beneficiary/) - Beneficiary management
- [`backend/src/services/voucher/`](backend/src/services/voucher/) - Voucher lifecycle
- [`backend/src/services/distribution/`](backend/src/services/distribution/) - Distribution engine

#### 2. Buffr Platform (Voucher Receiver)
**Location:** `buffr/` (separate Expo app)

**Responsibilities:**
- Receiving vouchers from Ketchup SmartPay
- Delivering vouchers to beneficiaries (app, USSD, SMS)
- Processing voucher redemptions
- Managing beneficiary wallet and transactions
- Agent network management

#### 3. Frontend Portals

**Ketchup Portal** (`apps/ketchup-portal/`):
- Dashboard with real-time metrics
- Beneficiary management
- Voucher distribution
- Agent network monitoring
- Reconciliation and reports

**Government Portal** (`apps/government-portal/`):
- Compliance dashboard
- Audit reports
- Regional performance analytics
- Voucher monitoring
- Beneficiary registry

### Technical Stack

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- TailwindCSS + DaisyUI
- React Query
- React Router

**Backend:**
- Node.js + Express
- TypeScript
- Neon PostgreSQL (serverless)
- `tsx watch` for development

**Mobile (Buffr):**
- React Native (Expo)
- iOS + Android support

**DevOps:**
- Package Manager: PNPM
- CI/CD: GitHub Actions
- Deployment: Vercel

---

## User Journeys & Personas

### Key Personas

#### Persona 1: Rural Elderly Beneficiary (70+)
**Profile:**
- No smartphone, basic feature phone
- Limited literacy, no digital skills
- Receives old-age grant (N$1,400/month)
- Lives 50km from nearest NamPost

**Journey:**
```
1. Receive SMS: "Grant N$1,400 received. Dial *123# to check balance."
2. Dial *123# → USSD menu in Oshiwambo
3. Check balance: "Balance: N$1,400"
4. Visit local agent (2km away)
5. Agent verifies ID + fingerprint
6. Cash out: N$1,400 - N$5 fee = N$1,395 cash
7. Receive SMS: "Cash out N$1,395. New balance: N$0"
```

**Pain Points:**
- USSD menu complexity
- Distance to agent
- Fingerprint verification failures
- Agent liquidity (cash availability)

**Opportunities:**
- Voice/IVR in local languages
- Agent mobile cash-out (agent comes to beneficiary)
- Biometric retry mechanisms

#### Persona 2: Urban Working-Age Beneficiary (25-40)
**Profile:**
- Smartphone user
- Banked (70% urban penetration)
- Digitally savvy
- Receives disability grant

**Journey:**
1. Receive push notification: "Grant N$1,500 received"
2. Open Buffr app → View balance
3. Pay electricity bill via app (N$500)
4. Transfer N$200 to sister (P2P)
5. Buy groceries with QR code (N$400)
6. Keep N$400 in wallet for next week

**Pain Points:**
- App not loading (poor connectivity)
- QR code not accepted by merchant

**Opportunities:**
- Offline transaction caching
- NAMQR merchant onboarding acceleration

#### Persona 3: Agent (NamPost/Retail)
**Profile:**
- Runs small shop or NamPost agency
- Handles 50+ transactions/day
- Needs float management
- Earns commission (0.5-1%)

**Journey:**
1. Morning: Check float balance (N$50,000)
2. Process 5 cash-outs (total N$7,000)
3. Receive SMS: "Float reduced to N$43,000"
4. Request top-up via app
5. Float credited within 2 hours
6. End of day: Reconcile transactions
7. Upload settlement report

**Pain Points:**
- Float delays
- Reconciliation errors
- Fraudulent transactions

**Opportunities:**
- Automated float prediction
- AI-powered fraud alerts
- Real-time settlement

### User-Centric KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Digital Adoption Rate | 60% by Y1 | % of beneficiaries using app/USSD |
| USSD Success Rate | 95% | USSD session completion rate |
| Agent Response Time | < 30 min | Time from cash-out request to completion |
| Beneficiary Satisfaction (NPS) | > 50 | Quarterly beneficiary survey |
| Agent Churn | < 10% annually | Agent retention rate |
| Fraud Rate | < 0.1% | fraudulent transactions / total |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KETCHUP SMARTPAY PLATFORM                    │
│                    (Voucher Issuer - smartpay-connect)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ Beneficiary  │    │   Voucher    │    │   Status     │     │
│  │   Database   │───►│  Generator   │───►│  Monitor     │     │
│  │              │    │              │    │              │     │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘     │
│                             │                     │              │
│                             ▼                     │              │
│                    ┌─────────────────┐           │              │
│                    │  Distribution   │           │              │
│                    │     Engine      │           │              │
│                    └────────┬────────┘           │              │
│                             │                     │              │
│                             ▼                     ▼              │
│                    ┌─────────────────┐    ┌─────────────────┐  │
│                    │   API Gateway   │    │   Webhook       │  │
│                    │   (REST/HTTPS)  │    │   Service       │  │
│                    │   + Rate Limit  │    │                 │  │
│                    └────────┬────────┘    └─────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────────┐                          │
│                    │  KAFKA Event    │                          │
│                    │  Bus (Real-time)│                          │
│                    └────────┬────────┘                          │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │ Secure API (HTTPS/mTLS)       │
              │ Real-time Webhook             │
              │ Event Streaming (KAFKA)       │
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌───────────────────────────────┐
│   BUFFR PLATFORM        │     │    KETCHUP PORTALS           │
│   (Voucher Receiver)    │     │    (smartpay-connect)        │
├─────────────────────────┤     ├───────────────────────────────┤
│                         │     │                               │
│  ┌──────────────┐      │     │  ┌─────────────┐ ┌─────────┐  │
│  │   Voucher    │      │     │  │  Ketchup    │ │Government│  │
│  │   Receiver   │◄─────┼─────┼──│   Portal    │ │  Portal │  │
│  │              │      │     │  │ (www.ketchup│ │(gov.ketchup│  │
│  └──────────────┘      │     │  └─────────────┘ └─────────┘  │
│         │              │     │                               │
│         ▼              │     │  Dashboards, Analytics,       │
│  ┌──────────────┐      │     │  Reports, Compliance          │
│  │  Redemption  │      │     │                               │
│  │   Processor  │──────┼─────┼───────────────────────────────┘
│  └──────────────┘      │
│         │              │
│         ▼              │
│  ┌──────────────┐      │
│  │  Beneficiaries│     │
│  │ (App/USSD/SMS)│    │
│  └──────────────┘      │
│         │              │
│         ▼              │
│  ┌──────────────┐      │
│  │   USSD       │      │     🔄 OFFLINE FALLBACK SUPPORTED
│  │   Gateway    │      │     (QR code caching, transaction queue)
│  └──────────────┘      │
│         │              │
│         ▼              │
│  ┌──────────────┐      │
│  │ Agent Network│      │
│  │  (NamPost)   │      │
│  └──────────────┘      │
│         │              │
│         ▼              │
│  ┌──────────────┐      │
│  │   POS/Kiosk  │      │     🔐 HSM + PCI DSS COMPLIANT
│  │   Terminals  │      │     (Tamper detection, remote kill-switch)
│  └──────────────┘      │
└─────────────────────────┘
```

### Resilience & Offline Support

**Network Outage Strategy:**
- **USSD Fallback:** USSD continues to work during internet outages
- **QR Code Caching:** Pre-generated QR codes valid for 24 hours
- **Transaction Queue:** Local queue for offline transactions, sync when online
- **SMS Notifications:** Backup notification channel

**Disaster Recovery:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 5 minutes
- **Geographic Redundancy:** Multi-region deployment (AWS Cape Town + Johannesburg)
- **Backup Strategy:** Hourly incremental, daily full backups

### Component Architecture

#### Backend Services (`backend/src/services/`)

| Service | Purpose | Files |
|---------|---------|-------|
| **AgentService** | Agent network management | [`agents/AgentService.ts`](backend/src/services/agents/AgentService.ts) |
| **BeneficiaryService** | Beneficiary CRUD operations | [`beneficiary/BeneficiaryService.ts`](backend/src/services/beneficiary/BeneficiaryService.ts) |
| **VoucherService** | Voucher lifecycle management | [`voucher/VoucherService.ts`](backend/src/services/voucher/VoucherService.ts) |
| **VoucherGenerator** | Voucher code generation | [`voucher/VoucherGenerator.ts`](backend/src/services/voucher/VoucherGenerator.ts) |
| **DistributionEngine** | Voucher distribution logic | [`distribution/DistributionEngine.ts`](backend/src/services/distribution/DistributionEngine.ts) |
| **ReconciliationService** | Transaction reconciliation | [`reconciliation/ReconciliationService.ts`](backend/src/services/reconciliation/ReconciliationService.ts) |
| **StatusMonitor** | System health monitoring | [`status/StatusMonitor.ts`](backend/src/services/status/StatusMonitor.ts) |
| **WebhookRepository** | Webhook event handling | [`webhook/WebhookRepository.ts`](backend/src/services/webhook/WebhookRepository.ts) |
| **Compliance Services** | PSD compliance automation | [`compliance/`](backend/src/services/compliance/) |

#### Compliance Services (`backend/src/services/compliance/`)

| Service | Purpose | PSD Requirement |
|---------|---------|-----------------|
| **TrustAccountService** | Trust account reconciliation | PSD-3 |
| **DormantWalletService** | Dormant wallet management | PSD-3 |
| **CapitalRequirementsService** | Capital tracking (N$1.5M minimum) | PSD-3 |
| **SystemUptimeMonitorService** | 99.9% uptime monitoring | PSD-12 |
| **BankOfNamibiaReportingService** | BoN report generation | PSD-1 |
| **IncidentResponseService** | 24h incident reporting | PSD-12 |
| **TwoFactorAuthService** | 2FA for payments | PSD-12 |

---

## Features & Requirements

### Functional Requirements (FR)

#### FR1: Voucher Management ✅ 95% Complete

| ID | Requirement | Status | Location | Priority |
|----|-------------|--------|----------|----------|
| FR1.1 | Receive vouchers in real-time from Ketchup SmartPay | ✅ | [`backend/src/api/routes/ketchup/vouchers.ts`](backend/src/api/routes/ketchup/vouchers.ts) | P0 |
| FR1.2 | Voucher delivery via mobile app | ✅ | Buffr mobile app | P0 |
| FR1.3 | Voucher delivery via USSD | ⚠️ Partial | [`buffr/services/ussdService.ts`](buffr/services/ussdService.ts) | **P0 - Critical** |
| FR1.4 | SMS notifications for all vouchers | ✅ | [`backend/src/services/notifications/NotificationsService.ts`](backend/src/services/notifications/NotificationsService.ts) | P0 |
| FR1.5 | NamQR code generation | ✅ | [`backend/src/services/voucher/VoucherGenerator.ts`](backend/src/services/voucher/VoucherGenerator.ts) | P1 |
| FR1.6 | Voucher redemption (all methods) | ✅ | [`backend/src/api/routes/ketchup/distribution.ts`](backend/src/api/routes/ketchup/distribution.ts) | P0 |
| FR1.7 | Offline transaction caching | 🔄 New | Development needed | **P1** |
| FR1.8 | Voice/IVR accessibility | ✅ | [`buffr/components/IVRSupport.tsx`](buffr/components/IVRSupport.tsx), [`docs/user_journeys.md`](docs/user_journeys.md) | **P2** |

#### FR2: Payment Processing ✅ 84% Complete

| ID | Requirement | Status | Location | Priority |
|----|-------------|--------|----------|----------|
| FR2.1 | Wallet-to-wallet transfers | ✅ | [`backend/src/services/distribution/DistributionEngine.ts`](backend/src/services/distribution/DistributionEngine.ts) | P0 |
| FR2.2 | Bank transfers | ✅ | [`backend/src/services/openbanking/PaymentInitiationService.ts`](backend/src/services/openbanking/PaymentInitiationService.ts) | P1 |
| FR2.3 | Merchant payments (QR codes) | ✅ | [`backend/src/services/voucher/VoucherGenerator.ts`](backend/src/services/voucher/VoucherGenerator.ts) | P1 |
| FR2.4 | Bill payments | ✅ | [`backend/src/api/routes/ketchup/distribution.ts`](backend/src/api/routes/ketchup/distribution.ts) | P1 |
| FR2.5 | Cashback at merchant tills | ⚠️ Partial | Analysis complete | **P1 - Key Driver** |
| FR2.6 | IPS Integration (Namibia Payment System) | ✅ | [`backend/src/services/ips/IPSIntegrationService.ts`](backend/src/services/ips/IPSIntegrationService.ts), `ips_transactions` table | **P0** |
| FR2.7 | NamPost Integration | ⚠️ Partial | [`backend/src/services/namPostService.ts`](backend/src/services/namPostService.ts) | P1 |
| FR2.8 | NAMQR Interoperability | ✅ | [`backend/src/services/namqr/NAMQRService.ts`](backend/src/services/namqr/NAMQRService.ts), `namqr_codes` table, ISO 20022 adapter | **P1** |

#### FR3: Security & Compliance ✅ 95% Complete

| ID | Requirement | Status | Location | Priority |
|----|-------------|--------|----------|----------|
| FR3.1 | 2FA for all transactions | ✅ | [`backend/src/services/compliance/TwoFactorAuthService.ts`](backend/src/services/compliance/TwoFactorAuthService.ts) | P0 |
| FR3.2 | Biometric authentication | ✅ | [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts) | P0 |
| FR3.3 | Data encryption (application-level) | ✅ | [`backend/src/utils/webhookSignature.ts`](backend/src/utils/webhookSignature.ts) | P0 |
| FR3.4 | Audit trail system | ✅ | [`backend/src/services/webhook/WebhookRepository.ts`](backend/src/services/webhook/WebhookRepository.ts) | P0 |
| FR3.5 | Compliance reporting | ✅ | [`backend/src/services/compliance/BankOfNamibiaReportingService.ts`](backend/src/services/compliance/BankOfNamibiaReportingService.ts) | P0 |
| FR3.6 | Real-time fraud monitoring | ⚠️ Partial | ML enhancement (existing fraud model) | **P1** |
| FR3.7 | HSM Integration | ✅ | [`backend/src/services/security/HardwareSecurityModule.ts`](backend/src/services/security/HardwareSecurityModule.ts) | **P1** |
| FR3.8 | PCI DSS Compliance | ✅ | [`backend/src/services/security/PCIDSSCompliance.ts`](backend/src/services/security/PCIDSSCompliance.ts) | **P2** |

#### FR4: User Management ✅ 100% Complete

| ID | Requirement | Status | Location | Priority |
|----|-------------|--------|----------|----------|
| FR4.1 | User registration (via NamPost/Ketchup) | ✅ | [`backend/src/services/beneficiary/BeneficiaryService.ts`](backend/src/services/beneficiary/BeneficiaryService.ts) | P0 |
| FR4.2 | KYC verification | ✅ | [`backend/src/services/beneficiary/BeneficiaryRepository.ts`](backend/src/services/beneficiary/BeneficiaryRepository.ts) | P0 |
| FR4.3 | User profile management | ✅ | [`backend/src/api/routes/ketchup/beneficiaries.ts`](backend/src/api/routes/ketchup/beneficiaries.ts) | P1 |
| FR4.4 | Session management | ✅ | [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts) | P0 |
| FR4.5 | Consent management | ✅ | [`backend/src/services/privacy/ConsentManagementService.ts`](backend/src/services/privacy/ConsentManagementService.ts), `beneficiary_consents` table | **P1** |
| FR4.6 | Accessibility settings | ✅ | [`buffr/components/IVRSupport.tsx`](buffr/components/IVRSupport.tsx), onboarding, [`buffr/app/settings/help.tsx`](buffr/app/settings/help.tsx) | **P2** |

#### FR5: Wallet Management ✅ 100% Complete

| ID | Requirement | Status | Location | Priority |
|----|-------------|--------|----------|----------|
| FR5.1 | Wallet creation | ✅ | [`backend/src/services/beneficiary/BeneficiaryService.ts`](backend/src/services/beneficiary/BeneficiaryService.ts) | P0 |
| FR5.2 | Wallet balance tracking | ✅ | [`backend/src/services/dashboard/DashboardService.ts`](backend/src/services/dashboard/DashboardService.ts) | P0 |
| FR5.3 | Transaction history | ✅ | [`backend/src/api/routes/shared/dashboard.ts`](backend/src/api/routes/shared/dashboard.ts) | P0 |
| FR5.4 | Wallet-to-wallet transfers | ✅ | [`backend/src/services/distribution/DistributionEngine.ts`](backend/src/services/distribution/DistributionEngine.ts) | P0 |
| FR5.5 | Float management (agents) | ✅ | [`backend/src/services/agents/AgentService.ts`](backend/src/services/agents/AgentService.ts) | P1 |

#### FR6: Account Management ✅ 100% Complete

| ID | Requirement | Status | Location | Priority |
|----|-------------|--------|----------|----------|
| FR6.1 | Bank account linking | ✅ | [`backend/src/services/openbanking/AccountInformationService.ts`](backend/src/services/openbanking/AccountInformationService.ts) | P1 |
| FR6.2 | Wallet auto-creation during onboarding | ✅ | [`backend/src/services/beneficiary/BeneficiaryService.ts`](backend/src/services/beneficiary/BeneficiaryService.ts) | P0 |
| FR6.3 | Account verification | ✅ | [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts) | P0 |
| FR6.4 | Account management | ✅ | [`backend/src/api/routes/ketchup/beneficiaries.ts`](backend/src/api/routes/ketchup/beneficiaries.ts) | P1 |

#### FR7: Agent Network ✅ 100% Complete (January 26, 2026)

| ID | Requirement | Status | Location | Priority |
|----|-------------|--------|----------|----------|
| FR7.1 | Agent registration & onboarding | ✅ | [`backend/src/services/agents/AgentService.ts`](backend/src/services/agents/AgentService.ts) | P0 |
| FR7.2 | Agent authentication & access | ✅ | [`backend/src/api/middleware/auth.ts`](backend/src/api/middleware/auth.ts) | P0 |
| FR7.3 | Agent dashboard | ✅ | [`apps/ketchup-portal/src/pages/Agents.tsx`](apps/ketchup-portal/src/pages/Agents.tsx) | P1 |
| FR7.4 | Agent liquidity management | ✅ | [`backend/src/services/agents/AgentService.ts`](backend/src/services/agents/AgentService.ts), [`backend/src/services/agents/AgentLiquidityService.ts`](backend/src/services/agents/AgentLiquidityService.ts), `agent_float` table | P0 |
| FR7.5 | Cash-out transaction processing | ✅ | [`backend/src/services/distribution/DistributionEngine.ts`](backend/src/services/distribution/DistributionEngine.ts) | P0 |
| FR7.6 | Agent commission management | ✅ | [`backend/src/services/agents/AgentService.ts`](backend/src/services/agents/AgentService.ts) | P1 |
| FR7.7 | Agent settlement | ✅ | [`backend/src/services/agents/AgentService.ts`](backend/src/services/agents/AgentService.ts) | P1 |
| FR7.8 | Agent performance analytics | ✅ | [`backend/src/services/dashboard/DashboardService.ts`](backend/src/services/dashboard/DashboardService.ts) | P1 |
| FR7.9 | Agent network coverage | ✅ | [`backend/src/api/routes/ketchup/agents.ts`](backend/src/api/routes/ketchup/agents.ts), [`backend/src/services/agents/AgentCoveragePlanner.ts`](backend/src/services/agents/AgentCoveragePlanner.ts), `agent_coverage_by_region` table | P1 |
| FR7.10 | Agent Network ML Integration | ✅ | Enhanced fraud detection (29 features) | P1 |

---

## Integration Requirements

### API Integration

#### Ketchup SmartPay → Buffr

**Base URL:** `https://api.ketchup.cc` (Production)  
**Development:** `http://localhost:3001`

**Key Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/distribution/disburse` | Distribute voucher to Buffr |
| POST | `/api/v1/distribution/batch` | Batch voucher distribution |
| GET | `/api/v1/vouchers/:id/status` | Get voucher status |
| GET | `/api/v1/beneficiaries/:id` | Get beneficiary details |
| POST | `/api/v1/webhooks` | Receive status updates |

#### API Gateway Features

| Feature | Implementation | Status |
|---------|----------------|--------|
| Rate Limiting | 100 requests/minute per client | ✅ |
| mTLS | Mutual TLS for service-to-service | ✅ |
| API Key Management | Rotating keys with 90-day expiry | ✅ |
| Request/Response Logging | Centralized logging (ELK stack) | ✅ |
| Request Validation | JSON Schema validation | ✅ |
| Error Handling | Standardized error responses | ✅ |
| API Versioning | URL-based versioning (/v1, /v2) | ✅ |

### Webhook Integration

**Webhook Events:**
- `voucher.issued` - Voucher created
- `voucher.delivered` - Voucher delivered to beneficiary
- `voucher.redeemed` - Voucher redeemed
- `voucher.expired` - Voucher expired
- `voucher.cancelled` - Voucher cancelled

**Webhook Payload Structure:**
```typescript
{
  event: string;
  timestamp: string;
  data: {
    voucher_id: string;
    beneficiary_id: string;
    amount: number;
    status: string;
    channel: string;
    metadata: Record<string, unknown>;
  };
  signature: string;
  retry_count?: number;
}
```

### Interoperability

| Standard | Integration | Status | Target Date |
|----------|-------------|--------|-------------|
| ISO 20022 | Message format for payments | ✅ | [`backend/src/services/openbanking/ISO20022Adapter.ts`](backend/src/services/openbanking/ISO20022Adapter.ts) | Q2 2026 |
| NAMQR | Merchant QR codes | ✅ | [`backend/src/services/namqr/NAMQRService.ts`](backend/src/services/namqr/NAMQRService.ts), `namqr_codes` table | Q2 2026 |
| IPP | Instant Payment Platform | ✅ | [`backend/src/services/ips/IPSIntegrationService.ts`](backend/src/services/ips/IPSIntegrationService.ts), `ips_transactions` table | February 2026 |
| Open Banking (PSDIR-11) | Third-party access | ⚠️ Partial | [`backend/src/services/openbanking/`](backend/src/services/openbanking/) | February 2026 |

---

## Security & Compliance

### PSD Compliance Status

| PSD | Requirement | Status | Service |
|-----|-------------|--------|---------|
| **PSD-1** | Payment Service Provider Licensing | ✅ | [`BankOfNamibiaReportingService.ts`](backend/src/services/compliance/BankOfNamibiaReportingService.ts) |
| **PSD-3** | Electronic Money Issuance | ✅ | [`CapitalRequirementsService.ts`](backend/src/services/compliance/CapitalRequirementsService.ts) |
| **PSD-3** | Trust Account (100% coverage) | ✅ | [`TrustAccountService.ts`](backend/src/services/compliance/TrustAccountService.ts) |
| **PSD-3** | Dormant Wallet Management | ✅ | [`DormantWalletService.ts`](backend/src/services/compliance/DormantWalletService.ts) |
| **PSD-12** | Cybersecurity (99.9% uptime) | ✅ | [`SystemUptimeMonitorService.ts`](backend/src/services/compliance/SystemUptimeMonitorService.ts) |
| **PSD-12** | 2FA for Payments | ✅ | [`TwoFactorAuthService.ts`](backend/src/services/compliance/TwoFactorAuthService.ts) |
| **PSD-12** | Incident Response (24h reporting) | ✅ | [`IncidentResponseService.ts`](backend/src/services/compliance/IncidentResponseService.ts) |
| **PSDIR-11** | Open Banking Standards | ⚠️ Partial | [`backend/src/services/openbanking/`](backend/src/services/openbanking/) |

### Data Privacy

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Namibia Data Protection Act | ⚠️ Partial | Consent flows, data minimization |
| GDPR Alignment | ⚠️ Partial | Right to erasure, data portability |
| Beneficiary Consent Management | ✅ | [`backend/src/services/privacy/ConsentManagementService.ts`](backend/src/services/privacy/ConsentManagementService.ts), `beneficiary_consents` table |
| Data Localization | ✅ | Neon PostgreSQL (AWS Cape Town) |

### Security Enhancements

| Enhancement | Status | Target Date |
|-------------|--------|-------------|
| HSM Integration | ✅ | [`backend/src/services/security/HardwareSecurityModule.ts`](backend/src/services/security/HardwareSecurityModule.ts) |
| PCI DSS Compliance | ✅ | [`backend/src/services/security/PCIDSSCompliance.ts`](backend/src/services/security/PCIDSSCompliance.ts) |
| API Abuse Prevention | ✅ | [`backend/src/services/security/APIGateway.ts`](backend/src/services/security/APIGateway.ts) (rate limiting, developer onboarding) |
| Penetration Testing | 🔄 New | Quarterly |

---

## Agent & Merchant Network

### Agent Network Strategy

**Target Metrics:**
- Agent Density: 1 agent per 500 beneficiaries
- Rural Coverage: 80% of beneficiaries within 10km
- Agent Commission: 0.5-1% of transaction value
- Agent Float: N$10,000 - N$100,000 per agent

**Agent Onboarding:**
1. Application submission (online/offline)
2. KYC verification (ID, business license)
3. Training (2-day program)
4. Certification exam
5. Device provisioning (POS terminal)
6. Float allocation

**Agent Support:**
- 24/7 helpline
- Weekly reconciliation reports
- Monthly commission payouts
- AI-powered fraud alerts

### Merchant Network Strategy

**Target Metrics:**
- Merchant Density: 1 merchant per 200 urban beneficiaries
- NAMQR Adoption: 80% of merchants by Y1
- Cashback Participation: 50% of merchants by Y1

**Merchant Onboarding:**
1. Business registration verification
2. NAMQR code generation
3. POS terminal provisioning
4. MDR agreement signing
5. Training (1-day program)

**Merchant Incentives:**
- Cashback subsidies (0.1-0.5%)
- Marketing support
- Analytics dashboard
- Priority settlement

---

## Implementation Roadmap

### Phase 1: Core Infrastructure ✅ Complete

| Milestone | Status | Date |
|-----------|--------|------|
| Database schema design | ✅ | Complete |
| API gateway setup | ✅ | Complete |
| Authentication middleware | ✅ | Complete |
| Beneficiary CRUD operations | ✅ | Complete |
| Voucher generation & distribution | ✅ | Complete |

### Phase 2: Frontend Portals ✅ Complete

| Milestone | Status | Date |
|-----------|--------|------|
| Ketchup Portal (React + Vite) | ✅ | Complete |
| Government Portal (React + Vite) | ✅ | Complete |
| Dashboard widgets | ✅ | Complete |
| Agent network management | ✅ | Complete |
| Compliance dashboard | ✅ | Complete |

### Phase 3: Compliance Automation ✅ Complete

| Milestone | Status | Date |
|-----------|--------|------|
| Trust account reconciliation | ✅ | Complete |
| Dormant wallet management | ✅ | Complete |
| Capital requirements tracking | ✅ | Complete |
| System uptime monitoring | ✅ | Complete |
| BoN reporting | ✅ | Complete |
| 2FA implementation | ✅ | Complete |
| Incident response | ✅ | Complete |

### Phase 4: Interoperability ✅ In Progress

| Milestone | Status | Target Date | Dependencies |
|-----------|--------|-------------|--------------|
| Open Banking (PSDIR-11) | ⚠️ Partial | February 2026 | BoN API credentials |
| NAMQR Integration | ✅ | [`backend/src/services/namqr/NAMQRService.ts`](backend/src/services/namqr/NAMQRService.ts), `namqr_codes` | Q2 2026 |
| IPS Integration | ✅ | [`backend/src/services/ips/IPSIntegrationService.ts`](backend/src/services/ips/IPSIntegrationService.ts), `ips_transactions` | February 2026 |
| ISO 20022 Migration | ✅ | [`backend/src/services/openbanking/ISO20022Adapter.ts`](backend/src/services/openbanking/ISO20022Adapter.ts) | Q3 2026 |

### Phase 5: Resilience & Scale ⚠️ Planning

| Milestone | Status | Target Date |
|-----------|--------|-------------|
| Offline transaction support | 🔄 New | Q2 2026 |
| Multi-region deployment | 🔄 New | Q3 2026 |
| HSM Integration | ✅ | [`backend/src/services/security/HardwareSecurityModule.ts`](backend/src/services/security/HardwareSecurityModule.ts) |
| PCI DSS Compliance | ✅ | [`backend/src/services/security/PCIDSSCompliance.ts`](backend/src/services/security/PCIDSSCompliance.ts) |

### Phase 6: AI/ML Enhancements ✅ Complete

| Milestone | Status | Date |
|-----------|--------|------|
| Fraud detection model | ✅ | Complete |
| Transaction classification | ✅ | Complete |
| Agent network ML integration | ✅ | January 26, 2026 |

### Phase 7: GTM & Adoption ✅ Planning Complete

| Milestone | Status | Target Date |
|-----------|--------|-------------|
| Beneficiary training program | ✅ | [`docs/go_to_market_plan.md`](docs/go_to_market_plan.md), [`docs/user_journeys.md`](docs/user_journeys.md) |
| Agent onboarding campaign | ✅ | [`docs/agent_onboarding.md`](docs/agent_onboarding.md), [`docs/go_to_market_plan.md`](docs/go_to_market_plan.md) |
| Merchant incentive program | ✅ | [`docs/go_to_market_plan.md`](docs/go_to_market_plan.md), [`docs/partnerships.md`](docs/partnerships.md) |
| Government stakeholder engagement | ✅ | [`docs/go_to_market_plan.md`](docs/go_to_market_plan.md), [`docs/lessons_learned.md`](docs/lessons_learned.md) |

---

## Gap Analysis & Global Best Practices

### Summary of Gaps & Opportunities

| Area | Gap/Risk | Severity | Action / Status |
|------|----------|----------|------------------|
| **USSD** | USSD parity not complete | Critical | Prioritize USSD feature parity; [`buffr/components/USSDParity.ts`](buffr/components/USSDParity.ts) |
| **Accessibility** | Voice/IVR not implemented | High | ✅ [`buffr/components/IVRSupport.tsx`](buffr/components/IVRSupport.tsx), user_journeys.md |
| **Interoperability** | IPS/Open Banking partial | Critical | ✅ IPS, NAMQR, ISO 20022 services; Open Banking partial |
| **Security** | HSM, PCI DSS not implemented | High | ✅ [`HardwareSecurityModule.ts`](backend/src/services/security/HardwareSecurityModule.ts), [`PCIDSSCompliance.ts`](backend/src/services/security/PCIDSSCompliance.ts), [`APIGateway.ts`](backend/src/services/security/APIGateway.ts) |
| **Privacy** | Consent flows not explicit | High | ✅ [`ConsentManagementService.ts`](backend/src/services/privacy/ConsentManagementService.ts), `beneficiary_consents` table |
| **Agent Network** | No density targets | Medium | ✅ [`AgentCoveragePlanner.ts`](backend/src/services/agents/AgentCoveragePlanner.ts), `agent_coverage_by_region`, [`agent_onboarding.md`](docs/agent_onboarding.md) |
| **GTM** | No training/change management | Critical | ✅ [`go_to_market_plan.md`](docs/go_to_market_plan.md), [`partnerships.md`](docs/partnerships.md), [`lessons_learned.md`](docs/lessons_learned.md) |
| **Analytics** | No impact metrics | Medium | ✅ [`ImpactAnalyticsService.ts`](backend/src/services/analytics/ImpactAnalyticsService.ts), [`apps/government-portal/.../ImpactDashboard.tsx`](apps/government-portal/src/pages/ImpactDashboard.tsx) |

### Lessons from Global G2P Implementations

| Platform | Lesson | Application |
|----------|--------|-------------|
| **India UPI** | Incentives drive adoption | Cashback program, merchant subsidies |
| **Indonesia G2P 4.0** | User-centric design | Journey mapping, accessibility |
| **SASSA** | Agent network is critical | Agent liquidity management, training |
| **Brazil PIX** | Instant settlement | Real-time payment rails |

### Prioritized Action Items

#### Immediate (Q1 2026)
1. ⚠️ Complete USSD feature parity (tracking: [`USSDParity.ts`](buffr/components/USSDParity.ts))
2. ✅ Launch agent onboarding campaign ([`agent_onboarding.md`](docs/agent_onboarding.md), GTM plan)
3. ✅ Add explicit consent flows ([`ConsentManagementService`](backend/src/services/privacy/ConsentManagementService.ts), `beneficiary_consents`)
4. ✅ Implement API abuse prevention ([`APIGateway`](backend/src/services/security/APIGateway.ts))

#### Short-term (Q2 2026)
1. ✅ Complete NAMQR integration ([`NAMQRService`](backend/src/services/namqr/NAMQRService.ts), `namqr_codes`)
2. Launch offline transaction support
3. ✅ Implement HSM integration ([`HardwareSecurityModule`](backend/src/services/security/HardwareSecurityModule.ts))
4. ✅ Start merchant incentive program ([`go_to_market_plan.md`](docs/go_to_market_plan.md), [`partnerships.md`](docs/partnerships.md))

#### Medium-term (Q3 2026)
1. ✅ Complete ISO 20022 migration ([`ISO20022Adapter`](backend/src/services/openbanking/ISO20022Adapter.ts))
2. ✅ Achieve PCI DSS compliance ([`PCIDSSCompliance`](backend/src/services/security/PCIDSSCompliance.ts))
3. Launch multi-region deployment
4. ✅ Add impact analytics dashboards ([`ImpactAnalyticsService`](backend/src/services/analytics/ImpactAnalyticsService.ts), [`ImpactDashboard`](apps/government-portal/src/pages/ImpactDashboard.tsx))

---

## Appendices

### A. API Reference

**Base URLs:**
- Production: `https://api.ketchup.cc`
- Development: `http://localhost:3001`

**API Version:** `v1`

### B. Database Schema

**Database:** Neon PostgreSQL (serverless)  
**Migration Tool:** `pnpm run migrate` (runs [`backend/src/database/migrations/run.ts`](backend/src/database/migrations/run.ts))  
**Seed Tool:** `pnpm run seed` (runs [`backend/scripts/seed.ts`](backend/scripts/seed.ts))

**Key Tables:**
- `beneficiaries` - 100,000+ beneficiary records
- `beneficiary_dependants` - Dependent information
- `beneficiary_consents` - Consent management (FR4.5; migration 012)
- `vouchers` - Voucher lifecycle
- `status_events` - Status tracking
- `webhook_events` - Webhook history
- `reconciliation_records` - Transaction reconciliation
- `agents` - Agent network
- `agent_float` - Agent liquidity / float (FR7.4; migration 012)
- `agent_coverage_by_region` - Coverage planning (FR7.9; migration 012)
- `locations` - Geographic data
- `namqr_codes` - NAMQR merchant QR codes (FR2.8; migration 012)
- `ips_transactions` - IPS instant payment records (FR2.6; migration 012)

### C. Testing & Certification

| Asset | Purpose |
|-------|---------|
| [`docs/certification.md`](docs/certification.md) | Certification process for agents, merchants, third-party developers |
| [`backend/tests/USSDParity.test.ts`](backend/tests/USSDParity.test.ts) | USSD feature parity tests |
| [`backend/tests/DeviceSecurity.test.ts`](backend/tests/DeviceSecurity.test.ts) | POS/ATM security and compliance tests |
| [`backend/tests/IPSIntegration.test.ts`](backend/tests/IPSIntegration.test.ts) | IPS and Open Banking end-to-end tests |

### D. Compliance References

| Regulation | Key Requirements | Source |
|------------|------------------|--------|
| PSD-1 | Payment Service Provider licensing | Bank of Namibia |
| PSD-3 | Electronic money, trust accounts | Bank of Namibia |
| PSD-12 | Cybersecurity, incident reporting | Bank of Namibia |
| PSDIR-11 | Open Banking standards | Bank of Namibia |
| Data Protection Act | Data privacy, consent | Namibia Ministry of Justice |

### E. Glossary

| Term | Definition |
|------|------------|
| **G2P** | Government-to-People (social grants, subsidies) |
| **USSD** | Unstructured Supplementary Service Data (feature phone protocol) |
| **MDR** | Merchant Discount Rate (fee on card/QR payments) |
| **NAMQR** | Namibia QR Code Standard |
| **IPS** | Instant Payment System (Namibia) |
| **HSM** | Hardware Security Module (cryptographic key storage) |
| **PCI DSS** | Payment Card Industry Data Security Standard |
| **LTV:CAC** | Lifetime Value to Customer Acquisition Cost ratio |

---

**Document Version:** 3.2  
**Last Updated:** February 1, 2026  
**Next Review:** March 1, 2026  
**Status:** Production Ready with Enhancement Opportunities  

**Implementation Notes (v3.2):**
- Migration 012 adds: `beneficiary_consents`, `namqr_codes`, `ips_transactions`, `agent_float`, `agent_coverage_by_region` (see [`backend/src/database/migrations/run.ts`](backend/src/database/migrations/run.ts) and [`012_interop_privacy_agents.sql`](backend/src/database/migrations/012_interop_privacy_agents.sql)).
- Seed script ([`backend/scripts/seed.ts`](backend/scripts/seed.ts)) seeds consent, agent_float, and agent_coverage_by_region after agents/beneficiaries.
- Run `pnpm run migrate` then `pnpm run seed` in `backend/` for a full dev/demo dataset.

**Feedback:** For questions or suggestions, contact the Product Team or submit via the in-app feedback mechanism.
