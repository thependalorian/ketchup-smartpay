# Buffr API Guide

**Project**: Buffr Payment Application  
**Last Updated**: January 28, 2026  
**Status**: ✅ **Production Ready**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [Core Endpoints](#core-endpoints)
5. [Integration Examples](#integration-examples)

---

## Overview

Buffr provides a comprehensive REST API for:

- **User Management**: Registration, login, profile
- **Wallets**: Create, manage, transfer
- **Vouchers**: Redeem G2P vouchers
- **Payments**: NAMQR, merchant payments
- **Open Banking**: Account info, payment initiation

**Base URL**: `https://api.buffr.na/v1`  
**Environment**: Production

---

## Architecture

```
┌──────────────┐
│  Mobile App  │
└──────┬───────┘
       │
       │ HTTPS/TLS
       ▼
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  API Routes  │────►│  Services    │
└──────┬───────┘     └──────┬───────┘
       │                     │
       ▼                     ▼
┌──────────────┐     ┌──────────────┐
│  Middleware  │     │   Database   │
│ (Auth, Rate) │     │   (Neon PG)  │
└──────────────┘     └──────────────┘
```

---

## Authentication

### JWT Tokens

```typescript
// Login response
{
  "accessToken": "eyJhbGc...",  // 15 min expiry
  "refreshToken": "eyJhbGc...", // 7 days expiry
  "user": { ... }
}

// Use in requests
Authorization: Bearer <accessToken>
```

### API Key (Merchant)

```typescript
// Request headers
X-API-Key: your_api_key_here
X-API-Secret: your_api_secret_here
```

---

## Core Endpoints

### Authentication

**POST /auth/register**
```json
{
  "fullName": "John Doe",
  "phone": "+264812345678",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**POST /auth/login**
```json
{
  "phone": "+264812345678",
  "password": "SecurePass123!"
}
```

### Wallets

**GET /wallets**
```
Authorization: Bearer <token>
```

**Response**:
```json
{
  "wallets": [
    {
      "id": "uuid",
      "name": "Main Wallet",
      "balance": 1500.00,
      "currency": "NAD",
      "type": "main"
    }
  ]
}
```

**POST /wallets/transfer**
```json
{
  "fromWalletId": "uuid",
  "toPhone": "+264812345679",
  "amount": 100.00,
  "description": "Payment for lunch"
}
```

### Vouchers

**POST /vouchers/redeem**
```json
{
  "voucherCode": "ABC123456",
  "walletId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "amount": 500.00,
  "newBalance": 2000.00,
  "transactionId": "txn_xxx"
}
```

### NAMQR Payments

**POST /namqr/generate**
```json
{
  "merchantId": "uuid",
  "amount": 150.00,
  "currency": "NAD",
  "isStatic": false
}
```

**Response**:
```json
{
  "qrCodeData": "00020101021152...",
  "tokenVaultId": "12345678",
  "expiresAt": "2026-01-28T15:30:00Z"
}
```

---

## Integration Examples

### Transfer Money

```typescript
const response = await fetch('https://api.buffr.na/v1/wallets/transfer', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fromWalletId: walletId,
    toPhone: '+264812345679',
    amount: 100.00,
    description: 'Lunch payment',
  }),
});

const data = await response.json();
```

### Redeem Voucher

```typescript
const response = await fetch('https://api.buffr.na/v1/vouchers/redeem', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    voucherCode: 'ABC123456',
    walletId: walletId,
  }),
});

const data = await response.json();
```

---

## Error Handling

**Standard Error Response**:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid voucher code",
    "details": {
      "field": "voucherCode",
      "reason": "Voucher not found or already redeemed"
    }
  }
}
```

**HTTP Status Codes**:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10/min |
| Wallet operations | 30/min |
| Payment processing | 30/min |
| Read operations | 100/min |

---

**Status**: ✅ Production Ready  
**Version**: 1.0  
**Last Updated**: January 28, 2026
