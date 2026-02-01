# Business & Product Documentation

This file provides references to all business and product requirement documents.

## Consolidated PRD ✅

| Document | Location | Description |
|----------|----------|-------------|
| **Consolidated PRD** | [`buffr/docs/CONSOLIDATED_PRD.md`](buffr/docs/CONSOLIDATED_PRD.md) | **SINGLE SOURCE OF TRUTH** - Complete PRD with all features, architecture, and project structure |

## Product Requirements Documents (Archived)

Individual PRDs have been consolidated into `CONSOLIDATED_PRD.md`. The archived versions are available for historical reference in `buffr/docs/archive/`:

| Archived Document | Location | Status |
|-------------------|----------|--------|
| G2P Voucher Platform PRD | `buffr/docs/archive/PRD_BUFFR_G2P_VOUCHER_PLATFORM.md` | ✅ Consolidated |
| Ketchup SmartPay Distribution PRD | `buffr/docs/archive/PRD_KETCHUP_SMARTPAY_VOUCHER_DISTRIBUTION.md` | ✅ Consolidated |
| Compliance PRD | `buffr/docs/archive/PRD_COMPLIANCE_COMPLETE.md` | ✅ Consolidated |

## Business Plans & Executive Summaries

| Document | Location | Description |
|----------|----------|-------------|
| **Buffr G2P SmartPay Business Plan** | [`buffr/docs/BUFFR_G2P_SMARTPAY_5PAGE_BUSINESS_PLAN.md`](buffr/docs/BUFFR_G2P_SMARTPAY_5PAGE_BUSINESS_PLAN.md) | 5-page business plan for G2P SmartPay |
| **Ketchup POS Terminal Business Plan** | [`buffr/docs/KETCHUP_POS_TERMINAL_BUSINESS_PLAN.md`](buffr_POS_TERMINAL_BUSINESS_P/docs/KETCHUPLAN.md) | Business plan for Ketchup POS terminal |
| **Buffr G2P Executive Summary Feb 2026** | [`buffr/docs/BUFFR_G2P_EXECUTIVE_SUMMARY_FEB2026.md`](buffr/docs/BUFFR_G2P_EXECUTIVE_SUMMARY_FEB2026.md) | Executive summary for February 2026 |

## Archived Documentation

All implementation guides, research, and planning documents have been moved to `buffr/docs/archive/`:

| Category | Count | Contents |
|----------|-------|----------|
| Implementation Guides | 15 | AI Backend, API Gateway, Encryption, Fineract, Open Banking |
| Migration Reports | 10 | Migration summaries, validation reports, seed data |
| Planning Documents | 12 | Architecture decisions, frontend plans, modular architecture |
| Research | 5 | Apache Fineract research, Causal analysis, IPP alignment |
| Testing | 5 | Truelayer testing, testing complete report, unit testing gap |
| Setup Guides | 5 | Android setup, iOS setup, frontend quick start |

**Total Archived:** 47 files moved to `buffr/docs/archive/`

## Related Documentation

| Document | Location | Description |
|----------|----------|-------------|
| **Architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | System architecture and design decisions |
| **Technical Documentation** | [`DOCUMENTATION.md`](DOCUMENTATION.md) | Complete technical documentation |
| **Project Structure** | [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) | File and directory structure |
| **Backend API** | [`backend/README.md`](backend/README.md) | Backend API documentation |
| **DNS Configuration** | [`DNS_CONFIGURATION.md`](DNS_CONFIGURATION.md) | Domain setup for ketchup.cc |

## Quick Links

### For Developers
- **[CONSOLIDATED_PRD.md](buffr/docs/CONSOLIDATED_PRD.md)** - Start here for complete requirements
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Understand the codebase
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Technical implementation details

### For Product/Business Teams
- **[CONSOLIDATED_PRD.md](buffr/docs/CONSOLIDATED_PRD.md)** - Single source of truth for all requirements
- **Business Plans** - See table above for business strategy documents

### For Compliance
- **[CONSOLIDATED_PRD.md](buffr/docs/CONSOLIDATED_PRD.md#compliance--regulatory)** - Compliance requirements section
- **[DOCUMENTATION.md](DOCUMENTATION.md#psd-compliance)** - PSD compliance details

## Documentation Summary

| Location | Files | Purpose |
|----------|-------|---------|
| Root | 4 | Main project documentation |
| docs/ | 4 | Reference docs (BUSINESS, CURL_VALIDATION, etc.) |
| buffr/docs/ | 5 | Business plans, consolidated PRD |
| buffr/docs/archive/ | 50+ | Historical/archived documents |

## Consolidated PRD Contents

The `CONSOLIDATED_PRD.md` includes:

1. **Executive Summary** - Product vision, problem statement, market opportunity
2. **Product Overview** - Core components, technical stack
3. **System Architecture** - High-level architecture, component details
4. **Features & Requirements** - 35+ functional requirements with status
5. **Integration Requirements** - API specifications, webhooks
6. **Compliance & Regulatory** - PSD compliance status (84% complete)
7. **Project Structure** - Complete file structure with locations
8. **Implementation Roadmap** - Phase-by-phase timeline
9. **Appendices** - API reference, database schema, deployment guide

## Compliance Status Summary

| PSD | Requirement | Status |
|-----|-------------|--------|
| PSD-1 | Payment Service Provider Licensing | ✅ Implemented |
| PSD-3 | Electronic Money Issuance | ✅ Implemented |
| PSD-3 | Trust Account (100% coverage) | ✅ Implemented |
| PSD-12 | Cybersecurity (99.9% uptime) | ✅ Implemented |
| PSDIR-11 | Open Banking Standards | ⚠️ Partial (Feb 2026) |

**Overall Compliance:** 84% (42/50 requirements implemented)
