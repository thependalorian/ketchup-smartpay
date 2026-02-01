# Architecture Decision Log

**Purpose**: Single source of truth for major technical decisions  
**Format**: Each entry records the "why" behind architectural choices  
**Maintenance**: Update when major decisions are made or changed

---

## Decision 1: Backend Consolidation Strategy

**Date**: 2026-01-17  
**Status**: ✅ **Accepted**  
**Decision Makers**: Technical Leadership Team

### Context

Three separate backend systems created complexity:
- **Next.js API** (port 3000) - Main application API
- **FastAPI Backend** (port 8001) - Payment processing & ML
- **AI Backend** (port 8000) - AI agents & intelligence

**Problems**:
- Mobile app had to manage multiple API endpoints
- Inconsistent authentication across systems
- Higher operational overhead (3 deployments, 3 monitoring systems)
- Team context switching between TypeScript and Python

### Decision

**Consolidate starting with API Gateway, then migrate AI Backend into Next.js API**

**Phased Approach**:
1. **Phase 1** (Month 1): Implement API Gateway in Next.js
2. **Phase 2** (Months 2-3): Migrate AI Backend → Next.js API
3. **Phase 3** (Months 4-6): Evaluate FastAPI → Next.js migration

### Rationale

**System Comparison Scores**:
- **Next.js API**: 9.2/10 (336 tests, 100% security, zero-config deployment)
- **FastAPI Backend**: 7.0/10 (manual deployment, unknown test coverage)
- **AI Backend**: 6.0/10 (basic error handling, manual deployment)

**Key Advantages of Next.js API**:
- ✅ Production-ready (336/336 tests passing)
- ✅ Zero-config deployment (Vercel auto-scaling)
- ✅ TypeScript ecosystem (matches AI Backend - easier migration)
- ✅ Proven scalability (68 endpoints, 103 HTTP methods)
- ✅ Lowest operational burden (fully automated CI/CD)

### Consequences

**Positive**:
- Single unified API for mobile app
- Reduced operational complexity
- Lower hosting costs
- Improved developer velocity

**Risks & Mitigations**:
- ⚠️ **Migration Risk**: Mitigated by phased approach, same language (TypeScript)
- ⚠️ **Payment Processing**: FastAPI may stay as microservice if migration too complex
- ⚠️ **ML Models**: May keep as microservice if Python dependencies are critical

**Timeline**: 3-6 months for full consolidation

---

## Decision 2: API Gateway Implementation

**Date**: 2026-01-17  
**Status**: ✅ **Implemented**  
**Decision Makers**: Backend Team

### Context

Mobile app needed to call three different backend systems with different URLs, authentication, and error handling.

### Decision

**Implement API Gateway as Next.js API route** (`app/api/gateway/route.ts`)

**Features**:
- Unified entry point for all backend requests
- Centralized authentication (JWT validation)
- Unified rate limiting
- Request/response logging
- Health checks for all backends

### Rationale

- ✅ Leverages existing Next.js infrastructure (no new service)
- ✅ TypeScript (matches codebase)
- ✅ Serverless (auto-scales on Vercel)
- ✅ Low latency (same deployment as main API)

### Consequences

**Positive**:
- Mobile app uses single endpoint (`/api/gateway`)
- Simplified client code (`gatewayClient.ts`)
- Centralized monitoring and logging

**Trade-offs**:
- Adds one hop (minimal latency impact)
- Gateway becomes single point of failure (mitigated by Vercel HA)

**Files Created**:
- `app/api/gateway/route.ts` - Gateway endpoint
- `utils/gatewayClient.ts` - Client library
- `scripts/test-gateway.sh` - Testing script

---

## Decision 3: Mobile App vs Admin Web App Architecture

**Date**: 2026-01-17  
**Status**: ✅ **Accepted**  
**Decision Makers**: Product & Engineering Leadership

### Context

Need to clarify architecture: Mobile app is primary consumer product, but operational staff need admin tools.

### Decision

**Separate Applications with Clear Boundaries**:
- **Mobile App** (React Native/Expo) = Primary consumer-facing product
- **Admin Web App** (Next.js) = Operational dashboard (separate project recommended)

