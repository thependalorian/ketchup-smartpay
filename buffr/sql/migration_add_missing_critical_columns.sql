-- ============================================================================
-- Migration: Add Missing Critical Columns for G2P Voucher Platform
-- Location: sql/migration_add_missing_critical_columns.sql
-- Purpose: Add missing columns for Fineract, IPS, and SmartPay integration
-- Date: 2026-01-26
-- Priority: High - Required for G2P voucher platform functionality
-- ============================================================================

-- ============================================================================
-- TRANSACTIONS TABLE - Add Integration Columns
-- ============================================================================

-- Add voucher_id to link transactions to vouchers
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL;

-- Add Fineract transaction ID for core banking sync
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS fineract_transaction_id BIGINT;

-- Add IPS transaction ID for Instant Payment System integration
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS ips_transaction_id VARCHAR(255);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_transactions_voucher_id ON transactions(voucher_id) WHERE voucher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_fineract_id ON transactions(fineract_transaction_id) WHERE fineract_transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_ips_id ON transactions(ips_transaction_id) WHERE ips_transaction_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN transactions.voucher_id IS 'Link to vouchers table for G2P voucher transactions';
COMMENT ON COLUMN transactions.fineract_transaction_id IS 'Fineract core banking system transaction ID';
COMMENT ON COLUMN transactions.ips_transaction_id IS 'Instant Payment System (IPS) transaction reference';

-- ============================================================================
-- VOUCHERS TABLE - Add SmartPay Integration Columns
-- ============================================================================

-- Add beneficiary_id (may already exist as smartpay_beneficiary_id, but add for clarity)
-- Note: vouchers.user_id already exists, but beneficiary_id is more explicit for G2P
ALTER TABLE vouchers 
  ADD COLUMN IF NOT EXISTS beneficiary_id VARCHAR(255);

-- Add currency (defaults to NAD for Namibia)
ALTER TABLE vouchers 
  ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NAD';

-- Add issued_at timestamp
ALTER TABLE vouchers 
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP;

-- Add smartpay_voucher_id (SmartPay system voucher ID)
-- Note: smartpay_beneficiary_id already exists from migration_vouchers_smartpay_integration.sql
ALTER TABLE vouchers 
  ADD COLUMN IF NOT EXISTS smartpay_voucher_id VARCHAR(255);

-- Add external_id for external system integration
ALTER TABLE vouchers 
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(255);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_vouchers_beneficiary_id ON vouchers(beneficiary_id) WHERE beneficiary_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_smartpay_voucher_id ON vouchers(smartpay_voucher_id) WHERE smartpay_voucher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_external_id ON vouchers(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_currency ON vouchers(currency);

-- Add comments
COMMENT ON COLUMN vouchers.beneficiary_id IS 'Beneficiary ID (may be same as user_id or SmartPay beneficiary ID)';
COMMENT ON COLUMN vouchers.currency IS 'Currency code (default: NAD for Namibia)';
COMMENT ON COLUMN vouchers.issued_at IS 'Timestamp when voucher was issued';
COMMENT ON COLUMN vouchers.smartpay_voucher_id IS 'SmartPay system voucher ID (Ketchup Software Solutions)';
COMMENT ON COLUMN vouchers.external_id IS 'External system ID for integration';

-- ============================================================================
-- WALLETS TABLE - Add Missing Base Columns (Optional - for card features)
-- ============================================================================

-- Add icon for wallet display
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

-- Add purpose for wallet description
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Add card design option
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS card_design INTEGER DEFAULT 2;

-- Add card number (last 4 digits)
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS card_number VARCHAR(4);

-- Add cardholder name
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS cardholder_name VARCHAR(255);

-- Add expiry date (MM/YY format)
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS expiry_date VARCHAR(5);

-- Add auto-pay settings (if not already present)
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS auto_pay_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS auto_pay_max_amount DECIMAL(15, 2);

ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS auto_pay_settings JSONB DEFAULT '{}';

-- Add security settings
ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS pin_protected BOOLEAN DEFAULT FALSE;

ALTER TABLE wallets 
  ADD COLUMN IF NOT EXISTS biometric_enabled BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallets_card_number ON wallets(card_number) WHERE card_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallets_auto_pay_enabled ON wallets(auto_pay_enabled) WHERE auto_pay_enabled = TRUE;

-- Add comments
COMMENT ON COLUMN wallets.icon IS 'Icon identifier for wallet display';
COMMENT ON COLUMN wallets.purpose IS 'Wallet purpose/description';
COMMENT ON COLUMN wallets.card_design IS 'Card design option (1-5)';
COMMENT ON COLUMN wallets.card_number IS 'Last 4 digits of card number';
COMMENT ON COLUMN wallets.cardholder_name IS 'Name on card';
COMMENT ON COLUMN wallets.expiry_date IS 'Card expiry date (MM/YY format)';

-- ============================================================================
-- FINERACT_SYNC_LOGS TABLE - Verify Column Names
-- ============================================================================

-- Note: fineract_sync_logs uses different column names:
--   - sync_status (instead of status) ✅ Already exists
--   - sync_error (instead of error_message) ✅ Already exists
--   - fineract_id (instead of external_id) ✅ Already exists
--   - entity_type, entity_id ✅ Already exist
--
-- Missing columns that might be needed:
--   - operation_type (create, update, delete)
--   - request_payload (JSONB)
--   - response_payload (JSONB)

ALTER TABLE fineract_sync_logs 
  ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);

