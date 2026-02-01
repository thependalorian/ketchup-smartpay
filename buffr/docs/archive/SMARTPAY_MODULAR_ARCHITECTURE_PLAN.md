# SmartPay Connect: Modular Architecture Migration Plan
## Breaking Monolithic Architecture into PRD-Aligned Services

**Date:** January 26, 2026  
**Status:** ⚠️ **Architectural Refactoring Required**  
**Current:** Monolithic React Frontend  
**Target:** Modular Backend + Frontend Architecture (PRD Aligned)

---

## 🎯 Executive Summary

**Problem:** SmartPay Connect repository is a **monolithic React frontend** that does **NOT align** with PRD's modular component architecture.

**Solution:** Refactor into **modular architecture** with:
- Separate backend service layer (5 services per PRD)
- Database layer (PostgreSQL/Neon)
- API Gateway (REST + Webhooks)
- Frontend API clients (replace mock data)

**Timeline:** 4-6 weeks for complete migration

---

## ⚠️ Current Architecture Issues

### Monolithic Structure
```
smartpay-connect/
└── src/
    ├── pages/          # UI + Business Logic (mixed)
    ├── lib/mockData.ts # All data in one file
    └── App.tsx         # Single entry point
```

**Problems:**
- ❌ No backend separation
- ❌ No service layer
- ❌ No database layer
- ❌ Business logic in UI components
- ❌ Cannot scale independently
- ❌ Hard to test services in isolation
- ❌ Does not match PRD component architecture

### PRD Requirements (Not Met)

| PRD Component | Current State | Required State |
|---------------|---------------|----------------|
| **Beneficiary Database** | Mock data in `mockData.ts` | Separate service + database |
| **Voucher Generator** | No generator | Separate service module |
| **Distribution Engine** | No distribution logic | Separate service module |
| **Status Monitor** | No monitoring | Separate service module |
| **API Gateway** | No backend | REST API + Webhooks |

---

## 🏗️ Target Modular Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React - Existing UI)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Pages    │  │ Components│  │ Hooks    │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │              │                   │
│       └─────────────┴──────────────┘                   │
│                    │                                   │
│                    ▼                                   │
│         ┌─────────────────────┐                        │
│         │  API Client Layer   │                        │
│         │  (Frontend Services)│                        │
│         └──────────┬──────────┘                        │
└────────────────────┼───────────────────────────────────┘
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API Gateway                        │
│  ┌──────────────────────────────────────────────┐      │
│  │  REST Endpoints + Webhook Handlers           │      │
│  │  - Authentication Middleware                  │      │
│  │  - Rate Limiting                             │      │
│  │  - Validation                                │      │
│  └──────────┬──────────────────────────────────┘      │
└─────────────┼───────────────────────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Benef.  │ │Voucher │ │Distrib.│ │Status  │ │Agent   │
│Service │ │Service │ │Engine  │ │Monitor │ │Service │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
    │         │         │         │         │
    └─────────┴─────────┴─────────┴─────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Database Layer      │
        │   (PostgreSQL/Neon)   │
        └───────────────────────┘
```

### Directory Structure

```
smartpay-connect/
├── frontend/                    # React frontend (refactored)
│   ├── src/
│   │   ├── components/         # UI components (keep existing)
│   │   ├── pages/              # Pages (use API clients)
│   │   ├── hooks/              # Custom hooks (API integration)
│   │   │   ├── useBeneficiaries.ts
│   │   │   ├── useVouchers.ts
│   │   │   └── useAgents.ts
│   │   └── services/           # Frontend API clients
│   │       ├── api.ts          # Base API client
│   │       ├── beneficiaryAPI.ts
│   │       ├── voucherAPI.ts
│   │       ├── distributionAPI.ts
│   │       └── agentAPI.ts
│   └── package.json
│
├── backend/                     # NEW: Backend services
│   ├── src/
│   │   ├── api/                # API Gateway
│   │   │   ├── routes/
│   │   │   │   ├── beneficiaries.ts
│   │   │   │   ├── vouchers.ts
│   │   │   │   ├── distribution.ts
│   │   │   │   ├── status.ts
│   │   │   │   ├── webhooks.ts
│   │   │   │   └── agents.ts
│   │   │   └── middleware/
│   │   │       ├── auth.ts
│   │   │       ├── validation.ts
│   │   │       ├── rateLimit.ts
│   │   │       └── errorHandler.ts
│   │   │
│   │   ├── services/           # Service Layer (PRD Components)
│   │   │   ├── beneficiary/
│   │   │   │   ├── BeneficiaryService.ts
│   │   │   │   ├── BeneficiaryRepository.ts
│   │   │   │   └── types.ts
│   │   │   ├── voucher/
│   │   │   │   ├── VoucherGenerator.ts
│   │   │   │   ├── VoucherService.ts
│   │   │   │   ├── VoucherRepository.ts
│   │   │   │   └── types.ts
│   │   │   ├── distribution/
│   │   │   │   ├── DistributionEngine.ts
│   │   │   │   ├── BuffrAPIClient.ts
│   │   │   │   ├── DeliveryService.ts
│   │   │   │   └── types.ts
│   │   │   ├── status/
│   │   │   │   ├── StatusMonitor.ts
│   │   │   │   ├── WebhookService.ts
│   │   │   │   ├── AnalyticsService.ts
│   │   │   │   └── types.ts
│   │   │   └── agent/
│   │   │       ├── AgentNetworkService.ts
│   │   │       ├── AgentRepository.ts
│   │   │       └── types.ts
│   │   │
│   │   ├── database/           # Database Layer
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── repositories/
│   │   │
│   │   └── utils/              # Shared utilities
│   │       ├── logger.ts
│   │       ├── errors.ts
│   │       └── validation.ts
│   │
│   └── package.json
│
└── shared/                      # Shared types
    ├── types/
    │   ├── beneficiary.ts
    │   ├── voucher.ts
    │   ├── agent.ts
    │   └── api.ts
    └── constants/
        └── regions.ts
