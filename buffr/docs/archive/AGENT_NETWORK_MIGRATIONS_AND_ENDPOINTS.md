# Agent Network Migrations & API Endpoints

**Date:** January 26, 2026  
**Status:** ✅ Complete - All migrations and endpoints follow Open Banking v1 format

---

## 📋 Overview

This document provides a complete reference for:
1. **Database Migrations** - Agent network tables and schema
2. **API Endpoints** - All 12 agent network endpoints following Open Banking v1 format
3. **PRD Integration** - Key clarifications about agent registration and access

**Key Answer:** Agents do NOT sign up through the main Buffr app. They have a separate registration and onboarding process via Agent Portal.

---

## 🗄️ Database Migrations

### Migration File

**Location:** `sql/migration_agent_network.sql`

**Status:** ✅ Ready to execute

**How to Run:**
```bash
# Option 1: Using migration runner (recommended)
npm run migrate

# Option 2: Manual execution via Neon dashboard
# Copy contents of sql/migration_agent_network.sql
# Paste into Neon SQL Editor and execute
```

### Tables Created

#### 1. `agents` Table
**Purpose:** Core agent information and configuration

**Columns:**
- `id` (UUID, Primary Key) - Agent unique identifier
- `name` (VARCHAR(255)) - Business name
- `type` (VARCHAR(50)) - Agent type: 'small', 'medium', 'large'
- `location` (VARCHAR(255)) - Physical address
- `latitude` (DECIMAL(10,8)) - GPS latitude
- `longitude` (DECIMAL(11,8)) - GPS longitude
- `wallet_id` (UUID, Foreign Key → wallets.id) - Agent's Buffr wallet
- `liquidity_balance` (DECIMAL(15,2)) - Available liquidity for cash-outs
- `cash_on_hand` (DECIMAL(15,2)) - Physical cash available
- `status` (VARCHAR(50)) - 'active', 'inactive', 'suspended', 'pending_approval'
- `min_liquidity_required` (DECIMAL(15,2)) - Minimum liquidity threshold
- `max_daily_cashout` (DECIMAL(15,2)) - Daily cash-out limit
- `commission_rate` (DECIMAL(5,2)) - Commission percentage (e.g., 1.5 for 1.5%)
- `contact_phone` (VARCHAR(20)) - Agent contact phone
- `contact_email` (VARCHAR(255)) - Agent contact email
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_agents_status` - Fast status filtering
- `idx_agents_type` - Fast type filtering
- `idx_agents_location` - Fast location search
- `idx_agents_wallet_id` - Fast wallet lookup
- `idx_agents_coordinates` - Geographic queries (latitude, longitude)

**Triggers:**
- `trg_agents_updated_at` - Auto-update `updated_at` on row changes

#### 2. `agent_liquidity_logs` Table
**Purpose:** Track agent liquidity changes over time

**Columns:**
- `id` (UUID, Primary Key)
- `agent_id` (UUID, Foreign Key → agents.id, CASCADE DELETE)
- `liquidity_balance` (DECIMAL(15,2)) - Liquidity balance at time of log
- `cash_on_hand` (DECIMAL(15,2)) - Cash on hand at time of log
- `timestamp` (TIMESTAMP WITH TIME ZONE) - When liquidity was recorded
- `notes` (TEXT) - Reason for liquidity change
- `created_at` (TIMESTAMP WITH TIME ZONE) - Log creation timestamp

**Indexes:**
- `idx_agent_liquidity_logs_agent_id` - Fast agent lookup
- `idx_agent_liquidity_logs_timestamp` - Fast time-based queries

#### 3. `agent_transactions` Table
**Purpose:** Track all agent transactions (cash-out, cash-in, commissions)

**Columns:**
- `id` (UUID, Primary Key)
- `agent_id` (UUID, Foreign Key → agents.id, CASCADE DELETE)
- `beneficiary_id` (UUID, Foreign Key → users.id, CASCADE DELETE)
- `voucher_id` (UUID, Foreign Key → vouchers.id, SET NULL on delete)
- `amount` (DECIMAL(15,2)) - Transaction amount
- `transaction_type` (VARCHAR(50)) - 'cash_out', 'cash_in', 'commission'
- `status` (VARCHAR(50)) - 'pending', 'completed', 'failed'
- `metadata` (JSONB) - Additional transaction data
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Indexes:**
- `idx_agent_transactions_agent_id` - Fast agent lookup
- `idx_agent_transactions_beneficiary_id` - Fast beneficiary lookup
- `idx_agent_transactions_voucher_id` - Fast voucher lookup
- `idx_agent_transactions_status` - Fast status filtering
- `idx_agent_transactions_type` - Fast type filtering
- `idx_agent_transactions_created_at` - Fast time-based queries

**Triggers:**
- `trg_agent_transactions_updated_at` - Auto-update `updated_at` on row changes

#### 4. `agent_settlements` Table
**Purpose:** Track agent settlements (monthly commission payments)

**Columns:**
- `id` (UUID, Primary Key)
- `agent_id` (UUID, Foreign Key → agents.id, CASCADE DELETE)
- `settlement_period` (VARCHAR(20)) - Format: "YYYY-MM" (e.g., "2026-01")
- `total_amount` (DECIMAL(15,2)) - Total transaction amount for period
- `commission` (DECIMAL(15,2)) - Commission earned
- `settlement_status` (VARCHAR(50)) - 'pending', 'processing', 'completed', 'failed'
- `settled_at` (TIMESTAMP WITH TIME ZONE) - When settlement was completed
- `metadata` (JSONB) - Additional settlement data
- `created_at` (TIMESTAMP WITH TIME ZONE) - Creation timestamp
- `updated_at` (TIMESTAMP WITH TIME ZONE) - Last update timestamp

**Constraints:**
- `UNIQUE(agent_id, settlement_period)` - One settlement per agent per period

**Indexes:**
- `idx_agent_settlements_agent_id` - Fast agent lookup
- `idx_agent_settlements_period` - Fast period filtering
- `idx_agent_settlements_status` - Fast status filtering
- `idx_agent_settlements_settled_at` - Fast time-based queries

**Triggers:**
- `trg_agent_settlements_updated_at` - Auto-update `updated_at` on row changes

### Migration Features

✅ **Idempotent:** Uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`  
✅ **Safe:** Uses `IF NOT EXISTS` to prevent errors on re-run  
✅ **Complete:** Includes all tables, indexes, triggers, and comments  
✅ **Documented:** Includes table and column comments  
✅ **Optimized:** Proper indexes for common query patterns  

