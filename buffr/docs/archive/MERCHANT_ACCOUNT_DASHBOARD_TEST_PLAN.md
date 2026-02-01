# Merchant Account Dashboard Test Plan

**Based on:** TrueLayer Merchant Account Dashboard Documentation  
**Date:** January 26, 2026  
**Status:** 📋 Test Plan Created

---

## 📋 Overview

This test plan covers all functionality described in the TrueLayer Merchant Account Dashboard documentation, ensuring our implementation matches their standards and best practices.

---

## 🎯 Test Categories

### 1. Merchant Account Access & Setup Tests

#### 1.1 Sandbox Account Access
- [ ] **Test:** Verify sandbox EUR merchant account is accessible
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?currency=EUR`
  - **Expected:** Returns merchant account with EUR currency
  - **Status:** 200 OK
  - **Data:** Account ID, currency, balance

- [ ] **Test:** Verify sandbox GBP merchant account is accessible
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?currency=GBP`
  - **Expected:** Returns merchant account with GBP currency
  - **Status:** 200 OK

- [ ] **Test:** Verify sandbox accounts allow unlimited deposits/withdrawals
  - **Endpoint:** `POST /api/v1/admin/merchant-accounts/{id}/deposit`
  - **Body:** `{ "amount": 1000000, "currency": "EUR" }`
  - **Expected:** Success (sandbox allows any amount)
  - **Status:** 201 Created

- [ ] **Test:** Verify payouts fail if merchant account has insufficient funds
  - **Endpoint:** `POST /api/v1/admin/merchant-accounts/{id}/payout`
  - **Body:** `{ "amount": 1000000, "currency": "EUR" }` (when balance is 0)
  - **Expected:** Error response
  - **Status:** 400 Bad Request
  - **Error:** "Insufficient funds"

#### 1.2 Live Environment Access
- [ ] **Test:** Verify live merchant accounts require support contact
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?environment=live`
  - **Expected:** Returns empty array or requires special permissions
  - **Status:** 403 Forbidden or 200 OK with empty array

#### 1.3 PLN Account Support
- [ ] **Test:** Verify PLN merchant account appears when enabled
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?currency=PLN`
  - **Expected:** Returns PLN merchant account if enabled
  - **Status:** 200 OK or 404 Not Found

---

### 2. Merchant Account Dashboard Tests

#### 2.1 Account Balance Viewing
- [ ] **Test:** Get current merchant account balance (EUR)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?currency=EUR`
  - **Expected:** Returns account with current balance
  - **Status:** 200 OK
  - **Data:** `{ "Data": { "Balance": 1234.56, "Currency": "EUR" } }`

- [ ] **Test:** Get current merchant account balance (GBP)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?currency=GBP`
  - **Expected:** Returns account with current balance
  - **Status:** 200 OK

- [ ] **Test:** Toggle between GBP and EUR accounts
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?currency=GBP`
  - **Then:** `GET /api/v1/admin/merchant-accounts?currency=EUR`
  - **Expected:** Both return correct account data
  - **Status:** 200 OK

#### 2.2 Historical Balances
- [ ] **Test:** Get historical balance for past 7 days
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/historical-balances?period=7days`
  - **Expected:** Returns array of daily balances for last 7 days
  - **Status:** 200 OK
  - **Data:** `{ "Data": { "Balances": [{ "date": "2026-01-20", "balance": 1000.00 }, ...] } }`

- [ ] **Test:** Get historical balance for past 6 months
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/historical-balances?period=6months`
  - **Expected:** Returns array of monthly balances for last 6 months
  - **Status:** 200 OK
  - **Data:** `{ "Data": { "Balances": [{ "month": "2025-07", "balance": 1000.00 }, ...] } }`

- [ ] **Test:** Generate CSV report for historical balance (daily)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/historical-balances/export?period=7days&format=csv`
  - **Expected:** Returns CSV file with historical balances
  - **Status:** 200 OK
  - **Content-Type:** `text/csv`
  - **Headers:** `date,balance,currency`

