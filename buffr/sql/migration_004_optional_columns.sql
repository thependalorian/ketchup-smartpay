-- Optional Columns Migration
-- Version: 4.0.0
-- Purpose: Add optional columns that may be frequently queried or improve query performance
-- Created: 2025-01-17
--
-- This migration adds optional columns that:
-- 1. May improve query performance when used in WHERE/GROUP BY clauses
-- 2. Are frequently accessed and benefit from being actual columns vs metadata
-- 3. Support better indexing and filtering
--
-- Note: Most frequently-queried columns already exist. This adds only truly missing ones.

-- ============================================================================
-- USERS TABLE: Add Missing Columns
-- ============================================================================

-- Add status column if not exists (for user state management)
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add first_name if not exists (exists in schema.sql but may not be in production DB)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);

-- Add last_name if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Add currency if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'N$';

-- Add avatar if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Update existing records
UPDATE users SET status = 'active' WHERE status IS NULL;
UPDATE users SET currency = 'N$' WHERE currency IS NULL;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status) WHERE status != 'active';

-- ============================================================================
-- CONTACTS TABLE: Add Missing Fields
-- ============================================================================

-- Add phone_number if not exists (schema has 'phone' but code may expect 'phone_number')
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
-- Sync from 'phone' column if exists
UPDATE contacts SET phone_number = phone WHERE phone_number IS NULL AND phone IS NOT NULL;

-- Add avatar if not exists
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add bank_code if not exists
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS bank_code VARCHAR(10);

-- Add metadata if not exists
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- GROUPS TABLE: Add Missing Fields
-- ============================================================================

-- Add type if not exists
ALTER TABLE groups ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'savings';

-- Add avatar if not exists
ALTER TABLE groups ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Add is_active if not exists
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add metadata if not exists
ALTER TABLE groups ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for active groups
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- MONEY_REQUESTS TABLE: Add Missing Fields
-- ============================================================================

-- Add description if not exists (currently stored in 'note' column)
ALTER TABLE money_requests ADD COLUMN IF NOT EXISTS description TEXT;
-- Sync from 'note' column if exists
UPDATE money_requests SET description = note WHERE description IS NULL AND note IS NOT NULL;

-- Add expires_at if not exists
ALTER TABLE money_requests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Add metadata if not exists
ALTER TABLE money_requests ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for expired requests
CREATE INDEX IF NOT EXISTS idx_money_requests_expires_at ON money_requests(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- NOTIFICATIONS TABLE: Add Missing Fields
-- ============================================================================

-- Add data JSONB if not exists (for notification payload)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}';

-- Add read_at if not exists
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;

-- Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;

-- ============================================================================
-- TRANSACTIONS TABLE: Add Missing Query Fields
-- ============================================================================

-- Add wallet_id if not exists (for JOINs with wallets)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- Add type if not exists (legacy field, also have transaction_type)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type VARCHAR(50);

-- Add description if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;

-- Add category if not exists (frequently queried for budget analysis)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add recipient_id if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_id VARCHAR(255);

-- Add recipient_name if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(255);

-- Add date if not exists (alias for transaction_time)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS date TIMESTAMP;
-- Sync from transaction_time if exists
UPDATE transactions SET date = transaction_time WHERE date IS NULL AND transaction_time IS NOT NULL;

-- Create indexes for frequently-queried fields
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id) WHERE wallet_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON transactions(category, date DESC) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC) WHERE date IS NOT NULL;

-- ============================================================================
-- RECORD MIGRATION IN HISTORY
-- ============================================================================

INSERT INTO migration_history (migration_name, migration_version, status, metadata)
VALUES ('migration_004_optional_columns.sql', '4.0.0', 'completed', '{"description": "Add optional columns for better query performance"}')
ON CONFLICT (migration_name) DO UPDATE SET
  status = 'completed',
  applied_at = NOW();