---

## 🔌 API Endpoints

All agent endpoints follow **Open Banking v1** format with:
- ✅ Standardized error responses (`OpenBankingErrorCode`)
- ✅ Open Banking pagination (`helpers.paginated`)
- ✅ Request/Response metadata (`Links`, `Meta`)
- ✅ Rate limiting (`RATE_LIMITS`)
- ✅ Authentication required (`requireAuth: true`)
- ✅ Response time tracking (`trackResponseTime: true`)

### Endpoint Summary

| Method | Endpoint | Purpose | Open Banking Format |
|--------|----------|---------|---------------------|
| GET | `/api/v1/agents` | List all agents | ✅ Yes |
| GET | `/api/v1/agents/{agentId}` | Get agent details | ✅ Yes |
| PUT | `/api/v1/agents/{agentId}` | Update agent (admin) | ✅ Yes |
| GET | `/api/v1/agents/nearby` | Find nearby agents | ✅ Yes |
| GET | `/api/v1/agents/dashboard` | Agent dashboard data | ✅ Yes |
| GET | `/api/v1/agents/{agentId}/transactions` | Agent transaction history | ✅ Yes |
| GET | `/api/v1/agents/{agentId}/liquidity` | Agent liquidity status | ✅ Yes |
| GET | `/api/v1/agents/{agentId}/liquidity-history` | Liquidity history | ✅ Yes |
| POST | `/api/v1/agents/{agentId}/cash-out` | Process cash-out | ✅ Yes |
| POST | `/api/v1/agents/{agentId}/mark-unavailable` | Mark unavailable | ✅ Yes |
| GET | `/api/v1/agents/{agentId}/settlement` | Get settlements | ✅ Yes |
| POST | `/api/v1/agents/{agentId}/settlement` | Process settlement | ✅ Yes |

**Total:** 12 endpoints (10 unique routes)

---

## 📝 Endpoint Details

### 1. GET /api/v1/agents

**Purpose:** List all agents with optional filters

