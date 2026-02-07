# Business & Product Documentation

This file provides references to all business and product requirement documents.

## Consolidated PRD ✅ (Production-Grade Architecture & Flows)

| Document | Location | Description |
|----------|----------|-------------|
| **Consolidated PRD v3.3** | [`buffr/docs/CONSOLIDATED_PRD.md`](buffr/docs/CONSOLIDATED_PRD.md) | **SINGLE SOURCE OF TRUTH** – BUFFR G2P Voucher Platform: production-grade, ecosystem-aware architecture. Ketchup SmartPay = G2P engine; BUFFR = beneficiary platform; Token Vault, universal SMS, separate DBs, NAMQR/IPS/Open Banking. |

**PRD alignment (v3.3):**
- ✅ Ecosystem principles (separation of concerns, Token Vault, separate DBs, universal SMS)
- ✅ Ketchup SmartPay as G2P engine (system of record, not wallet/user app)
- ✅ BUFFR as beneficiary platform (wallet, app, USSD, agents)
- ✅ Key data flows, database architecture, operational flows, summary tables
- ✅ User personas, KPIs, resilience, security, agent network, gap analysis
- ✅ Aligned with PSD-1, ETA, NAMQR, Open Banking and global G2P best practices

## Archived PRD Documents

Individual PRDs have been consolidated. Historical versions available in `buffr/docs/archive/`:

| Archived Document | Status |
|-------------------|--------|
| PRD_BUFFR_G2P_VOUCHER_PLATFORM.md | ✅ Consolidated into v3.3 |
| PRD_KETCHUP_SMARTPAY_VOUCHER_DISTRIBUTION.md | ✅ Consolidated into v3.3 |
| PRD_COMPLIANCE_COMPLETE.md | ✅ Consolidated into v3.3 |

## Business Plans & Executive Summaries

| Document | Location | Description |
|----------|----------|-------------|
| **Buffr G2P SmartPay Business Plan** | [`buffr/docs/BUFFR_G2P_SMARTPAY_5PAGE_BUSINESS_PLAN.md`](buffr/docs/BUFFR_G2P_SMARTPAY_5PAGE_BUSINESS_PLAN.md) | 5-page business plan for G2P SmartPay |
| **Ketchup POS Terminal Business Plan** | [`buffr/docs/KETCHUP_POS_TERMINAL_BUSINESS_PLAN.md`](buffr/docs/KETCHUP_POS_TERMINAL_BUSINESS_PLAN.md) | Business plan for Ketchup POS terminal |
| **Buffr G2P Executive Summary Feb 2026** | [`buffr/docs/BUFFR_G2P_EXECUTIVE_SUMMARY_FEB2026.md`](buffr/docs/BUFFR_G2P_EXECUTIVE_SUMMARY_FEB2026.md) | Executive summary for February 2026 |

## Documentation Structure

| Location | Files | Purpose |
|----------|-------|---------|
| Root | 4 | Main project documentation |
| docs/ | 4 | Reference docs |
| buffr/docs/ | 5 | Business plans, consolidated PRD |
| buffr/docs/archive/ | 50+ | Historical/archived documents |

## Quick Links

### For Developers
- **[CONSOLIDATED_PRD.md](buffr/docs/CONSOLIDATED_PRD.md)** - Complete requirements with architecture
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Codebase structure
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Technical details

### For Product Teams
- **[CONSOLIDATED_PRD.md](buffr/docs/CONSOLIDATED_PRD.md)** - Single source of truth
- **User Personas** - Section 3 (Rural elderly, urban beneficiary, agent)
- **Gap Analysis** - Section 10 (Prioritized improvements)

### For Compliance
- **[CONSOLIDATED_PRD.md](buffr/docs/CONSOLIDATED_PRD.md#security--compliance)** - Compliance section
- **[DOCUMENTATION.md](DOCUMENTATION.md#psd-compliance)** - PSD compliance details

### GTM, training, feedback loop
- **[go_to_market_plan.md](go_to_market_plan.md)** - GTM strategy, training, communication
- **[partnerships.md](partnerships.md)** - MNO, fintech, NGO partnerships
- **[lessons_learned.md](lessons_learned.md)** - UPI, G2P 4.0, SASSA mitigations
- **Feedback:** In-app/USSD NPS (FeedbackWidget); beneficiary surveys; incident reporting

## Key Metrics from PRD

| Metric | Target | Source |
|--------|--------|--------|
| Digital Adoption | 60% by Y1 | PRD Section 2 |
| USSD Success Rate | 95% | PRD Section 3 |
| Agent Density | 1:500 beneficiaries | PRD Section 7 |
| Fraud Rate | < 0.1% | PRD Section 3 |
| LTV:CAC Ratio | 5:1+ | PRD Section 1 |

## PRD Contents Summary

1. **Executive Summary** - Product vision, market opportunity, business model
2. **Product Overview** - Core components, technical stack
3. **User Journeys & Personas** - NEW: 3 personas with journeys and KPIs
4. **System Architecture** - High-level + component diagrams + resilience
5. **Features & Requirements** - 35+ requirements with priorities
6. **Integration Requirements** - API specs, webhooks, interoperability
7. **Security & Compliance** - PSD compliance, data privacy, HSM
8. **Agent & Merchant Network** - NEW: Density targets, onboarding strategy
9. **Implementation Roadmap** - 7 phases with timelines
10. **Gap Analysis** - NEW: Global best practices, prioritized actions

## Compliance Status Summary

| PSD | Requirement | Status |
|-----|-------------|--------|
| PSD-1 | Payment Service Provider Licensing | ✅ Implemented |
| PSD-3 | Electronic Money Issuance | ✅ Implemented |
| PSD-3 | Trust Account (100% coverage) | ✅ Implemented |
| PSD-12 | Cybersecurity (99.9% uptime) | ✅ Implemented |
| PSDIR-11 | Open Banking Standards | ⚠️ Partial (Feb 2026) |

**Overall Compliance:** 84% (42/50 requirements implemented)
**New Requirements Added:** 8 (security, privacy, accessibility)
