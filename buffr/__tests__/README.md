# Test Suite Documentation

**Based on:** TrueLayer Testing Patterns  
**Last Updated:** January 26, 2026

---

## 🧪 Test Structure

### Unit Tests (60%)
- `utils/` - Utility function tests
- `services/` - Service layer tests

### Integration Tests (30%)
- `api/v1/` - Open Banking v1 API tests
- `webhooks/` - Webhook handling tests
- `integration/` - End-to-end flow tests

### Test Scripts
- `scripts/test-*.ts` - Standalone test scripts

---

## 🚀 Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test __tests__/utils/openBanking.test.ts
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run Test Scripts
```bash
# Open Banking endpoints
npx tsx scripts/test-open-banking-endpoints.ts

# Payment flow (integration checklist)
npx tsx scripts/test-payment-flow.ts

# Merchant accounts
npx tsx scripts/test-merchant-accounts.ts

# Webhooks locally
npx tsx scripts/test-webhooks-locally.ts

# Sandbox scenarios
npx tsx scripts/test-sandbox-scenarios.ts

# Error scenarios
npx tsx scripts/test-error-scenarios.ts
```

---

## 📋 Test Files

### Unit Tests
- `utils/openBanking.test.ts` - Open Banking utilities
- `utils/validators.test.ts` - Validation functions
- `utils/errorHandler.test.ts` - Error handling

### Integration Tests
- `api/v1/payments.test.ts` - Payment API (TrueLayer patterns)
- `api/v1/merchant-accounts.test.ts` - Merchant accounts
- `api/v1/agents.test.ts` - Agent Network API (Open Banking v1)
- `webhooks/payment-webhooks.test.ts` - Webhook handling
- `integration/payment-flow.test.ts` - Complete payment flow
- `integration/payment-statuses.test.ts` - Status transitions

---

## 📖 Documentation

- **TrueLayer Testing Plan:** `docs/TRUELAYER_TESTING_PLAN.md`
- **Merchant Account Dashboard Plan:** `docs/MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md`
- **Test Files Summary:** `docs/TEST_FILES_SUMMARY.md`

---

**See:** `docs/TRUELAYER_TESTING_PLAN.md` for comprehensive testing strategy