**Query Parameters:**
- `status` - Filter by status: 'active', 'inactive', 'suspended', 'pending_approval'
- `type` - Filter by type: 'small', 'medium', 'large'
- `location` - Filter by location (partial match)
- `min_liquidity` - Filter by minimum liquidity
- `latitude` - For nearby search (requires longitude)
- `longitude` - For nearby search (requires latitude)
- `radius_km` - Search radius in kilometers (default: 10)
- `page` - Page number (default: 1)
- `page-size` - Items per page (default: 25, max: 100)

**Response Format:**
```json
{
  "Data": {
    "Agents": [
      {
        "AgentId": "uuid",
        "Name": "Agent Name",
        "Type": "small|medium|large",
        "Location": "Address",
        "Coordinates": {
          "Latitude": -22.1234,
          "Longitude": 17.5678
        },
        "Liquidity": {
          "Balance": 10000.00,
          "CashOnHand": 5000.00,
          "MinRequired": 1000.00,
          "HasSufficient": true
        },
        "Limits": {
          "MaxDailyCashout": 50000.00
        },
        "Commission": {
          "Rate": 1.5
        },
        "Status": "active",
        "CreatedDateTime": "2026-01-26T10:00:00Z",
        "UpdatedDateTime": "2026-01-26T10:00:00Z"
      }
    ],
    "Links": {
      "Self": "/api/v1/agents?page=1&page-size=25",
      "First": "/api/v1/agents?page=1&page-size=25",
      "Prev": null,
      "Next": "/api/v1/agents?page=2&page-size=25",
      "Last": "/api/v1/agents?page=3&page-size=25"
    },
    "Meta": {
      "TotalPages": 3
    }
  }
}
```

**Error Responses:**
- `400` - Invalid query parameters
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/route.ts`

---

### 2. GET /api/v1/agents/{agentId}

**Purpose:** Get detailed agent information

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Response Format:**
```json
{
  "Data": {
    "AgentId": "uuid",
    "Name": "Agent Name",
    "Type": "small|medium|large",
    "Location": "Address",
    "Coordinates": {
      "Latitude": -22.1234,
      "Longitude": 17.5678
    },
    "WalletId": "wallet-uuid",
    "Liquidity": {
      "Balance": 10000.00,
      "CashOnHand": 5000.00,
      "MinRequired": 1000.00,
      "HasSufficient": true,
      "CanProcessCashOut": true
    },
    "Limits": {
      "MaxDailyCashout": 50000.00
    },
    "Commission": {
      "Rate": 1.5
    },
    "Status": "active",
    "CreatedDateTime": "2026-01-26T10:00:00Z",
    "UpdatedDateTime": "2026-01-26T10:00:00Z"
  },
  "Links": {
    "Self": "/api/v1/agents/{agentId}"
  },
  "Meta": {}
}
```

**Error Responses:**
- `404` - Agent not found
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/route.ts`

---

### 3. PUT /api/v1/agents/{agentId}

**Purpose:** Update agent details (admin only)

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Request Body:**
```json
{
  "Data": {
    "Name": "Updated Name",
    "Type": "medium",
    "Location": "Updated Address",
    "Latitude": -22.1234,
    "Longitude": 17.5678,
    "MinLiquidityRequired": 5000.00,
    "MaxDailyCashout": 100000.00,
    "CommissionRate": 1.2,
    "Status": "active"
  }
}
```

**Response Format:**
```json
{
  "Data": {
    "AgentId": "uuid",
    "Name": "Updated Name",
    "Type": "medium",
    "Location": "Updated Address",
    "Status": "active",
    "UpdatedDateTime": "2026-01-26T10:00:00Z"
  },
  "Links": {
    "Self": "/api/v1/agents/{agentId}"
  },
  "Meta": {}
}
```

**Error Responses:**
- `400` - Invalid data or no fields to update
- `404` - Agent not found
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/route.ts`

---

### 4. GET /api/v1/agents/nearby

**Purpose:** Find nearby agents based on geographic coordinates

**Query Parameters:**
- `latitude` (required) - GPS latitude
- `longitude` (required) - GPS longitude
- `radius_km` - Search radius in kilometers (default: 10)
- `min_liquidity` - Minimum liquidity filter

**Response Format:**
```json
{
  "Data": {
    "Agents": [
      {
        "AgentId": "uuid",
        "Name": "Agent Name",
        "Type": "small",
        "Location": "Address",
        "Coordinates": {
          "Latitude": -22.1234,
          "Longitude": 17.5678
        },
        "Liquidity": {
          "Balance": 10000.00,
          "CashOnHand": 5000.00,
          "MinRequired": 1000.00,
          "HasSufficient": true
        },
        "Limits": {
          "MaxDailyCashout": 50000.00
        },
        "Commission": {
          "Rate": 1.5
        },
        "Status": "active"
      }
    ],
    "Total": 5,
    "SearchParams": {
      "Latitude": -22.1234,
      "Longitude": 17.5678,
      "RadiusKm": 10,
      "MinLiquidity": null
    }
  },
  "Links": {
    "Self": "/api/v1/agents/nearby?latitude=-22.1234&longitude=17.5678"
  },
  "Meta": {}
}
```

**Error Responses:**
- `400` - Missing latitude/longitude or invalid format
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/nearby/route.ts`

