# 🧪 Buffr Testing Plan - Based on TrueLayer Standards

**Date:** January 26, 2026  
**Status:** Comprehensive Testing Plan  
**Based On:** TrueLayer Payments API v3 Testing Patterns  
**Document Owner:** Development Team

---

## 📋 Executive Summary

This testing plan is based on **TrueLayer's proven testing methodologies** from their Payments API v3 documentation. TrueLayer is a leading Open Banking provider with extensive testing patterns for payments, webhooks, sandbox environments, and integration checklists.

**Key TrueLayer Testing Patterns Applied:**
- ✅ **Sandbox Environment Testing** - Mock providers, test scenarios
- ✅ **Integration Checklists** - Step-by-step verification
- ✅ **Webhook Testing** - Local development and verification
- ✅ **Payment Status Testing** - All status transitions
- ✅ **Error Scenario Testing** - Comprehensive error handling
- ✅ **Idempotency Testing** - Request retry safety
- ✅ **Authentication Testing** - Request signing, token management

---

## 📚 TrueLayer Documentation Reference

**Crawled Documents (343 files):**
- `docs_test-payments-in-sandbox.md` - Sandbox testing patterns
- `docs_payments-integration-checklist.md` - Integration verification
- `docs_quickstart-make-a-test-payment.md` - Quickstart patterns
- `docs_develop-and-test-a-webhook-endpoint-locally.md` - Webhook testing
- `reference_create-payment.md` - Payment API reference
- `docs_payments-api-errors.md` - Error handling patterns
- `docs_merchant-account-dashboard.md` - Merchant account testing

**Key Patterns Extracted:**
1. **Sandbox Testing** - Mock providers, test scenarios
2. **Integration Checklists** - Step-by-step verification
3. **Webhook Local Testing** - Docker/CLI tools for local development
4. **Payment Status Testing** - All status transitions
5. **Error Scenario Testing** - Comprehensive error handling
6. **Idempotency Testing** - Request retry safety

---

## 🎯 Testing Strategy Overview

### Testing Pyramid

```
        /\
       /E2E\        ← 10% - End-to-End Integration Tests
      /------\
     /  API   \     ← 30% - API Integration Tests
    /----------\
   /   Unit    \    ← 60% - Unit Tests
  /--------------\
```

### Test Categories

1. **Unit Tests** (60%)
   - Individual function/component testing
   - Mock dependencies
   - Fast execution

2. **Integration Tests** (30%)
   - API endpoint testing
   - Database integration
   - External service mocking

3. **End-to-End Tests** (10%)
   - Full user flows
   - Real environment testing
   - Performance testing

---

## 🧪 Phase 1: Unit Tests

### 1.1 Open Banking Utilities Testing

**File:** `__tests__/utils/openBanking.test.ts`

**Test Cases (Based on TrueLayer patterns):**

```typescript
describe('Open Banking Utilities', () => {
  describe('createOpenBankingErrorResponse', () => {
    it('should create error response with Code, Id, Message', () => {
      // Test error response format matches TrueLayer pattern
    });
    
    it('should include Errors array when provided', () => {
      // Test detailed error information
    });
  });
  
  describe('createOpenBankingPaginatedResponse', () => {
    it('should create paginated response with Links and Meta', () => {
      // Test pagination structure
    });
    
    it('should calculate total pages correctly', () => {
      // Test pagination math
    });
  });
  
  describe('parsePaginationParams', () => {
    it('should parse page and page-size from request', () => {
      // Test parameter parsing
    });
    
    it('should enforce min/max limits', () => {
      // Test boundary conditions
    });
  });
});
```

**TrueLayer Pattern:** Standardized error responses and pagination

### 1.2 ISO 20022 Message Testing

**File:** `__tests__/types/iso20022.test.ts`

**Test Cases:**

```typescript
describe('ISO 20022 Message Builders', () => {
  describe('buildCreditTransfer', () => {
    it('should build valid pacs.008 message', () => {
      // Test message structure
    });
    
    it('should include Business Application Header', () => {
      // Test BAH structure
    });
  });
  
  describe('buildStatusReport', () => {
    it('should build valid pacs.002 message', () => {
      // Test status report structure
    });
  });
  
  describe('validateCreditTransfer', () => {
    it('should validate required fields', () => {
      // Test validation
    });
  });
});
```

**TrueLayer Pattern:** Message validation and structure

### 1.3 Payment Processing Testing

**File:** `__tests__/services/paymentService.test.ts`

**Test Cases:**

