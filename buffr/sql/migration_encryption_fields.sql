-- Migration: Add Encrypted Columns for Sensitive Data
-- Location: sql/migration_encryption_fields.sql
-- Purpose: Add encrypted columns for sensitive PII and payment data
-- Date: 2026-01-22
-- Compliance: PSD-12 data protection requirements

-- ============================================================================
-- VOUCHERS TABLE - Encrypt bank account numbers
-- ============================================================================

-- Add encrypted columns for bank account number
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS bank_account_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number_iv TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number_tag TEXT;

-- Add encrypted columns for voucher redemption audit table
ALTER TABLE voucher_redemptions
ADD COLUMN IF NOT EXISTS bank_account_number_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number_iv TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number_tag TEXT;

-- ============================================================================
-- USER_BANKS TABLE - Migrate to encrypted format
-- ============================================================================

-- Add new encrypted columns (if they don't exist)
ALTER TABLE user_banks
ADD COLUMN IF NOT EXISTS account_number_encrypted_data TEXT,
ADD COLUMN IF NOT EXISTS account_number_iv TEXT,
ADD COLUMN IF NOT EXISTS account_number_tag TEXT;

-- ============================================================================
-- USER_CARDS TABLE - Migrate to encrypted format
-- ============================================================================

-- Add new encrypted columns (if they don't exist)
ALTER TABLE user_cards
ADD COLUMN IF NOT EXISTS card_number_encrypted_data TEXT,
ADD COLUMN IF NOT EXISTS card_number_iv TEXT,
ADD COLUMN IF NOT EXISTS card_number_tag TEXT;

-- ============================================================================
-- USERS TABLE - Add encrypted national_id column (for future use)
-- ============================================================================

-- Add encrypted national ID column (if SmartPay integration stores this)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS national_id_encrypted TEXT,
ADD COLUMN IF NOT EXISTS national_id_iv TEXT,
ADD COLUMN IF NOT EXISTS national_id_tag TEXT,
ADD COLUMN IF NOT EXISTS national_id_hash TEXT, -- For searching/duplicate detection
ADD COLUMN IF NOT EXISTS national_id_salt TEXT;

-- ============================================================================
-- INDEXES FOR ENCRYPTED FIELDS
-- ============================================================================

-- Index on national_id_hash for duplicate detection (hashed, not encrypted)
CREATE INDEX IF NOT EXISTS idx_users_national_id_hash 
ON users(national_id_hash) 
WHERE national_id_hash IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN vouchers.bank_account_number_encrypted IS 'Encrypted bank account number (AES-256-GCM)';
COMMENT ON COLUMN vouchers.bank_account_number_iv IS 'Initialization vector for bank account encryption';
COMMENT ON COLUMN vouchers.bank_account_number_tag IS 'Authentication tag for bank account encryption';

COMMENT ON COLUMN voucher_redemptions.bank_account_number_encrypted IS 'Encrypted bank account number (AES-256-GCM)';
COMMENT ON COLUMN voucher_redemptions.bank_account_number_iv IS 'Initialization vector for bank account encryption';
COMMENT ON COLUMN voucher_redemptions.bank_account_number_tag IS 'Authentication tag for bank account encryption';

COMMENT ON COLUMN user_banks.account_number_encrypted_data IS 'Encrypted account number (AES-256-GCM) - replaces account_number_encrypted';
COMMENT ON COLUMN user_banks.account_number_iv IS 'Initialization vector for account number encryption';
COMMENT ON COLUMN user_banks.account_number_tag IS 'Authentication tag for account number encryption';

COMMENT ON COLUMN user_cards.card_number_encrypted_data IS 'Encrypted card number (AES-256-GCM) - replaces card_number_encrypted';
COMMENT ON COLUMN user_cards.card_number_iv IS 'Initialization vector for card number encryption';
COMMENT ON COLUMN user_cards.card_number_tag IS 'Authentication tag for card number encryption';

COMMENT ON COLUMN users.national_id_encrypted IS 'Encrypted national ID number (AES-256-GCM)';
COMMENT ON COLUMN users.national_id_iv IS 'Initialization vector for national ID encryption';
COMMENT ON COLUMN users.national_id_tag IS 'Authentication tag for national ID encryption';
COMMENT ON COLUMN users.national_id_hash IS 'Hashed national ID for duplicate detection (one-way hash)';
COMMENT ON COLUMN users.national_id_salt IS 'Salt for national ID hash';
