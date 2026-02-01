# AI Backend Complete Guide

**Date:** January 26, 2026  
**Status:** ✅ **Migration Complete - Python Backend Active**  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Migration Summary](#migration-summary)
3. [Architecture](#architecture)
4. [Environment Variables](#environment-variables)
5. [API Reference](#api-reference)
6. [Testing Guide](#testing-guide)
7. [Deployment](#deployment)

---

## Overview

The Buffr AI Backend provides intelligent agent services for the G2P voucher platform. The backend has been migrated from TypeScript to Python for better ML ecosystem support and developer experience.

### Current Status

- ✅ **Python Backend Active** - Port 8001
- ✅ **TypeScript Backend Deprecated** - Port 8000 (can be removed)
- ✅ **Migration Complete** - All features implemented
- ✅ **API Compatibility** - Response formats match TypeScript

### Key Features

- **Multi-Agent System** - Companion, Guardian, Transaction Analyst, Crafter, RAG
- **ML Models** - Fraud detection, credit scoring, spending analysis
- **Streaming Support** - Server-Sent Events (SSE) for real-time responses
- **Exchange Rate Scheduler** - Automatic twice-daily updates
- **Knowledge Graph** - Neo4j integration for RAG

---

## Migration Summary

### ✅ Migration Complete (January 22, 2026)

**Status:** 100% Implementation Complete

**Tasks Completed:**
1. ✅ Companion Agent Streaming Endpoint (SSE)
2. ✅ Exchange Rate Scheduler (background tasks)
3. ✅ Simple Chat Endpoint
4. ✅ Request Format Compatibility (camelCase/snake_case)
5. ✅ API Response Format Compatibility (success/data wrapper)
6. ✅ API Gateway & Client Updates (port 8001)

**Files Created:** 8 files  
**Files Updated:** 12 files  
**Endpoints Updated:** 15+ endpoints

### Migration Statistics

- **Total Endpoints:** 20+ endpoints
- **Endpoints Updated:** 15+ endpoints (response format)
- **New Endpoints Added:** 2 (streaming, simple chat)
- **Services Created:** 2 (exchange rate, scheduler)
- **Dependencies Added:** 1 (APScheduler)

---

## Architecture

### Multi-Agent System

#### 1. Companion Agent
**Purpose:** Multi-agent orchestrator and routing

**Endpoints:**
- `POST /api/companion/chat` - Main chat interface
- `POST /api/companion/chat/stream` - Streaming chat (SSE)
- `POST /api/companion/multi-agent` - Multi-agent coordination

**Features:**
- Conversation history
- Session management
- Multi-agent routing
- Streaming responses

#### 2. Guardian Agent
**Purpose:** Fraud detection & credit scoring

**Endpoints:**
- `POST /api/guardian/fraud/check` - Fraud detection
- `POST /api/guardian/credit/assess` - Credit scoring
- `POST /api/guardian/investigate` - Security investigation
- `POST /api/guardian/chat` - Security chat

**Features:**
- Real-time fraud detection
- Credit scoring models
- Security investigation
- Risk assessment

#### 3. Transaction Analyst Agent
**Purpose:** Spending analysis & classification

**Endpoints:**
- `POST /api/transaction-analyst/classify` - Transaction classification
- `POST /api/transaction-analyst/analyze` - Spending analysis
- `POST /api/transaction-analyst/budget` - Budget generation
- `POST /api/transaction-analyst/chat` - Financial insights chat

**Features:**
- Transaction classification
- Spending pattern analysis
- Budget recommendations
- Financial insights

#### 4. Crafter Agent
**Purpose:** Workflow automation

**Endpoints:**
- `POST /api/crafter/scheduled-payment` - Scheduled payments
- `POST /api/crafter/spending-alert` - Spending alerts
- `POST /api/crafter/automate-savings` - Savings automation
- `POST /api/crafter/workflow/create` - Workflow creation
- `POST /api/crafter/workflow/execute` - Workflow execution
- `GET /api/crafter/workflow/monitor/{user_id}` - Workflow monitoring
- `POST /api/crafter/chat` - Automation chat

**Features:**
- Scheduled payment automation
- Spending alerts
- Savings automation
- Custom workflow creation

#### 5. RAG Agent
**Purpose:** Knowledge base retrieval and search

**Endpoints:**
- `POST /api/chat` - RAG-powered chat
- `POST /api/chat/simple` - Simple chat (no RAG)
- `POST /api/search` - Knowledge base search

**Features:**
- Knowledge graph integration (Neo4j)
- Semantic search
- Context-aware responses
- Fast direct LLM responses (simple chat)

---

## Environment Variables

### Required Variables

```bash
# AI Backend URL
AI_BACKEND_URL=http://localhost:8001
BUFFR_AI_URL=http://localhost:8001

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# LLM Providers
DEEPSEEK_API_KEY=your-deepseek-key
OPENAI_API_KEY=your-openai-key  # Optional
ANTHROPIC_API_KEY=your-anthropic-key  # Optional

# Exchange Rate API
EXCHANGE_RATE_API_KEY=your-api-key  # Optional

# CORS Origins
CORS_ORIGINS=http://localhost:8081,http://localhost:19000,http://localhost:19006,http://localhost:3000
```

### Optional Variables

```bash
# Logging
LOG_LEVEL=info  # debug, info, warning, error

# Timeouts
LLM_TIMEOUT=60  # seconds

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60  # seconds
```

---

## API Reference

### Response Format

All endpoints return TypeScript-compatible format:

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

### Request Format

Supports both `camelCase` and `snake_case`:
- `userId` or `user_id`
- `sessionId` or `session_id`

---

## Testing Guide

### Pre-Testing Setup

1. **Start Python Backend:**
   ```bash
   cd buffr/buffr_ai
   uvicorn main:app --host 0.0.0.0 --port 8001 --reload
   ```

2. **Verify Health Check:**
   ```bash
   curl http://localhost:8001/health
   ```

### Endpoint Testing

#### Companion Chat
```bash
curl -X POST http://localhost:8001/api/companion/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "message": "Hello",
    "sessionId": "session-123"
  }'
```

#### Streaming Chat
```bash
curl -X POST http://localhost:8001/api/companion/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "message": "Hello",
    "sessionId": "session-123"
  }'
```

#### Fraud Check
```bash
curl -X POST http://localhost:8001/api/guardian/fraud/check \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "tx-123",
    "amount": 1000.00,
    "userId": "user-123"
  }'
```

### Test Script

```bash
cd buffr
./scripts/test-ai-backend.sh
```

---

## Deployment

### Production Deployment

1. **Set Environment Variables:**
   ```bash
   AI_BACKEND_URL=https://ai-backend.buffr.ai
   DATABASE_URL=postgresql://...
   DEEPSEEK_API_KEY=...
   ```

2. **Deploy to Platform:**
   - Railway
   - Render
   - Vercel (serverless functions)

3. **Update API Gateway:**
   - Update `app/api/gateway/route.ts` with production URL
   - Update `utils/buffrAIClient.ts` with production URL

### Health Monitoring

- Health check: `GET /health`
- Service info: `GET /`
- Admin monitoring: `GET /api/v1/admin/ai-monitoring`

---

## 📊 Migration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Companion Streaming** | ✅ Complete | SSE endpoint added |
| **Exchange Rate Scheduler** | ✅ Complete | Background task implemented |
| **Simple Chat** | ✅ Complete | Endpoint added |
| **Request Compatibility** | ✅ Complete | camelCase/snake_case support |
| **Response Compatibility** | ✅ Complete | All endpoints wrapped |
| **API Gateway** | ✅ Complete | Routing updated to port 8001 |
| **Client Libraries** | ✅ Complete | Base URL updated to port 8001 |
| **Documentation** | ✅ Complete | Testing guide, env guide created |

---

## 📚 Related Documentation

- **Migration Plan:** Original migration strategy
- **Testing Guide:** Comprehensive testing instructions
- **Environment Variables:** Complete env var reference
- **Gap Analysis:** Feature comparison and gaps

---

**Last Updated:** January 26, 2026  
**Status:** ✅ **Migration Complete - Production Ready**
