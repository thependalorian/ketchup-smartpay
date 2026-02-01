# 🚪 API Gateway Implementation Plan

**Date**: 2026-01-17  
**Status**: 📋 **Ready for Implementation**  
**Timeline**: 4 weeks  
**Owner**: DevOps Engineer + Backend Team

---

## 📊 Overview

This plan implements a unified API Gateway in Next.js to provide a single entry point for the mobile app, centralizing authentication, rate limiting, routing, and monitoring.

**Goal**: Unify client interface, reduce complexity, enable gradual backend consolidation.

---

## 🎯 Objectives

1. ✅ Single API endpoint for mobile app
2. ✅ Centralized authentication and authorization
3. ✅ Unified rate limiting and security
4. ✅ Improved observability and monitoring
5. ✅ Non-breaking change (backends remain unchanged)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         React Native Mobile App          │
└──────────────┬──────────────────────────┘
               │
               │ Single API Endpoint
               ▼
┌─────────────────────────────────────────┐
│      API Gateway (Next.js)               │
│      /api/gateway/*                      │
│                                          │
│  - Authentication                        │
│  - Rate Limiting                         │
│  - Request Routing                       │
│  - Response Aggregation                  │
│  - Logging & Monitoring                  │
└──────┬───────────┬───────────┬──────────┘
       │           │           │
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Next.js  │ │ FastAPI  │ │ AI       │
│ API      │ │ Backend  │ │ Backend  │
│ :3000    │ │ :8001    │ │ :8000    │
└──────────┘ └──────────┘ └──────────┘
```

---

## 📅 Implementation Timeline

### Week 1: Infrastructure Setup

**Day 1-2: Create Gateway Structure**
- [ ] Create `app/api/gateway/` directory
- [ ] Set up gateway route handler
- [ ] Create gateway configuration file
- [ ] Set up environment variables

**Day 3-4: Core Gateway Logic**
- [ ] Implement request routing logic
- [ ] Add backend service discovery
- [ ] Create request/response transformers
- [ ] Add error handling

**Day 5: Testing Infrastructure**
- [ ] Set up test environment
- [ ] Create mock backends for testing
- [ ] Write unit tests for routing logic

**Deliverable**: Basic gateway routing functional

---

### Week 2: Authentication & Security

**Day 1-2: Centralized Authentication**
- [ ] Implement JWT validation middleware
- [ ] Add token refresh logic
- [ ] Create authentication cache
- [ ] Handle authentication errors

**Day 3-4: Rate Limiting**
- [ ] Implement rate limiting per user/IP
- [ ] Add rate limit headers
- [ ] Create rate limit configuration
- [ ] Add rate limit bypass for internal calls

**Day 5: Security Headers**
- [ ] Add security headers middleware
- [ ] Implement CORS handling
- [ ] Add request validation
- [ ] Security testing

**Deliverable**: Gateway with authentication and rate limiting

---

### Week 3: Routing & Integration

**Day 1-2: Route Configuration**
- [ ] Map all mobile app endpoints to backends
- [ ] Create route configuration file
- [ ] Implement route matching logic
- [ ] Add route versioning support

**Day 3-4: Backend Integration**
- [ ] Integrate Next.js API routes
- [ ] Integrate FastAPI backend
- [ ] Integrate AI Backend
- [ ] Add health check routing

**Day 5: Response Handling**
- [ ] Implement response aggregation
- [ ] Add response transformation
- [ ] Handle errors from backends
- [ ] Add response caching

**Deliverable**: Full routing to all three backends

---

### Week 4: Monitoring & Deployment

**Day 1-2: Logging & Monitoring**
- [ ] Add request/response logging
- [ ] Implement metrics collection
- [ ] Add performance monitoring
- [ ] Create monitoring dashboard

**Day 3: Load Testing**
- [ ] Run load tests on gateway
- [ ] Test rate limiting under load
- [ ] Verify error handling
- [ ] Performance optimization

**Day 4: Documentation**
- [ ] Document gateway API
- [ ] Create migration guide for mobile app
- [ ] Update API_MAPPING.md
- [ ] Create runbook for operations

**Day 5: Deployment**
- [ ] Deploy to staging
- [ ] Gradual rollout to production
- [ ] Monitor metrics
- [ ] Rollback plan ready

**Deliverable**: Production-ready API Gateway

---

## 🛠️ Technical Implementation

### Gateway Route Structure

```typescript
// app/api/gateway/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { routeRequest } from '@/utils/gateway/router';
import { authenticateRequest } from '@/utils/gateway/auth';
import { applyRateLimit } from '@/utils/gateway/rateLimit';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGatewayRequest(request, params.path, 'POST');
}

// ... PUT, DELETE, PATCH

async function handleGatewayRequest(
  request: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limit
    const rateLimitResult = await applyRateLimit(request, authResult.userId);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // 3. Route to backend
    const response = await routeRequest(path, method, request, authResult);

    // 4. Log request
    await logGatewayRequest(request, path, method, response.status);

    return response;
  } catch (error) {
    console.error('Gateway error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Route Configuration

```typescript
// utils/gateway/routes.ts
export const GATEWAY_ROUTES = {
  // Next.js API routes (direct pass-through)
  '/api/users': { backend: 'nextjs', path: '/api/users' },
  '/api/wallets': { backend: 'nextjs', path: '/api/wallets' },
  '/api/transactions': { backend: 'nextjs', path: '/api/transactions' },
  
  // FastAPI routes
  '/api/payments': { backend: 'fastapi', path: '/api/v1/payments' },
  '/api/namqr': { backend: 'fastapi', path: '/api/v1/namqr' },
  '/api/ml': { backend: 'fastapi', path: '/api/v1/ml' },
  
  // AI Backend routes
  '/api/companion': { backend: 'ai', path: '/api/companion' },
  '/api/guardian': { backend: 'ai', path: '/api/guardian' },
  '/api/transaction-analyst': { backend: 'ai', path: '/api/transaction-analyst' },
};

export const BACKEND_URLS = {
  nextjs: process.env.NEXTJS_API_URL || 'http://localhost:3000',
  fastapi: process.env.FASTAPI_URL || 'http://localhost:8001',
  ai: process.env.AI_BACKEND_URL || 'http://localhost:8000',
};
```

### Authentication Middleware

```typescript
// utils/gateway/auth.ts
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { success: false, error: 'No token provided' };
  }

  try {
    // Validate JWT token (reuse existing auth logic)
    const user = await verifyJWT(token);
    return { success: true, userId: user.id, user };
  } catch (error) {
    return { success: false, error: 'Invalid token' };
  }
}
```

### Rate Limiting

```typescript
// utils/gateway/rateLimit.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function applyRateLimit(
  request: NextRequest,
  userId?: string
): Promise<RateLimitResult> {
  const key = userId ? `rate:user:${userId}` : `rate:ip:${request.ip}`;
  const limit = userId ? 1000 : 100; // Higher limit for authenticated users
  const window = 60; // 1 minute

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }

  const remaining = Math.max(0, limit - count);
  const reset = await redis.ttl(key);

  return {
    allowed: count <= limit,
    remaining,
    reset,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  };
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Route matching logic
- [ ] Authentication middleware
- [ ] Rate limiting logic
- [ ] Error handling

### Integration Tests
- [ ] End-to-end request flow
- [ ] Backend integration
- [ ] Error propagation
- [ ] Response transformation

### Load Tests
- [ ] Gateway throughput
- [ ] Rate limiting under load
- [ ] Concurrent requests
- [ ] Backend failure scenarios

---

## 📊 Monitoring & Metrics

### Key Metrics to Track
1. **Request Volume**: Requests per second by endpoint
2. **Latency**: P50, P95, P99 latency
3. **Error Rate**: 4xx, 5xx error percentages
4. **Rate Limiting**: Number of rate-limited requests
5. **Backend Health**: Response times from each backend

### Logging
- Request/response logging
- Error logging with stack traces
- Performance logging
- Security event logging

### Alerts
- High error rate (>5%)
- High latency (P95 > 1s)
- Backend down
- Rate limit threshold exceeded

---

## 🚀 Deployment Strategy

### Phase 1: Staging Deployment
1. Deploy gateway to staging environment
2. Update mobile app staging config to use gateway
3. Monitor for 1 week
4. Fix any issues

### Phase 2: Gradual Production Rollout
1. **Week 1**: 10% of traffic through gateway
2. **Week 2**: 50% of traffic through gateway
3. **Week 3**: 100% of traffic through gateway
4. Monitor metrics at each stage

### Phase 3: Mobile App Update
1. Update mobile app to use gateway endpoint
2. Release mobile app update
3. Monitor adoption
4. Deprecate direct backend calls

---

## 📝 Migration Checklist

### Pre-Migration
- [ ] All backends have health check endpoints
- [ ] Monitoring dashboards set up
- [ ] Rollback plan documented
- [ ] Team trained on gateway operations

### Migration
- [ ] Gateway deployed to staging
- [ ] Mobile app staging config updated
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Documentation updated

### Post-Migration
- [ ] Monitor metrics for 1 week
- [ ] Collect team feedback
- [ ] Optimize based on metrics
- [ ] Plan next phase (AI Backend migration)

---

## 🔒 Security Considerations

1. **Authentication**: Centralized JWT validation
2. **Authorization**: Role-based access control
3. **Rate Limiting**: Per-user and per-IP limits
4. **Input Validation**: Validate all requests
5. **Error Handling**: Don't expose internal errors
6. **Logging**: Log security events
7. **CORS**: Proper CORS configuration

---

## 📚 Documentation

- [ ] API Gateway architecture diagram
- [ ] Route configuration guide
- [ ] Mobile app migration guide
- [ ] Operations runbook
- [ ] Troubleshooting guide

---

## ✅ Success Criteria

1. ✅ Single API endpoint for mobile app
2. ✅ All requests routed correctly
3. ✅ Authentication working
4. ✅ Rate limiting effective
5. ✅ Monitoring operational
6. ✅ Zero downtime deployment
7. ✅ Performance within SLA (<200ms P95)

---

**Status**: 📋 **Ready for Implementation**  
**Next Step**: Form Tiger Team and begin Week 1 tasks
