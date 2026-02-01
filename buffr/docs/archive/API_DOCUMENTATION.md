# Buffr API Documentation

**Last Updated**: January 26, 2026  
**Version**: 2.0.0  
**Base URL**: `/api` (legacy) or `/api/v1` (Open Banking)

---

## 📚 Additional API References

This document covers core API patterns. For specific API references, see:
- **Analytics API:** `ANALYTICS_API_REFERENCE.md` (merged into this document)
- **Split Bill API:** `SPLIT_BILL_API_REFERENCE.md` (merged into this document)
- **Voucher Backend:** `VOUCHER_BACKEND_IMPLEMENTATIONS.md` (merged into this document)
- **Open Banking:** `OPEN_BANKING_COMPLETE_GUIDE.md` (complete Open Banking API reference)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Security Patterns](#security-patterns)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Endpoint Reference](#endpoint-reference)
8. [Code Examples](#code-examples)

---

## Overview

The Buffr API is a RESTful API built with Next.js and Expo Router. All endpoints follow consistent security patterns, response formats, and error handling.

### Key Features

- ✅ **Standardized Security**: All endpoints use security wrappers
- ✅ **Consistent Responses**: Standardized response helpers
- ✅ **Rate Limiting**: Three-tier rate limiting system
- ✅ **Input Validation**: Comprehensive validation on all inputs
- ✅ **Error Handling**: Consistent error responses across all endpoints

---

## Authentication

### JWT Token Authentication

Most endpoints require authentication via JWT tokens in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

### Getting an Access Token

**POST** `/api/auth/login`

```json
{
  "phoneNumber": "+264811234567",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "user-uuid",
      "phoneNumber": "+264811234567",
      "fullName": "John Doe"
    }
  }
}
```

### Refreshing Tokens

**POST** `/api/auth/refresh`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

## Security Patterns

All API endpoints use standardized security wrappers for consistent security implementation.

### 1. Public Endpoints (`secureRoute`)

For endpoints that don't require authentication but need rate limiting:

```typescript
import { secureRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse } from '@/utils/apiResponse';

async function getHandler(req: ExpoRequest) {
  // Handler logic
  return successResponse({ data: 'public data' });
}

export const GET = secureRoute(RATE_LIMITS.api, getHandler);
```

**Features:**
- ✅ IP-based rate limiting
- ✅ Security headers (CORS, XSS protection, etc.)
- ✅ No authentication required

**Example Endpoint:** `/api/utilities/sponsored`

---

### 2. Authenticated Endpoints (`secureAuthRoute`)

For endpoints that require user authentication:

```typescript
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { getUserIdFromRequest } from '@/utils/db';

async function getHandler(req: ExpoRequest) {
  const userId = await getUserIdFromRequest(req);
  
  if (!userId) {
    return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
  }
  
  // Handler logic with userId
  return successResponse({ data: 'user data' });
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
```

**Features:**
- ✅ User-based rate limiting
- ✅ JWT token validation
- ✅ Security headers
- ✅ User ID extraction

**Example Endpoints:**
- `/api/users/me`
- `/api/wallets`
- `/api/transactions`
- `/api/groups`

---

### 3. Admin Endpoints (`secureAdminRoute`)

For endpoints that require admin privileges:

```typescript
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { getUserIdFromRequest } from '@/utils/db';

async function getHandler(req: ExpoRequest) {
  // Admin auth is handled by secureAdminRoute wrapper
  const adminUserId = await getUserIdFromRequest(req);
  
  // Handler logic
  return successResponse({ data: 'admin data' });
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
```

**Features:**
- ✅ Admin role verification
- ✅ Admin-tier rate limiting
- ✅ JWT token validation
- ✅ Security headers

**Example Endpoints:**
- `/api/admin/users`
- `/api/admin/transactions`
- `/api/compliance/incidents`
- `/api/compliance/dormancy`

---

## Response Format

All API responses follow a consistent structure:

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Optional success message"
}
```

**Status Codes:**
- `200 OK` - Standard success response
- `201 Created` - Resource created successfully
- `204 No Content` - Success with no response body

### Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Status Codes:**
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Validation Error Response

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "field1": "Error message for field1",
    "field2": "Error message for field2"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [
    // Array of items
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "hasMore": true
    }
  }
}
```

---

## Error Handling

### Standardized Error Responses

All endpoints use standardized error response helpers:

```typescript
import { 
  errorResponse, 
  notFoundResponse, 
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  HttpStatus 
} from '@/utils/apiResponse';

// Generic error
return errorResponse('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);

// Not found
return notFoundResponse('User', userId);

// Unauthorized
return unauthorizedResponse('Invalid token');

// Forbidden
return forbiddenResponse('Admin access required');

// Validation errors
return validationErrorResponse({
  email: 'Invalid email format',
  password: 'Password too short'
}, 'Validation failed');
```

### Error Response Consistency

All error responses:
- ✅ Include `success: false`
- ✅ Include `error` message
- ✅ Use appropriate HTTP status codes
- ✅ Include `Content-Type: application/json` header

---

## Rate Limiting

The API implements three-tier rate limiting:

| Tier | Limit | Window | Use Case |
|------|-------|--------|----------|
| **auth** | 5 requests | 15 minutes | Authentication endpoints |
| **api** | 100 requests | 15 minutes | Standard API endpoints |
| **payment** | 20 requests | 15 minutes | Payment-related endpoints |
| **admin** | 50 requests | 15 minutes | Admin endpoints |

### Rate Limit Headers

When rate limited, responses include:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900
Content-Type: application/json

{
  "success": false,
  "error": "Too many requests",
  "retryAfter": 900
}
```

---

## Endpoint Reference

### Authentication

#### POST `/api/auth/login`
Authenticate user and receive access token.

**Request:**
```json
{
  "phoneNumber": "+264811234567",
  "password": "password123"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": { /* user object */ }
  }
}
```

**Security:** `secureRoute` (public, rate limited)

---

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Security:** `secureRoute` (public, rate limited)

---

### Users

#### GET `/api/users/me`
Get current authenticated user's profile.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "phoneNumber": "+264811234567",
    "fullName": "John Doe",
    "email": "john@example.com",
    "isVerified": true
  }
}
```

