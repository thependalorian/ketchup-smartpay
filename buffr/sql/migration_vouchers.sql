-- Migration: Vouchers Table
-- Location: sql/migration_vouchers.sql
-- Purpose: Create vouchers table for government and merchant vouchers
-- Date: 2025-12-18
-- Compliance: Payment System Management Act, PSD-1/PSD-3 (NOT Virtual Assets Act)
-- Integration: NamPay, NamPost, retail partners (Shoprite, Pick n Pay)

-- Create vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  type VARCHAR(50) NOT NULL, -- 'government', 'merchant', 'corporate'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'available', -- 'available', 'redeemed', 'expired', 'cancelled', 'pending_settlement'
  expiry_date DATE,
  redeemed_at TIMESTAMP,
  redemption_method VARCHAR(50), -- 'wallet', 'cash_out', 'bank_transfer', 'merchant_payment'
  issuer VARCHAR(255), -- 'Ministry of Finance', 'Ministry of Gender Equality', merchant name, etc.
  icon VARCHAR(50), -- Icon identifier for UI
  voucher_code VARCHAR(100) UNIQUE, -- Unique code for in-person redemption (QR/code display)
  batch_id VARCHAR(100), -- Batch ID from issuer (e.g., Ministry of Finance batch)
  grant_type VARCHAR(100), -- For government vouchers: 'old_age', 'disability', 'child_support', etc.
  
  -- NamPay Integration
  nampay_reference VARCHAR(255), -- NamPay transaction reference for settlement
  nampay_settled BOOLEAN DEFAULT FALSE, -- Whether settled via NamPay
  nampay_settled_at TIMESTAMP, -- Settlement timestamp
  
  -- Verification & KYC
  verification_required BOOLEAN DEFAULT FALSE, -- Biometric/ID verification required
  verification_method VARCHAR(50), -- 'biometric', 'id_scan', 'in_person', 'none'
  verified_at TIMESTAMP, -- Verification timestamp
  verified_by VARCHAR(255), -- Verification point: 'nampost', 'shoprite', 'buffr_app', etc.
  
  -- Redemption Details
  redemption_point VARCHAR(255), -- Where redeemed: 'nampost_branch', 'shoprite', 'pick_n_pay', 'buffr_app', 'bank_transfer'
  bank_account_number VARCHAR(50), -- If redeemed via bank transfer
  bank_name VARCHAR(100), -- Bank name for transfer
  
  -- Line of Credit (Optional - only if government guaranteed)
  credit_advanced BOOLEAN DEFAULT FALSE, -- Whether credit was advanced before voucher redemption
  credit_settled BOOLEAN DEFAULT FALSE, -- Whether credit has been settled
  
  -- Metadata (JSONB for flexible storage)
  metadata JSONB DEFAULT '{}', -- Additional data:
  --   - batch_upload_date: When batch was uploaded
  --   - procurator_info: For procurator vouchers
  --   - payment_schedule: Grant payment schedule
  --   - retail_partner: Partner for cash-out
  --   - pos_merchant_id: For merchant payment redemption
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vouchers_user_id ON vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_type ON vouchers(type);
CREATE INDEX IF NOT EXISTS idx_vouchers_expiry ON vouchers(expiry_date) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_vouchers_batch_id ON vouchers(batch_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_code ON vouchers(voucher_code);
CREATE INDEX IF NOT EXISTS idx_vouchers_nampay_settled ON vouchers(nampay_settled) WHERE nampay_settled = FALSE;
CREATE INDEX IF NOT EXISTS idx_vouchers_redemption_method ON vouchers(redemption_method);

-- Create redemption audit table for compliance
CREATE TABLE IF NOT EXISTS voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID,
  user_id VARCHAR(255),
  redemption_method VARCHAR(50) NOT NULL,
  redemption_point VARCHAR(255),
  amount DECIMAL(15,2) NOT NULL,
  nampay_reference VARCHAR(255),
  verification_method VARCHAR(50),
  verified_by VARCHAR(255),
  bank_account_number VARCHAR(50),
  bank_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'settled'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  settled_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_voucher_id ON voucher_redemptions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user_id ON voucher_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_status ON voucher_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_nampay_ref ON voucher_redemptions(nampay_reference);

-- Add comments
COMMENT ON TABLE vouchers IS 'Government and merchant vouchers - Digital wallet and redemption platform (NOT virtual assets)';
COMMENT ON COLUMN vouchers.type IS 'Voucher type: government (social grants), merchant, corporate';
COMMENT ON COLUMN vouchers.voucher_code IS 'Unique code for in-person redemption at NamPost/retail partners';
COMMENT ON COLUMN vouchers.batch_id IS 'Batch ID from issuer (e.g., Ministry of Finance disbursement batch)';
COMMENT ON COLUMN vouchers.grant_type IS 'For government vouchers: old_age, disability, child_support, etc.';
COMMENT ON COLUMN vouchers.nampay_reference IS 'NamPay transaction reference for settlement';
COMMENT ON COLUMN vouchers.verification_required IS 'Biometric/ID verification required for government vouchers';
COMMENT ON COLUMN vouchers.redemption_method IS 'How voucher was redeemed: wallet, cash_out, bank_transfer, merchant_payment';
COMMENT ON COLUMN vouchers.redemption_point IS 'Where redeemed: nampost_branch, shoprite, pick_n_pay, buffr_app, bank_transfer';
COMMENT ON COLUMN vouchers.credit_advanced IS 'Whether credit was advanced before voucher redemption (only if government guaranteed)';
COMMENT ON TABLE voucher_redemptions IS 'Audit trail for all voucher redemptions - compliance requirement';