```typescript
describe('Payment Service', () => {
  describe('processPayment', () => {
    it('should process valid payment request', () => {
      // Test successful payment
    });
    
    it('should validate amount (≥ 1 minor unit)', () => {
      // Test amount validation (TrueLayer pattern: amount_in_minor ≥ 1)
    });
    
    it('should validate currency (GBP/EUR/NAD)', () => {
      // Test currency validation
    });
    
    it('should check sufficient funds', () => {
      // Test balance validation
    });
  });
  
  describe('idempotency', () => {
    it('should handle duplicate idempotency keys', () => {
      // Test idempotency (TrueLayer pattern)
    });
  });
});
```

**TrueLayer Pattern:** Amount validation, currency validation, idempotency

---

## 🔗 Phase 2: Integration Tests

### 2.1 API Endpoint Testing

**File:** `__tests__/api/v1/payments.test.ts`

**Test Cases (Based on TrueLayer Integration Checklist):**

#### 2.1.1 Payment Creation (TrueLayer Pattern: Step 4)

```typescript
describe('POST /api/v1/payments/domestic-payments', () => {
  it('should create payment with valid Open Banking format', async () => {
    // Test payment creation
    // Request body: { Data: { Initiation: {...} } }
  });
  
  it('should require Idempotency-Key header', async () => {
    // Test idempotency key requirement (TrueLayer pattern)
  });
  
  it('should require 2FA verification token', async () => {
    // Test PSD-12 compliance
  });
  
  it('should validate amount_in_minor (≥ 1)', async () => {
    // Test amount validation
  });
  
  it('should validate currency (NAD)', async () => {
    // Test currency validation
  });
  
  it('should validate DebtorAccount and CreditorAccount', async () => {
    // Test account validation
  });
  
  it('should return payment id and status', async () => {
    // Test response format
  });
});
```

#### 2.1.2 Payment Status (TrueLayer Pattern: Step 6)

```typescript
describe('GET /api/v1/payments/domestic-payments/{id}', () => {
  it('should return payment status', async () => {
    // Test status retrieval
  });
  
  it('should return all payment statuses', async () => {
    // Test: authorization_required, authorized, executed, settled, failed
    // (TrueLayer pattern: payment statuses)
  });
  
  it('should handle payment not found', async () => {
    // Test 404 handling
  });
});
```

#### 2.1.3 Error Handling (TrueLayer Pattern: Payments API Errors)

```typescript
describe('Error Handling', () => {
  it('should return 400 for invalid parameters', async () => {
    // Test: Invalid Parameters error
  });
  
  it('should return 401 for unauthenticated requests', async () => {
    // Test: Unauthenticated error
  });
  
  it('should return 403 for forbidden operations', async () => {
    // Test: Forbidden error
  });
  
  it('should return 409 for idempotency conflicts', async () => {
    // Test: Idempotency-Key Concurrency Conflict
  });
  
  it('should return 422 for idempotency key reuse', async () => {
    // Test: Idempotency-Key Reuse
  });
  
  it('should return 429 for rate limit exceeded', async () => {
    // Test: Rate Limit Exceeded
  });
  
  it('should return Open Banking error format', async () => {
    // Test error response format matches Open Banking standard
  });
});
```

### 2.2 Webhook Testing (TrueLayer Pattern: Step 6.2)

**File:** `__tests__/webhooks/payment-webhooks.test.ts`

**Test Cases:**

```typescript
describe('Payment Webhooks', () => {
  describe('Webhook Signature Verification', () => {
    it('should verify TL-Signature header', async () => {
      // Test webhook signature verification (TrueLayer pattern)
    });
    
    it('should verify X-TL-Webhook-Timestamp', async () => {
      // Test timestamp validation
    });
    
    it('should reject invalid signatures', async () => {
      // Test security
    });
  });
  
  describe('Webhook Types', () => {
    it('should handle payment_authorization_required', async () => {
      // Test webhook type
    });
    
    it('should handle payment_authorized', async () => {
      // Test webhook type
    });
    
    it('should handle payment_executed', async () => {
      // Test webhook type
    });
    
    it('should handle payment_settled', async () => {
      // Test webhook type
    });
    
    it('should handle payment_failed', async () => {
      // Test webhook type
    });
    
    it('should handle payment_creditable (TrueLayer pattern)', async () => {
      // Test settlement risk webhook
    });
  });
  
  describe('Local Webhook Testing', () => {
    it('should receive webhooks via local tunnel', async () => {
      // Test local webhook development (TrueLayer pattern: Docker/CLI)
    });
  });
});
```

**TrueLayer Pattern:** Webhook signature verification, local testing tools

### 2.3 Merchant Account Testing (TrueLayer Pattern: Step 2)

**File:** `__tests__/api/v1/merchant-accounts.test.ts`

**Test Cases (Expanded from Merchant Account Dashboard Test Plan):**

