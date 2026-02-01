# SmartPay Connect – cURL API Validation

**Purpose:** Validate backend API endpoints with curl.  
**Location:** `smartpay-connect/docs/CURL_VALIDATION.md`  
**Prerequisite:** Backend running on `http://localhost:3001` (or set `BASE_URL`).

---

## Base URL

```bash
BASE_URL="${BASE_URL:-http://localhost:3001}"
```

---

## 1. Health

```bash
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/health"
```

**Expected:** `200`, `{"status":"healthy","database":"connected",...}`

---

## 2. Ketchup – Vouchers

### List vouchers

```bash
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/vouchers"
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/vouchers?limit=5&status=redeemed"
```

**Expected:** `200`, `{"success":true,"data":[...]}`

### Get voucher by ID

```bash
# Replace VOUCHER_ID with an id from the list response
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/vouchers/VOUCHER_ID"
```

**Expected:** `200` with single voucher, or `404` if not found.

### Issue voucher (POST)

```bash
# Replace BENEFICIARY_ID with a valid beneficiary id from GET /api/v1/beneficiaries
curl -s -w "\nHTTP:%{http_code}" -X POST "$BASE_URL/api/v1/vouchers" \
  -H "Content-Type: application/json" \
  -d '{"beneficiaryId":"BENEFICIARY_ID","amount":100,"grantType":"social_grant"}'
```

**Expected:** `201`, `{"success":true,"data":{...},"message":"Voucher issued successfully"}`

### Delete voucher (only non-redeemed)

```bash
curl -s -w "\nHTTP:%{http_code}" -X DELETE "$BASE_URL/api/v1/vouchers/VOUCHER_ID"
```

**Expected:** `200` for non-redeemed, `400` for redeemed (audit trail).

---

## 3. Ketchup – Beneficiaries

```bash
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/beneficiaries"
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/beneficiaries/BENEFICIARY_ID"
```

**Expected:** `200`, `{"success":true,"data":...}`

---

## 4. Government – Monitoring & Analytics

### Regions summary

```bash
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/government/monitoring/regions/summary"
```

**Expected:** `200`, country-level summary.

### Regions list

```bash
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/government/monitoring/regions"
```

### Transactions (redeemed vouchers, paginated)

```bash
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/government/analytics/transactions?limit=5"
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/government/analytics/transactions?page=1&limit=10&region=Khomas"
```

**Expected:** `200`, `{"success":true,"data":{"transactions":[...],"total":N,"page":1,"limit":5}}`

### Financial summary & spend trend

```bash
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/government/analytics/financial"
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/government/analytics/spend-trend"
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/government/analytics/grant-types"
```

**Expected:** `200`.

---

## 5. Auth-required endpoints (401 without key)

These require `X-API-Key` (or configured auth). Without it, expect `401`.

```bash
# Dashboard metrics
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/dashboard/metrics"

# Webhooks list
curl -s -w "\nHTTP:%{http_code}" "$BASE_URL/api/v1/webhooks"
```

To test with API key (if set in backend):

```bash
curl -s -w "\nHTTP:%{http_code}" -H "X-API-Key: YOUR_API_KEY" "$BASE_URL/api/v1/dashboard/metrics"
```

---

## 6. One-liner validation (health + vouchers + beneficiaries + government)

```bash
BASE_URL="${BASE_URL:-http://localhost:3001}"
echo "Health:"    && curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" && echo ""
echo "Vouchers:" && curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/vouchers" && echo ""
echo "Beneficiaries:" && curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/beneficiaries" && echo ""
echo "Gov summary:" && curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/government/monitoring/regions/summary" && echo ""
echo "Gov transactions:" && curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/government/analytics/transactions?limit=5" && echo ""
```

**Expected:** All `200` (except auth-required endpoints if no key).

---

## Last run summary (example)

| Endpoint | HTTP | Notes |
|----------|------|--------|
| GET /health | 200 | DB connected |
| GET /api/v1/vouchers | 200 | List OK |
| GET /api/v1/vouchers/:id | 200 | Single OK |
| POST /api/v1/vouchers | 201 | Issue OK (with beneficiaryId, amount, grantType) |
| DELETE /api/v1/vouchers/:id | 200 | Non-redeemed only |
| GET /api/v1/beneficiaries | 200 | List OK |
| GET /api/v1/government/monitoring/regions/summary | 200 | OK |
| GET /api/v1/government/analytics/transactions | 200 | OK (Neon: no sql.join) |
| GET /api/v1/dashboard/metrics | 401 | Requires X-API-Key |
| GET /api/v1/webhooks | 401 | Requires X-API-Key |
