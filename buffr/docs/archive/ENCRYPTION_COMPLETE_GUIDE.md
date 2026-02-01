# Data Encryption Complete Guide

**Date:** January 26, 2026  
**Status:** ✅ **Application-Level Fully Implemented**  
**Compliance:** PSD-12 Data Protection Requirements

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Implementation](#implementation)
3. [Deployment Steps](#deployment-steps)
4. [Next Steps](#next-steps)
5. [Verification](#verification)

---

## Overview

Application-level data encryption for sensitive PII and payment data using AES-256-GCM before database storage.

### What's Encrypted

- **Bank Account Numbers** - `user_banks`, `vouchers`, `voucher_redemptions` tables
- **Card Numbers** - `user_cards` table
- **National ID Numbers** - `users` table (with hash for duplicate detection)

### Encryption Algorithm

- **Algorithm:** AES-256-GCM (Authenticated Encryption)
- **Key Derivation:** PBKDF2 with 100,000 iterations
- **IV Length:** 12 bytes (96 bits)
- **Tag Length:** 16 bytes (128 bits)

---

## Implementation

### Core Components

1. **`utils/encryption.ts`** - Core encryption utility
   - `encryptField()` - Encrypt plaintext data
   - `decryptField()` - Decrypt encrypted data
   - `hashSensitive()` - One-way hash for duplicate detection
   - `verifySensitiveHash()` - Verify hash matches

2. **`utils/encryptedFields.ts`** - Database helper utilities
   - `encryptBankAccount()` / `decryptBankAccount()`
   - `encryptCardNumber()` / `decryptCardNumber()`
   - `encryptNationalId()` / `decryptNationalId()`
   - Database-ready format helpers

3. **Database Migration** - `sql/migration_encryption_fields.sql`
   - Adds encrypted columns to all relevant tables
   - Creates indexes for hash-based searches

4. **API Integration** - All endpoints updated
   - Bank account creation/retrieval
   - Card creation/retrieval
   - Voucher redemption with bank transfer
   - User registration with national ID

### Database Schema

**Encrypted Column Pattern:**
- `{field}_encrypted` - Encrypted data (TEXT)
- `{field}_iv` - Initialization vector (TEXT)
- `{field}_tag` - Authentication tag (TEXT)
- `{field}_hash` - Hash for duplicate detection (TEXT, optional)

**Example:**
```sql
ALTER TABLE user_banks ADD COLUMN IF NOT EXISTS account_number_encrypted TEXT;
ALTER TABLE user_banks ADD COLUMN IF NOT EXISTS account_number_iv TEXT;
ALTER TABLE user_banks ADD COLUMN IF NOT EXISTS account_number_tag TEXT;
```

---

## Deployment Steps

### Step 1: Generate Encryption Key

```bash
cd buffr
npx tsx scripts/generate-encryption-key.ts
```

**Add to `.env.local`:**
```bash
ENCRYPTION_KEY=generated-64-character-key
```

**Production (Vercel):**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `ENCRYPTION_KEY` with generated value
3. Set for Production, Preview, and Development

### Step 2: Run Database Migration

```bash
npx tsx scripts/run-encryption-migration.ts
```

**What it does:**
- Adds encrypted columns to 5 tables
- Creates indexes for hash-based searches
- Adds column comments

### Step 3: Migrate Existing Data (if any)

```bash
npx tsx scripts/migrate-existing-data-to-encrypted.ts
```

**⚠️ Important:** Only run if you have existing plain text sensitive data

### Step 4: Verify Environment Validation

The application validates `ENCRYPTION_KEY` on startup. Check that validation passes:

```bash
npm run dev
```

Look for: `✅ Environment variables validated successfully`

---

## Next Steps

### Immediate

1. ✅ Generate encryption key
2. ✅ Run database migration
3. ⏳ Add `ENCRYPTION_KEY` to Vercel environment variables
4. ⏳ Migrate existing data (if applicable)

### Future

1. ⏳ Database-level encryption (TDE) - requires Neon provider configuration
2. ⏳ Key rotation mechanism
3. ⏳ Performance optimization for large datasets

---

## Verification

### Checklist

- [ ] `ENCRYPTION_KEY` is set in `.env.local`
- [ ] `ENCRYPTION_KEY` is set in Vercel environment variables
- [ ] Database migration executed successfully
- [ ] All encrypted columns exist in database
- [ ] Existing data migrated (if applicable)
- [ ] Environment validation passes on startup
- [ ] New bank accounts are encrypted
- [ ] New cards are encrypted
- [ ] Voucher redemptions encrypt bank accounts
- [ ] API responses mask sensitive data (show `****`)

### Test Encryption

```bash
# Test bank account encryption
curl -X POST http://localhost:3000/api/banks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "bankName": "Test Bank",
    "accountNumber": "1234567890",
    "accountType": "checking"
  }'

# Verify in database (account_number_encrypted_data should be populated)
```

---

## 📚 Related Documentation

- **Implementation Details:** See `ENCRYPTION_IMPLEMENTATION.md` (merged into this guide)
- **Deployment Guide:** See `ENCRYPTION_NEXT_STEPS.md` (merged into this guide)

---

**Last Updated:** January 26, 2026  
**Status:** ✅ **Application-Level Encryption Complete**
