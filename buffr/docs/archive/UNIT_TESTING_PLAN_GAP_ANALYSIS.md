# 🧪 Unit Testing Plan: Gap Analysis Recommendations

**Date:** January 26, 2026  
**Status:** Planning Phase  
**Purpose:** Comprehensive unit testing plan for P0 critical gap implementations

---

## 📋 Overview

This document outlines the unit testing strategy for the three P0 critical gap implementations:

1. **Voucher Expiry Management** - Proactive warnings system
2. **Beneficiary Feedback Loop** - Feedback collection system
3. **Basic Savings Wallet** - Interest-bearing savings with goals

---

## 🎯 Testing Strategy

### Test Coverage Goals
- **Services:** ≥90% code coverage
- **API Endpoints:** 100% endpoint coverage
- **Cron Jobs:** 100% critical path coverage
- **Database Operations:** 100% query coverage
- **Error Handling:** 100% error path coverage

### Testing Pyramid
```
        / E2E Tests (10%)
       / Integration Tests (20%)
      / Unit Tests (70%)
     /
100% Test Coverage
```

---

## 📦 Test Files Structure

```
__tests__/
├── services/
│   ├── voucherExpiryService.test.ts          [NEW]
│   ├── beneficiaryFeedbackService.test.ts   [NEW]
│   └── savingsWalletService.test.ts          [NEW]
├── api/
│   ├── v1/
│   │   ├── feedback/
│   │   │   ├── post-transaction.test.ts      [NEW]
│   │   │   └── feature-interest.test.ts      [NEW]
│   │   └── savings/
│   │       ├── wallet.test.ts                [NEW]
│   │       ├── transfer.test.ts              [NEW]
│   │       └── goals.test.ts                 [NEW]
│   └── cron/
│       ├── voucher-expiry-warnings.test.ts  [NEW]
│       ├── savings-interest-calculation.test.ts [NEW]
│       └── feedback-analytics.test.ts       [NEW]
└── integration/
    ├── voucher-expiry-flow.test.ts           [NEW]
    ├── feedback-collection-flow.test.ts       [NEW]
    └── savings-wallet-flow.test.ts           [NEW]
```

---

## 1️⃣ Voucher Expiry Service Tests

### File: `__tests__/services/voucherExpiryService.test.ts`

#### Test Cases

**1.1. `checkAndSendWarnings()`**
- ✅ Should find vouchers expiring in X days
- ✅ Should skip vouchers already warned
- ✅ Should skip redeemed vouchers
- ✅ Should skip expired vouchers
- ✅ Should send SMS warnings
- ✅ Should send push notifications
- ✅ Should record warnings in database
- ✅ Should handle SMS failures gracefully
- ✅ Should handle push notification failures gracefully
- ✅ Should return correct statistics

**1.2. `sendExpiryWarning()`**
- ✅ Should send SMS with correct message format
- ✅ Should send push notification with correct data
- ✅ Should record warning in database
- ✅ Should handle missing user phone number
- ✅ Should handle invalid voucher ID
- ✅ Should prevent duplicate warnings (same type)

**1.3. `markVoucherRedeemedAfterWarning()`**
- ✅ Should mark warnings as redeemed
- ✅ Should update redeemed_at timestamp
- ✅ Should handle non-existent voucher ID
- ✅ Should handle voucher with no warnings

**1.4. `aggregateDailyExpiryAnalytics()`**
- ✅ Should calculate expired voucher rate
- ✅ Should calculate redemption rate after warnings
- ✅ Should aggregate warning counts by type
- ✅ Should handle date with no vouchers
- ✅ Should update existing analytics record
- ✅ Should create new analytics record

**1.5. `getExpiringVouchersForUser()`**
- ✅ Should return vouchers expiring in 7 days
- ✅ Should filter by specific days until expiry
- ✅ Should return empty array for user with no expiring vouchers
- ✅ Should exclude redeemed vouchers
- ✅ Should exclude expired vouchers
- ✅ Should order by expiry date ascending

**1.6. Edge Cases**
- ✅ Should handle database connection errors
- ✅ Should handle invalid date calculations
- ✅ Should handle timezone issues
- ✅ Should handle concurrent warning sends

---

## 2️⃣ Beneficiary Feedback Service Tests

### File: `__tests__/services/beneficiaryFeedbackService.test.ts`

#### Test Cases

