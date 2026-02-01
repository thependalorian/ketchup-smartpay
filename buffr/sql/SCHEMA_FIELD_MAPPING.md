# Schema Field Mapping Documentation

**Location**: `sql/SCHEMA_FIELD_MAPPING.md`  
**Purpose**: Comprehensive guide to database schema, field locations, and naming conventions  
**Last Updated**: 2025-01-17

---

## 📋 Table of Contents

1. [Field Location Guide](#field-location-guide)
2. [Naming Conventions](#naming-conventions)
3. [Frequently-Queried Columns](#frequently-queried-columns)
4. [Metadata vs Actual Columns](#metadata-vs-actual-columns)
5. [API Response Mappings](#api-response-mappings)

---

## Field Location Guide

### Users Table

| Field | Database Column | Location | Notes |
|-------|----------------|----------|-------|
| `id` | `id` (VARCHAR) | ✅ Column | Primary key |
| `external_id` | `external_id` (VARCHAR) | ✅ Column | Added in migration_003 |
| `phone_number` | `phone_number` (VARCHAR) | ✅ Column | Unique |
| `email` | `email` (VARCHAR) | ✅ Column | Unique |
| `first_name` | `first_name` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `last_name` | `last_name` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `full_name` | `full_name` (VARCHAR) | ✅ Column | Primary name field |
| `avatar` | `avatar` (TEXT) | ✅ Column | Exists in schema.sql |
| `is_verified` | `is_verified` (BOOLEAN) | ✅ Column | Also check `kyc_level` |
| `kyc_level` | `kyc_level` (INTEGER) | ✅ Column | Added in migration_003 |
| `currency` | `currency` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `status` | `status` (VARCHAR) | ⚠️ Metadata | Stored in `metadata.status` |
| `role` | `role` (VARCHAR) | ✅ Column | From migration_add_admin_role |
| `metadata` | `metadata` (JSONB) | ✅ Column | Added in migration_003 |

**Note**: `first_name` and `last_name` exist in schema.sql but may not be populated. The adapter splits `full_name` for API compatibility.

---

### Wallets Table

| Field | Database Column | Location | Notes |
|-------|----------------|----------|-------|
| `id` | `id` (UUID) | ✅ Column | Primary key |
| `user_id` | `user_id` (VARCHAR) | ✅ Column | Foreign key |
| `name` | `name` (VARCHAR) | ✅ Column | Required |
| `balance` | `balance` (DECIMAL) | ✅ Column | Current balance |
| `available_balance` | `available_balance` (DECIMAL) | ✅ Column | Added in migration_003 |
| `currency` | `currency` (VARCHAR) | ✅ Column | Default 'N$' |
| `type` | `type` (VARCHAR) | ✅ Column | 'personal', 'savings', etc. |
| `status` | `status` (VARCHAR) | ✅ Column | Added in migration_003 |
| `is_default` | `is_default` (BOOLEAN) | ✅ Column | Added in migration_003 |
| `icon` | `icon` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `purpose` | `purpose` (TEXT) | ✅ Column | Exists in schema.sql |
| `card_design` | `card_design` (INTEGER) | ✅ Column | Exists in schema.sql |
| `card_number` | `card_number` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `cardholder_name` | `cardholder_name` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `expiry_date` | `expiry_date` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `auto_pay_enabled` | `auto_pay_enabled` (BOOLEAN) | ✅ Column | Exists in schema.sql |
| `auto_pay_max_amount` | `auto_pay_max_amount` (DECIMAL) | ✅ Column | Exists in schema.sql |
| `auto_pay_frequency` | `auto_pay_frequency` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `pin_protected` | `pin_protected` (BOOLEAN) | ✅ Column | Exists in schema.sql |
| `biometric_enabled` | `biometric_enabled` (BOOLEAN) | ✅ Column | Exists in schema.sql |
| `metadata` | `metadata` (JSONB) | ✅ Column | Added in migration_003 |

**Note**: All wallet fields exist as actual columns in schema.sql. The verification script may show warnings if columns aren't detected, but they exist.

---

### Transactions Table

| Field | Database Column | Location | Notes |
|-------|----------------|----------|-------|
| `id` | `id` (UUID) | ✅ Column | Primary key |
| `external_id` | `external_id` (VARCHAR) | ✅ Column | Added in migration_003 |
| `user_id` | `user_id` (VARCHAR) | ✅ Column | Foreign key |
| `wallet_id` | `wallet_id` (UUID) | ✅ Column | Exists in schema.sql, FK to wallets |
| `type` | `type` (VARCHAR) | ✅ Column | Legacy: 'sent', 'received', etc. |
| `transaction_type` | `transaction_type` (VARCHAR) | ✅ Column | Added in migration_003 |
| `amount` | `amount` (DECIMAL) | ✅ Column | Required |
| `currency` | `currency` (VARCHAR) | ✅ Column | Default 'N$' |
| `description` | `description` (TEXT) | ✅ Column | Exists in schema.sql |
| `category` | `category` (VARCHAR) | ✅ Column | **Frequently queried** - exists in schema.sql |
| `recipient_id` | `recipient_id` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `recipient_name` | `recipient_name` (VARCHAR) | ✅ Column | Exists in schema.sql |
| `merchant_name` | `merchant_name` (VARCHAR) | ✅ Column | Added in migration_003 |
| `merchant_category` | `merchant_category` (VARCHAR) | ✅ Column | Added in migration_003 |
| `merchant_id` | `merchant_id` (VARCHAR) | ✅ Column | Added in migration_003 |
| `status` | `status` (VARCHAR) | ✅ Column | 'pending', 'completed', 'failed' |
| `date` | `date` (TIMESTAMP) | ✅ Column | Exists in schema.sql |
| `transaction_time` | `transaction_time` (TIMESTAMP) | ✅ Column | Added in migration_003 |
| `metadata` | `metadata` (JSONB) | ✅ Column | Added in migration_003 |

**Critical Note**: 
- `category` is **frequently queried** in budget analysis (GROUP BY category)
- `wallet_id` is used for JOINs with wallets table
- Both exist as actual columns in schema.sql

---

### Groups Table

| Field | Database Column | Location | Notes |
|-------|----------------|----------|-------|
| `id` | `id` (UUID) | ✅ Column | Primary key |
| `owner_id` | `owner_id` (VARCHAR) | ✅ Column | **NOT creator_id** - use owner_id |
| `name` | `name` (VARCHAR) | ✅ Column | Required |
| `description` | `description` (TEXT) | ✅ Column | Optional |
| `type` | `type` (VARCHAR) | ⚠️ Not in schema | May be in metadata |
| `avatar` | `avatar` (TEXT) | ⚠️ Not in schema | May be in metadata |
| `target_amount` | `target_amount` (DECIMAL) | ✅ Column | Optional |
| `current_amount` | `current_amount` (DECIMAL) | ✅ Column | Default 0 |
| `currency` | `currency` (VARCHAR) | ✅ Column | Default 'N$' |
| `is_active` | `is_active` (BOOLEAN) | ⚠️ Not in schema | May be in metadata |
| `metadata` | `metadata` (JSONB) | ✅ Column | Added in migration_003 |

**Important**: Always use `owner_id`, never `creator_id`. The API maps this to `ownerId` (camelCase).

---

### Money Requests Table

| Field | Database Column | Location | Notes |
|-------|----------------|----------|-------|
| `id` | `id` (UUID) | ✅ Column | Primary key |
| `from_user_id` | `from_user_id` (VARCHAR) | ✅ Column | **NOT requester_id** |
| `to_user_id` | `to_user_id` (VARCHAR) | ✅ Column | **NOT recipient_id** |
| `amount` | `amount` (DECIMAL) | ✅ Column | Required |
| `currency` | `currency` (VARCHAR) | ✅ Column | Default 'N$' |
| `description` | `description` (TEXT) | ⚠️ Not in schema | Stored in `note` column |
| `status` | `status` (VARCHAR) | ✅ Column | 'pending', 'paid', etc. |
| `paid_amount` | `paid_amount` (DECIMAL) | ✅ Column | From migration_add_fields |
| `paid_at` | `paid_at` (TIMESTAMP) | ✅ Column | From migration_add_fields |
| `expires_at` | `expires_at` (TIMESTAMP) | ⚠️ Not in schema | May be in metadata |
| `metadata` | `metadata` (JSONB) | ✅ Column | Added in migration_003 |

**Important**: 
- Always use `from_user_id` and `to_user_id`, never `requester_id`/`recipient_id`
- API maps to `fromUserId` and `toUserId` (camelCase)
- `description` is stored in `note` column

---

## Naming Conventions

### Database (snake_case) ↔ API (camelCase)

| Database | API | Table |
|----------|-----|-------|
| `external_id` | `externalId` | users, transactions |
| `user_id` | `userId` | All tables |
| `wallet_id` | `walletId` | transactions |
| `kyc_level` | `kycLevel` | users |
| `is_verified` | `isVerified` | users |
| `is_default` | `isDefault` | wallets |
| `available_balance` | `availableBalance` | wallets |
| `transaction_type` | `type` | transactions |
| `transaction_time` | `transactionTime` | transactions |
| `merchant_name` | `merchantName` | transactions |
| `merchant_category` | `merchantCategory` | transactions |
| `owner_id` | `ownerId` | groups |
| `from_user_id` | `fromUserId` | money_requests |
| `to_user_id` | `toUserId` | money_requests |
| `paid_amount` | `paidAmount` | money_requests |
| `paid_at` | `paidAt` | money_requests |

---

## Frequently-Queried Columns

### High Priority (Should be Actual Columns)

These columns are queried frequently and should exist as actual columns (not metadata):

1. **`transactions.category`** ✅
   - Used in: `GROUP BY category` queries
   - Used in: Budget analysis, spending reports
   - **Status**: Exists as column in schema.sql

2. **`transactions.wallet_id`** ✅
   - Used in: JOINs with wallets table
   - Used in: Filtering transactions by wallet
   - **Status**: Exists as column in schema.sql

3. **`transactions.description`** ✅
   - Used in: Transaction search/filtering
   - **Status**: Exists as column in schema.sql

4. **`transactions.type`** ✅
   - Used in: Filtering by transaction type
   - **Status**: Exists as column (also have `transaction_type`)

### Medium Priority (Can Stay in Metadata)

These are used less frequently and can remain in metadata:

- `users.status` - User status (active/suspended)
- `wallets.icon` - Wallet icon (UI only)
- `groups.type` - Group type (savings/stokvel)
- `groups.avatar` - Group avatar (UI only)

---

## Metadata vs Actual Columns

### When to Use Metadata (JSONB)

Use metadata for:
- ✅ Rarely-queried fields
- ✅ Flexible/schema-less data
- ✅ UI-only fields (icons, avatars, designs)
- ✅ User preferences
- ✅ Temporary/experimental fields

### When to Use Actual Columns

Use actual columns for:
- ✅ Frequently-queried fields (WHERE, GROUP BY, ORDER BY)
- ✅ Foreign keys (for JOINs)
- ✅ Indexed fields
- ✅ Fields used in aggregations
- ✅ Fields with constraints (UNIQUE, NOT NULL)

---

## API Response Mappings

### Example: Transaction Response

**Database Row**:
```sql
{
  id: 'uuid-123',
  user_id: 'user-456',
  wallet_id: 'wallet-789',
  transaction_type: 'debit',
  amount: 100.00,
  category: 'food',
  description: 'Lunch',
  merchant_name: 'Restaurant ABC',
  transaction_time: '2025-01-17T12:00:00Z'
}
```

**API Response** (via `mapTransactionRow`):
```json
{
  "id": "uuid-123",
  "userId": "user-456",
  "walletId": "wallet-789",
  "type": "sent",  // Mapped from 'debit'
  "amount": 100.00,
  "category": "food",
  "description": "Lunch",
  "recipientName": "Restaurant ABC",
  "date": "2025-01-17T12:00:00Z"
}
```

### Example: Group Response

**Database Row**:
```sql
{
  id: 'group-123',
  owner_id: 'user-456',  // NOT creator_id!
  name: 'Savings Group',
  current_amount: 5000.00
}
```

**API Response**:
```json
{
  "id": "group-123",
  "ownerId": "user-456",  // camelCase
  "name": "Savings Group",
  "currentAmount": 5000.00
}
```

### Example: Money Request Response

**Database Row**:
```sql
{
  id: 'request-123',
  from_user_id: 'user-456',  // NOT requester_id!
  to_user_id: 'user-789',    // NOT recipient_id!
  amount: 100.00,
  status: 'pending'
}
```

**API Response**:
```json
{
  "id": "request-123",
  "fromUserId": "user-456",  // camelCase
  "toUserId": "user-789",    // camelCase
  "amount": 100.00,
  "status": "pending"
}
```

---

## Migration History

| Migration | Version | Key Changes |
|-----------|---------|-------------|
| `schema.sql` | 1.0.0 | Base schema with core tables |
| `migration_003_schema_fixes.sql` | 3.0.0 | Added: external_id, kyc_level, metadata, transaction_type, merchant_*, available_balance, is_default, status |
| `migration_000_history.sql` | 0.0.1 | Migration tracking table |

---

## Query Performance Notes

### Indexed Columns

These columns have indexes for fast queries:
- `users.phone_number` (UNIQUE)
- `users.email` (UNIQUE)
- `users.external_id` (from migration_003)
- `transactions.user_id`
- `transactions.wallet_id`
- `transactions.date` (DESC)
- `transactions.transaction_type`
- `transactions.merchant_category`
- `wallets.user_id`
- `wallets.is_default` (partial index)

### Recommended Indexes (if needed)

If querying frequently:
- `transactions.category` - For budget analysis
- `groups.owner_id` - For user's groups
- `money_requests.from_user_id` / `to_user_id` - For request lists

---

## Common Patterns

### Getting User by External ID
```sql
SELECT * FROM users WHERE external_id = $1;
```

### Getting Transactions by Category
```sql
SELECT * FROM transactions 
WHERE user_id = $1 AND category = $2
ORDER BY transaction_time DESC;
```

### Getting User's Groups
```sql
SELECT * FROM groups WHERE owner_id = $1;
```

### Getting Money Requests
```sql
SELECT * FROM money_requests 
WHERE from_user_id = $1 OR to_user_id = $1
ORDER BY created_at DESC;
```

---

## Troubleshooting

### Issue: Column not found
**Solution**: Check if column exists in schema.sql or was added in a migration. Run `npx tsx scripts/verify-schema.ts` to check.

### Issue: Wrong field name
**Solution**: 
- Groups: Use `owner_id`, not `creator_id`
- Money Requests: Use `from_user_id`/`to_user_id`, not `requester_id`/`recipient_id`
- Transactions: Both `type` and `transaction_type` exist (use `transaction_type` for new code)

### Issue: Field in metadata but need to query
**Solution**: Consider adding as actual column if frequently queried. Create migration to add column and populate from metadata.

---

**Last Verified**: 2025-01-17  
**Schema Version**: 3.0.0 (after migration_003_schema_fixes)