ALTER TABLE fineract_sync_logs 
  ADD COLUMN IF NOT EXISTS request_payload JSONB;

ALTER TABLE fineract_sync_logs 
  ADD COLUMN IF NOT EXISTS response_payload JSONB;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fineract_sync_logs_operation_type ON fineract_sync_logs(operation_type) WHERE operation_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN fineract_sync_logs.operation_type IS 'Operation type: create, update, delete, sync';
COMMENT ON COLUMN fineract_sync_logs.request_payload IS 'Request payload sent to Fineract';
COMMENT ON COLUMN fineract_sync_logs.response_payload IS 'Response payload from Fineract';

-- ============================================================================
-- SPLIT_BILLS TABLE - Verify Column Names
-- ============================================================================

-- Note: split_bills uses creator_id (not created_by) ✅ Already exists
-- Missing columns:
--   - title (bill title)
--   - due_date (due date)

ALTER TABLE split_bills 
  ADD COLUMN IF NOT EXISTS title VARCHAR(255);

ALTER TABLE split_bills 
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_split_bills_due_date ON split_bills(due_date) WHERE due_date IS NOT NULL;

-- Add comments
COMMENT ON COLUMN split_bills.title IS 'Bill title/description';
COMMENT ON COLUMN split_bills.due_date IS 'Due date for bill payment';

-- ============================================================================
-- TRANSACTION_ANALYTICS TABLE - Note on Schema Evolution
-- ============================================================================

-- Note: transaction_analytics has evolved to aggregate analytics
--   - Uses 'date' instead of 'period_start'/'period_end'
--   - Uses 'total_volume' instead of 'total_amount'
--   - Uses 'average_transaction_amount' instead of 'average_transaction'
--   - No 'user_id' - table is for aggregate analytics, not user-specific
--
-- This is intentional schema evolution. If user-specific analytics are needed,
-- consider creating a separate user_transaction_analytics table.

-- No changes needed - current schema is correct for aggregate analytics

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- ✅ Added voucher_id, fineract_transaction_id, ips_transaction_id to transactions
-- ✅ Added beneficiary_id, currency, issued_at, smartpay_voucher_id, external_id to vouchers
-- ✅ Added optional wallet card columns (icon, purpose, card_*, auto_pay_*, pin_protected, biometric_enabled)
-- ✅ Added operation_type, request_payload, response_payload to fineract_sync_logs
-- ✅ Added title, due_date to split_bills
-- ✅ Created indexes for all new columns
