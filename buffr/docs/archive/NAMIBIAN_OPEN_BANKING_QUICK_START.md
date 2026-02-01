# 🚀 Namibian Open Banking - Quick Start Guide for Buffr

**Date:** January 26, 2026  
**Purpose:** Quick setup guide for Namibian Open Banking Standards implementation in Buffr

---

## 📋 Prerequisites

1. ✅ Database (PostgreSQL/Neon)
2. ✅ Environment variables configured
3. ✅ Node.js dependencies installed
4. ✅ Python dependencies installed (for FastAPI backend)

---

## 🗄️ Step 1: Database Setup

### Run Migration

```bash
# Connect to your database
psql $DATABASE_URL

# Run migration
\i sql/migration_namibian_open_banking.sql
```

Or use the migration script:

```bash
npm run migrate -- migration_namibian_open_banking.sql
```

### Verify Tables

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'oauth_consents',
  'oauth_authorization_codes',
  'oauth_par_requests',
  'service_level_metrics',
  'participants',
  'payments',
  'automated_request_tracking'
);

-- Verify Buffr is registered as Data Provider
SELECT * FROM participants WHERE participant_id = 'API000001';
```

### Register TPP (Example)

```sql
-- Register a TPP for testing
INSERT INTO participants (participant_id, name, role, status)
VALUES ('API123456', 'Test TPP', 'TPP', 'Active');
```

---

## ⚙️ Step 2: Environment Variables

Add to `.env.local`:

```bash
# Data Provider Participant ID (Buffr)
DATA_PROVIDER_PARTICIPANT_ID=API000001

# JWT Secrets (for OAuth tokens)
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Database URL (already configured)
DATABASE_URL=postgresql://...
```

---

## 🧪 Step 3: Test Consent Flow

### 3.1 Generate PKCE Challenge (Client Side)

```typescript
import { generatePKCEChallenge } from '@/utils/namibianOpenBanking';

const pkce = generatePKCEChallenge();
console.log('Code Verifier:', pkce.codeVerifier);
console.log('Code Challenge:', pkce.codeChallenge);
```

### 3.2 Create Pushed Authorization Request (PAR)

```bash
curl -X POST http://localhost:3000/bon/v1/common/par \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "Data": {
      "client_id": "API123456",
      "redirect_uri": "https://tpp-app.com/callback",
      "response_type": "code",
      "scope": "banking:accounts.basic.read banking:payments.write",
      "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      "code_challenge_method": "S256"
    }
  }'
```

**Response:**
```json
{
  "Data": {
    "request_uri": "urn:ietf:params:oauth:request_uri:abc123",
    "expires_in": 600
  }
}
```

### 3.3 Account Holder Authorization

**Note:** This step requires Account Holder to authenticate and grant consent through a UI. The authorization code is returned to the TPP's redirect URI.

### 3.4 Exchange Authorization Code for Tokens

```bash
curl -X POST http://localhost:3000/bon/v1/common/token \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "authorization-code-from-step-3.3",
    "redirect_uri": "https://tpp-app.com/callback",
    "client_id": "API123456",
    "code_verifier": "code-verifier-from-step-3.1"
  }'
```

**Response:**
```json
{
  "Data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "refresh_token": "refresh-token-123",
    "scope": "banking:accounts.basic.read banking:payments.write",
    "consent_id": "consent-uuid-123"
  }
}
```

---

## 📡 Step 4: Test API Endpoints

### 4.1 List Accounts (AIS)

```bash
curl -X GET "http://localhost:3000/bon/v1/banking/accounts?page=1&page-size=25" \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Authorization: Bearer {access_token_from_step_3.4}"
```

### 4.2 Get Account Balance (AIS)

```bash
curl -X GET "http://localhost:3000/bon/v1/banking/accountbalance?AccountId=wallet-123" \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Authorization: Bearer {access_token}"
```

### 4.3 List Transactions (AIS)

```bash
curl -X GET "http://localhost:3000/bon/v1/banking/transactions?AccountId=wallet-123&page=1&page-size=25" \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Authorization: Bearer {access_token}"
```

### 4.4 Make Payment (PIS)

```bash
curl -X POST http://localhost:3000/bon/v1/banking/payments \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "Data": {
      "AccountId": "wallet-123",
      "Amount": "50.00",
      "Currency": "NAD",
      "BeneficiaryAccountId": "wallet-456",
      "BeneficiaryName": "Jane Doe",
      "Reference": "Test payment",
      "PaymentType": "Domestic On-us"
    }
  }'