```typescript
describe('Merchant Accounts', () => {
  describe('GET /api/v1/admin/merchant-accounts', () => {
    it('should list merchant accounts', async () => {
      // Test account listing
    });
    
    it('should return account details (id, IBAN, sort code, account number, beneficiary name)', async () => {
      // Test account details (TrueLayer pattern)
    });
    
    it('should filter by currency (EUR, GBP, PLN)', async () => {
      // Test currency filtering
    });
    
    it('should return current balance', async () => {
      // Test balance retrieval
    });
  });
  
  describe('GET /api/v1/admin/merchant-accounts/{id}/historical-balances', () => {
    it('should return 7-day historical balances', async () => {
      // Test 7-day view
    });
    
    it('should return 6-month historical balances', async () => {
      // Test 6-month view
    });
    
    it('should export historical balances as CSV', async () => {
      // Test CSV export
    });
  });
  
  describe('GET /api/v1/admin/merchant-accounts/{id}/transactions', () => {
    it('should return transaction history', async () => {
      // Test transaction listing
    });
    
    it('should organize inbound by settled_date', async () => {
      // Test settled date sorting
    });
    
    it('should organize outbound by executed_date', async () => {
      // Test executed date sorting
    });
    
    it('should support single date filtering', async () => {
      // Test date filter
    });
    
    it('should support date range filtering', async () => {
      // Test date range filter
    });
    
    it('should exclude pending payments from balances', async () => {
      // Test pending payment exclusion
    });
    
    it('should include pending payouts in transactions', async () => {
      // Test pending payout inclusion
    });
    
    it('should export transactions as CSV with 11 core columns', async () => {
      // Test CSV export format: amount,currency,status,type,reference,remitter,beneficiary,transactionId,paymentId,payoutId,date
    });
    
    it('should include metadata in CSV export when enabled', async () => {
      // Test metadata inclusion
    });
  });
  
  describe('GET /api/v1/admin/merchant-accounts/{id}/details', () => {
    it('should return complete account details', async () => {
      // Test: id, beneficiary_name, sort_code, account_number, IBAN
    });
  });
  
  describe('Merchant Account Sweeping', () => {
    it('should link business account to merchant account', async () => {
      // Test business account linking
    });
    
    it('should set up automatic sweeping', async () => {
      // Test sweeping configuration
    });
    
    it('should trigger sweep when balance reaches threshold', async () => {
      // Test automatic sweep
    });
    
    it('should get sweeping settings', async () => {
      // Test settings retrieval
    });
    
    it('should disable sweeping', async () => {
      // Test sweeping disable
    });
  });
  
  describe('Sandbox Account Behavior', () => {
    it('should allow unlimited deposits in sandbox', async () => {
      // Test sandbox deposit limits
    });
    
    it('should allow unlimited withdrawals in sandbox', async () => {
      // Test sandbox withdrawal limits
    });
    
    it('should fail payouts with insufficient funds', async () => {
      // Test payout failure
    });
  });
});
```

**Reference:** See `docs/MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md` for complete 48-test coverage

---

## 🎭 Phase 3: Sandbox & Mock Testing

### 3.1 Sandbox Environment Setup (TrueLayer Pattern)

**File:** `scripts/setup-sandbox.ts`

**Features:**
- Mock payment providers
- Test user accounts
- Test scenarios (success, failure, cancellation)
- Mock bank responses

**Test Scenarios (Based on TrueLayer Mock Bank):**

```typescript
describe('Sandbox Testing', () => {
  describe('Mock Payment Scenarios', () => {
    it('should simulate payment execution', async () => {
      // Test: test_executed username pattern
    });
    
    it('should simulate authorization failure', async () => {
      // Test: test_authorisation_failed
    });
    
    it('should simulate execution rejection', async () => {
      // Test: test_execution_rejected
    });
    
    it('should simulate cancellation', async () => {
      // Test: cancel button
    });
  });
  
  describe('Execution Delays', () => {
    it('should simulate execution delays', async () => {
      // Test: Execution delay selection
    });
  });
  
  describe('Settlement Delays', () => {
    it('should simulate settlement delays', async () => {
      // Test: Settlement delay selection
    });
  });
});
```

**TrueLayer Pattern:** Mock bank with test usernames, delay simulation

### 3.2 Test Data Generation

**File:** `scripts/generate-test-data.ts`

**Test Data Patterns:**

```typescript
// Based on TrueLayer patterns
const testUsers = {
  executed: {
    username: 'test_executed',
    // Simulates successful payment
  },
  authorizationFailed: {
    username: 'test_authorisation_failed',
    // Simulates auth failure
  },
  executionRejected: {
    username: 'test_execution_rejected',
    // Simulates rejection
  },
};

const testPayments = {
  valid: {
    amount_in_minor: 10000, // 100.00 NAD
    currency: 'NAD',
    // ... valid payment structure
  },
  invalidAmount: {
    amount_in_minor: 0, // Should fail (≥ 1 required)
  },
  invalidCurrency: {
    currency: 'USD', // Should fail (NAD only)
  },
};
```

