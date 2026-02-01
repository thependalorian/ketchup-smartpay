-- Migration: SmartPay Integration Fields for Vouchers
-- Location: sql/migration_vouchers_smartpay_integration.sql
-- Purpose: Add SmartPay beneficiary ID and NamQR code fields to vouchers table
-- Date: 2026-01-21
-- Priority: Priority 3 - Real-Time SmartPay Integration

-- Add smartpay_beneficiary_id column (links voucher to SmartPay beneficiary database)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS smartpay_beneficiary_id VARCHAR(100);

-- Add namqr_code column (stores generated NamQR code for voucher)
ALTER TABLE vouchers 
ADD COLUMN IF NOT EXISTS namqr_code TEXT;

-- Add index for SmartPay beneficiary ID lookups
CREATE INDEX IF NOT EXISTS idx_vouchers_smartpay_beneficiary_id 
ON vouchers(smartpay_beneficiary_id);

-- Add comments
COMMENT ON COLUMN vouchers.smartpay_beneficiary_id IS 'SmartPay beneficiary ID (links to Ketchup SmartPay beneficiary database)';
COMMENT ON COLUMN vouchers.namqr_code IS 'Generated NamQR code for voucher (Purpose Code 18 - Government voucher)';
