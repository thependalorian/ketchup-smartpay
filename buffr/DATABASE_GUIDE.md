# Buffr Database Guide

**Project**: Buffr Payment Application  
**Database**: Neon PostgreSQL (Serverless)  
**Last Updated**: January 28, 2026  
**Status**: ✅ **Production Ready**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Database Structure](#database-structure)
3. [Key Tables](#key-tables)
4. [Migration](#migration)
5. [Service Integration](#service-integration)
6. [Security](#security)
7. [Usage Examples](#usage-examples)

---

## Overview

### Connection Details

**Provider**: Neon PostgreSQL (Serverless)  
**Connection**: Uses same database as g2p project  
**Tables**: 216 (shared schema)  
**Environment Variable**: `DATABASE_URL`

### Architecture

The Buffr application uses a **hybrid schema approach**:

1. **Production Schema** - Currently in use with real data (216 tables)
2. **Database Adapters** - Runtime transformation layer (`utils/db-adapters.ts`)
3. **Migration Files** - 43 migration files in `sql/` directory

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
│ Neon PostgreSQL │  ◄── Production schema (216 tables)
└─────────────────┘
```

### Quick Stats

- **Total Tables**: 216
- **Migration Files**: 43
- **Shared with**: g2p project (same database)
- **Key Features**: Token Vault, Open Banking, NAMQR, Vouchers

---

## Database Structure

### By Category

| Category | Tables | Status |
|----------|--------|--------|
| **🏦 Open Banking** | 8 | ✅ Operational |
| **💳 NAMQR & Payments** | 8 | ✅ Operational |
| **🔐 OAuth & Consent** | 6 | ✅ Operational |
| **👥 Users & Accounts** | 10+ | ✅ Operational |
| **💰 Transactions** | 5+ | ✅ Operational |
| **🎮 Gamification** | 20+ | ✅ Operational |
| **🔒 Compliance** | 10+ | ✅ Operational |
| **🎟️ Vouchers (G2P)** | 10+ | ✅ Operational |
| **🏪 Merchants & Agents** | 15+ | ✅ Operational |
| **🔧 Other** | 120+ | ✅ Operational |

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts | UUID, external_id, verification |
| `wallets` | User wallets | Balance, currency, limits |
| `transactions` | All transactions | Type, status, fees |
| `vouchers` | G2P vouchers | Amount, expiry, redemption |
| `token_vault_parameters` | QR parameters | NAMQR storage |
| `merchants` | Merchant accounts | KYC, compliance |
| `agents` | Agent network | Location, commission |

---

## Key Tables

### 1. Users Table

**Current Production Schema:**

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id VARCHAR(255) UNIQUE,
  full_name TEXT,
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

**Key Features**:
- UUID primary key
- External ID for API compatibility
- Verification status
- 2FA support
- Multi-currency support (default: NAD)

### 2. Wallets Table

```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  balance DECIMAL(12,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'NAD',
  wallet_type VARCHAR(50),
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Wallet Types**:
- `main` - Primary wallet
- `savings` - Savings wallet (with interest)
- `emoney` - E-money account
- `voucher` - Voucher wallet

### 3. Token Vault Parameters

```sql
CREATE TABLE token_vault_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_vault_id VARCHAR(8) UNIQUE NOT NULL,
  voucher_id UUID REFERENCES vouchers(id),
  merchant_id UUID REFERENCES merchants(id),
  namqr_data JSONB NOT NULL,
  purpose_code VARCHAR(2),
  amount DECIMAL(12,2),
  currency VARCHAR(3) DEFAULT 'NAD',
  is_static BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  stored_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features**:
- 8-digit token vault ID (NREF format)
- JSONB storage for NAMQR data
- Support for both static and dynamic QR
- Auto-expiry for dynamic QR codes
- Links to vouchers or merchants

### 4. Vouchers Table (G2P)

```sql
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_code VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  status VARCHAR(20) DEFAULT 'active',
  expires_at TIMESTAMP,
  redeemed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Statuses**:
- `active` - Available for redemption
- `redeemed` - Fully redeemed
- `expired` - Past expiry date
- `cancelled` - Administratively cancelled

### 5. Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id VARCHAR(255) UNIQUE,
  user_id UUID REFERENCES users(id),
  wallet_id UUID REFERENCES wallets(id),
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  fee DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(20) DEFAULT 'pending',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

**Transaction Types**:
- `transfer` - P2P transfer
- `voucher_redemption` - G2P voucher redemption
- `payment` - Merchant payment
- `deposit` - Wallet deposit
- `withdrawal` - Wallet withdrawal
- `fee` - Fee transaction

---

## Migration

### Running Migrations

```bash
# Using NPM script
npm run migrate

# Or directly
tsx scripts/run-migrations.ts
```

### Migration Files (43 total)

| File | Description | Tables |
|------|-------------|--------|
| `migration_auth.sql` | Authentication | 3 |
| `migration_vouchers.sql` | G2P vouchers | 5 |
| `migration_token_vault.sql` | Token vault | 1 |
| `migration_namibian_open_banking.sql` | Open Banking | 8 |
| `migration_fineract_sync.sql` | Fineract integration | 10 |
| `migration_analytics.sql` | Analytics | 15 |
| `migration_bills_and_merchants.sql` | Bills & merchants | 10 |
| ... | ... | ... |

**Full list**: 43 migration files in `sql/` directory

### Database Adapter Layer

**File**: `utils/db-adapters.ts`

**Purpose**: Bridge between application code and production schema

```typescript
// Example: User adapter
export function adaptUser(dbUser: any) {
  return {
    id: dbUser.id || dbUser.external_id,
    name: dbUser.full_name || `${dbUser.first_name} ${dbUser.last_name}`,
    email: dbUser.email,
    phone: dbUser.phone_number,
    verified: dbUser.is_verified,
    // ... more fields
  };
}
```

**Adapters for**:
- Users
- Wallets
- Transactions
- Vouchers
- Merchants

---

## Service Integration

### Token Vault Service

**Files**:
- `services/tokenVaultService.ts` - Main service
- `services/tokenVaultStorage.ts` - Database storage

**Functions**:

```typescript
import { storeTokenVaultParameters, retrieveTokenVaultParameters } from '@/services/tokenVaultStorage';

// Store QR parameters
const result = await storeTokenVaultParameters({
  namqrData: qrCode,
  voucherId: voucher.id,
  purposeCode: '18', // Government voucher
  amount: 500.00,
  currency: 'NAD',
  isStatic: false,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
});

// Retrieve parameters
const { success, data } = await retrieveTokenVaultParameters(tokenVaultId);

if (success && data) {
  console.log('NAMQR data:', data.namqrData);
  console.log('Voucher ID:', data.voucherId);
}
```

### Database Connection

**File**: `utils/db.ts`

```typescript
import { query, queryOne } from '@/utils/db';

// Single row
const user = await queryOne<User>(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// Multiple rows
const transactions = await query<Transaction>(
  'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
  [userId]
);
```

### Environment Variables

```env
# Required
DATABASE_URL=postgresql://neondb_owner:***@ep-rough-frog-ad0dg5fe-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Optional (for specific features)
TOKEN_VAULT_URL=https://api.namclear.com.na/vault/v1
FINERACT_BASE_URL=https://fineract.example.com/fineract-provider/api/v1
```

---

## Security

### SQL Injection Prevention

**Always use parameterized queries:**

```typescript
// ✅ SAFE
const users = await query(
  'SELECT * FROM users WHERE email = $1',
  [userEmail]
);

// ❌ UNSAFE
const users = await query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### Data Encryption

**Token Vault**:
- NAMQR data stored as JSONB
- Sensitive fields can be encrypted at application layer
- Use environment variables for encryption keys

**User Data**:
- Passwords: Bcrypt hashing
- PII: Consider encryption for sensitive fields
- 2FA secrets: Encrypted storage

### Audit Trail

**Tables with audit fields**:
- `created_at` - Record creation timestamp
- `updated_at` - Last update timestamp
- `created_by` - User who created (where applicable)

**Audit Log Table**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Usage Examples

### Create User with Wallet

```typescript
import { query } from '@/utils/db';

// 1. Create user
const user = await queryOne<User>(
  `INSERT INTO users (full_name, phone_number, email)
   VALUES ($1, $2, $3)
   RETURNING *`,
  ['John Doe', '+264812345678', 'john@example.com']
);

// 2. Create primary wallet
const wallet = await queryOne<Wallet>(
  `INSERT INTO wallets (user_id, name, wallet_type, is_primary)
   VALUES ($1, $2, $3, $4)
   RETURNING *`,
  [user.id, 'Main Wallet', 'main', true]
);
```

### Process Voucher Redemption

```typescript
import { query, queryOne } from '@/utils/db';

// 1. Get voucher
const voucher = await queryOne<Voucher>(
  `SELECT * FROM vouchers WHERE voucher_code = $1 AND status = 'active'`,
  [voucherCode]
);

// 2. Check expiry
if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
  throw new Error('Voucher expired');
}

// 3. Start transaction
await query('BEGIN');

try {
  // 4. Update wallet balance
  await query(
    `UPDATE wallets 
     SET balance = balance + $1, updated_at = NOW()
     WHERE id = $2`,
    [voucher.amount, walletId]
  );

  // 5. Mark voucher as redeemed
  await query(
    `UPDATE vouchers 
     SET status = 'redeemed', redeemed_at = NOW()
     WHERE id = $1`,
    [voucher.id]
  );

  // 6. Create transaction record
  await query(
    `INSERT INTO transactions (user_id, wallet_id, type, amount, status, description)
     VALUES ($1, $2, 'voucher_redemption', $3, 'completed', $4)`,
    [userId, walletId, voucher.amount, `Redeemed voucher ${voucherCode}`]
  );

  // 7. Commit
  await query('COMMIT');
} catch (error) {
  await query('ROLLBACK');
  throw error;
}
```

### Query User Transactions

```typescript
import { query } from '@/utils/db';

const transactions = await query<Transaction>(
  `SELECT t.*, w.name as wallet_name
   FROM transactions t
   JOIN wallets w ON t.wallet_id = w.id
   WHERE t.user_id = $1
   ORDER BY t.created_at DESC
   LIMIT $2 OFFSET $3`,
  [userId, limit, offset]
);
```

---

## Database Documentation

### Detailed Schema

See `sql/SCHEMA_DOCUMENTATION.md` for:
- Complete table definitions
- Field mappings
- Relationships
- Data adapters

### Field Mapping

See `sql/SCHEMA_FIELD_MAPPING.md` for:
- Production vs. proposed schema differences
- Adapter layer mappings
- Migration strategies

---

## Quick Reference

### NPM Scripts

```bash
npm run migrate        # Run all migrations
npm run migrate:dev    # Run migrations in dev mode
```

### Database Commands

```bash
# Connect
psql $DATABASE_URL

# List tables
\dt

# Describe table
\d users

# Query
SELECT * FROM users LIMIT 10;
```

### Connection Info

**Host**: `ep-rough-frog-ad0dg5fe-pooler.c-2.us-east-1.aws.neon.tech`  
**Database**: `neondb`  
**User**: `neondb_owner`  
**SSL**: Required

---

## Status

✅ **Tables**: 216 (operational)  
✅ **Migrations**: 43 files  
✅ **Token Vault**: Database-backed  
✅ **Service Integration**: Complete  
✅ **Documentation**: Complete  

**Last Updated**: January 28, 2026
