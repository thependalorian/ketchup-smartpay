-- ============================================================================
-- Migration: 007_fix_psd_compliance_schema.sql
-- Purpose: Fix schema issues found during testing
-- ============================================================================

-- Fix 1: Increase OTP code storage size (storing SHA256 hash = 64 chars)
ALTER TABLE two_factor_auth_logs
ALTER COLUMN otp_code TYPE VARCHAR(64);

-- Fix 2: Add UNIQUE constraint for dormant_wallets ON CONFLICT
ALTER TABLE dormant_wallets
DROP CONSTRAINT IF EXISTS dormant_wallets_beneficiary_id_key;

ALTER TABLE dormant_wallets
ADD CONSTRAINT dormant_wallets_beneficiary_id_unique UNIQUE (beneficiary_id);

-- Fix 3: Make outstanding_liabilities_avg_6mo nullable (can be NULL initially)
ALTER TABLE capital_requirements_tracking
ALTER COLUMN outstanding_liabilities_avg_6mo DROP NOT NULL;

ALTER TABLE capital_requirements_tracking
ALTER COLUMN ongoing_capital_required DROP NOT NULL;

-- Fix 4: Increase availability_percentage precision to avoid overflow
-- Change from DECIMAL(5,4) to DECIMAL(10,6)
ALTER TABLE system_availability_summary
ALTER COLUMN availability_percentage TYPE DECIMAL(10,6);

-- Add audit log entry
INSERT INTO compliance_audit_trail (
  audit_type,
  regulation,
  action_taken,
  performed_by,
  result,
  notes
) VALUES (
  'schema_fix',
  'PSD-1,PSD-3,PSD-12',
  'Fixed schema issues from test results',
  'System',
  'resolved',
  'Migration 007: Fixed OTP storage, dormant wallet constraint, capital tracking nullability, availability precision'
);
