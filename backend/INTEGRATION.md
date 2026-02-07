/**
 * Ketchup-SmartPay + Buffr Integration Guide
 * 
 * Location: backend/INTEGRATION.md
 * Purpose: Document integration points between Ketchup-SmartPay backend and Buffr mobile app
 * 
 * Topics:
 * - Database sharing
 * - API communication
 * - Idempotency for duplicate prevention
 * - Reconciliation
 * - Environment configuration
 */

# Ketchup-SmartPay + Buffr Integration Guide

## Overview

Ketchup-SmartPay (backend) and Buffr (mobile app) are designed to work together as an integrated G2P voucher distribution system. This document describes how the two systems integrate.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Ketchup-SmartPay Backend                     │
│  (API Server + PostgreSQL Database + Distribution Engine)         │
├─────────────────────────────────────────────────────────────────┤
│  • Voucher management and distribution                           │
│  • Beneficiary registry                                         │
│  • Reconciliation with Buffr                                    │
│  • Compliance reporting                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Buffr      │    │   Buffr      │    │   Buffr      │
│   Mobile     │    │   API        │    │   Notify     │
│   App        │    │   Server     │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
```

## 1. Database Integration

### Shared Tables

Both systems can share the same PostgreSQL database (Neon):

| Table | Purpose | Access |
|-------|---------|--------|
| `vouchers` | Main voucher registry | Ketchup (RW), Buffr (R) |
| `beneficiaries` | Beneficiary registry | Ketchup (RW), Buffr (R) |
| `webhook_events` | Webhook delivery log | Ketchup (RW) |
| `reconciliation_records` | Status reconciliation | Ketchup (RW) |
| `idempotency_keys` | Duplicate prevention | Both (W) |

### Environment

```env
# In buffr/.env.local
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

## 2. API Communication

### Buffr API (from Ketchup)

Ketchup-SmartPay calls Buffr API for voucher distribution:

```typescript
// backend/src/services/distribution/BuffrAPIClient.ts

const BUFFR_API_URL = process.env.BUFFR_API_URL || 'https://api.buffr.com';
const BUFFR_API_KEY = process.env.BUFFR_API_KEY || '';

// Endpoints used:
const BUFFR_DISBURSE_ENDPOINT = '/api/utilities/vouchers/disburse';
const BUFFR_STATUS_ENDPOINT = '/api/v1/vouchers/{voucherId}';
```

### Ketchup API (from Buffr)

Buffr calls Ketchup API for beneficiary verification:

```typescript
// buffr/app/api/v1/distribution/receive/route.ts

const KETCHUP_SMARTPAY_API_URL = process.env.KETCHUP_SMARTPAY_API_URL;
const KETCHUP_SMARTPAY_API_KEY = process.env.KETCHUP_SMARTPAY_API_KEY;

// Endpoints:
const KETCHUP_BENEFICIARY_ENDPOINT = '/api/v1/beneficiaries';
```

## 3. Idempotency (Duplicate Prevention)

Both systems implement idempotency to prevent duplicate processing:

### Ketchup-SmartPay Implementation

```typescript
// backend/src/services/idempotency/IdempotencyService.ts

export class IdempotencyService {
  async getCachedResponse(
    idempotencyKey: string,
    endpointPrefix: string = ENDPOINT_DISTRIBUTION
  ): Promise<{ status: number; body: unknown } | null>
  
  async setCachedResponse(
    idempotencyKey: string,
    status: number,
    body: unknown,
    endpointPrefix: string = ENDPOINT_DISTRIBUTION
  ): Promise<void>
}
```

### Buffr Implementation

```typescript
// buffr/utils/idempotency.ts

export async function getCachedIdempotencyResponse(
  idempotencyKey: string,
  endpointPrefix: string = 'distribution'
): Promise<{ status: number; body: unknown } | null>

export async function setCachedIdempotencyResponse(
  idempotencyKey: string,
  status: number,
  body: unknown,
  endpointPrefix: string = 'distribution'
): Promise<void>
```

### Usage in API Routes

```typescript
// Both systems support these headers:
Idempotency-Key: <unique-key>
idempotency-key: <unique-key>  
x-idempotency-key: <unique-key>
```

### Idempotency Key Generation

