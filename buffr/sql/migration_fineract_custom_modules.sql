/**
 * Fineract Custom Modules Database Migration
 * 
 * Location: sql/migration_fineract_custom_modules.sql
 * Purpose: Add support for fineract-voucher and fineract-wallets custom modules
 * 
 * Changes:
 * 1. Add wallet columns to fineract_accounts table (fineract_wallet_id, wallet_no)
 * 2. Create fineract_vouchers mapping table
 * 3. Update fineract_sync_logs to support voucher and wallet entity types
 * 
 * Architecture: Dual database
 * - Fineract (MySQL/PostgreSQL): Core banking data (vouchers, wallets via custom modules)
 * - Neon PostgreSQL: Application data + sync tracking
 */

-- ============================================================================
-- UPDATE FINERACT_ACCOUNTS TABLE FOR WALLET SUPPORT
-- ============================================================================

-- Add wallet columns to fineract_accounts table
-- Note: fineract_account_id is for trust account (savings account)
--       fineract_wallet_id is for beneficiary wallets (fineract-wallets module)
ALTER TABLE fineract_accounts
  ADD COLUMN IF NOT EXISTS fineract_wallet_id BIGINT,
  ADD COLUMN IF NOT EXISTS wallet_no VARCHAR(100);

-- Add index for wallet lookups
CREATE INDEX IF NOT EXISTS idx_fineract_accounts_wallet_id ON fineract_accounts(fineract_wallet_id);
CREATE INDEX IF NOT EXISTS idx_fineract_accounts_wallet_no ON fineract_accounts(wallet_no);

-- Update unique constraint to allow one wallet per user (account_type = 'WALLET')
-- Trust account can coexist with wallet (account_type = 'TRUST' or 'SAVINGS')
-- Note: The existing UNIQUE(user_id, account_type) constraint allows this

-- Update comment to reflect wallet support
COMMENT ON TABLE fineract_accounts IS 'Map Buffr users to Fineract clients and wallets. fineract_account_id is for trust account (savings account), fineract_wallet_id is for beneficiary wallets (fineract-wallets module)';

-- ============================================================================
-- FINERACT VOUCHERS TABLE
-- ============================================================================

-- Map Buffr vouchers to Fineract vouchers (fineract-voucher module)
CREATE TABLE IF NOT EXISTS fineract_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL, -- Buffr voucher ID (references vouchers.id)
  fineract_voucher_id BIGINT NOT NULL, -- Voucher ID in Fineract (fineract-voucher module)
  voucher_code VARCHAR(100) NOT NULL, -- Voucher code from Fineract
  status VARCHAR(50) NOT NULL DEFAULT 'ISSUED', -- 'ISSUED', 'ACTIVE', 'REDEEMED', 'EXPIRED'
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(voucher_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_fineract_vouchers_voucher_id ON fineract_vouchers(voucher_id);
CREATE INDEX IF NOT EXISTS idx_fineract_vouchers_fineract_voucher_id ON fineract_vouchers(fineract_voucher_id);
CREATE INDEX IF NOT EXISTS idx_fineract_vouchers_voucher_code ON fineract_vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_fineract_vouchers_status ON fineract_vouchers(status);

-- Trigger for updated_at
CREATE TRIGGER trg_fineract_vouchers_updated_at
  BEFORE UPDATE ON fineract_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_fineract_updated_at();

-- Comment
COMMENT ON TABLE fineract_vouchers IS 'Map Buffr vouchers to Fineract vouchers (fineract-voucher module)';

-- ============================================================================
-- UPDATE FINERACT_SYNC_LOGS FOR CUSTOM MODULES
-- ============================================================================

-- Update entity_type to support vouchers and wallets
-- Note: Existing 'account' type is for trust account (savings account)
--       New 'wallet' type is for beneficiary wallets (fineract-wallets module)
--       New 'voucher' type is for vouchers (fineract-voucher module)

-- Add comment to clarify entity types
COMMENT ON COLUMN fineract_sync_logs.entity_type IS 'Entity type: client, account (trust account), voucher (fineract-voucher), wallet (fineract-wallets), voucher_redemption, wallet_transaction';

-- ============================================================================
-- MIGRATION NOTES
-- ============================================================================

-- fineract_accounts table now supports:
-- - Trust account: Uses fineract_account_id (Fineract savings account)
-- - Beneficiary wallets: Uses fineract_wallet_id (fineract-wallets module)
-- - Both can coexist: A user can have a trust account AND a wallet

-- fineract_vouchers table:
-- - Maps Buffr vouchers to Fineract vouchers (fineract-voucher module)
-- - One-to-one mapping: Each Buffr voucher maps to one Fineract voucher

-- fineract_sync_logs table:
-- - Supports all entity types: client, account, voucher, wallet, voucher_redemption, wallet_transaction