```

---

## 📋 Service Module Specifications

### 1. Beneficiary Service Module

**Location:** `backend/src/services/beneficiary/`

**PRD Component:** Beneficiary Database

**Responsibilities:**
- Manage 100,000+ beneficiary records
- CRUD operations
- Regional distribution tracking
- Eligibility status management
- Historical payment data

**Files:**
```typescript
// BeneficiaryService.ts
export class BeneficiaryService {
  async getAll(filters?: BeneficiaryFilters): Promise<Beneficiary[]>
  async getById(id: string): Promise<Beneficiary | null>
  async create(data: CreateBeneficiaryDTO): Promise<Beneficiary>
  async update(id: string, data: UpdateBeneficiaryDTO): Promise<Beneficiary>
  async getByRegion(region: Region): Promise<Beneficiary[]>
  async getEligible(): Promise<Beneficiary[]>
}

// BeneficiaryRepository.ts
export class BeneficiaryRepository {
  async findAll(filters?: BeneficiaryFilters): Promise<Beneficiary[]>
  async findById(id: string): Promise<Beneficiary | null>
  async create(data: Beneficiary): Promise<Beneficiary>
  async update(id: string, data: Partial<Beneficiary>): Promise<Beneficiary>
}
```

**API Routes:**
- `GET /api/v1/beneficiaries` - List all beneficiaries
- `GET /api/v1/beneficiaries/:id` - Get beneficiary by ID
- `POST /api/v1/beneficiaries` - Create beneficiary
- `PUT /api/v1/beneficiaries/:id` - Update beneficiary
- `GET /api/v1/beneficiaries/:id/vouchers` - Get beneficiary vouchers

---

### 2. Voucher Generator Service Module

**Location:** `backend/src/services/voucher/`

**PRD Component:** Voucher Generator

**Responsibilities:**
- Generate unique voucher codes/QR codes
- Assign expiry dates based on grant type
- Link vouchers to beneficiary records
- Create voucher metadata

**Files:**
```typescript
// VoucherGenerator.ts
export class VoucherGenerator {
  generateVoucherCode(): string
  generateQRCode(voucher: Voucher): string
  assignExpiryDate(grantType: GrantType): Date
  createVoucher(data: CreateVoucherDTO): Voucher
}

// VoucherService.ts
export class VoucherService {
  async issueVoucher(data: IssueVoucherDTO): Promise<Voucher>
  async issueBatch(data: IssueBatchDTO): Promise<Voucher[]>
  async getById(id: string): Promise<Voucher | null>
  async getByBeneficiary(beneficiaryId: string): Promise<Voucher[]>
  async updateStatus(id: string, status: VoucherStatus): Promise<Voucher>
}
```

**API Routes:**
- `POST /api/v1/vouchers` - Issue single voucher
- `POST /api/v1/vouchers/batch` - Issue batch vouchers
- `GET /api/v1/vouchers/:id` - Get voucher by ID
- `GET /api/v1/vouchers` - List vouchers (with filters)
- `PUT /api/v1/vouchers/:id/status` - Update voucher status

---

### 3. Distribution Engine Service Module

**Location:** `backend/src/services/distribution/`

**PRD Component:** Distribution Engine

**Responsibilities:**
- Batch processing for bulk distribution
- Real-time processing for individual vouchers
- Multi-channel routing (API → Buffr, SMS, USSD)
- Delivery confirmation and retry logic

**Files:**
```typescript
// DistributionEngine.ts
export class DistributionEngine {
  async distributeToBuffr(voucher: Voucher): Promise<DistributionResult>
  async distributeBatch(vouchers: Voucher[]): Promise<BatchResult>
  async distributeToSMS(voucher: Voucher): Promise<DistributionResult>
  async distributeToUSSD(voucher: Voucher): Promise<DistributionResult>
  async confirmDelivery(voucherId: string): Promise<void>
}