---

## 🔄 Phase 4: Payment Flow Testing

### 4.1 Complete Payment Flow (TrueLayer Integration Checklist)

**File:** `__tests__/integration/payment-flow.test.ts`

**Test Flow (Based on TrueLayer 8-Step Checklist):**

```typescript
describe('Complete Payment Flow', () => {
  // Step 1: Console/Webhook Configuration
  it('should have webhook URI configured', async () => {
    // Test webhook setup
  });
  
  // Step 2: Merchant Account
  it('should have merchant account with sufficient balance', async () => {
    // Test merchant account
  });
  
  // Step 3: Payment Authentication
  it('should sign requests with private key', async () => {
    // Test request signing
  });
  
  it('should include idempotency key', async () => {
    // Test idempotency
  });
  
  it('should generate access token', async () => {
    // Test token generation
  });
  
  // Step 4: Payment Creation
  it('should create payment with valid data', async () => {
    // Test payment creation
  });
  
  // Step 5: Payment Authorization
  it('should handle authorization flow', async () => {
    // Test authorization
  });
  
  // Step 6: Payment Tracking
  it('should track payment status changes', async () => {
    // Test status tracking
  });
  
  it('should receive webhook notifications', async () => {
    // Test webhooks
  });
  
  // Step 7: Payout (if applicable)
  it('should create payout to payment source', async () => {
    // Test closed-loop payout
  });
  
  // Step 8: Returning User Flow
  it('should handle returning user with preselected provider', async () => {
    // Test returning user flow
  });
});
```

### 4.2 Payment Status Transitions

**File:** `__tests__/integration/payment-statuses.test.ts`

**Test Cases (TrueLayer Payment Statuses):**

```typescript
describe('Payment Status Transitions', () => {
  it('should transition: authorization_required → authorized', async () => {
    // Test status transition
  });
  
  it('should transition: authorized → executed', async () => {
    // Test status transition
  });
  
  it('should transition: executed → settled', async () => {
    // Test status transition
  });
  
  it('should handle failed status', async () => {
    // Test failure scenario
  });
  
  it('should handle cancelled status', async () => {
    // Test cancellation
  });
});
```

**TrueLayer Pattern:** All payment statuses and transitions

---

## 🪝 Phase 5: Webhook Testing

### 5.1 Local Webhook Development (TrueLayer Pattern)

**File:** `scripts/test-webhooks-locally.ts`

**Implementation (Based on TrueLayer Docker/CLI tools):**

```typescript
// Based on TrueLayer: "Develop and test a webhook endpoint locally"

describe('Local Webhook Testing', () => {
  it('should route webhooks to local endpoint', async () => {
    // Test: Docker/CLI routing (TrueLayer pattern)
    // docker run truelayer/truelayer-cli route-webhooks --to-addr http://localhost:8080
  });
  
  it('should generate test webhooks', async () => {
    // Test: Webhook generation (TrueLayer pattern)
    // truelayer generate-webhook executed
    // truelayer generate-webhook failed
  });
  
  it('should verify webhook signatures', async () => {
    // Test signature verification
  });
});
```

### 5.2 Webhook Event Types

**File:** `__tests__/webhooks/webhook-events.test.ts`

**Test Cases:**

```typescript
describe('Webhook Events', () => {
  // Payment Webhooks
  it('should handle payment_authorization_required', async () => {});
  it('should handle payment_authorized', async () => {});
  it('should handle payment_executed', async () => {});
  it('should handle payment_settled', async () => {});
  it('should handle payment_failed', async () => {});
  it('should handle payment_creditable (TrueLayer pattern)', async () => {});
  
  // Payout Webhooks
  it('should handle payout_executed', async () => {});
  it('should handle payout_failed', async () => {});
  
  // Refund Webhooks
  it('should handle refund_executed', async () => {});
  it('should handle refund_failed', async () => {});
  
  // Merchant Account Webhooks
  it('should handle balance_notification', async () => {});
});
```

---

## ✅ Phase 6: Integration Checklist Testing

### 6.1 Payments Integration Checklist (TrueLayer Pattern)

**File:** `__tests__/integration/checklist.test.ts`

**Test Cases (Based on TrueLayer 8-Step Checklist):**