- [ ] **Test:** Generate CSV report for historical balance (monthly)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/historical-balances/export?period=6months&format=csv`
  - **Expected:** Returns CSV file with monthly balances
  - **Status:** 200 OK
  - **Content-Type:** `text/csv`
  - **Headers:** `month,balance,currency`

---

### 3. Transactions Tests

#### 3.1 Transaction Listing
- [ ] **Test:** Get transactions organized by settled date (inbound)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?type=inbound&sort=settled_date`
  - **Expected:** Returns transactions sorted by settled date
  - **Status:** 200 OK
  - **Data:** Each transaction has `settled_date` field

- [ ] **Test:** Get transactions organized by executed date (outbound)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?type=outbound&sort=executed_date`
  - **Expected:** Returns transactions sorted by executed date
  - **Status:** 200 OK
  - **Data:** Each transaction has `executed_date` field

- [ ] **Test:** Filter transactions by single date
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?date=2026-01-26`
  - **Expected:** Returns transactions for that specific date
  - **Status:** 200 OK

- [ ] **Test:** Filter transactions by date range
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?start_date=2026-01-20&end_date=2026-01-26`
  - **Expected:** Returns transactions within date range
  - **Status:** 200 OK

- [ ] **Test:** Verify transactions exclude pending payments (inbound)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?type=inbound`
  - **Expected:** No transactions with status "pending"
  - **Status:** 200 OK

- [ ] **Test:** Verify transactions can include pending payouts (outbound)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?type=outbound`
  - **Expected:** May include transactions with status "pending"
  - **Status:** 200 OK

- [ ] **Test:** Refresh transactions (get latest)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?refresh=true`
  - **Expected:** Returns most recent transactions
  - **Status:** 200 OK
  - **Headers:** `Cache-Control: no-cache`

#### 3.2 Transaction Export
- [ ] **Test:** Export transactions as CSV with 11 core columns
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions/export?format=csv`
  - **Expected:** CSV file with exactly 11 columns
  - **Status:** 200 OK
  - **Content-Type:** `text/csv`
  - **Columns:** `amount,currency,status,type,reference,remitter,beneficiary,transactionId,paymentId,payoutId,date`

- [ ] **Test:** Export transactions with metadata included
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions/export?format=csv&include_metadata=true`
  - **Expected:** CSV file with 11 core columns + metadata columns
  - **Status:** 200 OK
  - **Data:** Additional columns from metadata key-value pairs

- [ ] **Test:** Export transactions for date range
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions/export?format=csv&start_date=2026-01-20&end_date=2026-01-26`
  - **Expected:** CSV file with transactions in date range
  - **Status:** 200 OK

- [ ] **Test:** Verify CSV export format matches TrueLayer standard
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions/export?format=csv`
  - **Expected:** CSV matches exact format:
    ```
    amount,currency,status,type,reference,remitter,beneficiary,transactionId,paymentId,payoutId,date
    100.00,EUR,executed,payment,REF123,John Doe,Merchant ABC,txn_123,pay_456,,2026-01-26T10:00:00Z
    ```
  - **Status:** 200 OK

#### 3.3 Legacy PayDirect Format
- [ ] **Test:** Verify legacy format limits to single date (not range)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?legacy_format=true&date=2026-01-26`
  - **Expected:** Returns transactions for single date only
  - **Status:** 200 OK

- [ ] **Test:** Verify legacy format changes Type column naming
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?legacy_format=true`
  - **Expected:** Type column uses legacy naming convention
  - **Status:** 200 OK

- [ ] **Test:** Verify legacy format changes column order
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?legacy_format=true`
  - **Expected:** Columns in legacy order
  - **Status:** 200 OK

---

### 4. Account Details Tests

#### 4.1 Account Information
- [ ] **Test:** Get merchant account details
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/details`
  - **Expected:** Returns complete account details
  - **Status:** 200 OK
  - **Data:** 
    ```json
    {
      "Data": {
        "AccountId": "acc_123",
        "BeneficiaryName": "Buffr Payments Ltd",
        "SortCode": "123456",
        "AccountNumber": "12345678",
        "IBAN": "GB82WEST12345698765432",
        "Currency": "GBP"
      }
    }
    ```

