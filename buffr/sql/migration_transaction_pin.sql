-- Migration: Transaction PIN for 2FA
-- Location: sql/migration_transaction_pin.sql
-- Purpose: Add transaction_pin_hash column to users table for PSD-12 2FA compliance
-- Date: 2026-01-21
-- Priority: Priority 2 - 2FA Verification System (Critical for PSD-12 Compliance)

-- Add transaction_pin_hash column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS transaction_pin_hash VARCHAR(255);

-- Add index for faster PIN verification queries (if needed)
-- Note: PIN hash lookups are typically done by user_id, so existing index should suffice

-- Add comment
COMMENT ON COLUMN users.transaction_pin_hash IS 'Bcrypt hashed transaction PIN for 2FA verification (PSD-12 requirement). Never store plaintext PIN.';