```typescript
describe('Payments Integration Checklist', () => {
  // Step 1: Console & Webhook Configuration
  describe('Step 1: Console & Webhook Configuration', () => {
    it('should have public key uploaded', async () => {
      // Test: Signing keys configured
    });
    
    it('should have webhook URI configured', async () => {
      // Test: Webhook URI set
    });
  });
  
  // Step 2: Merchant Account
  describe('Step 2: Merchant Account', () => {
    it('should have merchant account created', async () => {
      // Test: Merchant account exists
    });
    
    it('should have sufficient balance', async () => {
      // Test: Balance check
    });
  });
  
  // Step 3: Payment Authentication
  describe('Step 3: Payment Authentication', () => {
    it('should sign requests correctly', async () => {
      // Test: Request signing
    });
    
    it('should include idempotency key', async () => {
      // Test: Idempotency
    });
    
    it('should generate access token', async () => {
      // Test: Token generation
    });
  });
  
  // Step 4: Payment Creation
  describe('Step 4: Payment Creation', () => {
    it('should create payment with valid amount', async () => {
      // Test: Amount validation (≥ 1 minor unit)
    });
    
    it('should create payment with valid currency', async () => {
      // Test: Currency validation (NAD)
    });
    
    it('should create payment with beneficiary', async () => {
      // Test: Beneficiary validation
    });
    
    it('should create payment with user details', async () => {
      // Test: User information (AML requirements)
    });
  });
  
  // Step 5: Payment Authorization
  describe('Step 5: Payment Authorization', () => {
    it('should handle authorization flow', async () => {
      // Test: Authorization process
    });
  });
  
  // Step 6: Payment Tracking
  describe('Step 6: Payment Tracking', () => {
    it('should track payment status', async () => {
      // Test: Status polling
    });
    
    it('should receive webhook notifications', async () => {
      // Test: Webhook handling
    });
  });
  
  // Step 7: Payout (if applicable)
  describe('Step 7: Payout', () => {
    it('should create closed-loop payout', async () => {
      // Test: Payout to payment source
    });
  });
  
  // Step 8: Returning User Flow
  describe('Step 8: Returning User Flow', () => {
    it('should preselect provider for returning user', async () => {
      // Test: Preselected provider
    });
  });
});
```

---

## 🚨 Phase 7: Error Scenario Testing

### 7.1 API Error Testing (TrueLayer Pattern: Payments API Errors)

**File:** `__tests__/errors/api-errors.test.ts`

**Test Cases:**

```typescript
describe('API Error Handling', () => {
  describe('400 - Invalid Parameters', () => {
    it('should return 400 for missing required fields', async () => {
      // Test: Missing Data.Initiation
    });
    
    it('should return 400 for invalid amount', async () => {
      // Test: amount_in_minor < 1
    });
    
    it('should return 400 for invalid currency', async () => {
      // Test: Invalid currency code
    });
  });
  
  describe('401 - Unauthenticated', () => {
    it('should return 401 for missing token', async () => {
      // Test: No Authorization header
    });
    
    it('should return 401 for invalid token', async () => {
      // Test: Invalid/expired token
    });
  });
  
  describe('403 - Forbidden', () => {
    it('should return 403 for unauthorized access', async () => {
      // Test: Access denied
    });
  });
  
  describe('409 - Idempotency Conflict', () => {
    it('should return 409 for concurrent idempotency key', async () => {
      // Test: Concurrent requests with same key
    });
  });
  
  describe('422 - Idempotency Key Reuse', () => {
    it('should return 422 for reused idempotency key', async () => {
      // Test: Same key, different request
    });
  });
  
  describe('429 - Rate Limit', () => {
    it('should return 429 for rate limit exceeded', async () => {
      // Test: Too many requests
    });
  });
  
  describe('500 - Server Error', () => {
    it('should return 500 for server errors', async () => {
      // Test: Internal server error
    });
  });
});
```

**TrueLayer Pattern:** All error types from Payments API Errors documentation

### 7.2 Payment Failure Scenarios

**File:** `__tests__/scenarios/payment-failures.test.ts`

**Test Cases:**

```typescript
describe('Payment Failure Scenarios', () => {
  it('should handle insufficient funds', async () => {
    // Test: INSUFFICIENT_FUNDS error
  });
  
  it('should handle account not found', async () => {
    // Test: ACCOUNT_NOT_FOUND error
  });
  
  it('should handle payment limit exceeded', async () => {
    // Test: PAYMENT_LIMIT_EXCEEDED error
  });
  
  it('should handle authorization failure', async () => {
    // Test: Authorization failed (TrueLayer: test_authorisation_failed)
  });
  
  it('should handle execution rejection', async () => {
    // Test: Execution rejected (TrueLayer: test_execution_rejected)
  });
  
  it('should handle cancellation', async () => {
    // Test: User cancellation
  });
});
```

---

## 🔐 Phase 8: Security Testing

### 8.1 Request Signing (TrueLayer Pattern: Step 3.1)

**File:** `__tests__/security/request-signing.test.ts`

**Test Cases:**

