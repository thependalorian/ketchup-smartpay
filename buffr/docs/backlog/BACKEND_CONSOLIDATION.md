# Backend Consolidation Strategy

**Status**: 🚧 **Active**  
**Priority**: High  
**Timeline**: 3-6 months

---

## Problem Statement

Three separate backend systems create operational complexity:
- **Next.js API** (port 3000) - Main application API
- **FastAPI Backend** (port 8001) - Payment processing & ML
- **AI Backend** (port 8000) - AI agents & intelligence

**Pain Points**:
- Mobile app must manage multiple API endpoints
- Inconsistent authentication across systems
- Higher operational overhead (3 deployments, 3 monitoring systems)
- Team context switching between TypeScript and Python

---

## Recommended Solution

**API Gateway → Consolidate AI Backend into Next.js API**

### System Comparison

| System | Robustness | Scalability | Deployment | Test Coverage | Security | **Score** |
|--------|-----------|-------------|------------|---------------|----------|-----------|
| **Next.js API** | 9/10 | 9/10 | 10/10 | 336/336 | 100% | **9.2/10** ✅ |
| **FastAPI Backend** | 7/10 | 8/10 | 6/10 | Unknown | Good | **7.0/10** ⚠️ |
| **AI Backend** | 6/10 | 6/10 | 6/10 | Unknown | Basic | **6.0/10** ⚠️ |

**Winner**: Next.js API - Highest score, production-ready, lowest operational burden

---

## Implementation Phases

### Phase 1: API Gateway (Month 1) ✅ COMPLETE

**Status**: ✅ Implemented

**Deliverables**:
- ✅ Gateway endpoint (`app/api/gateway/route.ts`)
- ✅ Client library (`utils/gatewayClient.ts`)
- ✅ Testing script (`scripts/test-gateway.sh`)
- ✅ Environment variables configured

**Next Steps**:
- ⏳ Test gateway with all three backends
- ⏳ Update mobile app to use `gatewayClient.ts`
- ⏳ Add monitoring and metrics

### Phase 2: Migrate AI Backend → Next.js API (Months 2-3)

**Status**: ⏳ Planned

**Rationale**:
- Same language (TypeScript) - easier migration
- Similar architecture patterns
- Lower migration risk

**Tasks**:
1. Migrate AI agents to Next.js API routes
2. Migrate RAG system
3. Migrate LLM integration
4. Test and optimize
5. Deprecate AI Backend

**Success Criteria**:
- All AI functionality available via Next.js API
- No breaking changes for mobile app
- Performance maintained or improved

### Phase 3: Evaluate FastAPI Migration (Months 4-6)

**Status**: ⏳ Future

**Decision Point**:
- Assess payment processing migration feasibility
- Evaluate ML model dependencies
- Decide: migrate or keep as microservice

**Considerations**:
- Payment processing may need to stay separate (security/compliance)
- ML models might stay as microservice (Python dependencies)
- Different language (Python) adds migration complexity

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Backend Count** | 1-2 backends | Number of active services |
| **Operational Overhead** | 50% reduction | Time spent on deployments/maintenance |
| **Mobile App Complexity** | Single API endpoint | Number of API URLs mobile app uses |
| **Developer Velocity** | 30% improvement | Features shipped per sprint |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Migration introduces bugs** | High | Phased approach, comprehensive testing |
| **Performance degradation** | Medium | Load testing, performance monitoring |
| **Service disruption** | High | Gradual rollout, feature flags |
| **Team knowledge gaps** | Medium | Documentation, pair programming |

---

## Timeline

- **Month 1**: ✅ API Gateway (COMPLETE)
- **Months 2-3**: Migrate AI Backend → Next.js API
- **Months 4-6**: Evaluate FastAPI migration

---

## Related Documents

- Architecture Decision: `docs/ARCHITECTURE_DECISIONS.md` (Decision 1)
- API Gateway Implementation: `docs/backlog/API_GATEWAY_IMPLEMENTATION.md`
- API Mapping: `API_MAPPING.md`

---

**Last Updated**: 2026-01-17