```

### 4.5 Get Payment Status (PIS)

```bash
curl -X GET "http://localhost:3000/bon/v1/banking/payments/payment-123" \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Authorization: Bearer {access_token}"
```

### 4.6 List Beneficiaries (PIS)

```bash
curl -X GET "http://localhost:3000/bon/v1/banking/beneficiaries?page=1&page-size=25" \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Authorization: Bearer {access_token}"
```

---

## 🔄 Step 5: Refresh Access Token

When access token expires (after 1 hour):

```bash
curl -X POST http://localhost:3000/bon/v1/common/token \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "refresh-token-from-step-3.4",
    "client_id": "API123456"
  }'
```

---

## 🚫 Step 6: Revoke Consent

```bash
curl -X POST http://localhost:3000/bon/v1/common/revoke \
  -H "ParticipantId: API123456" \
  -H "x-v: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "refresh-token-123",
    "token_type_hint": "refresh_token"
  }'
```

**Response:** `200 OK` (no body)

---

## 📊 Step 7: Monitor Service Levels

### View Metrics

```typescript
import { getServiceLevelMetrics } from '@/utils/serviceLevelMonitoring';

const metrics = await getServiceLevelMetrics(
  '/bon/v1/banking/accounts',
  'API123456'
);

console.log('Availability:', metrics.availability); // Should be >= 0.999
console.log('Median Response Time:', metrics.medianResponseTime); // Should be <= 300ms
```

### Generate Report

```typescript
import { generateServiceLevelReport } from '@/utils/serviceLevelMonitoring';

const report = await generateServiceLevelReport(
  new Date('2026-01-01'),
  new Date('2026-01-31')
);

console.log('Overall Availability:', report.overall.availability);
console.log('Availability Target Met:', report.targets.availability.met);
console.log('Response Time Target Met:', report.targets.responseTime.met);
```

---

## ✅ Verification Checklist

- [ ] Database migration run successfully
- [ ] Data Provider registered (API000001)
- [ ] TPP registered (API123456)
- [ ] Environment variables set
- [ ] PAR endpoint working
- [ ] Token endpoint working
- [ ] List Accounts endpoint working
- [ ] Get Balance endpoint working
- [ ] List Transactions endpoint working
- [ ] Make Payment endpoint working
- [ ] Get Payment Status endpoint working
- [ ] List Beneficiaries endpoint working
- [ ] Token refresh working
- [ ] Token revocation working
- [ ] Service level metrics being recorded

---

## 🔧 Troubleshooting

### Error: "Participant not found"
- **Solution:** Register participant in `participants` table

### Error: "Invalid ParticipantId format"
- **Solution:** Ensure Participant ID follows `APInnnnnn` format (e.g., `API123456`)

### Error: "Invalid or expired access token"
- **Solution:** Token may have expired (1 hour). Use refresh token to get new access token.

### Error: "Consent does not include required scope"
- **Solution:** Request consent with required scopes during PAR creation.

### Error: "Insufficient funds"
- **Solution:** Ensure account has sufficient balance for payment.

---

## 📚 Next Steps

1. **Implement Authorization UI** - Create Account Holder consent interface
2. **Set up mTLS** - Configure mutual TLS with QWACs
3. **Create Developer Portal** - OpenAPI documentation and testing tools
4. **Monitor Service Levels** - Set up alerts for availability and response time
5. **Add More Payment Types** - Implement Domestic EFT (EnCR, NRTC)

---

**Quick Start Guide Version:** 1.0  
**Last Updated:** January 26, 2026