```typescript
describe('Request Signing', () => {
  it('should sign requests with private key', async () => {
    // Test: Tl-Signature header
  });
  
  it('should verify signature with public key', async () => {
    // Test: Signature verification
  });
  
  it('should reject unsigned requests', async () => {
    // Test: Security
  });
  
  it('should reject invalid signatures', async () => {
    // Test: Security
  });
});
```

### 8.2 2FA Testing (PSD-12 Compliance)

**File:** `__tests__/security/2fa.test.ts`

**Test Cases:**

```typescript
describe('2FA Authentication', () => {
  it('should require 2FA for payments', async () => {
    // Test: PSD-12 compliance
  });
  
  it('should validate verification token', async () => {
    // Test: Token validation
  });
  
  it('should reject expired tokens', async () => {
    // Test: Token expiry
  });
});
```

---

## 📊 Phase 9: Performance Testing

### 9.1 Load Testing (Based on TrueLayer Patterns)

**File:** `scripts/load-tests/payment-api.js` (k6)

**Test Scenarios:**

```javascript
// Based on TrueLayer patterns
export default function () {
  // Test: Payment creation under load
  // Test: Status polling under load
  // Test: Webhook handling under load
}
```

**Metrics:**
- Response time < 2 seconds (TrueLayer requirement)
- 99.9% uptime (PSD-12 requirement)
- Rate limit handling (15 requests/second - Open Banking pattern)

### 9.2 Stress Testing

**File:** `scripts/stress-tests/payment-stress.test.ts`

**Test Cases:**

```typescript
describe('Stress Testing', () => {
  it('should handle high concurrent requests', async () => {
    // Test: Concurrent payment creation
  });
  
  it('should handle rate limiting', async () => {
    // Test: Rate limit enforcement
  });
  
  it('should maintain performance under load', async () => {
    // Test: Performance metrics
  });
});
```

---

## 🧩 Phase 10: Mock Provider Testing

### 10.1 Mock Payment Providers (TrueLayer Sandbox Pattern)

**File:** `__tests__/mocks/mock-providers.test.ts`

**Mock Providers (Based on TrueLayer Sandbox):**

```typescript
const mockProviders = {
  // Based on TrueLayer sandbox providers
  'mock-payments-gb-redirect': {
    display_name: 'Mock UK Payments - Redirect Flow',
    test_scenarios: ['executed', 'failed', 'cancelled'],
  },
  'mock-payments-fr-redirect': {
    display_name: 'Mock France Payments - Redirect Flow',
    test_scenarios: ['executed', 'failed'],
  },
  // ... other mock providers
};

describe('Mock Providers', () => {
  it('should simulate successful payment', async () => {
    // Test: test_executed scenario
  });
  
  it('should simulate authorization failure', async () => {
    // Test: test_authorisation_failed scenario
  });
  
  it('should simulate execution rejection', async () => {
    // Test: test_execution_rejected scenario
  });
  
  it('should simulate cancellation', async () => {
    // Test: cancel scenario
  });
});
```

**TrueLayer Pattern:** Mock bank with test usernames

---

## 📝 Phase 11: Test Data & Fixtures

### 11.1 Test Data Generation

**File:** `scripts/generate-test-data.ts`

**Test Data (Based on TrueLayer Patterns):**

```typescript
// Test Users (TrueLayer pattern)
export const testUsers = {
  executed: {
    id: 'test-user-executed',
    username: 'test_executed', // TrueLayer pattern
    // ... user data
  },
  authorizationFailed: {
    id: 'test-user-auth-failed',
    username: 'test_authorisation_failed', // TrueLayer pattern
  },
  executionRejected: {
    id: 'test-user-rejected',
    username: 'test_execution_rejected', // TrueLayer pattern
  },
};

// Test Payments
export const testPayments = {
  valid: {
    amount_in_minor: 10000, // 100.00 NAD
    currency: 'NAD',
    // ... payment data
  },
  invalidAmount: {
    amount_in_minor: 0, // Should fail (≥ 1 required)
  },
  invalidCurrency: {
    currency: 'USD', // Should fail (NAD only)
  },
};

// Test Webhooks
export const testWebhooks = {
  paymentExecuted: {
    type: 'payment_executed',
    // ... webhook data
  },
  paymentSettled: {
    type: 'payment_settled',
    // ... webhook data
  },
  paymentFailed: {
    type: 'payment_failed',
    // ... webhook data
  },
};
```

---

## 🧪 Phase 12: Test Execution Plan

### 12.1 Test Execution Order

**Based on TrueLayer Integration Checklist:**

1. **Setup Phase:**
   - [ ] Webhook configuration
   - [ ] Merchant account setup
   - [ ] Authentication setup

2. **Core Functionality:**
   - [ ] Payment creation
   - [ ] Payment authorization
   - [ ] Payment tracking
   - [ ] Webhook handling

3. **Advanced Features:**
   - [ ] Payouts
   - [ ] Returning user flow
   - [ ] Error handling

