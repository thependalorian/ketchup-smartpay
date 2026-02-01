# Database Schema Reference

**Purpose**: Quick reference for database structure  
**Source**: See `sql/COMPLETE_SCHEMA.md` for full details  
**Last Updated**: 2026-01-17

---

## Quick Stats

- **Total Tables**: 100
- **Core Tables**: 20+ (users, wallets, transactions, etc.)
- **Schema Status**: ✅ All migrations applied
- **Documentation**: Complete

---

## Core Tables

### User Management
- `users` - User accounts (25 columns)
- `contacts` - User contacts (12 columns)

### Financial
- `wallets` - User wallets (30+ columns)
- `transactions` - Financial transactions (40+ columns)
- `money_requests` - Money request system (15 columns)

### Social
- `groups` - Group wallets (15 columns)

### System
- `notifications` - Push notifications (10 columns)
- `migration_history` - Schema migration tracking (10 columns)

---

## Schema Documentation

- **Main Schema**: `sql/schema.sql`
- **Field Mapping**: `sql/SCHEMA_FIELD_MAPPING.md`
- **Migrations**: `sql/migration_*.sql`
- **TypeScript Types**: `types/database.ts`
- **Voucher Schema**: `sql/migration_vouchers.sql` (G2P voucher system)

---

**For detailed schema documentation, see `sql/schema.sql` and migration files**
