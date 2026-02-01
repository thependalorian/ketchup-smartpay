# API Endpoints to Database Schema Mapping

**Date:** January 22, 2026  
**Backends:** 
- Python AI Backend (FastAPI) - Port 8001
- TypeScript AI Backend (Express.js) - Port 8000
- Next.js API Routes - Port 3000
**Database:** Neon PostgreSQL  
**Status:** G2P Voucher Platform - Active Agents Only

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Python AI Backend (FastAPI)](#python-ai-backend-fastapi)
   - [Core System Endpoints](#core-system-endpoints)
   - [Guardian Agent Endpoints](#guardian-agent-endpoints)
   - [Transaction Analyst Agent Endpoints](#transaction-analyst-agent-endpoints)
   - [Companion Agent Endpoints](#companion-agent-endpoints)
   - [ML API Endpoints](#ml-api-endpoints)
   - [RAG Agent Endpoints](#rag-agent-endpoints)
3. [TypeScript AI Backend (Express.js)](#typescript-ai-backend-expressjs)
4. [Next.js API Routes](#nextjs-api-routes)
   - [Authentication](#authentication)
   - [Users](#users)
   - [Wallets](#wallets)
   - [Transactions](#transactions)
   - [Payments](#payments)
   - [Contacts & Groups](#contacts--groups)
   - [Money Requests](#money-requests)
   - [Notifications](#notifications)
   - [Vouchers](#vouchers)
   - [Utilities](#utilities)
   - [Admin](#admin)
   - [Analytics](#analytics)
   - [Compliance](#compliance)
   - [USSD](#ussd)
5. [Complete Database Schema](#complete-database-schema)
6. [Endpoint Summary by Database Table](#endpoint-summary-by-database-table)

---

## Overview

This document maps **ALL API endpoints across the entire project** to their corresponding database tables and operations.

**Project Structure:**
- **Python AI Backend** (FastAPI, Port 8001) - AI agents and ML services
- **TypeScript AI Backend** (Express.js, Port 8000) - Legacy AI backend (being phased out)
- **Next.js API Routes** (Port 3000) - Core application APIs (95+ endpoints)

**Active Agents (G2P Voucher Platform):**
- ✅ Guardian Agent (Fraud & Credit)
- ✅ Transaction Analyst Agent (Spending Analysis)
- ✅ Companion Agent (Orchestrator)

**Removed Agents (Not relevant to G2P vouchers):**
- ❌ Scout Agent (Market Intelligence)
- ❌ Mentor Agent (Financial Education)
- ❌ Crafter Agent (Workflow Automation) - Still exists in TypeScript backend but not in Python

---

## Python AI Backend (FastAPI)

### Core System Endpoints

### `GET /`
**Description:** Service information and endpoint listing  
**Database Tables:** None (static information)

### `GET /health`
**Description:** Health check for all services  
**Database Tables:** None (status checks only)

---

## Guardian Agent Endpoints

### `POST /api/guardian/fraud/check`
**Description:** Real-time fraud detection with AI reasoning  
**Request Model:** `FraudCheckRequest`  
**Response Model:** `FraudCheckResponse`

**Database Operations:**
- **READ:**
  - `transactions` - Fetch transaction history for user
  - `fraud_checks` - Get historical fraud check results
  - `users` - Get user profile data
- **WRITE:**
  - `fraud_checks` - INSERT new fraud check result
    - Columns: `transaction_id`, `user_id`, `session_id`, `fraud_probability`, `is_fraud`, `risk_level`, `recommended_action`, `logistic_score`, `neural_network_score`, `random_forest_score`, `gmm_anomaly_score`, `checked_at`, `metadata`
  - `sessions` - CREATE session if needed
    - Columns: `user_id`, `metadata`, `created_at`

**Key SQL Queries:**
```sql
-- Store fraud check
INSERT INTO fraud_checks (
    transaction_id, user_id, session_id,
    fraud_probability, is_fraud, risk_level,
    recommended_action, logistic_score, neural_network_score,
    random_forest_score, gmm_anomaly_score, checked_at
) VALUES (...);

-- Fetch transaction history
SELECT * FROM transactions
WHERE user_id = $1
ORDER BY transaction_time DESC
LIMIT 100;
```

---

### `POST /api/guardian/credit/assess`
**Description:** Credit scoring and risk assessment  
**Request Model:** `CreditAssessmentRequest`  
**Response Model:** `CreditAssessmentResponse`

**Database Operations:**
- **READ:**
  - `users` - Get user profile and KYC level
  - `transactions` - Calculate transaction statistics
  - `credit_assessments` - Get previous credit assessments
  - `merchants` - Get merchant data (if merchant_id provided)
- **WRITE:**
  - `credit_assessments` - INSERT new credit assessment
    - Columns: `user_id`, `merchant_id`, `session_id`, `credit_score`, `default_probability`, `credit_tier`, `max_loan_amount`, `recommended_interest_rate`, `logistic_score`, `random_forest_score`, `gradient_boosting_score`, `assessed_at`, `metadata`

**Key SQL Queries:**
```sql
-- Store credit assessment
INSERT INTO credit_assessments (
    user_id, merchant_id, session_id,
    credit_score, default_probability, credit_tier,
    max_loan_amount, recommended_interest_rate,
    logistic_score, random_forest_score, gradient_boosting_score,
    assessed_at
) VALUES (...);

-- Fetch merchant data
SELECT * FROM merchants WHERE id = $1;

-- Calculate transaction statistics
SELECT 
    COUNT(*) as transaction_count,
    SUM(amount) as total_volume,
    AVG(amount) as avg_amount,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_count
FROM transactions
WHERE user_id = $1;
```

---

### `POST /api/guardian/chat`
**Description:** Conversational fraud and credit risk assessment  
**Request Model:** `GuardianAgentResponse`  
**Response Model:** `GuardianAgentResponse`

**Database Operations:**
- **READ:**
  - `sessions` - Get or create session
  - `fraud_checks` - Get recent fraud checks for context
  - `credit_assessments` - Get recent credit assessments
  - `transactions` - Get transaction history
- **WRITE:**
  - `sessions` - CREATE session if needed
  - `fraud_checks` - INSERT fraud check results (if transaction analyzed)
  - `credit_assessments` - INSERT credit assessment (if credit check performed)

**Key SQL Queries:**
```sql
-- Create session
INSERT INTO sessions (user_id, metadata, created_at)
VALUES ($1, $2, $3)
RETURNING id;

-- Get recent fraud checks
SELECT * FROM fraud_checks
WHERE user_id = $1
ORDER BY checked_at DESC
LIMIT 10;
```

---

### `GET /api/guardian/health`
**Description:** Guardian Agent health check  
**Database Tables:** None (status check only)

---

## Transaction Analyst Agent Endpoints

### `POST /api/transaction-analyst/classify`
**Description:** Classify transaction into category  
**Request Model:** `TransactionClassificationRequest`  
**Response Model:** `TransactionClassificationResponse`

**Database Operations:**
- **READ:**
  - `transactions` - Fetch transaction to classify
  - `transaction_categories` - Get existing classification
- **WRITE:**
  - `transaction_categories` - INSERT/UPDATE classification
    - Columns: `transaction_id`, `category`, `subcategory`, `confidence`, `alternate_categories`, `classified_at`, `model_version`, `metadata`

**Key SQL Queries:**
```sql
-- Store classification
INSERT INTO transaction_categories (
    transaction_id, category, subcategory,
    confidence, alternate_categories, classified_at, model_version
) VALUES (...);

-- Get existing classification
SELECT * FROM transaction_categories
WHERE transaction_id = $1;
```

---

### `POST /api/transaction-analyst/analyze`
**Description:** Comprehensive spending pattern analysis  
**Request Model:** `SpendingAnalysisRequest`  
**Response Model:** `SpendingAnalysisResponse`

**Database Operations:**
- **READ:**
  - `transactions` - Fetch user transactions for time period
  - `transaction_categories` - Get category breakdown
  - `user_spending_features` - Get computed spending features
  - `spending_personas` - Get user's spending persona
  - `spending_analyses` - Get previous analyses
- **WRITE:**
  - `spending_analyses` - INSERT new analysis result
    - Columns: `session_id`, `user_id`, `period_start`, `period_end`, `total_spending`, `spending_trend`, `is_unusual_spending`, `top_categories`, `spending_by_category`, `insights`, `recommendations`, `analyzed_at`, `metadata`
  - `user_spending_features` - INSERT/UPDATE computed features
    - Columns: `user_id`, `period_start`, `period_end`, `total_spending`, `avg_transaction_amount`, `transaction_count`, `spending_volatility`, `spending_by_category`, `weekend_spending_ratio`, `evening_spending_ratio`, `cash_withdrawal_frequency`, `unique_merchants_count`, `computed_at`, `metadata`
  - `spending_personas` - INSERT/UPDATE persona assignment
    - Columns: `user_id`, `primary_persona`, `primary_confidence`, `persona_distribution`, `cluster_id`, `cluster_size`, `assigned_at`, `model_version`, `metadata`

**Key SQL Queries:**
```sql
-- Fetch user transactions
SELECT 
    id, user_id, amount, currency, transaction_type, status,
    merchant_name, merchant_category, transaction_time
FROM transactions
WHERE user_id = $1
  AND status = 'completed'
  AND transaction_time >= NOW() - INTERVAL '3 months'
ORDER BY transaction_time DESC;

-- Store spending analysis
INSERT INTO spending_analyses (
    session_id, user_id, period_start, period_end,
    total_spending, spending_trend, is_unusual_spending,
    top_categories, spending_by_category, insights, recommendations,
    analyzed_at
) VALUES (...);

-- Get cluster statistics (for peer comparison)
SELECT 
    COUNT(DISTINCT user_id) as group_size,
    AVG(total_spending) as average_spending,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_spending) as median_spending
FROM (
    SELECT user_id, SUM(amount) as total_spending
    FROM transactions
    WHERE status = 'completed'
      AND transaction_time >= NOW() - INTERVAL '3 months'
    GROUP BY user_id
) user_spending;
```

---

### `POST /api/transaction-analyst/budget`
**Description:** Generate personalized budget recommendations  
**Request Model:** `BudgetRequest`  
**Response Model:** `BudgetResponse`

**Database Operations:**
- **READ:**
  - `transactions` - Fetch spending history
  - `transaction_categories` - Get category breakdown
  - `user_spending_features` - Get spending patterns
  - `spending_personas` - Get user persona for recommendations
- **WRITE:**
  - `spending_analyses` - INSERT budget analysis
    - Columns: `user_id`, `recommendations` (contains budget data)

**Key SQL Queries:**
```sql
-- Get category spending
SELECT 
    merchant_category as category,
    SUM(amount) as category_spending,
    COUNT(*) as transaction_count
FROM transactions
WHERE user_id = $1
  AND status = 'completed'
  AND transaction_time >= NOW() - INTERVAL '3 months'
GROUP BY merchant_category
ORDER BY category_spending DESC;
```

---

### `POST /api/transaction-analyst/chat`
**Description:** Conversational spending analysis  
**Request Model:** Chat request  
**Response Model:** Chat response

**Database Operations:**
- **READ:**
  - `transactions` - Fetch transaction data
  - `spending_analyses` - Get previous analyses
  - `transaction_categories` - Get category data
- **WRITE:**
  - `spending_analyses` - INSERT analysis results

---

### `GET /api/transaction-analyst/health`
**Description:** Transaction Analyst health check  
**Database Tables:** None (status check only)

---

## Companion Agent Endpoints

### `POST /api/companion/chat`
**Description:** Main conversational interface (orchestrates other agents)  
**Request Model:** `ChatRequest`  
**Response Model:** `ChatResponse`

**Database Operations:**
- **READ:**
  - `sessions` - Get or create session
  - `conversations` - Get conversation history (if table exists)
  - `users` - Get user profile
  - `transactions` - Get transaction summary (via Guardian/Transaction Analyst)
  - `financial_goals` - Get user goals (if table exists)
  - `literacy_assessments` - Get literacy level (if table exists)
- **WRITE:**
  - `sessions` - CREATE session if needed
  - `conversations` - INSERT conversation record
    - Columns: `session_id`, `user_id`, `user_message`, `assistant_response`, `agents_consulted`, `created_at`

**Key SQL Queries:**
```sql
-- Store conversation
INSERT INTO conversations (
    session_id, user_id, user_message, assistant_response,
    agents_consulted, created_at
) VALUES ($1, $2, $3, $4, $5, $6);

-- Get conversation history
SELECT user_message, assistant_response, agents_consulted, created_at
FROM conversations
WHERE session_id = $1
ORDER BY created_at DESC
LIMIT 10;

-- Get user context
SELECT category, SUM(amount) as total, COUNT(*) as count
FROM transactions
WHERE user_id = $1
  AND status = 'completed'
GROUP BY category;
```

---

### `POST /api/companion/chat/stream`
**Description:** Streaming chat with Server-Sent Events (SSE)  
**Request Model:** `ChatRequest`  
**Response:** StreamingResponse (SSE format)

**Database Operations:**
- Same as `/api/companion/chat` (read/write operations)

---

### `POST /api/companion/multi-agent`
**Description:** Coordinate multiple agents for complex queries  
**Request Model:** `MultiAgentRequest`  
**Response Model:** `MultiAgentResponse`

**Database Operations:**
- **READ:**
  - All tables accessed by orchestrated agents:
    - `transactions` (via Guardian & Transaction Analyst)
    - `fraud_checks` (via Guardian)
    - `credit_assessments` (via Guardian)
    - `spending_analyses` (via Transaction Analyst)
    - `transaction_categories` (via Transaction Analyst)
- **WRITE:**
  - Results from orchestrated agents stored in respective tables

**Key SQL Queries:**
- Combines queries from Guardian and Transaction Analyst agents

---

### `GET /api/companion/context/{user_id}`
**Description:** Get comprehensive user context  
**Response Model:** `UserContextResponse`

**Database Operations:**
- **READ:**
  - `users` - Get user profile
  - `transactions` - Get transaction summary
  - `financial_goals` - Get active goals
  - `literacy_assessments` - Get literacy level
  - `spending_personas` - Get spending persona
  - `user_spending_features` - Get spending features

**Key SQL Queries:**
```sql
-- Get transaction summary
SELECT category, SUM(amount) as total, COUNT(*) as count
FROM transactions
WHERE user_id = $1
GROUP BY category;

-- Get active goals
SELECT goal_name, target_amount, target_date, category
FROM financial_goals
WHERE user_id = $1
  AND status = 'active'
ORDER BY target_date
LIMIT 3;

-- Get literacy level
SELECT literacy_level, overall_score
FROM literacy_assessments
WHERE user_id = $1
ORDER BY assessed_at DESC
LIMIT 1;
```

---

### `GET /api/companion/history/{session_id}`
**Description:** Get conversation history for session  
**Response Model:** List of conversation messages

**Database Operations:**
- **READ:**
  - `conversations` - Get conversation history
    - Columns: `user_message`, `assistant_response`, `agents_consulted`, `created_at`

**Key SQL Queries:**
```sql
SELECT user_message, assistant_response, agents_consulted, created_at
FROM conversations
WHERE session_id = $1
ORDER BY created_at DESC
LIMIT $2;
```

---

### `GET /api/companion/health`
**Description:** Companion Agent health check  
**Database Tables:** None (status check only)

---

## ML API Endpoints

### `POST /api/ml/fraud/check`
**Description:** Direct ML model inference for fraud detection  
**Database Operations:**
- **READ:**
  - `ml_models` - Get model metadata
  - `predictions` - Store prediction history
- **WRITE:**
  - `predictions` - INSERT prediction record
    - Columns: `model_id`, `prediction_type`, `input_features`, `prediction_result`, `confidence`, `inference_time_ms`, `reference_type`, `reference_id`, `predicted_at`, `metadata`

---

### `POST /api/ml/credit/assess`
**Description:** Direct ML model inference for credit scoring  
**Database Operations:**
- **READ:**
  - `ml_models` - Get model metadata
- **WRITE:**
  - `predictions` - INSERT prediction record

---

### `POST /api/ml/transactions/classify`
**Description:** Direct ML model inference for transaction classification  
**Database Operations:**
- **READ:**
  - `ml_models` - Get model metadata
- **WRITE:**
  - `predictions` - INSERT prediction record
  - `transaction_categories` - INSERT classification result

---

### `POST /api/ml/spending/analyze`
**Description:** Direct ML model inference for spending analysis  
**Database Operations:**
- **READ:**
  - `ml_models` - Get model metadata
- **WRITE:**
  - `predictions` - INSERT prediction record
  - `spending_analyses` - INSERT analysis result

---

## RAG Agent Endpoints

### `POST /chat`
**Description:** Conversational AI with knowledge graph  
**Database Operations:**
- **READ:**
  - `documents` - Get document metadata
  - `chunks` - Vector similarity search
  - `sessions` - Get or create session
  - `messages` - Get conversation history
- **WRITE:**
  - `sessions` - CREATE session if needed
  - `messages` - INSERT user and assistant messages
    - Columns: `session_id`, `role`, `content`, `metadata`, `created_at`

**Key SQL Queries:**
```sql
-- Vector similarity search
SELECT 
    c.id AS chunk_id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> $1::vector) AS similarity,
    c.metadata,
    d.title AS document_title,
    d.source AS document_source
FROM chunks c
JOIN documents d ON c.document_id = d.id
WHERE c.embedding IS NOT NULL
ORDER BY c.embedding <=> $1::vector
LIMIT 10;

-- Store message
INSERT INTO messages (session_id, role, content, metadata, created_at)
VALUES ($1, $2, $3, $4, $5);
```

---

### `POST /chat/simple`
**Description:** Simple chat without RAG (direct LLM call)  
**Database Operations:**
- **READ:**
  - `sessions` - Get or create session
  - `messages` - Get conversation history
- **WRITE:**
  - `sessions` - CREATE session if needed
  - `messages` - INSERT user and assistant messages

---

### `POST /chat/stream`
**Description:** Streaming chat with SSE  
**Database Operations:**
- Same as `/chat` (read/write operations)

---

### `POST /search/vector`
**Description:** Vector similarity search  
**Database Operations:**
- **READ:**
  - `chunks` - Vector similarity search
  - `documents` - Get document metadata

**Key SQL Queries:**
```sql
-- Uses match_chunks() function
SELECT * FROM match_chunks($1::vector, $2);
```

---

### `POST /search/graph`
**Description:** Graph-based search (Neo4j)  
**Database Operations:**
- **External:** Neo4j knowledge graph (not PostgreSQL)

---

### `POST /search/hybrid`
**Description:** Hybrid search (vector + text)  
**Database Operations:**
- **READ:**
  - `chunks` - Vector and text similarity search
  - `documents` - Get document metadata

**Key SQL Queries:**
```sql
-- Uses hybrid_search() function
SELECT * FROM hybrid_search($1::vector, $2, $3, $4);
```

---

### `GET /documents`
**Description:** List all documents  
**Database Operations:**
- **READ:**
  - `documents` - List all documents with metadata

**Key SQL Queries:**
```sql
SELECT id, title, source, metadata, created_at, updated_at
FROM documents
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;
```

---

### `GET /sessions/{session_id}`
**Description:** Get session details  
**Database Operations:**
- **READ:**
  - `sessions` - Get session metadata
  - `messages` - Get all messages for session

**Key SQL Queries:**
```sql
SELECT * FROM sessions WHERE id = $1;

SELECT * FROM messages
WHERE session_id = $1
ORDER BY created_at ASC;
```

---

## TypeScript AI Backend (Express.js)

**Port:** 8000  
**Status:** Legacy backend (being phased out in favor of Python backend)

### Core Endpoints

#### `GET /`
**Description:** Service information and endpoint listing  
**Database Tables:** None (static information)

#### `GET /health`
**Description:** Health check for all services  
**Database Tables:** None (status checks only)

### Companion Agent Endpoints

#### `POST /api/companion/chat`
**Description:** Main conversational interface  
**Database Operations:**
- **READ:** `sessions`, `conversations`, `users`, `transactions`
- **WRITE:** `sessions`, `conversations`

#### `POST /api/companion/chat/stream`
**Description:** Streaming chat with SSE  
**Database Operations:** Same as `/api/companion/chat`

#### `POST /api/companion/multi-agent`
**Description:** Coordinate multiple agents  
**Database Operations:** Combines operations from Guardian and Transaction Analyst

### Guardian Agent Endpoints

#### `POST /api/guardian/fraud/check`
**Description:** Fraud detection  
**Database Operations:**
- **READ:** `transactions`, `fraud_checks`, `users`
- **WRITE:** `fraud_checks`, `sessions`

#### `POST /api/guardian/credit/assess`
**Description:** Credit scoring  
**Database Operations:**
- **READ:** `users`, `transactions`, `credit_assessments`, `merchants`
- **WRITE:** `credit_assessments`

#### `POST /api/guardian/investigate`
**Description:** Investigate fraud alerts  
**Database Operations:**
- **READ:** `fraud_checks`, `transactions`, `users`
- **WRITE:** `fraud_checks` (update investigation status)

#### `POST /api/guardian/chat`
**Description:** Conversational fraud and credit assessment  
**Database Operations:**
- **READ:** `sessions`, `fraud_checks`, `credit_assessments`, `transactions`
- **WRITE:** `sessions`, `fraud_checks`, `credit_assessments`

### Transaction Analyst Agent Endpoints

#### `POST /api/transaction-analyst/classify`
**Description:** Classify transaction  
**Database Operations:**
- **READ:** `transactions`, `transaction_categories`
- **WRITE:** `transaction_categories`

#### `POST /api/transaction-analyst/analyze`
**Description:** Spending pattern analysis  
**Database Operations:**
- **READ:** `transactions`, `transaction_categories`, `user_spending_features`, `spending_personas`, `spending_analyses`
- **WRITE:** `spending_analyses`, `user_spending_features`, `spending_personas`

#### `POST /api/transaction-analyst/budget`
**Description:** Generate budget recommendations  
**Database Operations:**
- **READ:** `transactions`, `transaction_categories`, `user_spending_features`, `spending_personas`
- **WRITE:** `spending_analyses`

#### `POST /api/transaction-analyst/chat`
**Description:** Conversational spending analysis  
**Database Operations:**
- **READ:** `transactions`, `spending_analyses`, `transaction_categories`
- **WRITE:** `spending_analyses`

### Crafter Agent Endpoints (Workflow Automation)

#### `POST /api/crafter/scheduled-payment`
**Description:** Create scheduled payment  
**Database Operations:**
- **READ:** `users`, `wallets`, `autopay_rules`
- **WRITE:** `autopay_rules`

#### `POST /api/crafter/spending-alert`
**Description:** Create spending alert  
**Database Operations:**
- **READ:** `users`, `transactions`
- **WRITE:** `notifications` (alert configuration stored in metadata)

#### `POST /api/crafter/automate-savings`
**Description:** Create savings automation  
**Database Operations:**
- **READ:** `users`, `wallets`, `groups`
- **WRITE:** `autopay_rules`, `groups`

#### `POST /api/crafter/workflow/create`
**Description:** Create workflow  
**Database Operations:**
- **WRITE:** `workflows` (if table exists)

#### `POST /api/crafter/workflow/execute`
**Description:** Execute workflow  
**Database Operations:**
- **READ:** `workflows`
- **WRITE:** `workflow_executions` (if table exists)

#### `GET /api/crafter/workflow/monitor/:userId`
**Description:** Monitor user workflows  
**Database Operations:**
- **READ:** `workflows`, `workflow_executions`

#### `POST /api/crafter/chat`
**Description:** Conversational workflow automation  
**Database Operations:**
- **READ:** `workflows`, `autopay_rules`
- **WRITE:** `workflows`, `autopay_rules`

### RAG Agent Endpoints

#### `POST /api/chat`
**Description:** Conversational AI with knowledge graph  
**Database Operations:**
- **READ:** `documents`, `chunks`, `sessions`, `messages`
- **WRITE:** `sessions`, `messages`

#### `POST /api/chat/simple`
**Description:** Simple chat without RAG  
**Database Operations:**
- **READ:** `sessions`, `messages`
- **WRITE:** `sessions`, `messages`

#### `POST /api/search`
**Description:** Search knowledge base  
**Database Operations:**
- **READ:** `documents`, `chunks`

---

## Next.js API Routes

**Port:** 3000  
**Framework:** Next.js 14 with App Router  
**Total Endpoints:** 95+

### Authentication

#### `POST /api/auth/login`
**Description:** Login with phone number and OTP  
**Database Operations:**
- **READ:** `users`, `otp_codes`
- **WRITE:** `otp_codes`, `users` (create if new), `wallets` (create default wallet), `auth_sessions`
- **Key Tables:** `users`, `otp_codes`, `wallets`, `auth_sessions`

#### `POST /api/auth/refresh`
**Description:** Refresh JWT tokens  
**Database Operations:**
- **READ:** `auth_sessions`
- **WRITE:** `auth_sessions` (update token)

#### `POST /api/auth/setup-pin`
**Description:** Setup transaction PIN  
**Database Operations:**
- **READ:** `users`
- **WRITE:** `users` (update encrypted PIN), `pin_audit_logs`

#### `POST /api/auth/verify-2fa`
**Description:** Verify 2FA token  
**Database Operations:**
- **READ:** `users`, `otp_codes`
- **WRITE:** `otp_codes` (mark as used)

### Users

#### `GET /api/users/me`
**Description:** Get current user profile  
**Database Operations:**
- **READ:** `users`, `wallets`, `user_profiles`
- **Key Tables:** `users`, `wallets`, `user_profiles`

#### `POST /api/users/toggle-2fa`
**Description:** Toggle 2FA on/off  
**Database Operations:**
- **READ:** `users`
- **WRITE:** `users` (update `is_two_factor_enabled`), `audit_logs`

#### `GET /api/users/sessions`
**Description:** Get user sessions  
**Database Operations:**
- **READ:** `auth_sessions`, `sessions`

### Wallets

#### `GET /api/wallets`
**Description:** List user wallets  
**Database Operations:**
- **READ:** `wallets`
- **Key Tables:** `wallets`

#### `GET /api/wallets/[id]`
**Description:** Get wallet details  
**Database Operations:**
- **READ:** `wallets`, `transactions` (recent)

#### `POST /api/wallets/[id]/add-money`
**Description:** Add money to wallet  
**Database Operations:**
- **READ:** `wallets`, `users`
- **WRITE:** `wallets` (update balance), `transactions` (INSERT), `audit_logs`

#### `GET /api/wallets/[id]/autopay/history`
**Description:** Get autopay transaction history  
**Database Operations:**
- **READ:** `autopay_transactions`, `autopay_rules`
- **Key Tables:** `autopay_transactions`, `autopay_rules`

#### `POST /api/wallets/[id]/autopay/execute`
**Description:** Execute autopay rule  
**Database Operations:**
- **READ:** `autopay_rules`, `wallets`
- **WRITE:** `autopay_transactions`, `transactions`, `wallets` (update balance)

### Transactions

#### `GET /api/transactions`
**Description:** List user transactions  
**Database Operations:**
- **READ:** `transactions`
- **Query Parameters:** `limit`, `offset`, `type`, `status`, `from_date`, `to_date`
- **Key Tables:** `transactions`

#### `GET /api/transactions/[id]`
**Description:** Get transaction details  
**Database Operations:**
- **READ:** `transactions`, `transaction_categories`, `fraud_checks`

### Payments

#### `POST /api/payments/send`
**Description:** Send money to another user  
**Database Operations:**
- **READ:** `users`, `wallets`, `contacts`
- **WRITE:** `transactions` (INSERT 2: debit + credit), `wallets` (update balances), `notifications`, `audit_logs`
- **Key Tables:** `transactions`, `wallets`, `notifications`, `audit_logs`

#### `POST /api/payments/bank-transfer`
**Description:** Transfer to bank account  
**Database Operations:**
- **READ:** `users`, `wallets`, `user_banks`
- **WRITE:** `transactions`, `wallets` (update balance), `audit_logs`, `api_sync_audit_logs`

#### `POST /api/payments/merchant-payment`
**Description:** Pay merchant via QR code  
**Database Operations:**
- **READ:** `users`, `wallets`, `merchants`
- **WRITE:** `transactions`, `wallets` (update balance), `notifications`, `audit_logs`

#### `POST /api/payments/wallet-to-wallet`
**Description:** Wallet-to-wallet transfer via IPS  
**Database Operations:**
- **READ:** `users`, `wallets`, `otp_codes` (2FA verification)
- **WRITE:** `transactions`, `wallets` (update balances), `api_sync_audit_logs`, `audit_logs`
- **Key Tables:** `transactions`, `wallets`, `api_sync_audit_logs`

#### `POST /api/payments/request`
**Description:** Request money from another user  
**Database Operations:**
- **READ:** `users`, `contacts`
- **WRITE:** `money_requests`, `notifications`

#### `POST /api/payments/split-bill/route`
**Description:** Create split bill  
**Database Operations:**
- **READ:** `users`, `wallets`, `contacts`
- **WRITE:** `split_bills`, `split_bill_participants`, `notifications`
- **Key Tables:** `split_bills`, `split_bill_participants`, `notifications`

#### `POST /api/payments/split-bill/[id]/pay/route`
**Description:** Pay split bill share  
**Database Operations:**
- **READ:** `split_bills`, `split_bill_participants`, `wallets`
- **WRITE:** `split_bill_participants` (update paid_amount), `transactions`, `wallets` (update balance)

#### `POST /api/payments/3ds-complete`
**Description:** Complete 3DS payment  
**Database Operations:**
- **READ:** `transactions`
- **WRITE:** `transactions` (update status), `wallets` (update balance)

### Contacts & Groups

#### `GET /api/contacts`
**Description:** List user contacts  
**Database Operations:**
- **READ:** `contacts`
- **Key Tables:** `contacts`

#### `GET /api/contacts/[id]`
**Description:** Get contact details  
**Database Operations:**
- **READ:** `contacts`

#### `POST /api/contacts`
**Description:** Create contact  
**Database Operations:**
- **WRITE:** `contacts`

#### `PUT /api/contacts/[id]`
**Description:** Update contact  
**Database Operations:**
- **READ:** `contacts`
- **WRITE:** `contacts`

#### `DELETE /api/contacts/[id]`
**Description:** Delete contact  
**Database Operations:**
- **WRITE:** `contacts` (DELETE)

#### `GET /api/groups`
**Description:** List user groups  
**Database Operations:**
- **READ:** `groups`, `group_members`
- **Key Tables:** `groups`, `group_members`

#### `GET /api/groups/[id]`
**Description:** Get group details  
**Database Operations:**
- **READ:** `groups`, `group_members`

#### `POST /api/groups`
**Description:** Create group  
**Database Operations:**
- **WRITE:** `groups`, `group_members`

#### `POST /api/groups/[id]/contribute`
**Description:** Contribute to group savings  
**Database Operations:**
- **READ:** `groups`, `group_members`, `wallets`
- **WRITE:** `group_members` (update contribution), `transactions`, `wallets` (update balance)

#### `GET /api/groups/[id]/members`
**Description:** Get group members  
**Database Operations:**
- **READ:** `group_members`, `users`

### Money Requests

#### `GET /api/requests`
**Description:** List money requests  
**Database Operations:**
- **READ:** `money_requests`
- **Key Tables:** `money_requests`

#### `GET /api/requests/[id]`
**Description:** Get money request details  
**Database Operations:**
- **READ:** `money_requests`

#### `POST /api/requests/[id]`
**Description:** Accept/decline money request  
**Database Operations:**
- **READ:** `money_requests`, `wallets`
- **WRITE:** `money_requests` (update status), `transactions`, `wallets` (update balance)

### Notifications

#### `GET /api/notifications`
**Description:** List user notifications  
**Database Operations:**
- **READ:** `notifications`
- **Key Tables:** `notifications`

#### `GET /api/notifications/[id]`
**Description:** Get notification details  
**Database Operations:**
- **READ:** `notifications`

#### `PUT /api/notifications/[id]`
**Description:** Mark notification as read  
**Database Operations:**
- **WRITE:** `notifications` (update `is_read`, `read_at`)

#### `POST /api/notifications/register`
**Description:** Register push notification token  
**Database Operations:**
- **WRITE:** `push_tokens`
- **Key Tables:** `push_tokens`

#### `GET /api/notifications/preferences`
**Description:** Get notification preferences  
**Database Operations:**
- **READ:** `notification_preferences`
- **Key Tables:** `notification_preferences`

#### `POST /api/notifications/send`
**Description:** Send notification (admin/internal)  
**Database Operations:**
- **WRITE:** `notifications`, `notification_logs`

### Vouchers

#### `GET /api/utilities/vouchers`
**Description:** List user vouchers  
**Database Operations:**
- **READ:** `vouchers`
- **Key Tables:** `vouchers`

#### `GET /api/utilities/vouchers/all`
**Description:** Get all vouchers (admin)  
**Database Operations:**
- **READ:** `vouchers`

#### `GET /api/utilities/vouchers/[id]`
**Description:** Get voucher details  
**Database Operations:**
- **READ:** `vouchers`, `voucher_redemptions`

#### `POST /api/utilities/vouchers/disburse`
**Description:** Disburse voucher (admin)  
**Database Operations:**
- **READ:** `users`
- **WRITE:** `vouchers`, `voucher_audit_logs`, `notifications`
- **Key Tables:** `vouchers`, `voucher_audit_logs`

#### `POST /api/utilities/vouchers/redeem`
**Description:** Redeem voucher  
**Database Operations:**
- **READ:** `vouchers`, `wallets`
- **WRITE:** `voucher_redemptions`, `vouchers` (update status), `wallets` (update balance), `transactions`, `voucher_audit_logs`
- **Key Tables:** `voucher_redemptions`, `vouchers`, `voucher_audit_logs`

#### `POST /api/utilities/vouchers/find-by-qr`
**Description:** Find voucher by QR code  
**Database Operations:**
- **READ:** `vouchers`

### Utilities

#### `POST /api/utilities/mobile-recharge`
**Description:** Mobile airtime/data recharge  
**Database Operations:**
- **READ:** `wallets`
- **WRITE:** `transactions`, `wallets` (update balance)

#### `POST /api/utilities/buy-tickets`
**Description:** Buy event tickets  
**Database Operations:**
- **READ:** `wallets`, `tickets`
- **WRITE:** `transactions`, `wallets` (update balance), `tickets` (update availability)

#### `POST /api/utilities/insurance/purchase`
**Description:** Purchase insurance  
**Database Operations:**
- **READ:** `wallets`, `insurance_products`
- **WRITE:** `transactions`, `wallets` (update balance)

#### `GET /api/utilities/subscriptions`
**Description:** List subscriptions  
**Database Operations:**
- **READ:** `subscriptions` (if table exists)

#### `GET /api/utilities/subscriptions/[id]`
**Description:** Get subscription details  
**Database Operations:**
- **READ:** `subscriptions`

#### `POST /api/utilities/subscriptions/[id]/pause`
**Description:** Pause subscription  
**Database Operations:**
- **READ:** `subscriptions`
- **WRITE:** `subscriptions` (update status)

#### `GET /api/utilities/sponsored`
**Description:** List sponsored services  
**Database Operations:**
- **READ:** `sponsored_services` (if table exists)

### Banks & Cards

#### `GET /api/banks`
**Description:** List user bank accounts  
**Database Operations:**
- **READ:** `user_banks`
- **Key Tables:** `user_banks`

#### `GET /api/banks/[id]`
**Description:** Get bank account details  
**Database Operations:**
- **READ:** `user_banks`

#### `POST /api/banks`
**Description:** Add bank account  
**Database Operations:**
- **WRITE:** `user_banks`, `audit_logs`

#### `GET /api/cards`
**Description:** List user cards  
**Database Operations:**
- **READ:** `user_cards`
- **Key Tables:** `user_cards`

#### `GET /api/cards/[id]`
**Description:** Get card details  
**Database Operations:**
- **READ:** `user_cards`

#### `POST /api/cards`
**Description:** Add card  
**Database Operations:**
- **WRITE:** `user_cards`, `audit_logs`

### Admin

#### `GET /api/admin/users`
**Description:** List all users (admin)  
**Database Operations:**
- **READ:** `users`, `wallets`
- **Key Tables:** `users`, `wallets`

#### `GET /api/admin/users/[id]`
**Description:** Get user details (admin)  
**Database Operations:**
- **READ:** `users`, `wallets`, `transactions`, `user_profiles`

#### `POST /api/admin/users/[id]/suspend`
**Description:** Suspend user  
**Database Operations:**
- **READ:** `users`
- **WRITE:** `users` (update status), `staff_audit_logs`

#### `POST /api/admin/users/[id]/reactivate`
**Description:** Reactivate user  
**Database Operations:**
- **READ:** `users`
- **WRITE:** `users` (update status), `staff_audit_logs`

#### `GET /api/admin/transactions`
**Description:** List all transactions (admin)  
**Database Operations:**
- **READ:** `transactions`, `users`, `wallets`

#### `POST /api/admin/transactions/[id]/flag/route`
**Description:** Flag transaction for review  
**Database Operations:**
- **READ:** `transactions`
- **WRITE:** `transactions` (update flags), `audit_logs`

#### `GET /api/admin/audit`
**Description:** Get audit logs  
**Database Operations:**
- **READ:** `audit_logs`
- **Key Tables:** `audit_logs`

#### `GET /api/admin/audit-logs/query/route`
**Description:** Query audit logs with filters  
**Database Operations:**
- **READ:** `audit_logs`, `pin_audit_logs`, `voucher_audit_logs`, `transaction_audit_logs`, `api_sync_audit_logs`, `staff_audit_logs`

#### `GET /api/admin/audit-logs/export/route`
**Description:** Export audit logs  
**Database Operations:**
- **READ:** `audit_logs`, `pin_audit_logs`, `voucher_audit_logs`, `transaction_audit_logs`, `api_sync_audit_logs`, `staff_audit_logs`

#### `POST /api/admin/audit-logs/retention/route`
**Description:** Archive old audit logs  
**Database Operations:**
- **READ:** `audit_logs`, `pin_audit_logs`, `voucher_audit_logs`, `transaction_audit_logs`, `api_sync_audit_logs`, `staff_audit_logs`
- **WRITE:** `audit_logs_archive`, `pin_audit_logs_archive`, `voucher_audit_logs_archive`, `transaction_audit_logs_archive`, `api_sync_audit_logs_archive`, `staff_audit_logs_archive`

#### `GET /api/admin/trust-account/status`
**Description:** Get trust account status  
**Database Operations:**
- **READ:** `trust_account`, `trust_account_transactions`
- **Key Tables:** `trust_account`, `trust_account_transactions`

#### `POST /api/admin/trust-account/reconcile`
**Description:** Reconcile trust account  
**Database Operations:**
- **READ:** `trust_account`, `trust_account_transactions`
- **WRITE:** `trust_account_reconciliation_log`
- **Key Tables:** `trust_account_reconciliation_log`

#### `GET /api/admin/compliance/monthly-stats`
**Description:** Get compliance monthly statistics  
**Database Operations:**
- **READ:** `compliance_monthly_stats`
- **Key Tables:** `compliance_monthly_stats`

#### `POST /api/admin/compliance/generate-report`
**Description:** Generate compliance report  
**Database Operations:**
- **READ:** `compliance_monthly_stats`, `transactions`, `vouchers`
- **WRITE:** `compliance_report_files`, `compliance_report_submissions`
- **Key Tables:** `compliance_report_files`, `compliance_report_submissions`

#### `GET /api/admin/smartpay/health/route`
**Description:** Check SmartPay integration health  
**Database Operations:**
- **READ:** `api_sync_audit_logs`

#### `GET /api/admin/smartpay/sync-logs/route`
**Description:** Get SmartPay sync logs  
**Database Operations:**
- **READ:** `api_sync_audit_logs`

#### `GET /api/admin/ai-monitoring/route`
**Description:** Monitor AI backend health  
**Database Operations:**
- **READ:** `ml_models`, `model_performance`, `predictions`

### Analytics

#### `GET /api/analytics/users/route`
**Description:** User analytics  
**Database Operations:**
- **READ:** `users`, `user_behavior_analytics`
- **Key Tables:** `user_behavior_analytics`

#### `GET /api/analytics/transactions/route`
**Description:** Transaction analytics  
**Database Operations:**
- **READ:** `transactions`, `transaction_analytics`
- **Key Tables:** `transaction_analytics`

#### `GET /api/analytics/merchants/route`
**Description:** Merchant analytics  
**Database Operations:**
- **READ:** `merchants`, `merchant_analytics`
- **Key Tables:** `merchant_analytics`

#### `GET /api/analytics/geographic/route`
**Description:** Geographic analytics  
**Database Operations:**
- **READ:** `geographic_analytics`
- **Key Tables:** `geographic_analytics`

#### `GET /api/analytics/payment-methods/route`
**Description:** Payment method analytics  
**Database Operations:**
- **READ:** `payment_method_analytics`
- **Key Tables:** `payment_method_analytics`

#### `GET /api/analytics/channels/route`
**Description:** Channel analytics (mobile/USSD/SMS)  
**Database Operations:**
- **READ:** `channel_analytics`
- **Key Tables:** `channel_analytics`

#### `GET /api/analytics/insights/route`
**Description:** Business insights  
**Database Operations:**
- **READ:** `transaction_analytics`, `user_behavior_analytics`, `merchant_analytics`, `geographic_analytics`, `payment_method_analytics`, `channel_analytics`

#### `GET /api/analytics/export/route`
**Description:** Export analytics data  
**Database Operations:**
- **READ:** All analytics tables

### Compliance

#### `GET /api/compliance/reports/monthly`
**Description:** Get monthly compliance reports  
**Database Operations:**
- **READ:** `compliance_report_files`, `compliance_report_submissions`

#### `POST /api/compliance/processing/route`
**Description:** Process compliance checks  
**Database Operations:**
- **READ:** `transactions`, `vouchers`, `users`
- **WRITE:** `compliance_checks`, `compliance_monthly_stats`

#### `GET /api/compliance/incidents/route`
**Description:** Get security incidents  
**Database Operations:**
- **READ:** `security_incidents`, `incident_updates`
- **Key Tables:** `security_incidents`, `incident_updates`

#### `GET /api/compliance/dormancy/route`
**Description:** Get dormant wallet reports  
**Database Operations:**
- **READ:** `dormant_wallets`, `wallet_dormancy_events`, `wallet_dormancy_reports`
- **Key Tables:** `dormant_wallets`, `wallet_dormancy_events`, `wallet_dormancy_reports`

### Cron Jobs

#### `POST /api/cron/analytics-hourly/route`
**Description:** Hourly analytics aggregation  
**Database Operations:**
- **READ:** `transactions`, `users`, `wallets`
- **WRITE:** `transaction_analytics`, `user_behavior_analytics`

#### `POST /api/cron/analytics-daily/route`
**Description:** Daily analytics aggregation  
**Database Operations:**
- **READ:** `transactions`, `users`, `wallets`
- **WRITE:** `transaction_analytics`, `user_behavior_analytics`, `merchant_analytics`, `geographic_analytics`, `payment_method_analytics`, `channel_analytics`

#### `POST /api/cron/analytics-weekly/route`
**Description:** Weekly analytics aggregation  
**Database Operations:**
- **READ:** All analytics tables
- **WRITE:** Aggregated weekly statistics

#### `POST /api/cron/analytics-monthly/route`
**Description:** Monthly analytics aggregation  
**Database Operations:**
- **READ:** All analytics tables
- **WRITE:** `compliance_monthly_stats`

#### `POST /api/cron/compliance-report`
**Description:** Generate compliance report  
**Database Operations:**
- **READ:** `compliance_monthly_stats`, `transactions`, `vouchers`
- **WRITE:** `compliance_report_files`, `compliance_report_submissions`

#### `POST /api/cron/trust-account-reconcile`
**Description:** Reconcile trust account  
**Database Operations:**
- **READ:** `trust_account`, `trust_account_transactions`
- **WRITE:** `trust_account_reconciliation_log`

#### `POST /api/cron/incident-reporting-check`
**Description:** Check for security incidents  
**Database Operations:**
- **READ:** `fraud_checks`, `transactions`, `audit_logs`
- **WRITE:** `security_incidents`, `incident_updates`, `incident_notifications`

### USSD

#### `POST /api/ussd/route`
**Description:** USSD gateway endpoint  
**Database Operations:**
- **READ:** `users`, `wallets`, `transactions`, `vouchers`
- **WRITE:** `transactions`, `wallets`, `voucher_redemptions`, `sessions` (USSD session)

### Other

#### `GET /api/gateway/route`
**Description:** API gateway health check  
**Database Operations:** None (routing only)

#### `POST /api/webhooks/smartpay/route`
**Description:** SmartPay webhook handler  
**Database Operations:**
- **READ:** `transactions`, `vouchers`
- **WRITE:** `transactions` (update status), `api_sync_audit_logs`

#### `GET /api/merchants/qr-code/route`
**Description:** Generate merchant QR code  
**Database Operations:**
- **READ:** `merchants`

#### `GET /api/companion/suggestions`
**Description:** Get AI companion suggestions  
**Database Operations:**
- **READ:** `transactions`, `spending_analyses`, `user_spending_features`

#### `GET /api/transaction-analyst/budget-insights`
**Description:** Get budget insights  
**Database Operations:**
- **READ:** `spending_analyses`, `transaction_categories`, `user_spending_features`

#### `GET /api/admin/fineract/route`
**Description:** Fineract integration endpoint  
**Database Operations:**
- **READ/WRITE:** External Fineract API (not in PostgreSQL)

---

## Complete Database Schema

This section documents all database tables across the entire Buffr platform, organized by functional area.

### Core User & Authentication Tables

#### `users`
**Primary Key:** `id` (VARCHAR)  
**Key Columns:** `phone_number`, `email`, `full_name`, `buffr_id`, `external_id`, `kyc_level`, `is_verified`, `is_two_factor_enabled`, `currency`, `status`, `role`, `is_admin`, `permissions`, `mfa_enabled`, `mfa_secret`, `last_login_at`, `created_at`, `updated_at`  
**Used By:** All authentication, user management, and profile endpoints

#### `otp_codes`
**Primary Key:** `phone_number` (VARCHAR)  
**Key Columns:** `code`, `expires_at`, `used`  
**Used By:** `/api/auth/login`, `/api/auth/verify-2fa`

#### `auth_sessions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `access_token`, `refresh_token`, `expires_at`, `created_at`  
**Used By:** `/api/auth/login`, `/api/auth/refresh`, `/api/users/sessions`

#### `user_profiles`
**Primary Key:** `user_id` (VARCHAR)  
**Key Columns:** Demographics, behavioral features, preferences  
**Used By:** AI agents, analytics

### Wallet & Transaction Tables

#### `wallets`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `name`, `icon`, `type`, `balance`, `currency`, `available_balance`, `is_default`, `status`, `auto_pay_enabled`, `auto_pay_settings`, `pin_protected`, `biometric_enabled`, `created_at`, `updated_at`  
**Used By:** All wallet and payment endpoints

#### `transactions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `wallet_id`, `type`, `amount`, `currency`, `description`, `category`, `recipient_id`, `recipient_name`, `status`, `date`, `external_id`, `transaction_type`, `transaction_time`, `merchant_name`, `merchant_category`, `merchant_id`, `metadata`, `created_at`  
**Used By:** All transaction, payment, and analytics endpoints

#### `transaction_categories`
**Primary Key:** `transaction_id` (UUID)  
**Key Columns:** `category`, `subcategory`, `confidence`, `alternate_categories`, `classified_at`, `model_version`, `metadata`  
**Used By:** Transaction Analyst Agent, ML classification endpoints

### Payment & Request Tables

#### `money_requests`
**Primary Key:** `id` (UUID)  
**Key Columns:** `from_user_id`, `to_user_id`, `amount`, `paid_amount`, `currency`, `note`, `status`, `paid_at`, `description`, `expires_at`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/requests/*`, `/api/payments/request`

#### `split_bills`
**Primary Key:** `id` (UUID)  
**Key Columns:** `created_by`, `title`, `total_amount`, `currency`, `status`, `metadata`, `created_at`  
**Used By:** `/api/payments/split-bill/*`

#### `split_bill_participants`
**Primary Key:** `id` (UUID)  
**Key Columns:** `split_bill_id`, `user_id`, `amount`, `paid_amount`, `status`, `created_at`  
**Used By:** `/api/payments/split-bill/*`

### Autopay Tables

#### `autopay_rules`
**Primary Key:** `id` (UUID)  
**Key Columns:** `wallet_id`, `user_id`, `rule_type`, `amount`, `frequency`, `recipient_id`, `recipient_name`, `is_active`, `next_execution_date`, `created_at`, `updated_at`  
**Used By:** `/api/wallets/[id]/autopay/*`, Crafter Agent

#### `autopay_transactions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `rule_id`, `wallet_id`, `user_id`, `amount`, `status`, `executed_at`, `failure_reason`, `recipient_id`, `recipient_name`, `rule_description`, `authorisation_code`, `created_at`  
**Used By:** `/api/wallets/[id]/autopay/history`

### Contact & Group Tables

#### `contacts`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `name`, `phone`, `email`, `phone_number`, `is_favorite`, `avatar`, `bank_code`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/contacts/*`

#### `groups`
**Primary Key:** `id` (UUID)  
**Key Columns:** `owner_id`, `name`, `description`, `target_amount`, `current_amount`, `currency`, `type`, `avatar`, `is_active`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/groups/*`

#### `group_members`
**Primary Key:** `id` (UUID)  
**Key Columns:** `group_id`, `user_id`, `contribution`, `is_owner`, `joined_at`  
**Used By:** `/api/groups/*`

### Notification Tables

#### `notifications`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `type`, `title`, `message`, `is_read`, `read_at`, `related_id`, `data`, `created_at`  
**Used By:** `/api/notifications/*`

#### `push_tokens`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `token`, `platform`, `device_id`, `created_at`, `updated_at`  
**Used By:** `/api/notifications/register`

#### `notification_preferences`
**Primary Key:** `user_id` (VARCHAR)  
**Key Columns:** Preferences for different notification types  
**Used By:** `/api/notifications/preferences`

#### `notification_logs`
**Primary Key:** `id` (UUID)  
**Key Columns:** `notification_id`, `status`, `sent_at`, `error_message`  
**Used By:** Notification sending system

### Voucher Tables

#### `vouchers`
**Primary Key:** `id` (UUID)  
**Key Columns:** `voucher_code`, `beneficiary_id`, `amount`, `currency`, `status`, `expires_at`, `disbursed_at`, `redeemed_at`, `merchant_id`, `category`, `encrypted_pin`, `qr_code_data`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/utilities/vouchers/*`

#### `voucher_redemptions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `voucher_id`, `user_id`, `wallet_id`, `amount`, `merchant_id`, `redemption_method`, `redemption_location`, `encrypted_pin_used`, `metadata`, `redeemed_at`  
**Used By:** `/api/utilities/vouchers/redeem`

### Bank & Card Tables

#### `user_banks`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `bank_name`, `account_number`, `account_type`, `branch_code`, `encrypted_account_number`, `is_verified`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/banks/*`, `/api/payments/bank-transfer`

#### `user_cards`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `card_type`, `last_four_digits`, `expiry_month`, `expiry_year`, `encrypted_card_number`, `cardholder_name`, `is_default`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/cards/*`

### Audit & Compliance Tables

#### `audit_logs`
**Primary Key:** `id` (UUID)  
**Key Columns:** `admin_user_id`, `action_type`, `resource_type`, `resource_id`, `status`, `ip_address`, `user_agent`, `metadata`, `created_at`  
**Used By:** `/api/admin/audit/*`, all admin endpoints

#### `pin_audit_logs`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `action_type`, `ip_address`, `user_agent`, `success`, `metadata`, `created_at`  
**Used By:** PIN operations

#### `voucher_audit_logs`
**Primary Key:** `id` (UUID)  
**Key Columns:** `voucher_id`, `action_type`, `performed_by`, `ip_address`, `metadata`, `created_at`  
**Used By:** Voucher operations

#### `transaction_audit_logs`
**Primary Key:** `id` (UUID)  
**Key Columns:** `transaction_id`, `action_type`, `performed_by`, `ip_address`, `metadata`, `created_at`  
**Used By:** Transaction operations

#### `api_sync_audit_logs`
**Primary Key:** `id` (UUID)  
**Key Columns:** `sync_type`, `external_system`, `resource_type`, `resource_id`, `status`, `request_payload`, `response_payload`, `error_message`, `created_at`  
**Used By:** External API syncs (SmartPay, IPS, etc.)

#### `staff_audit_logs`
**Primary Key:** `id` (UUID)  
**Key Columns:** `staff_user_id`, `action_type`, `resource_type`, `resource_id`, `ip_address`, `metadata`, `created_at`  
**Used By:** Staff/admin operations

#### Audit Archive Tables
- `audit_logs_archive` - Archived audit logs
- `pin_audit_logs_archive` - Archived PIN audit logs
- `voucher_audit_logs_archive` - Archived voucher audit logs
- `transaction_audit_logs_archive` - Archived transaction audit logs
- `api_sync_audit_logs_archive` - Archived API sync logs
- `staff_audit_logs_archive` - Archived staff audit logs

### Compliance & Trust Account Tables

#### `compliance_checks`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `check_type`, `status`, `result`, `metadata`, `checked_at`  
**Used By:** Compliance processing

#### `compliance_monthly_stats`
**Primary Key:** `id` (UUID)  
**Key Columns:** `month`, `year`, `total_transactions`, `total_amount`, `fraud_count`, `compliance_violations`, `metadata`, `created_at`  
**Used By:** `/api/admin/compliance/*`, `/api/compliance/reports/monthly`

#### `compliance_report_files`
**Primary Key:** `id` (UUID)  
**Key Columns:** `report_type`, `month`, `year`, `file_path`, `file_size`, `status`, `created_at`  
**Used By:** Compliance reporting

#### `compliance_report_submissions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `report_file_id`, `submitted_by`, `submitted_to`, `status`, `submitted_at`  
**Used By:** Compliance reporting

#### `trust_account`
**Primary Key:** `id` (UUID)  
**Key Columns:** `account_number`, `balance`, `currency`, `status`, `last_reconciled_at`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/admin/trust-account/*`, `/api/cron/trust-account-reconcile`

#### `trust_account_transactions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `trust_account_id`, `transaction_type`, `amount`, `currency`, `reference_id`, `description`, `status`, `created_at`  
**Used By:** Trust account operations

#### `trust_account_reconciliation_log`
**Primary Key:** `id` (UUID)  
**Key Columns:** `trust_account_id`, `reconciled_by`, `opening_balance`, `closing_balance`, `transactions_count`, `discrepancies`, `reconciled_at`  
**Used By:** Trust account reconciliation

### Analytics Tables

#### `transaction_analytics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `period_type`, `period_start`, `period_end`, `total_transactions`, `total_amount`, `avg_amount`, `transaction_count_by_type`, `metadata`, `created_at`  
**Used By:** `/api/analytics/transactions/route`, cron jobs

#### `user_behavior_analytics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `period_type`, `period_start`, `period_end`, `active_users`, `new_users`, `churn_rate`, `engagement_metrics`, `metadata`, `created_at`  
**Used By:** `/api/analytics/users/route`, cron jobs

#### `merchant_analytics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `merchant_id`, `period_type`, `period_start`, `period_end`, `transaction_count`, `total_amount`, `avg_amount`, `metadata`, `created_at`  
**Used By:** `/api/analytics/merchants/route`, cron jobs

#### `geographic_analytics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `period_type`, `period_start`, `period_end`, `region`, `transaction_count`, `total_amount`, `metadata`, `created_at`  
**Used By:** `/api/analytics/geographic/route`, cron jobs

#### `payment_method_analytics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `period_type`, `period_start`, `period_end`, `payment_method`, `transaction_count`, `total_amount`, `metadata`, `created_at`  
**Used By:** `/api/analytics/payment-methods/route`, cron jobs

#### `channel_analytics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `period_type`, `period_start`, `period_end`, `channel`, `transaction_count`, `total_amount`, `metadata`, `created_at`  
**Used By:** `/api/analytics/channels/route`, cron jobs

### AI & ML Tables

#### `fraud_checks`
**Primary Key:** `id` (UUID)  
**Key Columns:** `transaction_id`, `user_id`, `session_id`, `fraud_probability`, `is_fraud`, `risk_level`, `recommended_action`, `logistic_score`, `neural_network_score`, `random_forest_score`, `gmm_anomaly_score`, `checked_at`, `metadata`  
**Used By:** Guardian Agent, `/api/guardian/fraud/check`

#### `credit_assessments`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `merchant_id`, `session_id`, `credit_score`, `default_probability`, `credit_tier`, `max_loan_amount`, `recommended_interest_rate`, `logistic_score`, `random_forest_score`, `gradient_boosting_score`, `assessed_at`, `metadata`  
**Used By:** Guardian Agent, `/api/guardian/credit/assess`

#### `spending_analyses`
**Primary Key:** `id` (UUID)  
**Key Columns:** `session_id`, `user_id`, `period_start`, `period_end`, `total_spending`, `spending_trend`, `is_unusual_spending`, `top_categories`, `spending_by_category`, `insights`, `recommendations`, `analyzed_at`, `metadata`  
**Used By:** Transaction Analyst Agent, `/api/transaction-analyst/analyze`

#### `user_spending_features`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `period_start`, `period_end`, `total_spending`, `avg_transaction_amount`, `transaction_count`, `spending_volatility`, `spending_by_category`, `weekend_spending_ratio`, `evening_spending_ratio`, `cash_withdrawal_frequency`, `unique_merchants_count`, `computed_at`, `metadata`  
**Used By:** Transaction Analyst Agent

#### `spending_personas`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `primary_persona`, `primary_confidence`, `persona_distribution`, `cluster_id`, `cluster_size`, `assigned_at`, `model_version`, `metadata`  
**Used By:** Transaction Analyst Agent

#### `ml_models`
**Primary Key:** `id` (UUID)  
**Key Columns:** `model_name`, `version`, `model_type`, `status`, `accuracy`, `precision`, `recall`, `f1_score`, `training_data_hash`, `model_file_path`, `created_at`, `updated_at`  
**Used By:** ML API endpoints, `/api/ml/*`

#### `model_performance`
**Primary Key:** `id` (UUID)  
**Key Columns:** `model_id`, `metric_name`, `metric_value`, `evaluation_date`, `metadata`  
**Used By:** ML monitoring

#### `predictions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `model_id`, `prediction_type`, `input_features`, `prediction_result`, `confidence`, `inference_time_ms`, `reference_type`, `reference_id`, `predicted_at`, `metadata`  
**Used By:** ML API endpoints

#### `merchants`
**Primary Key:** `id` (UUID)  
**Key Columns:** `merchant_name`, `merchant_category`, `mcc`, `location`, `metadata`, `created_at`  
**Used By:** Guardian Agent, merchant payment endpoints

### Session & Conversation Tables

#### `sessions`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `metadata`, `expires_at`, `created_at`  
**Used By:** All AI agents, RAG endpoints

#### `messages`
**Primary Key:** `id` (UUID)  
**Key Columns:** `session_id`, `role`, `content`, `metadata`, `created_at`  
**Used By:** RAG Agent, `/chat/*` endpoints

#### `conversations`
**Primary Key:** `id` (UUID)  
**Key Columns:** `session_id`, `user_id`, `user_message`, `assistant_response`, `agents_consulted`, `created_at`  
**Used By:** Companion Agent

### RAG Knowledge Base Tables

#### `documents`
**Primary Key:** `id` (UUID)  
**Key Columns:** `title`, `source`, `content`, `metadata`, `created_at`, `updated_at`  
**Used By:** RAG Agent, `/search/*`, `/documents`

#### `chunks`
**Primary Key:** `id` (UUID)  
**Key Columns:** `document_id`, `content`, `embedding`, `chunk_index`, `metadata`, `created_at`  
**Used By:** RAG Agent, vector search endpoints

### Utility Tables

#### `tickets`
**Primary Key:** `id` (UUID)  
**Key Columns:** `user_id`, `event_name`, `event_date`, `venue`, `price`, `quantity`, `status`, `metadata`, `created_at`  
**Used By:** `/api/utilities/buy-tickets`

#### `insurance_products`
**Primary Key:** `id` (UUID)  
**Key Columns:** `product_name`, `provider`, `coverage_type`, `premium_amount`, `coverage_amount`, `status`, `metadata`, `created_at`  
**Used By:** `/api/utilities/insurance/purchase`

#### `exchange_rates`
**Primary Key:** `id` (UUID)  
**Key Columns:** `base_currency`, `target_currency`, `rate`, `fetched_at`, `source`  
**Used By:** Exchange rate service

#### `exchange_rate_fetch_log`
**Primary Key:** `id` (UUID)  
**Key Columns:** `fetch_time`, `base_currency`, `target_currencies`, `status`, `error_message`  
**Used By:** Exchange rate scheduler

### Incident & Security Tables

#### `security_incidents`
**Primary Key:** `id` (UUID)  
**Key Columns:** `incident_type`, `severity`, `status`, `description`, `affected_resources`, `detected_at`, `resolved_at`, `metadata`  
**Used By:** `/api/compliance/incidents/route`, `/api/cron/incident-reporting-check`

#### `incident_updates`
**Primary Key:** `id` (UUID)  
**Key Columns:** `incident_id`, `update_type`, `description`, `updated_by`, `created_at`  
**Used By:** Incident management

#### `incident_notifications`
**Primary Key:** `id` (UUID)  
**Key Columns:** `incident_id`, `notification_type`, `recipient`, `status`, `sent_at`  
**Used By:** Incident notifications

#### `incident_metrics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `period_type`, `period_start`, `period_end`, `incident_count_by_type`, `avg_resolution_time`, `metadata`, `created_at`  
**Used By:** Incident analytics

### Dormancy Tables

#### `dormant_wallets`
**Primary Key:** `id` (UUID)  
**Key Columns:** `wallet_id`, `user_id`, `last_activity_date`, `dormancy_status`, `days_inactive`, `metadata`, `created_at`, `updated_at`  
**Used By:** `/api/compliance/dormancy/route`

#### `wallet_dormancy_events`
**Primary Key:** `id` (UUID)  
**Key Columns:** `wallet_id`, `event_type`, `event_date`, `metadata`, `created_at`  
**Used By:** Dormancy tracking

#### `wallet_dormancy_reports`
**Primary Key:** `id` (UUID)  
**Key Columns:** `report_date`, `total_dormant_wallets`, `total_dormant_balance`, `dormancy_by_period`, `metadata`, `created_at`  
**Used By:** Dormancy reporting

### Realtime Processing Tables

#### `settlement_batches`
**Primary Key:** `id` (UUID)  
**Key Columns:** `batch_id`, `batch_date`, `total_transactions`, `total_amount`, `status`, `processed_at`  
**Used By:** Settlement processing

#### `processing_metrics`
**Primary Key:** `id` (UUID)  
**Key Columns:** `metric_type`, `metric_value`, `timestamp`, `metadata`  
**Used By:** Performance monitoring

#### `system_health`
**Primary Key:** `id` (UUID)  
**Key Columns:** `service_name`, `status`, `response_time_ms`, `error_rate`, `timestamp`  
**Used By:** System health monitoring

### Migration History

#### `migration_history`
**Primary Key:** `id` (UUID)  
**Key Columns:** `migration_name`, `applied_at`, `applied_by`  
**Used By:** Migration tracking

---

## Endpoint Summary by Database Table

This section lists all endpoints that interact with each database table, organized alphabetically by table name.

### `api_sync_audit_logs`
- `POST /api/payments/bank-transfer` - WRITE
- `POST /api/payments/wallet-to-wallet` - WRITE
- `POST /api/webhooks/smartpay/route` - WRITE
- `GET /api/admin/smartpay/sync-logs/route` - READ
- `GET /api/admin/smartpay/health/route` - READ
- `GET /api/admin/audit-logs/query/route` - READ
- `GET /api/admin/audit-logs/export/route` - READ
- `POST /api/admin/audit-logs/retention/route` - READ/WRITE (archive)

### `audit_logs`
- `POST /api/auth/setup-pin` - WRITE
- `POST /api/payments/send` - WRITE
- `POST /api/payments/bank-transfer` - WRITE
- `POST /api/payments/merchant-payment` - WRITE
- `POST /api/banks` - WRITE
- `POST /api/cards` - WRITE
- `GET /api/admin/audit` - READ
- `GET /api/admin/audit-logs/query/route` - READ
- `GET /api/admin/audit-logs/export/route` - READ
- `POST /api/admin/audit-logs/retention/route` - READ/WRITE (archive)
- `POST /api/admin/transactions/[id]/flag/route` - WRITE
- `POST /api/cron/incident-reporting-check` - READ

### `auth_sessions`
- `POST /api/auth/login` - WRITE
- `POST /api/auth/refresh` - READ/WRITE
- `GET /api/users/sessions` - READ

### `autopay_rules`
- `GET /api/wallets/[id]/autopay/history` - READ
- `POST /api/wallets/[id]/autopay/execute` - READ
- `POST /api/crafter/scheduled-payment` - WRITE (TypeScript backend)
- `POST /api/crafter/automate-savings` - WRITE (TypeScript backend)
- `POST /api/crafter/chat` - READ/WRITE (TypeScript backend)

### `autopay_transactions`
- `GET /api/wallets/[id]/autopay/history` - READ
- `POST /api/wallets/[id]/autopay/execute` - WRITE

### `chunks`
- `POST /chat` - READ (vector search) - Python AI
- `POST /api/chat` - READ (vector search) - TypeScript AI
- `POST /search/vector` - READ - Python AI
- `POST /api/search` - READ - TypeScript AI
- `POST /search/hybrid` - READ - Python AI

### `compliance_checks`
- `POST /api/compliance/processing/route` - WRITE

### `compliance_monthly_stats`
- `GET /api/admin/compliance/monthly-stats` - READ
- `POST /api/admin/compliance/generate-report` - READ
- `POST /api/compliance/reports/monthly` - READ
- `POST /api/cron/compliance-report` - READ/WRITE
- `POST /api/cron/analytics-monthly/route` - WRITE

### `compliance_report_files`
- `POST /api/admin/compliance/generate-report` - WRITE
- `GET /api/compliance/reports/monthly` - READ
- `POST /api/cron/compliance-report` - WRITE

### `compliance_report_submissions`
- `POST /api/admin/compliance/generate-report` - WRITE
- `POST /api/cron/compliance-report` - WRITE

### `contacts`
- `GET /api/contacts` - READ
- `GET /api/contacts/[id]` - READ
- `POST /api/contacts` - WRITE
- `PUT /api/contacts/[id]` - WRITE
- `DELETE /api/contacts/[id]` - DELETE
- `POST /api/payments/send` - READ
- `POST /api/payments/request` - READ
- `POST /api/payments/split-bill/route` - READ

### `conversations`
- `POST /api/companion/chat` - READ/WRITE - Python AI
- `POST /api/companion/chat/stream` - READ/WRITE - Python AI
- `POST /api/companion/multi-agent` - READ/WRITE - Python AI
- `GET /api/companion/history/{session_id}` - READ - Python AI
- `POST /api/companion/chat` - READ/WRITE - TypeScript AI
- `POST /api/companion/chat/stream` - READ/WRITE - TypeScript AI

### `credit_assessments`
- `POST /api/guardian/credit/assess` - WRITE - Python AI
- `POST /api/guardian/chat` - READ/WRITE - Python AI
- `POST /api/guardian/credit/assess` - WRITE - TypeScript AI
- `POST /api/guardian/chat` - READ/WRITE - TypeScript AI

### `documents`
- `POST /chat` - READ - Python AI
- `POST /api/chat` - READ - TypeScript AI
- `POST /search/vector` - READ - Python AI
- `POST /api/search` - READ - TypeScript AI
- `POST /search/hybrid` - READ - Python AI
- `GET /documents` - READ - Python AI

### `dormant_wallets`
- `GET /api/compliance/dormancy/route` - READ

### `exchange_rates`
- Exchange rate service (internal) - READ/WRITE

### `exchange_rate_fetch_log`
- Exchange rate scheduler (internal) - WRITE

### `fraud_checks`
- `POST /api/guardian/fraud/check` - WRITE - Python AI
- `POST /api/guardian/chat` - READ/WRITE - Python AI
- `POST /api/guardian/fraud/check` - WRITE - TypeScript AI
- `POST /api/guardian/investigate` - READ/WRITE - TypeScript AI
- `POST /api/guardian/chat` - READ/WRITE - TypeScript AI
- `POST /api/cron/incident-reporting-check` - READ

### `geographic_analytics`
- `GET /api/analytics/geographic/route` - READ
- `GET /api/analytics/insights/route` - READ
- `GET /api/analytics/export/route` - READ
- `POST /api/cron/analytics-daily/route` - WRITE
- `POST /api/cron/analytics-weekly/route` - READ
- `POST /api/cron/analytics-monthly/route` - READ

### `group_members`
- `GET /api/groups` - READ
- `GET /api/groups/[id]` - READ
- `POST /api/groups` - WRITE
- `POST /api/groups/[id]/contribute` - READ/WRITE
- `GET /api/groups/[id]/members` - READ

### `groups`
- `GET /api/groups` - READ
- `GET /api/groups/[id]` - READ
- `POST /api/groups` - WRITE
- `POST /api/groups/[id]/contribute` - READ/WRITE
- `POST /api/crafter/automate-savings` - WRITE (TypeScript backend)

### `incident_metrics`
- `GET /api/compliance/incidents/route` - READ

### `incident_notifications`
- `POST /api/cron/incident-reporting-check` - WRITE

### `incident_updates`
- `GET /api/compliance/incidents/route` - READ

### `insurance_products`
- `POST /api/utilities/insurance/purchase` - READ

### `merchant_analytics`
- `GET /api/analytics/merchants/route` - READ
- `GET /api/analytics/insights/route` - READ
- `GET /api/analytics/export/route` - READ
- `POST /api/cron/analytics-daily/route` - WRITE
- `POST /api/cron/analytics-weekly/route` - READ
- `POST /api/cron/analytics-monthly/route` - READ

### `merchants`
- `POST /api/guardian/credit/assess` - READ - Python AI
- `POST /api/guardian/fraud/check` - READ (indirect) - Python AI
- `POST /api/payments/merchant-payment` - READ
- `POST /api/utilities/vouchers/redeem` - READ
- `GET /api/merchants/qr-code/route` - READ

### `messages`
- `POST /chat` - READ/WRITE - Python AI
- `POST /api/chat` - READ/WRITE - TypeScript AI
- `POST /chat/simple` - READ/WRITE - Python AI
- `POST /api/chat/simple` - READ/WRITE - TypeScript AI
- `POST /chat/stream` - READ/WRITE - Python AI
- `GET /sessions/{session_id}` - READ - Python AI

### `ml_models`
- `POST /api/ml/fraud/check` - READ - Python AI
- `POST /api/ml/credit/assess` - READ - Python AI
- `POST /api/ml/transactions/classify` - READ - Python AI
- `POST /api/ml/spending/analyze` - READ - Python AI
- `GET /api/admin/ai-monitoring/route` - READ

### `model_performance`
- `GET /api/admin/ai-monitoring/route` - READ

### `money_requests`
- `GET /api/requests` - READ
- `GET /api/requests/[id]` - READ
- `POST /api/requests/[id]` - READ/WRITE
- `POST /api/payments/request` - WRITE

### `notification_logs`
- `POST /api/notifications/send` - WRITE

### `notification_preferences`
- `GET /api/notifications/preferences` - READ

### `notifications`
- `GET /api/notifications` - READ
- `GET /api/notifications/[id]` - READ
- `PUT /api/notifications/[id]` - WRITE
- `POST /api/notifications/send` - WRITE
- `POST /api/payments/send` - WRITE
- `POST /api/payments/request` - WRITE
- `POST /api/payments/split-bill/route` - WRITE
- `POST /api/utilities/vouchers/disburse` - WRITE

### `otp_codes`
- `POST /api/auth/login` - READ/WRITE
- `POST /api/auth/verify-2fa` - READ/WRITE
- `POST /api/payments/wallet-to-wallet` - READ (2FA verification)

### `payment_method_analytics`
- `GET /api/analytics/payment-methods/route` - READ
- `GET /api/analytics/insights/route` - READ
- `GET /api/analytics/export/route` - READ
- `POST /api/cron/analytics-daily/route` - WRITE
- `POST /api/cron/analytics-weekly/route` - READ
- `POST /api/cron/analytics-monthly/route` - READ

### `pin_audit_logs`
- `POST /api/auth/setup-pin` - WRITE
- `GET /api/admin/audit-logs/query/route` - READ
- `GET /api/admin/audit-logs/export/route` - READ
- `POST /api/admin/audit-logs/retention/route` - READ/WRITE (archive)

### `predictions`
- `POST /api/ml/fraud/check` - WRITE - Python AI
- `POST /api/ml/credit/assess` - WRITE - Python AI
- `POST /api/ml/transactions/classify` - WRITE - Python AI
- `POST /api/ml/spending/analyze` - WRITE - Python AI
- `GET /api/admin/ai-monitoring/route` - READ

### `processing_metrics`
- Internal monitoring (cron jobs) - WRITE

### `push_tokens`
- `POST /api/notifications/register` - WRITE

### `security_incidents`
- `GET /api/compliance/incidents/route` - READ
- `POST /api/cron/incident-reporting-check` - WRITE

### `sessions`
- `POST /api/guardian/chat` - READ/WRITE - Python AI
- `POST /api/companion/chat` - READ/WRITE - Python AI
- `POST /api/companion/chat/stream` - READ/WRITE - Python AI
- `POST /chat` - READ/WRITE - Python AI
- `POST /api/chat` - READ/WRITE - TypeScript AI
- `POST /chat/simple` - READ/WRITE - Python AI
- `POST /api/chat/simple` - READ/WRITE - TypeScript AI
- `POST /chat/stream` - READ/WRITE - Python AI
- `POST /api/ussd/route` - READ/WRITE

### `settlement_batches`
- Internal settlement processing - WRITE

### `spending_analyses`
- `POST /api/transaction-analyst/analyze` - WRITE - Python AI
- `POST /api/transaction-analyst/budget` - WRITE - Python AI
- `POST /api/transaction-analyst/chat` - READ/WRITE - Python AI
- `POST /api/ml/spending/analyze` - WRITE - Python AI
- `POST /api/transaction-analyst/analyze` - WRITE - TypeScript AI
- `POST /api/transaction-analyst/budget` - WRITE - TypeScript AI
- `POST /api/transaction-analyst/chat` - READ/WRITE - TypeScript AI
- `GET /api/companion/suggestions` - READ
- `GET /api/transaction-analyst/budget-insights` - READ

### `spending_personas`
- `POST /api/transaction-analyst/analyze` - READ/WRITE - Python AI
- `GET /api/companion/context/{user_id}` - READ - Python AI
- `POST /api/transaction-analyst/analyze` - READ/WRITE - TypeScript AI

### `split_bill_participants`
- `POST /api/payments/split-bill/route` - WRITE
- `POST /api/payments/split-bill/[id]/pay/route` - READ/WRITE

### `split_bills`
- `POST /api/payments/split-bill/route` - WRITE
- `POST /api/payments/split-bill/[id]/pay/route` - READ

### `staff_audit_logs`
- `POST /api/admin/users/[id]/suspend` - WRITE
- `POST /api/admin/users/[id]/reactivate` - WRITE
- `GET /api/admin/audit-logs/query/route` - READ
- `GET /api/admin/audit-logs/export/route` - READ
- `POST /api/admin/audit-logs/retention/route` - READ/WRITE (archive)

### `system_health`
- Internal health monitoring - WRITE

### `transaction_analytics`
- `GET /api/analytics/transactions/route` - READ
- `GET /api/analytics/insights/route` - READ
- `GET /api/analytics/export/route` - READ
- `POST /api/cron/analytics-hourly/route` - WRITE
- `POST /api/cron/analytics-daily/route` - WRITE
- `POST /api/cron/analytics-weekly/route` - READ
- `POST /api/cron/analytics-monthly/route` - READ

### `transaction_audit_logs`
- `POST /api/admin/transactions/[id]/flag/route` - WRITE
- `GET /api/admin/audit-logs/query/route` - READ
- `GET /api/admin/audit-logs/export/route` - READ
- `POST /api/admin/audit-logs/retention/route` - READ/WRITE (archive)

### `transaction_categories`
- `POST /api/transaction-analyst/classify` - WRITE - Python AI
- `POST /api/transaction-analyst/analyze` - READ - Python AI
- `POST /api/ml/transactions/classify` - WRITE - Python AI
- `POST /api/transaction-analyst/classify` - WRITE - TypeScript AI
- `POST /api/transaction-analyst/analyze` - READ - TypeScript AI
- `GET /api/transaction-analyst/budget-insights` - READ
- `GET /api/transactions/[id]` - READ

### `transactions`
- `POST /api/guardian/fraud/check` - READ - Python AI
- `POST /api/guardian/credit/assess` - READ (statistics) - Python AI
- `POST /api/transaction-analyst/classify` - READ - Python AI
- `POST /api/transaction-analyst/analyze` - READ - Python AI
- `POST /api/transaction-analyst/budget` - READ - Python AI
- `GET /api/companion/context/{user_id}` - READ - Python AI
- `POST /api/guardian/fraud/check` - READ - TypeScript AI
- `POST /api/guardian/credit/assess` - READ - TypeScript AI
- `POST /api/transaction-analyst/classify` - READ - TypeScript AI
- `POST /api/transaction-analyst/analyze` - READ - TypeScript AI
- `POST /api/transaction-analyst/budget` - READ - TypeScript AI
- `GET /api/transactions` - READ
- `GET /api/transactions/[id]` - READ
- `POST /api/payments/send` - WRITE
- `POST /api/payments/bank-transfer` - WRITE
- `POST /api/payments/merchant-payment` - WRITE
- `POST /api/payments/wallet-to-wallet` - WRITE
- `POST /api/payments/split-bill/[id]/pay/route` - WRITE
- `POST /api/payments/3ds-complete` - READ/WRITE
- `POST /api/requests/[id]` - WRITE
- `POST /api/groups/[id]/contribute` - WRITE
- `POST /api/wallets/[id]/add-money` - WRITE
- `POST /api/wallets/[id]/autopay/execute` - WRITE
- `POST /api/utilities/vouchers/redeem` - WRITE
- `POST /api/utilities/mobile-recharge` - WRITE
- `POST /api/utilities/buy-tickets` - WRITE
- `POST /api/utilities/insurance/purchase` - WRITE
- `GET /api/wallets/[id]` - READ
- `GET /api/admin/transactions` - READ
- `POST /api/admin/transactions/[id]/flag/route` - READ/WRITE
- `GET /api/analytics/transactions/route` - READ
- `POST /api/cron/analytics-hourly/route` - READ
- `POST /api/cron/analytics-daily/route` - READ
- `POST /api/cron/analytics-weekly/route` - READ
- `POST /api/cron/analytics-monthly/route` - READ
- `POST /api/compliance/processing/route` - READ
- `POST /api/cron/compliance-report` - READ
- `POST /api/cron/incident-reporting-check` - READ
- `POST /api/webhooks/smartpay/route` - READ/WRITE
- `GET /api/companion/suggestions` - READ
- `GET /api/transaction-analyst/budget-insights` - READ
- `POST /api/ussd/route` - READ/WRITE

### `trust_account`
- `GET /api/admin/trust-account/status` - READ
- `POST /api/admin/trust-account/reconcile` - READ
- `POST /api/cron/trust-account-reconcile` - READ

### `trust_account_reconciliation_log`
- `POST /api/admin/trust-account/reconcile` - WRITE
- `POST /api/cron/trust-account-reconcile` - WRITE

### `trust_account_transactions`
- `GET /api/admin/trust-account/status` - READ
- `POST /api/admin/trust-account/reconcile` - READ
- `POST /api/cron/trust-account-reconcile` - READ

### `user_behavior_analytics`
- `GET /api/analytics/users/route` - READ
- `GET /api/analytics/insights/route` - READ
- `GET /api/analytics/export/route` - READ
- `POST /api/cron/analytics-hourly/route` - WRITE
- `POST /api/cron/analytics-daily/route` - WRITE
- `POST /api/cron/analytics-weekly/route` - READ
- `POST /api/cron/analytics-monthly/route` - READ

### `user_banks`
- `GET /api/banks` - READ
- `GET /api/banks/[id]` - READ
- `POST /api/banks` - WRITE
- `POST /api/payments/bank-transfer` - READ

### `user_cards`
- `GET /api/cards` - READ
- `GET /api/cards/[id]` - READ
- `POST /api/cards` - WRITE

### `user_profiles`
- `GET /api/users/me` - READ
- `GET /api/admin/users/[id]` - READ

### `user_spending_features`
- `POST /api/transaction-analyst/analyze` - READ/WRITE - Python AI
- `GET /api/companion/context/{user_id}` - READ - Python AI
- `POST /api/transaction-analyst/analyze` - READ/WRITE - TypeScript AI
- `GET /api/companion/suggestions` - READ
- `GET /api/transaction-analyst/budget-insights` - READ

### `users`
- `GET /api/companion/context/{user_id}` - READ - Python AI
- `POST /api/guardian/credit/assess` - READ - Python AI
- `POST /api/guardian/fraud/check` - READ (indirect via transactions) - Python AI
- `POST /api/guardian/credit/assess` - READ - TypeScript AI
- `POST /api/guardian/fraud/check` - READ - TypeScript AI
- `POST /api/auth/login` - READ/WRITE
- `POST /api/auth/setup-pin` - READ/WRITE
- `POST /api/auth/verify-2fa` - READ
- `GET /api/users/me` - READ
- `POST /api/users/toggle-2fa` - READ/WRITE
- `GET /api/users/sessions` - READ
- `POST /api/payments/send` - READ
- `POST /api/payments/bank-transfer` - READ
- `POST /api/payments/merchant-payment` - READ
- `POST /api/payments/wallet-to-wallet` - READ
- `POST /api/payments/request` - READ
- `POST /api/payments/split-bill/route` - READ
- `POST /api/groups/[id]/contribute` - READ
- `POST /api/utilities/vouchers/disburse` - READ
- `GET /api/admin/users` - READ
- `GET /api/admin/users/[id]` - READ
- `POST /api/admin/users/[id]/suspend` - READ/WRITE
- `POST /api/admin/users/[id]/reactivate` - READ/WRITE
- `GET /api/analytics/users/route` - READ
- `POST /api/cron/analytics-hourly/route` - READ
- `POST /api/cron/analytics-daily/route` - READ
- `POST /api/compliance/processing/route` - READ
- `POST /api/ussd/route` - READ

### `voucher_audit_logs`
- `POST /api/utilities/vouchers/disburse` - WRITE
- `POST /api/utilities/vouchers/redeem` - WRITE
- `GET /api/admin/audit-logs/query/route` - READ
- `GET /api/admin/audit-logs/export/route` - READ
- `POST /api/admin/audit-logs/retention/route` - READ/WRITE (archive)

### `voucher_redemptions`
- `POST /api/utilities/vouchers/redeem` - WRITE
- `GET /api/utilities/vouchers/[id]` - READ
- `POST /api/ussd/route` - WRITE

### `vouchers`
- `GET /api/utilities/vouchers` - READ
- `GET /api/utilities/vouchers/all` - READ
- `GET /api/utilities/vouchers/[id]` - READ
- `POST /api/utilities/vouchers/disburse` - WRITE
- `POST /api/utilities/vouchers/redeem` - READ/WRITE
- `POST /api/utilities/vouchers/find-by-qr` - READ
- `POST /api/compliance/processing/route` - READ
- `POST /api/cron/compliance-report` - READ
- `POST /api/webhooks/smartpay/route` - READ
- `POST /api/ussd/route` - READ/WRITE

### `wallet_dormancy_events`
- `GET /api/compliance/dormancy/route` - READ

### `wallet_dormancy_reports`
- `GET /api/compliance/dormancy/route` - READ

### `wallets`
- `GET /api/wallets` - READ
- `GET /api/wallets/[id]` - READ
- `POST /api/wallets/[id]/add-money` - READ/WRITE
- `GET /api/wallets/[id]/autopay/history` - READ
- `POST /api/wallets/[id]/autopay/execute` - READ/WRITE
- `POST /api/payments/send` - READ/WRITE
- `POST /api/payments/bank-transfer` - READ/WRITE
- `POST /api/payments/merchant-payment` - READ/WRITE
- `POST /api/payments/wallet-to-wallet` - READ/WRITE
- `POST /api/payments/split-bill/[id]/pay/route` - READ/WRITE
- `POST /api/payments/3ds-complete` - READ/WRITE
- `POST /api/requests/[id]` - READ/WRITE
- `POST /api/groups/[id]/contribute` - READ/WRITE
- `POST /api/utilities/vouchers/redeem` - READ/WRITE
- `POST /api/utilities/mobile-recharge` - READ/WRITE
- `POST /api/utilities/buy-tickets` - READ/WRITE
- `POST /api/utilities/insurance/purchase` - READ/WRITE
- `GET /api/users/me` - READ
- `GET /api/admin/users` - READ
- `GET /api/admin/users/[id]` - READ
- `POST /api/cron/analytics-hourly/route` - READ
- `POST /api/cron/analytics-daily/route` - READ
- `GET /api/compliance/dormancy/route` - READ
- `POST /api/ussd/route` - READ/WRITE

---

## Database Functions Used

### Vector Search Functions
- **`match_chunks(query_embedding, match_count)`** - Vector similarity search
- **`hybrid_search(query_embedding, query_text, match_count, text_weight)`** - Hybrid search

### Helper Functions
- **`get_latest_credit_score(merchant_uuid)`** - Get latest credit score
- **`get_user_spending_summary(user_uuid, start_date, end_date)`** - Get spending summary
- **`check_model_retraining_needed(model_uuid, accuracy_threshold)`** - Check if retraining needed

---

## Testing & Validation

### Test Scripts

**Comprehensive Validation:**
```bash
# Test all endpoints and database tables
npx tsx scripts/test-api-database-mapping.ts
```

**Python AI Backend Tests:**
```bash
cd buffr_ai
pytest tests/test_api_database_mapping.py -v
```

**AI Backend Endpoint Tests:**
```bash
./scripts/test-ai-backend.sh
```

**See:** `docs/TESTING_API_DATABASE_MAPPING.md` for complete testing guide

---

## Notes

1. **Missing Tables:** Some endpoints reference tables that may not exist yet:
   - `conversations` - Used by Companion Agent (may need to be created)
   - `financial_goals` - Referenced in user context (may not exist)
   - `literacy_assessments` - Referenced in user context (Mentor Agent - removed)
   - `subscriptions` - Referenced in utilities endpoints (may not exist)
   - `sponsored_services` - Referenced in utilities endpoints (may not exist)
   - `workflows` - Used by Crafter Agent in TypeScript backend (may not exist)
   - `workflow_executions` - Used by Crafter Agent in TypeScript backend (may not exist)

2. **Graceful Degradation:** All database operations have try-except blocks and will continue functioning even if database is unavailable.

3. **Session Management:** Sessions are created on-demand if they don't exist.

4. **ML Models:** ML model storage is optional - endpoints work with or without trained models.

5. **Backend Status:**
   - **Python AI Backend (Port 8001):** Active, primary AI backend for G2P voucher platform
   - **TypeScript AI Backend (Port 8000):** Legacy backend, being phased out
   - **Next.js API Routes (Port 3000):** Active, core application APIs

6. **Endpoint Count:**
   - Python AI Backend: ~25 endpoints
   - TypeScript AI Backend: ~20 endpoints
   - Next.js API Routes: 95+ endpoints
   - **Total: 140+ API endpoints**

7. **Database Tables:**
   - Core tables: 15+
   - Audit & compliance tables: 15+
   - Analytics tables: 6
   - AI/ML tables: 8
   - Utility tables: 10+
   - **Total: 60+ database tables**

---

**Last Updated:** January 22, 2026  
**Maintained By:** AI Backend Team  
**Documentation Status:** ✅ Complete - All endpoints and tables mapped across entire project