- [ ] **Test:** Verify all required fields are present
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/details`
  - **Expected:** All fields present: id, beneficiary_name, sort_code, account_number, IBAN
  - **Status:** 200 OK

---

### 5. Merchant Account Sweeping Tests

#### 5.1 Sweeping Configuration
- [ ] **Test:** Link business account to merchant account
  - **Endpoint:** `POST /api/v1/admin/merchant-accounts/{id}/link-business-account`
  - **Body:** `{ "business_account_id": "biz_123", "business_account_details": {...} }`
  - **Expected:** Business account linked successfully
  - **Status:** 201 Created

- [ ] **Test:** Set up automatic sweeping
  - **Endpoint:** `POST /api/v1/admin/merchant-accounts/{id}/sweeping`
  - **Body:** `{ "enabled": true, "balance_threshold": 1000.00, "sweep_amount": "all" }`
  - **Expected:** Sweeping configured
  - **Status:** 201 Created

- [ ] **Test:** Verify sweeping triggers when balance reaches threshold
  - **Setup:** Set threshold to 1000.00, current balance 999.00
  - **Action:** Receive payment of 10.00 (balance becomes 1009.00)
  - **Expected:** Automatic sweep triggered to business account
  - **Status:** Webhook received or transaction created

- [ ] **Test:** Disable sweeping
  - **Endpoint:** `POST /api/v1/admin/merchant-accounts/{id}/sweeping`
  - **Body:** `{ "enabled": false }`
  - **Expected:** Sweeping disabled
  - **Status:** 200 OK

---

### 6. Differences from Payments View Tests

#### 6.1 Balance Differences
- [ ] **Test:** Verify historical balance excludes pending payments
  - **Setup:** Create pending payment to merchant account
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/historical-balances`
  - **Expected:** Balance does not include pending payment
  - **Status:** 200 OK

- [ ] **Test:** Verify transactions can show pending payouts
  - **Setup:** Create pending payout from merchant account
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?type=outbound`
  - **Expected:** Pending payout appears in transactions
  - **Status:** 200 OK

#### 6.2 Date/Time Differences
- [ ] **Test:** Verify transaction date is when payment created with bank (not when payment created)
  - **Setup:** Create payment at 10:00 AM, bank processes at 10:05 AM
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions`
  - **Expected:** Transaction date shows 10:05 AM (bank processing time)
  - **Status:** 200 OK

- [ ] **Test:** Compare merchant account dashboard date vs payments view date
  - **Endpoint 1:** `GET /api/v1/admin/merchant-accounts/{id}/transactions/{txn_id}`
  - **Endpoint 2:** `GET /api/v1/payments/{payment_id}`
  - **Expected:** Dates may differ (merchant account = bank time, payments = creation time)
  - **Status:** 200 OK

---

### 7. Error Handling Tests

#### 7.1 Invalid Requests
- [ ] **Test:** Request non-existent merchant account
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/invalid_id`
  - **Expected:** Error response
  - **Status:** 404 Not Found
  - **Error:** `{ "Code": "RESOURCE_NOT_FOUND", "Message": "Merchant account not found" }`

- [ ] **Test:** Request invalid currency
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts?currency=INVALID`
  - **Expected:** Error response
  - **Status:** 400 Bad Request
  - **Error:** `{ "Code": "FIELD_INVALID", "Message": "Invalid currency" }`

- [ ] **Test:** Request invalid date range
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?start_date=2026-01-26&end_date=2026-01-20`
  - **Expected:** Error response (end before start)
  - **Status:** 400 Bad Request
  - **Error:** `{ "Code": "FIELD_INVALID", "Message": "End date must be after start date" }`

#### 7.2 Authorization Tests
- [ ] **Test:** Access merchant account without admin authentication
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts`
  - **Headers:** No Authorization header
  - **Expected:** Error response
  - **Status:** 401 Unauthorized
  - **Error:** `{ "Code": "UNAUTHORIZED", "Message": "Authentication required" }`

- [ ] **Test:** Access merchant account with non-admin user
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts`
  - **Headers:** `Authorization: Bearer {regular_user_token}`
  - **Expected:** Error response
  - **Status:** 403 Forbidden
  - **Error:** `{ "Code": "FORBIDDEN", "Message": "Admin access required" }`

---

### 8. Performance Tests

#### 8.1 Response Time
- [ ] **Test:** Historical balance query performance (7 days)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/historical-balances?period=7days`
  - **Expected:** Response time < 500ms
  - **Status:** 200 OK