// BuffrAPIClient.ts
export class BuffrAPIClient {
  async sendVoucher(voucher: Voucher): Promise<BuffrResponse>
  async sendBatch(vouchers: Voucher[]): Promise<BuffrBatchResponse>
  async checkStatus(voucherId: string): Promise<VoucherStatus>
}

// DeliveryService.ts
export class DeliveryService {
  async recordDelivery(voucherId: string, result: DistributionResult): Promise<void>
  async retryFailedDelivery(voucherId: string): Promise<void>
  async getDeliveryHistory(voucherId: string): Promise<DeliveryEvent[]>
}
```

**API Routes:**
- `POST /api/v1/distribution/disburse` - Distribute to Buffr
- `POST /api/v1/distribution/batch` - Batch distribution
- `GET /api/v1/distribution/status/:voucherId` - Get distribution status
- `POST /api/v1/distribution/retry/:voucherId` - Retry failed delivery

---

### 4. Status Monitor Service Module

**Location:** `backend/src/services/status/`

**PRD Component:** Status Monitor

**Responsibilities:**
- Track voucher lifecycle states
- Monitor redemption events from Buffr
- Track expiry dates and send warnings
- Geographic usage analytics

**Files:**
```typescript
// StatusMonitor.ts
export class StatusMonitor {
  async trackStatus(voucherId: string, status: VoucherStatus): Promise<void>
  async monitorExpiry(): Promise<void>
  async sendExpiryWarnings(): Promise<void>
  async getStatusHistory(voucherId: string): Promise<StatusEvent[]>
  async getAnalytics(filters?: AnalyticsFilters): Promise<Analytics>
}

// WebhookService.ts
export class WebhookService {
  async sendStatusUpdate(event: StatusEvent): Promise<void>
  async handleBuffrWebhook(payload: BuffrWebhookPayload): Promise<void>
  async retryFailedWebhook(webhookId: string): Promise<void>
}

// AnalyticsService.ts
export class AnalyticsService {
  async getRegionalAnalytics(): Promise<RegionalAnalytics>
  async getRedemptionAnalytics(): Promise<RedemptionAnalytics>
  async getAgentNetworkAnalytics(): Promise<AgentNetworkAnalytics>
}
```

**API Routes:**
- `GET /api/v1/status/:voucherId` - Get voucher status
- `GET /api/v1/status/history/:voucherId` - Get status history
- `POST /api/v1/webhooks/buffr` - Receive Buffr webhooks
- `GET /api/v1/analytics/regional` - Regional analytics
- `GET /api/v1/analytics/redemption` - Redemption analytics

---

### 5. API Gateway

**Location:** `backend/src/api/`

**PRD Component:** API Gateway

**Responsibilities:**
- RESTful API endpoints for Buffr integration
- Webhook infrastructure for real-time updates
- Authentication and authorization (OAuth 2.0, API keys)
- Rate limiting and security controls

**Files:**
```typescript
// routes/index.ts - Main router
// routes/beneficiaries.ts
// routes/vouchers.ts
// routes/distribution.ts
// routes/status.ts
// routes/webhooks.ts
// routes/agents.ts

// middleware/auth.ts
export const authenticate = (req, res, next) => {
  // OAuth 2.0 PKCE validation
  // API key validation
}

// middleware/rateLimit.ts
export const rateLimit = (maxRequests: number, windowMs: number) => {
  // Rate limiting logic
}