---

### 5. GET /api/v1/agents/dashboard

**Purpose:** Get agent dashboard data (statistics, liquidity, transactions)

**Query Parameters:**
- `agent_id` (required) - Agent unique identifier

**Response Format:**
```json
{
  "Data": {
    "Agent": {
      "AgentId": "uuid",
      "Name": "Agent Name",
      "Type": "small",
      "Location": "Address",
      "Status": "active"
    },
    "Liquidity": {
      "Balance": 10000.00,
      "CashOnHand": 5000.00,
      "MinRequired": 1000.00,
      "HasSufficient": true,
      "CanProcessCashOut": true
    },
    "Statistics": {
      "Today": {
        "TransactionCount": 15,
        "TotalAmount": 5000.00
      },
      "ThisMonth": {
        "TransactionCount": 450,
        "TotalAmount": 150000.00
      }
    },
    "Limits": {
      "MaxDailyCashout": 50000.00,
      "RemainingToday": 45000.00
    },
    "Commission": {
      "Rate": 1.5,
      "EstimatedThisMonth": 2250.00
    }
  },
  "Links": {
    "Self": "/api/v1/agents/dashboard?agent_id={agentId}"
  },
  "Meta": {}
}
```

**Error Responses:**
- `400` - Missing agent_id
- `404` - Agent not found
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/dashboard/route.ts`

---

### 6. GET /api/v1/agents/{agentId}/transactions

**Purpose:** Get agent transaction history with pagination

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Query Parameters:**
- `status` - Filter by status: 'pending', 'completed', 'failed'
- `from` - Start date (ISO format)
- `to` - End date (ISO format)
- `page` - Page number (default: 1)
- `page-size` - Items per page (default: 25, max: 100)

**Response Format:**
```json
{
  "Data": {
    "Transactions": [
      {
        "TransactionId": "uuid",
        "AgentId": "uuid",
        "BeneficiaryId": "uuid",
        "VoucherId": "uuid",
        "Amount": 1000.00,
        "TransactionType": "cash_out",
        "Status": "completed",
        "CreatedDateTime": "2026-01-26T10:00:00Z"
      }
    ],
    "Links": {
      "Self": "/api/v1/agents/{agentId}/transactions?page=1&page-size=25",
      "First": "/api/v1/agents/{agentId}/transactions?page=1&page-size=25",
      "Prev": null,
      "Next": "/api/v1/agents/{agentId}/transactions?page=2&page-size=25",
      "Last": "/api/v1/agents/{agentId}/transactions?page=3&page-size=25"
    },
    "Meta": {
      "TotalPages": 3
    }
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/transactions/route.ts`

---

### 7. GET /api/v1/agents/{agentId}/liquidity

**Purpose:** Get current agent liquidity status

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Response Format:**
```json
{
  "Data": {
    "AgentId": "uuid",
    "AgentName": "Agent Name",
    "Liquidity": {
      "Balance": 10000.00,
      "CashOnHand": 5000.00,
      "MinRequired": 1000.00,
      "Available": 10000.00
    },
    "Status": {
      "HasSufficientLiquidity": true,
      "CanProcessCashOut": true,
      "AgentStatus": "active"
    },
    "Timestamp": "2026-01-26T10:00:00Z"
  },
  "Links": {
    "Self": "/api/v1/agents/{agentId}/liquidity"
  },
  "Meta": {}
}
```

**Error Responses:**
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/liquidity/route.ts`

---

### 8. GET /api/v1/agents/{agentId}/liquidity-history

**Purpose:** Get agent liquidity history with pagination

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Query Parameters:**
- `from` - Start date (ISO format)
- `to` - End date (ISO format)
- `page` - Page number (default: 1)
- `page-size` - Items per page (default: 25, max: 100)

**Response Format:**
```json
{
  "Data": {
    "LiquidityHistory": [
      {
        "LogId": "uuid",
        "AgentId": "uuid",
        "LiquidityBalance": 10000.00,
        "CashOnHand": 5000.00,
        "Timestamp": "2026-01-26T10:00:00Z",
        "Notes": "Cash-out transaction"
      }
    ],
    "Links": {
      "Self": "/api/v1/agents/{agentId}/liquidity-history?page=1&page-size=25",
      "First": "/api/v1/agents/{agentId}/liquidity-history?page=1&page-size=25",
      "Prev": null,
      "Next": "/api/v1/agents/{agentId}/liquidity-history?page=2&page-size=25",
      "Last": "/api/v1/agents/{agentId}/liquidity-history?page=3&page-size=25"
    },
    "Meta": {
      "TotalPages": 3
    }
  }
}
```

**Error Responses:**
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/liquidity-history/route.ts`

---

### 9. POST /api/v1/agents/{agentId}/cash-out

**Purpose:** Process cash-out transaction (PSD-12: 2FA required)

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Request Body:**
```json
{
  "Data": {
    "BeneficiaryId": "uuid",
    "Amount": 1000.00,
    "VoucherId": "uuid"
  },
  "verificationToken": "2fa-token"
}
```

**Response Format:**
```json
{
  "Data": {
    "TransactionId": "uuid",
    "AgentId": "uuid",
    "BeneficiaryId": "uuid",
    "Amount": 1000.00,
    "Currency": "NAD",
    "Status": "completed",
    "VoucherId": "uuid",
    "CreatedDateTime": "2026-01-26T10:00:00Z"
  },
  "Links": {
    "Self": "/api/v1/agents/{agentId}/transactions/{transactionId}"
  },
  "Meta": {}
}
```

**Error Responses:**
- `400` - Missing required fields or invalid amount
- `401` - Authentication required or invalid 2FA token
- `404` - Agent or beneficiary not found
- `500` - Server error or insufficient liquidity

**PSD-12 Compliance:**
- ✅ Requires 2FA verification token
- ✅ Validates 2FA token before processing
- ✅ Returns `SCA_REQUIRED` error if 2FA missing

**File:** `app/api/v1/agents/[agentId]/cash-out/route.ts`

---

### 10. POST /api/v1/agents/{agentId}/mark-unavailable

**Purpose:** Mark agent as unavailable

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Request Body:**
```json
{
  "Data": {
    "Reason": "Out of cash"
  }
}
```

**Response Format:**
```json
{
  "Data": {
    "AgentId": "uuid",
    "Status": "inactive",
    "Message": "Agent marked as unavailable",
    "Reason": "Out of cash",
    "UpdatedDateTime": "2026-01-26T10:00:00Z"
  },
  "Links": {
    "Self": "/api/v1/agents/{agentId}"
  },
  "Meta": {}
}
```

**Error Responses:**
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/mark-unavailable/route.ts`

---

### 11. GET /api/v1/agents/{agentId}/settlement

**Purpose:** Get agent settlement history or specific settlement

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Query Parameters:**
- `period` (optional) - Settlement period in "YYYY-MM" format (e.g., "2026-01")
  - If provided: Returns specific settlement
  - If omitted: Returns all settlements with pagination

**Response Format (Specific Settlement):**
```json
{
  "Data": {
    "SettlementId": "uuid",
    "AgentId": "uuid",
    "Period": "2026-01",
    "TotalAmount": 150000.00,
    "Commission": 2250.00,
    "Status": "completed",
    "SettledDateTime": "2026-01-31T23:59:59Z",
    "CreatedDateTime": "2026-01-26T10:00:00Z"
  },
  "Links": {
    "Self": "/api/v1/agents/{agentId}/settlement?period=2026-01"
  },
  "Meta": {}
}
```

**Response Format (All Settlements):**
```json
{
  "Data": {
    "Settlements": [
      {
        "SettlementId": "uuid",
        "Period": "2026-01",
        "TotalAmount": 150000.00,
        "Commission": 2250.00,
        "Status": "completed",
        "SettledDateTime": "2026-01-31T23:59:59Z",
        "CreatedDateTime": "2026-01-26T10:00:00Z"
      }
    ],
    "Links": {
      "Self": "/api/v1/agents/{agentId}/settlement?page=1&page-size=25",
      "First": "/api/v1/agents/{agentId}/settlement?page=1&page-size=25",
      "Prev": null,
      "Next": "/api/v1/agents/{agentId}/settlement?page=2&page-size=25",
      "Last": "/api/v1/agents/{agentId}/settlement?page=3&page-size=25"
    },
    "Meta": {
      "TotalPages": 3
    }
  }
}
```

**Error Responses:**
- `404` - Settlement not found (when period specified)
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/settlement/route.ts`

---

### 12. POST /api/v1/agents/{agentId}/settlement

**Purpose:** Process new settlement (admin only)

**Path Parameters:**
- `agentId` (UUID) - Agent unique identifier

**Request Body:**
```json
{
  "Data": {
    "SettlementPeriod": "2026-01"
  }
}
```

**Response Format:**
```json
{
  "Data": {
    "SettlementId": "uuid",
    "AgentId": "uuid",
    "Period": "2026-01",
    "TotalAmount": 150000.00,
    "Commission": 2250.00,
    "Status": "processing",
    "CreatedDateTime": "2026-01-26T10:00:00Z"
  },
  "Links": {
    "Self": "/api/v1/agents/{agentId}/settlement?period=2026-01"
  },
  "Meta": {}
}
```

**Error Responses:**
- `400` - Missing SettlementPeriod or invalid format
- `401` - Authentication required
- `500` - Server error

**File:** `app/api/v1/agents/[agentId]/settlement/route.ts`

---

## ✅ Open Banking Compliance

All endpoints follow Open Banking v1 standards:

### Error Handling
- ✅ Uses `OpenBankingErrorCode` enum
- ✅ Returns standardized error format with `Code`, `Id`, `Message`, `Errors[]`
- ✅ Includes error details with `Path` for field-level errors

### Pagination
- ✅ Uses `helpers.paginated()` for consistent pagination
- ✅ Includes `Links` (Self, First, Prev, Next, Last)
- ✅ Includes `Meta` (TotalPages, FirstAvailableDateTime, LastAvailableDateTime)

### Response Format
- ✅ Wraps data in `Data` object
- ✅ Includes `Links` for resource navigation
- ✅ Includes `Meta` for metadata
- ✅ Uses PascalCase for property names (Open Banking standard)

### Security
- ✅ All endpoints require authentication (`requireAuth: true`)
- ✅ Rate limiting applied (`RATE_LIMITS`)
- ✅ Response time tracking enabled
- ✅ PSD-12 compliance (2FA required for cash-out)

### Request/Response Metadata
- ✅ Request ID tracking (`context?.requestId`)
- ✅ Standardized headers
- ✅ API versioning (`/api/v1/`)

---

## 🚀 Quick Start

### 1. Run Migration

```bash
# Using migration runner
npm run migrate

# Or manually via Neon dashboard
# Copy sql/migration_agent_network.sql
# Paste into Neon SQL Editor and execute
```

### 2. Test Endpoints

```bash
# List agents
curl -X GET "https://your-api.com/api/v1/agents?page=1&page-size=25" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get agent details
curl -X GET "https://your-api.com/api/v1/agents/{agentId}" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Find nearby agents
curl -X GET "https://your-api.com/api/v1/agents/nearby?latitude=-22.1234&longitude=17.5678&radius_km=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Summary

**Migrations:**
- ✅ 4 tables created
- ✅ 15 indexes created
- ✅ 3 triggers created
- ✅ Fully idempotent and safe to re-run

**API Endpoints:**
- ✅ 12 endpoints (10 unique routes)
- ✅ All follow Open Banking v1 format
- ✅ Complete error handling
- ✅ Pagination support where applicable
- ✅ PSD-12 compliance (2FA for cash-out)

**Status:** ✅ **Production Ready**

---

**Last Updated:** January 26, 2026  
**Document Owner:** Technical Team  
**Version:** 1.0

---

## 📝 Related Documentation

- **PRD Update:** Agent Network section added to `PRD_BUFFR_G2P_VOUCHER_PLATFORM.md` (Section 7)
- **Testing:** See `docs/TESTING_COMPLETE_REPORT.md` for agent network test coverage (43/43 tests passing)
- **PRD Summary:** Key clarifications documented in PRD (agents do NOT sign up through main app)