- [ ] **Test:** Historical balance query performance (6 months)
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/historical-balances?period=6months`
  - **Expected:** Response time < 2000ms
  - **Status:** 200 OK

- [ ] **Test:** Transaction list query performance
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?limit=100`
  - **Expected:** Response time < 1000ms
  - **Status:** 200 OK

#### 8.2 Pagination
- [ ] **Test:** Paginate transactions
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?page=1&page_size=50`
  - **Expected:** Returns 50 transactions with pagination metadata
  - **Status:** 200 OK
  - **Data:** `{ "Data": { "Transactions": [...], "Links": { "Self": "...", "Next": "..." }, "Meta": { "TotalPages": 5, "Page": 1 } } }`

- [ ] **Test:** Request page beyond available data
  - **Endpoint:** `GET /api/v1/admin/merchant-accounts/{id}/transactions?page=999`
  - **Expected:** Returns empty array or error
  - **Status:** 200 OK or 404 Not Found

---

### 9. Integration Tests

#### 9.1 Webhook Integration
- [ ] **Test:** Receive merchant account balance update webhook
  - **Setup:** Configure webhook endpoint
  - **Action:** Balance changes
  - **Expected:** Webhook received with balance update
  - **Payload:** `{ "event": "merchant_account.balance_updated", "account_id": "...", "balance": 1234.56 }`

- [ ] **Test:** Receive transaction webhook
  - **Setup:** Configure webhook endpoint
  - **Action:** New transaction on merchant account
  - **Expected:** Webhook received with transaction details
  - **Payload:** `{ "event": "merchant_account.transaction_created", "transaction_id": "...", "amount": 100.00 }`

#### 9.2 API Endpoint Integration
- [ ] **Test:** Verify merchant account endpoints match TrueLayer API reference
  - **Reference:** `https://docs.truelayer.com/reference/list-operating-accounts`
  - **Expected:** Our endpoints match TrueLayer format
  - **Status:** Verified

---

## 📊 Test Coverage Summary

### By Category
- **Access & Setup:** 6 tests
- **Dashboard Features:** 8 tests
- **Transactions:** 12 tests
- **Account Details:** 2 tests
- **Sweeping:** 4 tests
- **Differences from Payments View:** 4 tests
- **Error Handling:** 5 tests
- **Performance:** 4 tests
- **Integration:** 3 tests

**Total:** 48 test cases

### Priority Levels
- **🔴 Critical:** 20 tests (Access, Transactions, Error Handling)
- **🟡 High:** 15 tests (Dashboard, Account Details, Sweeping)
- **🟢 Medium:** 10 tests (Performance, Integration)
- **⚪ Low:** 3 tests (Legacy format, edge cases)

---

## 🧪 Test Implementation

### Test File Structure
```
buffr/
├── __tests__/
│   └── api/
│       └── merchant-accounts.test.ts  # Main test file
├── scripts/
│   └── test-merchant-accounts.ts     # Integration test script
└── docs/
    └── MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md  # This file
```

### Test Framework
- **Unit Tests:** Jest/Vitest
- **Integration Tests:** Custom test script (TypeScript)
- **E2E Tests:** Playwright or Cypress (for UI if applicable)

### Test Data Requirements
- Sandbox merchant accounts (EUR, GBP)
- Test transactions (various types, dates, statuses)
- Test business account for sweeping
- Mock webhook endpoints

---

## ✅ Success Criteria

All tests must pass before considering merchant account dashboard feature complete:

1. ✅ All critical tests pass (20/20)
2. ✅ All high priority tests pass (15/15)
3. ✅ Response times meet performance requirements
4. ✅ Error handling matches Open Banking standards
5. ✅ CSV exports match TrueLayer format exactly
6. ✅ Webhook integration verified
7. ✅ Admin authorization enforced

---

## 📝 Notes

### Key Differences from Payments View
- Merchant account dashboard shows **bank processing time**, not payment creation time
- Pending payments are **excluded** from historical balances
- Pending payouts **can be shown** in transactions
- CSV export has **11 core columns** (vs more in payments view)

### TrueLayer Compliance
- All endpoints must follow Open Banking v1 format
- Error responses must use Open Banking error codes
- CSV exports must match TrueLayer format exactly
- Webhook payloads must match TrueLayer webhook format

---

**Last Updated:** January 26, 2026  
**Next Steps:** Implement test cases in `__tests__/api/merchant-accounts.test.ts`