// middleware/validation.ts
export const validateRequest = (schema: ZodSchema) => {
  // Request validation
}
```

---

## 🔄 Step-by-Step Migration Plan

### Week 1-2: Backend Foundation

**Day 1-2: Setup Backend Structure**
```bash
cd smartpay-connect
mkdir -p backend/src/{api/{routes,middleware},services/{beneficiary,voucher,distribution,status,agent},database,utils}
cd backend
npm init -y
npm install express cors dotenv @neondatabase/serverless zod
npm install -D @types/express @types/node typescript tsx
```

**Day 3-5: Extract Beneficiary Service**
- Create `BeneficiaryService.ts`
- Create `BeneficiaryRepository.ts`
- Create API route `api/routes/beneficiaries.ts`
- Add database connection
- Test with existing mock data

**Day 6-10: Extract Voucher Service**
- Create `VoucherGenerator.ts`
- Create `VoucherService.ts`
- Create `VoucherRepository.ts`
- Create API route `api/routes/vouchers.ts`
- Test voucher generation

### Week 3-4: Distribution & Status Services

**Day 11-15: Extract Distribution Engine**
- Create `DistributionEngine.ts`
- Create `BuffrAPIClient.ts`
- Create `DeliveryService.ts`
- Create API route `api/routes/distribution.ts`
- Test Buffr API integration

**Day 16-20: Extract Status Monitor**
- Create `StatusMonitor.ts`
- Create `WebhookService.ts`
- Create `AnalyticsService.ts`
- Create API route `api/routes/webhooks.ts`
- Test webhook handling

### Week 5-6: Frontend Refactoring

**Day 21-25: Create API Client Layer**
- Create `frontend/src/services/api.ts` (base client)
- Create `frontend/src/services/beneficiaryAPI.ts`
- Create `frontend/src/services/voucherAPI.ts`
- Create `frontend/src/services/distributionAPI.ts`

**Day 26-30: Update Pages**
- Refactor `Vouchers.tsx` to use `voucherAPI`
- Refactor `Beneficiaries.tsx` to use `beneficiaryAPI`
- Refactor `Agents.tsx` to use `agentAPI`
- Add loading states and error handling
- Remove direct `mockData.ts` imports

### Week 7-8: Database & Testing

**Day 31-35: Database Integration**
- Set up PostgreSQL/Neon connection
- Create database migrations
- Update repositories to use database
- Seed database with realistic data

**Day 36-40: Testing & Optimization**
- Unit tests for services
- Integration tests for API endpoints
- End-to-end testing
- Performance optimization
- Security audit

---

## 📊 Comparison: Current vs Target

### Current Architecture (Monolithic)

```
Frontend (React)
  ├── Pages (UI + Business Logic)
  │   ├── Vouchers.tsx → generateVouchers()
  │   ├── Beneficiaries.tsx → generateBeneficiaries()
  │   └── Agents.tsx → generateAgents()
  └── lib/mockData.ts (All data generation)
```

**Issues:**
- ❌ No separation of concerns
- ❌ Cannot scale services independently
- ❌ Hard to test business logic
- ❌ No backend for Buffr integration
- ❌ No database persistence

### Target Architecture (Modular)

```
Frontend (React UI)
  └── API Clients → Backend API Gateway
                    ├── Beneficiary Service → Database
                    ├── Voucher Service → Database
                    ├── Distribution Engine → Buffr API
                    └── Status Monitor → Webhooks
```

**Benefits:**
- ✅ Clear separation of concerns
- ✅ Services can scale independently
- ✅ Easy to test in isolation
- ✅ Backend ready for Buffr integration
- ✅ Database persistence
- ✅ Aligns with PRD architecture

---

## ✅ Migration Checklist

### Phase 1: Backend Setup
- [ ] Create backend directory structure
- [ ] Initialize backend package.json
- [ ] Set up Express server
- [ ] Add database connection (Neon)
- [ ] Create base API router

### Phase 2: Service Extraction
- [ ] Extract Beneficiary Service
- [ ] Extract Voucher Generator Service
- [ ] Extract Distribution Engine
- [ ] Extract Status Monitor
- [ ] Create API Gateway routes

### Phase 3: Database Integration
- [ ] Create database migrations
- [ ] Set up repositories
- [ ] Seed database with data
- [ ] Update services to use database

### Phase 4: Frontend Refactoring
- [ ] Create API client layer
- [ ] Create custom hooks
- [ ] Refactor pages to use API
- [ ] Add loading/error states
- [ ] Remove mock data dependencies

### Phase 5: Testing & Deployment
- [ ] Unit tests for services
- [ ] Integration tests for API
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

---

## 🎯 Success Criteria

**Architecture Alignment:**
- ✅ 5 separate service modules (per PRD)
- ✅ Clear separation: Frontend ↔ Backend ↔ Database
- ✅ Each service can be tested independently
- ✅ Services can scale independently
- ✅ API Gateway handles all external communication

**Functionality:**
- ✅ All existing UI features work
- ✅ All PRD requirements implemented
- ✅ Buffr API integration working
- ✅ Webhook handling functional
- ✅ Database persistence working

**Code Quality:**
- ✅ No business logic in UI components
- ✅ Services are testable
- ✅ Clear API contracts
- ✅ Error handling throughout
- ✅ Comprehensive logging

---

**Last Updated:** January 26, 2026  
**Status:** ⚠️ **Migration Plan Ready - Awaiting Implementation**