```typescript
// SHA-256 hash of: voucher_id:status:timestamp
function generateIdempotencyKey(voucherId: string, status: string, timestamp?: string): string {
  const ts = timestamp || new Date().toISOString();
  return crypto.createHash('sha256').update(`${voucherId}:${status}:${ts}`).digest('hex');
}
```

## 4. Voucher Distribution Flow

```
1. Ketchup creates voucher
   └─→ INSERT INTO vouchers

2. Ketchup sends to Buffr
   └─→ POST /api/utilities/vouchers/disburse
       ├─ voucher_id, amount, beneficiary_id_number
       └─ Returns: deliveryId

3. Buffr notifies beneficiary
   └─→ In-app notification + SMS

4. Buffr sends status webhook to Ketchup
   └─→ POST /api/v1/webhooks/buffr
       ├─ event: voucher.redeemed
       └─ Idempotency-Key header

5. Ketchup updates status
   └─→ UPDATE vouchers SET status = 'redeemed'
```

## 5. Reconciliation

Ketchup periodically reconciles voucher status with Buffr:

```typescript
// backend/src/services/reconciliation/ReconciliationService.ts

async reconcileAll() {
  // For each voucher in Ketchup
  const buffrStatus = await buffrAPIClient.checkStatus(voucher.id);
  
  // Compare and log discrepancies
  if (ketchupStatus !== buffrStatus.status) {
    await sql`
      INSERT INTO reconciliation_records (
        voucher_id, ketchup_status, buffr_status, match
      ) VALUES (...)
    `;
  }
}
```

## 6. Environment Configuration

### Ketchup-SmartPay Backend

```env
# backend/.env.local

# Database (can be shared with buffr)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Buffr API (for distribution)
BUFFR_API_URL=https://api.buffr.com
BUFFR_API_KEY=your_buffr_api_key

# Idempotency (optional - can share with buffr)
# Use same DATABASE_URL for shared idempotency_keys table
```

### Buffr Mobile App

```env
# buffr/.env.local

# Database (can be shared with ketchup)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Ketchup API (for beneficiary verification)
KETCHUP_SMARTPAY_API_URL=http://localhost:3001
KETCHUP_SMARTPAY_API_KEY=your_ketchup_api_key

# Idempotency (optional - can share with ketchup)
# Use same DATABASE_URL for shared idempotency_keys table
```

## 7. Common Integration Issues

### 1. Duplicate Distribution

**Problem**: Same voucher sent to Buffr twice due to network retry.

**Solution**: Use idempotency keys:
```typescript
const idempotencyKey = generateIdempotencyKey(voucher.id, 'disburse');
const cached = await idempotencyService.getCachedResponse(idempotencyKey, 'distribution');
if (cached) return cached;
await distributionEngine.distribute(voucher);
await idempotencyService.setCachedResponse(idempotencyKey, 200, response, 'distribution');
```

### 2. Status Mismatch

**Problem**: Ketchup shows 'active' but Buffr shows 'redeemed'.

**Solution**: Run reconciliation:
```bash
cd backend && npm run reconcile
```

### 3. Webhook Duplicates

**Problem**: Buffr retries webhook, causing duplicate processing.

**Solution**: Use idempotency in webhook handler:
```typescript
router.post('/buffr', async (req, res) => {
  const idempotencyKey = req.headers['Idempotency-Key'];
  const cached = await idempotencyService.getCachedResponse(idempotencyKey, 'webhook');
  if (cached) return res.status(cached.status).json(cached.body);
  // ... process webhook
  await idempotencyService.setCachedResponse(idempotencyKey, 200, response, 'webhook');
});
```

## 8. Testing Integration

### Unit Tests

```bash
# Backend
cd backend && npm test -- --run tests/IdempotencyService.test.ts

# Buffr
cd buffr && npm test -- --testPathPattern="idempotency"
```

### Integration Tests

```bash
# Run full reconciliation test
cd backend && npm run test:reconciliation

# Run Buffr API integration
cd buffr && npm run test:integration
```

## 9. Monitoring

### Key Metrics

- Distribution success rate
- Reconciliation discrepancy count
- Idempotency cache hit rate
- Webhook delivery latency

### Logs

```bash
# Backend logs
tail -f backend/logs/combined.log | grep -E "(Buffr|distribution|reconciliation)"

# Buffr logs  
tail -f buffr/logs/combined.log | grep -E "(Ketchup|webhook|idempotency)"
```
