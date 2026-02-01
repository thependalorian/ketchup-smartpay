# Buffr App Database Schema Documentation

**Last Updated:** December 17, 2025
**Database Provider:** Neon PostgreSQL (Serverless)
**Schema Status:** Production (Existing Schema + Extensions)

---

## Table of Contents

1. [Overview](#overview)
2. [Schema Architecture](#schema-architecture)
3. [Core Tables](#core-tables)
4. [Data Adapters](#data-adapters)
5. [Migration Strategy](#migration-strategy)

---

## Overview

The Buffr application uses **two schema approaches**:

1. **Existing Production Schema** - Currently in use with real data
2. **Proposed New Schema** (`sql/schema.sql`) - Documented ideal schema

The application uses **database adapters** (`utils/db-adapters.ts`) to bridge the gap between these schemas at runtime.

---

## Schema Architecture

### Current Implementation

```
┌─────────────────┐
│  Application    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DB Adapters    │  ◄── Runtime transformation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Neon PostgreSQL │  ◄── Existing production schema
└─────────────────┘
```

---

## Core Tables

### 1. Users Table

**Existing Schema (Production):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) UNIQUE,           -- String IDs for compatibility
  full_name TEXT,                             -- Single name field
  phone_number VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  avatar TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_two_factor_enabled BOOLEAN DEFAULT FALSE,
  currency VARCHAR(10) DEFAULT 'NAD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Proposed Schema (schema.sql):**
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,               -- String ID as primary
  first_name VARCHAR(100),                    -- Separate first/last names
  last_name VARCHAR(100),
  full_name VARCHAR(255),
  phone_number VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  avatar TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_two_factor_enabled BOOLEAN DEFAULT FALSE,
  currency VARCHAR(10) DEFAULT 'NAD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Differences:**
- Production uses UUID for `id`, external_id for string compatibility
- Production stores only `full_name`, proposed schema splits into first/last
- Adapter splits full_name on first space for compatibility

---

### 2. Wallets Table

**Existing Schema (Production):**
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) REFERENCES users(external_id),
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  type VARCHAR(50),
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'NAD',
  purpose TEXT,
  card_design VARCHAR(50),
  card_number VARCHAR(20),
  cardholder_name VARCHAR(255),
  expiry_date VARCHAR(10),
  pin_protected BOOLEAN DEFAULT FALSE,
  biometric_enabled BOOLEAN DEFAULT FALSE,

  -- Production-specific fields
  available_balance DECIMAL(15,2),           -- Stored in metadata in proposed
  is_default BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  metadata JSONB,                             -- Flexible storage for AutoPay, etc.

  -- AutoPay fields (stored in metadata in production)
  auto_pay_enabled BOOLEAN DEFAULT FALSE,
  auto_pay_max_amount DECIMAL(15,2),
  auto_pay_settings JSONB,
  auto_pay_frequency VARCHAR(20),
  auto_pay_deduct_date VARCHAR(50),
  auto_pay_deduct_time VARCHAR(20),
  auto_pay_amount DECIMAL(15,2),
  auto_pay_repayments INTEGER,
  auto_pay_payment_method VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_is_default ON wallets(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_wallets_auto_pay_enabled ON wallets(auto_pay_enabled) WHERE auto_pay_enabled = TRUE;
```

**Key Points:**
- Production stores `available_balance`, `is_default`, `status`, `metadata` as direct columns
- AutoPay settings can be stored both as direct columns AND in metadata JSONB
- Adapter extracts/injects data from metadata as needed

---

### 3. Transactions Table

**Existing Schema (Production):**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) UNIQUE,
  user_id VARCHAR(255) NOT NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  transaction_type VARCHAR(20) NOT NULL,      -- 'debit', 'credit', 'payment', 'deposit', 'transfer'
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NAD',
  description TEXT,
  category VARCHAR(50),
  recipient_id VARCHAR(255),
  recipient_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'completed',     -- 'pending', 'completed', 'failed'
  transaction_time TIMESTAMP DEFAULT NOW(),   -- Not 'date'

  -- Production-specific fields
  merchant_name VARCHAR(255),
  merchant_category VARCHAR(100),
  merchant_id VARCHAR(100),
  metadata JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_transaction_time ON transactions(transaction_time DESC);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
```

**Key Differences from Proposed Schema:**
- Uses `transaction_type` (not `type`)
- Uses `transaction_time` (not `date`)
- Has `external_id` for string ID compatibility
- Includes merchant-specific fields
- Has flexible `metadata` JSONB column

**Transaction Type Mapping:**
```javascript
// Adapter mapping
sent → debit
received → credit
payment → payment
transfer_in → deposit
transfer_out → transfer
```

---

### 4. AutoPay Rules Table

**Existing Schema (Production):**
```sql
CREATE TABLE autopay_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL,            -- 'recurring', 'scheduled', 'minimum_balance', etc.
  amount DECIMAL(15,2) NOT NULL,
  frequency VARCHAR(20),                      -- 'weekly', 'bi-weekly', 'monthly', 'yearly'
  recipient_id VARCHAR(255),
  recipient_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  next_execution_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_autopay_rules_wallet_id ON autopay_rules(wallet_id);
CREATE INDEX idx_autopay_rules_user_id ON autopay_rules(user_id);
CREATE INDEX idx_autopay_rules_next_execution ON autopay_rules(next_execution_date) WHERE is_active = TRUE;
```

---

### 5. AutoPay Transactions Table

**Existing Schema (Production):**
```sql
CREATE TABLE autopay_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES autopay_rules(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL,                -- 'success', 'failed', 'pending'
  executed_at TIMESTAMP DEFAULT NOW(),
  failure_reason TEXT,
  recipient_id VARCHAR(255),
  recipient_name VARCHAR(255),
  rule_description TEXT,
  authorisation_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_autopay_transactions_wallet_id ON autopay_transactions(wallet_id);
CREATE INDEX idx_autopay_transactions_rule_id ON autopay_transactions(rule_id);
CREATE INDEX idx_autopay_transactions_user_id ON autopay_transactions(user_id);
CREATE INDEX idx_autopay_transactions_executed_at ON autopay_transactions(executed_at DESC);
```

---

### 6. Contacts Table

**Schema (Aligned):**
```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_is_favorite ON contacts(is_favorite) WHERE is_favorite = TRUE;
```

---

### 7. Groups Table

**Schema (Aligned):**
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2),
  current_amount DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'NAD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_groups_owner_id ON groups(owner_id);
```

---

### 8. Group Members Table

**Schema (Aligned):**
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  contribution DECIMAL(15,2) DEFAULT 0.00,
  is_owner BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
```

---

### 9. Money Requests Table

**Schema (Aligned):**
```sql
CREATE TABLE money_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id VARCHAR(255) NOT NULL,
  to_user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NAD',
  note TEXT,
  status VARCHAR(20) DEFAULT 'pending',      -- 'pending', 'paid', 'declined', 'expired'
  paid_amount DECIMAL(15,2) DEFAULT 0.00,    -- For partial payments
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_money_requests_from_user_id ON money_requests(from_user_id);
CREATE INDEX idx_money_requests_to_user_id ON money_requests(to_user_id);
CREATE INDEX idx_money_requests_status ON money_requests(status);
```

---

### 10. Notifications Table

**Schema (Aligned):**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,                 -- 'transaction', 'request', 'payment', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID,                            -- Links to related entity
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## Data Adapters

### Purpose

Database adapters in `utils/db-adapters.ts` transform data between application and database formats:

**Map Functions** (DB → App):
```typescript
mapWalletRow(dbRow)       // Converts DB row to application Wallet object
mapTransactionRow(dbRow)  // Converts DB row to application Transaction object
mapUserRow(dbRow)         // Converts DB row to application User object
```

**Prepare Functions** (App → DB):
```typescript
prepareWalletData(wallet)           // Converts Wallet to DB format for INSERT
prepareTransactionData(transaction) // Converts Transaction to DB format
prepareUserData(user)               // Converts User to DB format
```

### Example: Wallet Adapter

```typescript
export function mapWalletRow(row: any): Wallet {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    balance: row.balance || 0,
    availableBalance: row.metadata?.available_balance || row.available_balance || row.balance,
    isDefault: row.is_default || false,
    autoPayEnabled: row.auto_pay_enabled || row.metadata?.auto_pay_enabled || false,
    // ... extract other fields from metadata or direct columns
  };
}

export function prepareWalletData(wallet: Wallet, userId: string): any {
  return {
    user_id: userId,
    name: wallet.name,
    balance: wallet.balance,
    metadata: {
      available_balance: wallet.availableBalance || wallet.balance,
      auto_pay_enabled: wallet.autoPayEnabled,
      // ... store additional data in metadata
    },
    is_default: wallet.isDefault,
    auto_pay_enabled: wallet.autoPayEnabled,
    // ... map other fields
  };
}
```

---

## Migration Strategy

### Current Approach (Hybrid)

The application uses a **hybrid approach** to support both schemas:

1. **Runtime Adapters**: Transform data on-the-fly
2. **Dual Storage**: Some fields stored both as columns and in metadata
3. **Backward Compatible**: Works with existing production data

### Migration Options

#### Option A: Stay with Existing Schema (Recommended)

- ✅ No database migration needed
- ✅ No data loss risk
- ✅ Works with current production data
- ⚠️ Update `sql/schema.sql` to match reality
- ⚠️ Document adapter patterns

#### Option B: Migrate to Proposed Schema

- ⚠️ Requires careful data migration
- ⚠️ Potential downtime
- ⚠️ Need rollback strategy
- ✅ Cleaner schema design
- ✅ Better separation of concerns

**Recommended:** Option A - Document the existing schema as the canonical version.

---

## Best Practices

### When Adding New Fields

1. **Add to existing schema first** (production database)
2. **Update adapters** in `utils/db-adapters.ts`
3. **Update TypeScript interfaces** in application code
4. **Test with real data**
5. **Document in this file**

### When Querying

```typescript
// ✅ Good - Use adapters
import { query } from '@/utils/db';
import { mapWalletRow } from '@/utils/db-adapters';

const rows = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
const wallets = rows.map(mapWalletRow);

// ❌ Bad - Direct query without adapter
const rows = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
// Missing adapter means incorrect field names
```

### When Inserting

```typescript
// ✅ Good - Use prepare functions
import { prepareWalletData } from '@/utils/db-adapters';

const dbData = prepareWalletData(wallet, userId);
await query('INSERT INTO wallets (...) VALUES (...)', [...]);

// ❌ Bad - Direct insert without preparation
await query('INSERT INTO wallets (...) VALUES (...)', [wallet.name, ...]);
// Missing metadata, wrong field names
```

---

## Conclusion

The Buffr database uses a **production-tested existing schema** with runtime adapters for flexibility. This approach:

- ✅ Works reliably with production data
- ✅ Allows gradual schema evolution
- ✅ Maintains backward compatibility
- ✅ Supports flexible metadata storage

For new features, extend the existing schema and update adapters accordingly.

---

**Last Reviewed:** December 17, 2025
**Review By:** Claude Code Validation Agent
**Status:** ✅ Production Ready