**Security:** `secureAuthRoute` (authenticated)

---

### Wallets

#### GET `/api/wallets`
List all wallets for authenticated user.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "wallet-uuid",
      "name": "Main Wallet",
      "balance": 1000.00,
      "currency": "NAD",
      "isDefault": true
    }
  ]
}
```

**Security:** `secureAuthRoute` (authenticated)

---

#### POST `/api/wallets`
Create a new wallet.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "name": "Savings Wallet",
  "currency": "NAD",
  "type": "savings"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "wallet-uuid",
    "name": "Savings Wallet",
    "balance": 0.00,
    "currency": "NAD"
  }
}
```

**Security:** `secureAuthRoute` (authenticated)

---

### Transactions

#### GET `/api/transactions`
List transactions for authenticated user.

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by type (`sent`, `received`, `payment`)

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "transaction-uuid",
      "amount": 100.00,
      "currency": "NAD",
      "type": "sent",
      "status": "completed",
      "description": "Payment to John",
      "date": "2026-01-17T10:00:00Z"
    }
  ]
}
```

**Security:** `secureAuthRoute` (authenticated)

---

### Payments

#### POST `/api/payments/send`
Send money to another user.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Request:**
```json
{
  "toUserId": "recipient-uuid",
  "amount": 100.00,
  "currency": "NAD",
  "walletId": "wallet-uuid",
  "description": "Payment for services"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "transactionId": "transaction-uuid",
    "amount": 100.00,
    "status": "completed"
  }
}
```

**Security:** `secureAuthRoute` with `RATE_LIMITS.payment` (authenticated, payment rate limit)

---

### Admin Endpoints

#### GET `/api/admin/users`
List all users (admin only).

**Headers:**
```http
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `search` (optional): Search by email, phone, or name
- `status` (optional): Filter by status
- `role` (optional): Filter by role
- `limit` (optional): Pagination limit (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [ /* user objects */ ],
    "pagination": {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Security:** `secureAdminRoute` (admin only)

---

## Code Examples

### Complete Endpoint Example

```typescript
/**
 * Example: User Profile Endpoint
 * Location: app/api/users/me.ts
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { queryOne, getUserIdFromRequest } from '@/utils/db';

async function getHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const user = await queryOne(
      'SELECT id, phone_number, full_name, email, is_verified FROM users WHERE id = $1',
      [userId]
    );

    if (!user) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    return successResponse({
      id: user.id,
      phoneNumber: user.phone_number,
      fullName: user.full_name,
      email: user.email,
      isVerified: user.is_verified,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
```

### Error Handling Example

```typescript
import { 
  errorResponse, 
  validationErrorResponse,
  notFoundResponse,
  HttpStatus 
} from '@/utils/apiResponse';
import { validateAmount, validateUUID } from '@/utils/validators';

async function createPaymentHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    
    // Validation
    const errors: Record<string, string> = {};
    
    if (!validateUUID(body.toUserId)) {
      errors.toUserId = 'Invalid user ID';
    }
    
    if (!validateAmount(body.amount)) {
      errors.amount = 'Amount must be greater than 0';
    }
    
    if (Object.keys(errors).length > 0) {
      return validationErrorResponse(errors, 'Validation failed');
    }
    
    // Check if recipient exists
    const recipient = await queryOne('SELECT id FROM users WHERE id = $1', [body.toUserId]);
    if (!recipient) {
      return notFoundResponse('User', body.toUserId);
    }
    
    // Process payment...
    return createdResponse({ transactionId: '...' }, '/api/transactions/...');
    
  } catch (error: any) {
    return errorResponse(
      error instanceof Error ? error.message : 'Payment failed',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
```

### Admin Endpoint Example

```typescript
/**
 * Example: Admin User Management
 * Location: app/api/admin/users/[id]/route.ts
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { queryOne, getUserIdFromRequest } from '@/utils/db';

async function getHandler(
  request: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper
    const adminUserId = await getUserIdFromRequest(request);
    
    const user = await queryOne(
      'SELECT * FROM users WHERE id = $1',
      [params.id]
    );
    
    if (!user) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }
    
    return successResponse({
      id: user.id,
      phoneNumber: user.phone_number,
      fullName: user.full_name,
      email: user.email,
      status: user.status,
      role: user.role,
    });
  } catch (error: any) {
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
```

---

## Best Practices

### 1. Always Use Security Wrappers

✅ **DO:**
```typescript
export const GET = secureAuthRoute(RATE_LIMITS.api, handler);
```

❌ **DON'T:**
```typescript
export const GET = handler; // Missing security!
```

### 2. Use Standardized Response Helpers

✅ **DO:**
```typescript
return successResponse({ data: 'result' });
return errorResponse('Error message', HttpStatus.BAD_REQUEST);
```

❌ **DON'T:**
```typescript
return new Response(JSON.stringify({ data: 'result' }), { status: 200 });
```

### 3. Validate All Inputs

✅ **DO:**
```typescript
if (!validateAmount(amount)) {
  return validationErrorResponse({ amount: 'Invalid amount' });
}
```

❌ **DON'T:**
```typescript
// No validation - security risk!
```

### 4. Handle Errors Consistently

✅ **DO:**
```typescript
try {
  // Logic
} catch (error: any) {
  return errorResponse(
    error instanceof Error ? error.message : 'Operation failed',
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
```

### 5. Use Appropriate Status Codes

- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST (resource created)
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Additional API References

### Analytics API
See `ANALYTICS_API_REFERENCE.md` for complete analytics endpoints:
- Transaction analytics
- User behavior analytics
- Merchant analytics
- Geographic analytics
- Payment method analytics
- Channel analytics
- Product development insights

### Split Bill API
See `SPLIT_BILL_API_REFERENCE.md` for split bill endpoints:
- Create split bill
- Pay split bill share
- Split bill status flow
- Participant management

### Voucher Backend
See `VOUCHER_BACKEND_IMPLEMENTATIONS.md` for voucher implementation details:
- Core voucher API endpoints
- External service integrations
- NamQR integration
- Security & compliance

### Open Banking APIs
See `OPEN_BANKING_COMPLETE_GUIDE.md` for complete Open Banking v1 API reference (134/141 endpoints)

---

## Additional Resources

- **[API Security Standardization](./API_SECURITY_STANDARDIZATION.md)** - Detailed security implementation guide
- **[Migration Resolution Plan](../MIGRATION_RESOLUTION_PLAN.md)** - Complete API audit and standardization status
- **[API Design Principles](../.claude/skills/api-design/SKILL.md)** - API design best practices
- **[API Endpoints Database Mapping](./API_ENDPOINTS_DATABASE_MAPPING.md)** - Complete endpoint to database mapping
- **[Testing API Database Mapping](./TESTING_API_DATABASE_MAPPING.md)** - Testing guide for API/database mapping

---

**Last Updated**: January 26, 2026  
**Status**: ✅ Complete - All 141 endpoints documented (68 legacy + 134 Open Banking v1)