**API Access Strategy**:
- **Mobile App**: Uses API Gateway (`/api/gateway`)
- **Admin Web App**: Direct API access to `/api/admin/*` endpoints

### Rationale

**Mobile App (Consumer)**:
- Mobile-first UX optimized for transactions
- Offline support, biometric auth
- G2P voucher management and redemption
- USSD support for feature phones

**Admin Web App (Operations)**:
- Desktop-optimized for complex data tables
- Bulk operations, filters, search
- Real-time monitoring dashboards

**Why Separate Projects**:
- ✅ Clear separation of concerns
- ✅ Independent deployment cycles
- ✅ Different UX requirements
- ✅ Team workflow efficiency
- ✅ Security isolation

### Consequences

**Positive**:
- Focused codebases (mobile stays consumer-focused)
- Independent development cycles
- Better security (admin isolated)

**Implementation**:
- Admin web app can be separate Next.js project: `buffr-admin/`
- Or shared routes in main project: `/admin/*` (protected by `secureAdminRoute`)

---

## Decision 4: Database Schema Strategy

**Date**: 2025-12 (Historical)  
**Status**: ✅ **Accepted**  
**Decision Makers**: Database Team

### Context

Need to balance query performance vs schema flexibility.

### Decision

**Hybrid Approach**: Core fields as columns, flexible data in JSONB metadata

**Strategy**:
- Frequently-queried fields → Database columns (with indexes)
- UI-only or rarely-queried fields → JSONB metadata
- Migration system for schema evolution

### Rationale

- ✅ Query performance for hot paths (columns with indexes)
- ✅ Schema flexibility for evolving features (JSONB)
- ✅ Migration system ensures safe schema changes

### Consequences

**Positive**:
- Fast queries for common operations
- Flexible schema for new features
- Safe migrations

**Trade-offs**:
- Some fields in metadata require JSON queries
- Need clear documentation of field locations

**Documentation**: See `sql/SCHEMA_FIELD_MAPPING.md`

---

## Decision 5: API Security Standardization

**Date**: 2025-12 (Historical)  
**Status**: ✅ **Completed**  
**Decision Makers**: Security & Backend Team

### Context

Inconsistent security patterns across 68 API endpoints.

### Decision

**Standardize all endpoints with security wrappers**:
- `secureAuthRoute` - User authentication required
- `secureAdminRoute` - Admin authentication + role check
- `secureRoute` - Optional authentication

**Standardize response helpers**:
- `successResponse()` - Success responses
- `errorResponse()` - Error responses
- Remove all custom `jsonResponse()` functions

### Rationale

- ✅ Consistent security patterns
- ✅ Easier to audit and maintain
- ✅ Standardized error handling
- ✅ Type-safe responses

### Consequences

**Positive**:
- 100% security coverage (all 68 endpoints secured)
- 0 custom response functions (all use `apiResponse` helpers)
- Easier to add new security features (update wrappers)

**Files**:
- `utils/secureApi.ts` - Security wrappers
- `utils/apiResponse.ts` - Response helpers

---

## Decision 6: Test Infrastructure

**Date**: 2025-12 (Historical)  
**Status**: ✅ **Completed**  
**Decision Makers**: Engineering Team

### Context

Need comprehensive test coverage for production readiness.

### Decision

**Jest test suite with 336 tests across 10 test suites**

**Coverage**:
- API endpoint tests
- Service layer tests
- Utility function tests
- Error handling tests

### Rationale

- ✅ Catches regressions before deployment
- ✅ Documents expected behavior
- ✅ Enables confident refactoring

### Consequences

**Positive**:
- 336/336 tests passing
- Production-ready codebase
- Fast feedback loop

**Files**: `__tests__/` directory

---

## How to Use This Document

1. **When making a major architectural decision**: Add a new entry
2. **When reviewing past decisions**: Check this log first
3. **When debating alternatives**: Reference relevant decisions
4. **When onboarding new team members**: Read this to understand "why"

**Format for New Entries**:
- Date
- Status (Accepted/Deferred/Rejected)
- Context (what problem were we solving?)
- Decision (what did we decide?)
- Rationale (why this choice?)
- Consequences (what does this mean?)

---

**Last Updated**: 2026-01-17
