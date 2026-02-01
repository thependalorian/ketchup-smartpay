-- Schema Fixes Migration
-- Version: 3.0.0
-- Purpose: Add all missing fields referenced in code but not in schema
-- Created: 2025-01-17
--
-- This migration adds fields that are expected by db-adapters.ts and API routes
-- but were missing from the base schema.sql

-- ============================================================================
-- USERS TABLE: Add Missing Fields
-- ============================================================================

-- Add external_id for string ID compatibility (referenced in db-adapters.ts:16)
-- This allows both UUID and string-based ID lookups
ALTER TABLE users ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) UNIQUE;

-- Add kyc_level for verification levels (referenced in db-adapters.ts:23)
-- Levels: 0=none, 1=basic, 2=verified, 3=enhanced
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 0;

-- Add metadata JSONB for flexible storage (referenced in db-adapters.ts:22)
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add created_at and updated_at if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Populate external_id from id for existing records (backwards compatible)
UPDATE users SET external_id = id::text WHERE external_id IS NULL;

-- Sync kyc_level with is_verified for existing records
UPDATE users SET kyc_level = CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END WHERE kyc_level = 0;

-- Create index on external_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
CREATE INDEX IF NOT EXISTS idx_users_kyc_level ON users(kyc_level);

-- ============================================================================
-- TRANSACTIONS TABLE: Add Missing Fields
-- ============================================================================

-- Add external_id for string ID compatibility (referenced in prepareTransactionData)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- Add transaction_type (code expects this, schema has 'type')
-- This allows both naming conventions to work
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);

-- Add transaction_time if not exists (referenced in db-adapters.ts:81)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add merchant fields (referenced in db-adapters.ts:76-79)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_category VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_id VARCHAR(100);

-- Add metadata JSONB for flexible storage
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Sync transaction_type from type column for existing records
UPDATE transactions
SET transaction_type = type
WHERE transaction_type IS NULL AND type IS NOT NULL;

-- Sync transaction_time from date column for existing records
UPDATE transactions
SET transaction_time = date
WHERE transaction_time IS NULL AND date IS NOT NULL;

-- Generate external_id for existing records
UPDATE transactions
SET external_id = 'TXN-' || id::text
WHERE external_id IS NULL;

-- Create indexes for transaction fields
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_time ON transactions(transaction_time DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_category ON transactions(merchant_category);

-- ============================================================================
-- WALLETS TABLE: Add Missing Fields
-- ============================================================================

-- Add available_balance (referenced in prepareWalletData)
-- This tracks funds available for immediate use (balance minus pending)
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS available_balance DECIMAL(15, 2);

-- Add is_default flag to mark primary wallet
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Add status column for wallet state
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add metadata JSONB for flexible storage
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Sync available_balance with balance for existing records
UPDATE wallets
SET available_balance = balance
WHERE available_balance IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_is_default ON wallets(user_id, is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_wallets_status ON wallets(status);

-- ============================================================================
-- CONTACTS TABLE: Add Missing Fields
-- ============================================================================

-- Add metadata JSONB for flexible storage
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- MONEY_REQUESTS TABLE: Add Missing Fields
-- ============================================================================

-- Add metadata JSONB for flexible storage
ALTER TABLE money_requests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- GROUPS TABLE: Add Missing Fields
-- ============================================================================

-- Add metadata JSONB for flexible storage
ALTER TABLE groups ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- RECORD MIGRATION IN HISTORY
-- ============================================================================

INSERT INTO migration_history (migration_name, migration_version, status, metadata)
VALUES ('migration_003_schema_fixes.sql', '3.0.0', 'completed', '{"description": "Add missing schema fields"}')
ON CONFLICT (migration_name) DO UPDATE SET
  status = 'completed',
  applied_at = NOW();