4. **Security & Compliance:**
   - [ ] Request signing
   - [ ] 2FA validation
   - [ ] Error handling

### 12.2 Continuous Testing

**File:** `.github/workflows/test.yml`

**Test Pipeline:**
- Unit tests on every commit
- Integration tests on PR
- E2E tests on merge to main

---

## 📋 Test Checklist

### Pre-Deployment Checklist (Based on TrueLayer)

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Webhook testing complete
- [ ] Error scenarios tested
- [ ] Security tests passing
- [ ] Performance tests passing
- [ ] Sandbox testing complete
- [ ] Mock provider testing complete
- [ ] Documentation updated

### Production Readiness (TrueLayer Pattern)

- [ ] Integration checklist complete (8 steps)
- [ ] Webhook endpoint verified
- [ ] Error handling tested
- [ ] Rate limiting tested
- [ ] Monitoring configured
- [ ] Logging configured

---

## 🛠️ Testing Tools & Scripts

### Existing Test Scripts

**Current Test Scripts:**
- ✅ `scripts/test-open-banking-endpoints.ts` - Open Banking endpoint testing
- ✅ `__tests__/api/payments.test.ts` - Payment API tests
- ✅ `__tests__/services/adumoService.test.ts` - Service tests

### New Test Scripts to Create

**Based on TrueLayer Patterns:**

1. **`scripts/test-webhooks-locally.ts`**
   - Local webhook testing (TrueLayer Docker/CLI pattern)
   - Webhook signature verification
   - Webhook event simulation

2. **`scripts/test-payment-flow.ts`**
   - Complete payment flow testing
   - Status transition testing
   - Integration checklist verification

3. **`scripts/generate-test-webhooks.ts`**
   - Webhook generation (TrueLayer pattern)
   - Test webhook creation
   - Webhook validation

4. **`scripts/test-sandbox-scenarios.ts`**
   - Sandbox scenario testing
   - Mock provider testing
   - Test user scenarios

5. **`scripts/test-error-scenarios.ts`**
   - Error scenario testing
   - Error response validation
   - Error handling verification

---

## 📈 Test Coverage Goals

### Coverage Targets

| Category | Target | Current | Status |
|----------|--------|---------|--------|
| **Unit Tests** | 80% | ~60% | ⏳ In Progress |
| **Integration Tests** | 70% | ~40% | ⏳ In Progress |
| **E2E Tests** | 50% | ~20% | ⏳ Planned |
| **Error Scenarios** | 90% | ~50% | ⏳ In Progress |
| **Webhook Tests** | 80% | ~30% | ⏳ Planned |
| **Merchant Account Tests** | 100% | 0% | ⏳ Planned (48 tests from dashboard plan) |

---

## 🎯 Priority Testing Areas

### 🔴 Critical (Week 1-2)

1. **Payment Creation & Status** (TrueLayer Steps 4-6)
   - Payment creation API
   - Payment status tracking
   - Webhook handling

2. **Error Handling** (TrueLayer: Payments API Errors)
   - All error types
   - Error response format
   - Error recovery

3. **Authentication** (TrueLayer Step 3)
   - Request signing
   - Token management
   - 2FA validation

### 🟡 High Priority (Week 3-4)

4. **Merchant Account Dashboard Testing** (TrueLayer: Merchant Account Dashboard)
   - 48 test cases from MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md
   - Historical balances (7 days, 6 months)
   - Transaction export (CSV with 11 columns)
   - Account sweeping
   - Sandbox account behavior

5. **Webhook Testing** (TrueLayer Step 6.2)
   - Local webhook development
   - Signature verification
   - All webhook types

6. **Sandbox Testing** (TrueLayer: Test Payments in Sandbox)
   - Mock providers
   - Test scenarios
   - Delay simulation

7. **Integration Checklist** (TrueLayer: 8-Step Checklist)
   - Complete flow testing
   - Step-by-step verification

### 🟢 Medium Priority (Week 5-6)

7. **Performance Testing**
   - Load testing
   - Stress testing
   - Rate limiting

8. **Security Testing**
   - Request signing
   - 2FA
   - Webhook security

---

## 📚 Test Documentation

### Test Files Structure