**2.1. `submitPostTransactionFeedback()`**
- ✅ Should save feedback to database
- ✅ Should validate satisfaction score (1-5)
- ✅ Should reject invalid satisfaction scores
- ✅ Should handle optional feedback text
- ✅ Should record channel (app/ussd/sms)
- ✅ Should link to transaction ID
- ✅ Should return feedback ID

**2.2. `submitFeatureInterestSurvey()`**
- ✅ Should save feature interest survey
- ✅ Should update existing survey for same feature
- ✅ Should include user analytics metadata
- ✅ Should validate feature name
- ✅ Should handle optional fields (concerns, suggestions)
- ✅ Should record interest level
- ✅ Should return survey ID

**2.3. `submitPeriodicSurvey()`**
- ✅ Should save periodic survey
- ✅ Should prevent duplicate surveys (same period)
- ✅ Should credit incentive (N$5-10)
- ✅ Should update survey incentive flags
- ✅ Should handle incentive credit failure gracefully
- ✅ Should validate survey period
- ✅ Should record completion timestamp

**2.4. `creditSurveyIncentive()`**
- ✅ Should credit N$5 for SMS/USSD surveys
- ✅ Should credit N$10 for app surveys
- ✅ Should update wallet balance
- ✅ Should create transaction record
- ✅ Should handle missing default wallet
- ✅ Should handle insufficient balance (shouldn't happen, but test)
- ✅ Should update survey incentive flags

**2.5. `getFeedbackAnalytics()`**
- ✅ Should calculate average satisfaction score
- ✅ Should calculate feedback response rate
- ✅ Should calculate feature interest rates
- ✅ Should handle date with no feedback
- ✅ Should return correct structure

**2.6. `aggregateDailyFeedbackAnalytics()`**
- ✅ Should aggregate total feedback received
- ✅ Should calculate average satisfaction
- ✅ Should calculate response rate
- ✅ Should extract top pain points
- ✅ Should extract top suggestions
- ✅ Should update existing analytics record

**2.7. `sendPeriodicSurveySMS()`**
- ✅ Should send SMS with correct message
- ✅ Should handle missing user phone
- ✅ Should format message correctly

**2.8. Edge Cases**
- ✅ Should handle database errors
- ✅ Should handle invalid user IDs
- ✅ Should handle missing transaction IDs
- ✅ Should handle concurrent survey submissions

---

## 3️⃣ Savings Wallet Service Tests

### File: `__tests__/services/savingsWalletService.test.ts`

#### Test Cases

**3.1. `createSavingsWallet()`**
- ✅ Should create savings wallet for user
- ✅ Should use default interest rate (2.5%)
- ✅ Should allow custom interest rate
- ✅ Should allow lock period configuration
- ✅ Should link to main wallet
- ✅ Should handle user with no default wallet
- ✅ Should prevent duplicate savings wallets
- ✅ Should reactivate existing closed wallet

**3.2. `transferToSavings()`**
- ✅ Should transfer from main wallet to savings
- ✅ Should update both wallet balances
- ✅ Should create transaction records
- ✅ Should validate sufficient balance
- ✅ Should handle insufficient balance error
- ✅ Should update goal progress if goalId provided
- ✅ Should mark goal as completed when target reached
- ✅ Should use database transaction (rollback on error)
- ✅ Should handle concurrent transfers

**3.3. `calculateAndCreditInterest()`**
- ✅ Should calculate daily interest correctly
- ✅ Should credit interest to wallet balance
- ✅ Should record interest transaction
- ✅ Should log interest calculation
- ✅ Should skip wallets with zero balance
- ✅ Should skip wallets already calculated today
- ✅ Should handle days since last calculation
- ✅ Should skip tiny interest amounts (<0.01)
- ✅ Should return correct statistics
- ✅ Should handle calculation errors gracefully

**3.4. `createSavingsGoal()`**
- ✅ Should create savings goal
- ✅ Should create savings wallet if doesn't exist
- ✅ Should validate target amount
- ✅ Should allow optional target date
- ✅ Should configure auto-transfer rules
- ✅ Should configure round-up rules
- ✅ Should return goal ID

**3.5. `getSavingsWallet()`**
- ✅ Should return savings wallet for user
- ✅ Should return null if no savings wallet
- ✅ Should only return active wallets

**3.6. `getSavingsGoals()`**
- ✅ Should return all active goals for user
- ✅ Should order by created_at DESC
- ✅ Should exclude cancelled goals
- ✅ Should return empty array if no goals

**3.7. `processAutoTransferOnVoucherReceipt()`**
- ✅ Should transfer to goals with auto-transfer enabled
- ✅ Should respect auto-transfer amount limits
- ✅ Should handle multiple goals
- ✅ Should skip if voucher amount insufficient
- ✅ Should handle errors gracefully (non-blocking)

**3.8. `processRoundUpSavings()`**
- ✅ Should round up transaction to nearest multiple
- ✅ Should transfer round-up amount to savings
- ✅ Should handle multiple goals with round-up
- ✅ Should skip if round-up amount is zero
- ✅ Should handle errors gracefully (non-blocking)

**3.9. `aggregateDailySavingsAnalytics()`**
- ✅ Should calculate total savings wallets
- ✅ Should calculate total savings balance
- ✅ Should calculate average savings balance
- ✅ Should calculate adoption rate
- ✅ Should aggregate goal statistics
- ✅ Should aggregate transaction statistics
- ✅ Should update existing analytics record

**3.10. Edge Cases**
- ✅ Should handle database transaction failures
- ✅ Should handle interest calculation edge cases (leap years, etc.)
- ✅ Should handle concurrent interest calculations
- ✅ Should handle wallet balance inconsistencies
- ✅ Should handle goal completion race conditions

---

## 4️⃣ API Endpoint Tests

### 4.1. Feedback API Tests

#### File: `__tests__/api/v1/feedback/post-transaction.test.ts`
- ✅ Should require authentication
- ✅ Should validate request body
- ✅ Should submit feedback successfully
- ✅ Should return feedback ID
- ✅ Should handle invalid satisfaction score
- ✅ Should handle missing transaction ID
- ✅ Should enforce rate limits

#### File: `__tests__/api/v1/feedback/feature-interest.test.ts`
- ✅ Should require authentication
- ✅ Should validate feature name
- ✅ Should validate wouldUse boolean
- ✅ Should submit survey successfully
- ✅ Should return survey ID
- ✅ Should handle invalid feature name
- ✅ Should enforce rate limits

### 4.2. Savings API Tests

#### File: `__tests__/api/v1/savings/wallet.test.ts`
- ✅ **GET** - Should return savings wallet
- ✅ **GET** - Should return null if no wallet
- ✅ **POST** - Should create savings wallet
- ✅ **POST** - Should allow custom configuration
- ✅ Should require authentication
- ✅ Should enforce rate limits

#### File: `__tests__/api/v1/savings/transfer.test.ts`
- ✅ Should require authentication
- ✅ Should validate amount (> 0)
- ✅ Should transfer to savings wallet
- ✅ Should transfer to specific goal
- ✅ Should handle insufficient balance
- ✅ Should enforce rate limits

#### File: `__tests__/api/v1/savings/goals.test.ts`
- ✅ **GET** - Should return all goals
- ✅ **GET** - Should calculate progress percentage
- ✅ **POST** - Should create savings goal
- ✅ **POST** - Should validate required fields
- ✅ Should require authentication
- ✅ Should enforce rate limits

---

## 5️⃣ Cron Job Tests

### 5.1. Voucher Expiry Warnings Cron

#### File: `__tests__/api/cron/voucher-expiry-warnings.test.ts`
- ✅ Should require CRON_SECRET authentication
- ✅ Should reject invalid CRON_SECRET
- ✅ Should check all warning days (7, 3, 1, 0)
- ✅ Should check specific day via query param
- ✅ Should aggregate analytics for yesterday
- ✅ Should return correct statistics
- ✅ Should handle errors gracefully

### 5.2. Savings Interest Calculation Cron

#### File: `__tests__/api/cron/savings-interest-calculation.test.ts`
- ✅ Should require CRON_SECRET authentication
- ✅ Should calculate interest for all wallets
- ✅ Should aggregate savings analytics
- ✅ Should return correct statistics
- ✅ Should handle calculation errors gracefully

### 5.3. Feedback Analytics Cron

#### File: `__tests__/api/cron/feedback-analytics.test.ts`
- ✅ Should require CRON_SECRET authentication
- ✅ Should aggregate feedback analytics for yesterday
- ✅ Should calculate all metrics correctly
- ✅ Should handle date with no feedback
- ✅ Should return success response

---

## 6️⃣ Integration Tests

### 6.1. Voucher Expiry Flow

#### File: `__tests__/integration/voucher-expiry-flow.test.ts`
- ✅ End-to-end: Voucher created → Warnings sent → Voucher redeemed → Analytics updated
- ✅ Should track redemption after warning
- ✅ Should calculate redemption rate correctly
- ✅ Should prevent duplicate warnings

### 6.2. Feedback Collection Flow

#### File: `__tests__/integration/feedback-collection-flow.test.ts`
- ✅ End-to-end: Transaction → Feedback prompt → Feedback submitted → Incentive credited
- ✅ Should link feedback to transaction
- ✅ Should credit correct incentive amount
- ✅ Should aggregate in analytics

### 6.3. Savings Wallet Flow

#### File: `__tests__/integration/savings-wallet-flow.test.ts`
- ✅ End-to-end: Create wallet → Create goal → Transfer → Interest calculated → Goal completed
- ✅ Should calculate interest correctly over time
- ✅ Should update goal progress
- ✅ Should mark goal as completed

---

## 🛠️ Test Utilities & Mocks

### Mock Database
```typescript
// __tests__/mocks/db.ts
export const mockQuery = jest.fn();
export const mockQueryOne = jest.fn();
```

### Mock Services
```typescript
// __tests__/mocks/services.ts
export const mockSendSMS = jest.fn();
export const mockSendPushNotification = jest.fn();
```

### Test Data Factories
```typescript
// __tests__/factories/voucherFactory.ts
export const createTestVoucher = (overrides?: Partial<Voucher>) => { ... };

// __tests__/factories/userFactory.ts
export const createTestUser = (overrides?: Partial<User>) => { ... };

// __tests__/factories/walletFactory.ts
export const createTestWallet = (overrides?: Partial<Wallet>) => { ... };
```

---

## 📊 Test Coverage Targets

| Component | Target Coverage | Critical Paths |
|-----------|----------------|----------------|
| `voucherExpiryService` | ≥90% | 100% |
| `beneficiaryFeedbackService` | ≥90% | 100% |
| `savingsWalletService` | ≥90% | 100% |
| API Endpoints | 100% | 100% |
| Cron Jobs | 100% | 100% |
| Database Operations | 100% | 100% |
| Error Handling | 100% | 100% |

---

## 🚀 Implementation Priority

### Phase 1: Critical Services (Week 1)
1. ✅ `voucherExpiryService.test.ts` - Core expiry logic
2. ✅ `beneficiaryFeedbackService.test.ts` - Core feedback logic
3. ✅ `savingsWalletService.test.ts` - Core savings logic

### Phase 2: API Endpoints (Week 2)
4. ✅ Feedback API tests
5. ✅ Savings API tests

### Phase 3: Cron Jobs (Week 2)
6. ✅ Cron job tests

### Phase 4: Integration Tests (Week 3)
7. ✅ End-to-end flow tests

---

## 📝 Test Execution

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test __tests__/services/voucherExpiryService.test.ts
npm test __tests__/services/beneficiaryFeedbackService.test.ts
npm test __tests__/services/savingsWalletService.test.ts
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run in Watch Mode
```bash
npm run test:watch
```

---

## ✅ Test Checklist

### Before Implementation
- [ ] Review existing test patterns
- [ ] Set up test database
- [ ] Create test utilities and mocks
- [ ] Create test data factories

### During Implementation
- [ ] Write tests alongside code (TDD)
- [ ] Ensure all edge cases covered
- [ ] Test error handling paths
- [ ] Test database transactions

### After Implementation
- [ ] Achieve ≥90% coverage
- [ ] All tests passing
- [ ] Integration tests passing
- [ ] Performance tests passing (if applicable)

---

## 🔍 Test Quality Criteria

### Good Test Characteristics
- ✅ **Fast** - Run in milliseconds
- ✅ **Isolated** - No dependencies between tests
- ✅ **Repeatable** - Same results every time
- ✅ **Self-validating** - Clear pass/fail
- ✅ **Timely** - Written before or with code

### Test Naming Convention
```typescript
describe('ServiceName', () => {
  describe('methodName()', () => {
    it('should do something when condition is met', () => { ... });
    it('should handle error when condition fails', () => { ... });
  });
});
```

---

## 📚 References

- **Existing Test Patterns:** `__tests__/services/ussdService.test.ts`
- **Jest Configuration:** `jest.config.js`
- **Test Setup:** `__tests__/setup.ts`
- **Testing Documentation:** `docs/TESTING_COMPLETE_REPORT.md`

---

**Status:** 📋 **Planning Complete** - Ready for Implementation