```
buffr/
├── __tests__/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── payments.test.ts
│   │   │   ├── transactions.test.ts
│   │   │   ├── wallets.test.ts
│   │   │   └── merchant-accounts.test.ts ⏳ (to create - 48 tests)
│   │   └── webhooks/
│   │       └── payment-webhooks.test.ts
│   ├── utils/
│   │   ├── openBanking.test.ts
│   │   └── validators.test.ts
│   ├── services/
│   │   ├── paymentService.test.ts
│   │   └── ipsService.test.ts
│   ├── integration/
│   │   ├── payment-flow.test.ts
│   │   ├── checklist.test.ts
│   │   └── payment-statuses.test.ts
│   ├── errors/
│   │   └── api-errors.test.ts
│   ├── security/
│   │   ├── request-signing.test.ts
│   │   └── 2fa.test.ts
│   └── scenarios/
│       └── payment-failures.test.ts
├── scripts/
│   ├── test-open-banking-endpoints.ts ✅ (existing)
│   ├── test-webhooks-locally.ts ⏳ (to create)
│   ├── test-payment-flow.ts ⏳ (to create)
│   ├── generate-test-webhooks.ts ⏳ (to create)
│   ├── test-sandbox-scenarios.ts ⏳ (to create)
│   ├── test-error-scenarios.ts ⏳ (to create)
│   └── test-merchant-accounts.ts ⏳ (to create - from dashboard plan)
└── docs/
    ├── TRUELAYER_TESTING_PLAN.md ✅ (this file)
    └── MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md ✅ (48 test cases)
```

---

## 🚀 Implementation Timeline

### Week 1: Foundation
- [ ] Update existing test scripts
- [ ] Create webhook testing scripts
- [ ] Set up sandbox environment

### Week 2: Core Testing
- [ ] Payment API testing
- [ ] Error scenario testing
- [ ] Integration checklist testing

### Week 3: Advanced Testing
- [ ] Webhook local testing
- [ ] Mock provider testing
- [ ] Performance testing

### Week 4: Documentation & Review
- [ ] Test documentation
- [ ] Test coverage report
- [ ] Test execution guide

---

## 📖 References

### TrueLayer Documentation Used

1. **Test Payments in Sandbox**
   - Mock providers
   - Test scenarios
   - Mock bank usage

2. **Payments Integration Checklist**
   - 8-step integration process
   - Step-by-step verification

3. **Develop and Test Webhook Endpoint Locally**
   - Docker/CLI tools
   - Local webhook routing
   - Webhook generation

4. **Payments API Errors**
   - All error types
   - Error response format
   - Error handling

5. **Payment Statuses**
   - All status transitions
   - Status tracking

6. **Merchant Account Dashboard** ⭐ NEW
   - Historical balances (7 days, 6 months)
   - Transaction export (CSV format)
   - Account sweeping
   - Sandbox account behavior
   - See: `docs/MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md` for complete 48-test coverage

---

## ✅ Next Steps

1. **Immediate:**
   - [ ] Review existing test files
   - [ ] Update test scripts with TrueLayer patterns
   - [ ] Create webhook testing scripts

2. **Short-term:**
   - [ ] Implement sandbox testing
   - [ ] Create mock providers
   - [ ] Set up local webhook testing

3. **Medium-term:**
   - [ ] Complete integration checklist
   - [ ] Performance testing
   - [ ] Security testing

---

**Document Status:** ✅ **Complete - Ready for Implementation**  
**Last Updated:** January 26, 2026  
**Based On:** TrueLayer Payments API v3 Testing Patterns

---

## 📚 Related Documentation

- **Testing Complete Report:** `TESTING_COMPLETE_REPORT.md` (comprehensive test results)
- **TrueLayer Docs Summary:** See `TRUELAYER_DOCS_SUMMARY.md`, `TRUELAYER_DOCS_INDEX.md`, `TRUELAYER_IMPLEMENTATION_STATUS.md`, `TRUELAYER_TESTING_IMPLEMENTATION.md` (all merged into this plan)

---

## 📁 Test Files Created

### ✅ New Test Files (10 files)

1. **`__tests__/api/v1/payments-domestic.test.ts`** - Open Banking v1 payments testing
2. **`__tests__/webhooks/payment-webhooks.test.ts`** - Webhook testing
3. **`__tests__/integration/payment-statuses.test.ts`** - Payment status transitions
4. **`__tests__/integration/checklist.test.ts`** - Integration checklist verification
5. **`__tests__/utils/openBanking.test.ts`** - Open Banking utilities
6. **`scripts/test-webhooks-locally.ts`** - Local webhook testing
7. **`scripts/test-payment-flow.ts`** - Complete payment flow
8. **`scripts/test-sandbox-scenarios.ts`** - Sandbox scenario testing
9. **`scripts/test-error-scenarios.ts`** - Error scenario testing
10. **`scripts/generate-test-webhooks.ts`** - Webhook generation

### ✅ Updated Test Files (3 files)

1. **`__tests__/api/payments.test.ts`** - Added TrueLayer patterns
2. **`__tests__/api/transactions.test.ts`** - Added TrueLayer patterns
3. **`scripts/test-open-banking-endpoints.ts`** - Enhanced with TrueLayer patterns

**See:** `docs/TEST_FILES_SUMMARY.md` for complete list
