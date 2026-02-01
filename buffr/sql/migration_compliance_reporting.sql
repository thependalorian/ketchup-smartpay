-- Migration: Compliance Reporting Schema
-- Location: sql/migration_compliance_reporting.sql
-- Purpose: Create compliance reporting tables for monthly statistics submission to Bank of Namibia (PSD-1 Requirement)
-- Date: 2026-01-21
-- Priority: Priority 6 - Compliance Reporting (PSD-1 Monthly Requirement)

-- Monthly Statistics Table
-- Stores aggregated monthly statistics for compliance reporting
CREATE TABLE IF NOT EXISTS compliance_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month DATE NOT NULL, -- First day of the month (e.g., 2026-01-01)
  report_year INTEGER NOT NULL,
  report_month_number INTEGER NOT NULL, -- 1-12
  
  -- Transaction Statistics
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_transaction_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_transaction_volume INTEGER NOT NULL DEFAULT 0, -- Number of transactions
  
  -- Voucher Statistics
  total_vouchers_issued INTEGER NOT NULL DEFAULT 0,
  total_voucher_value_issued NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_vouchers_redeemed INTEGER NOT NULL DEFAULT 0,
  total_voucher_value_redeemed NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_vouchers_expired INTEGER NOT NULL DEFAULT 0,
  total_voucher_value_expired NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- User Statistics
  total_active_users INTEGER NOT NULL DEFAULT 0,
  total_registered_users INTEGER NOT NULL DEFAULT 0,
  new_users_this_month INTEGER NOT NULL DEFAULT 0,
  
  -- Wallet Statistics
  total_wallets INTEGER NOT NULL DEFAULT 0,
  total_wallet_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  average_wallet_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- Payment Method Statistics
  wallet_transfers_count INTEGER NOT NULL DEFAULT 0,
  wallet_transfers_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  bank_transfers_count INTEGER NOT NULL DEFAULT 0,
  bank_transfers_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  cash_out_count INTEGER NOT NULL DEFAULT 0,
  cash_out_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  merchant_payments_count INTEGER NOT NULL DEFAULT 0,
  merchant_payments_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
  
  -- Compliance Statistics
  total_2fa_verifications INTEGER NOT NULL DEFAULT 0,
  total_audit_log_entries INTEGER NOT NULL DEFAULT 0,
  total_fraud_attempts INTEGER NOT NULL DEFAULT 0,
  total_incidents INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'finalized', 'submitted', 'approved'
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per month
  UNIQUE(report_year, report_month_number)
);

-- Compliance Report Files
-- Stores generated report files (CSV, Excel, PDF)
CREATE TABLE IF NOT EXISTS compliance_report_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_stats_id UUID NOT NULL REFERENCES compliance_monthly_stats(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL, -- 'csv', 'excel', 'pdf'
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Storage path or URL
  file_size BIGINT, -- File size in bytes
  mime_type VARCHAR(100),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES users(id),
  
  -- Indexes
  INDEX idx_report_files_stats_id (monthly_stats_id),
  INDEX idx_report_files_type (file_type)
);

-- Compliance Report Submissions
-- Tracks submissions to Bank of Namibia
CREATE TABLE IF NOT EXISTS compliance_report_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_stats_id UUID NOT NULL REFERENCES compliance_monthly_stats(id) ON DELETE CASCADE,
  submission_date DATE NOT NULL,
  submission_method VARCHAR(50) NOT NULL, -- 'email', 'portal', 'api', 'manual'
  submission_reference VARCHAR(255), -- Reference number from BoN
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- 'submitted', 'acknowledged', 'rejected', 'approved'
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by VARCHAR(255), -- BoN contact name
  rejection_reason TEXT,
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  
  -- Indexes
  INDEX idx_submissions_stats_id (monthly_stats_id),
  INDEX idx_submissions_date (submission_date),
  INDEX idx_submissions_status (status)
);

-- Comments
COMMENT ON TABLE compliance_monthly_stats IS 'Monthly statistics for compliance reporting to Bank of Namibia (PSD-1 requirement: submit within 10 days of month end)';
COMMENT ON TABLE compliance_report_files IS 'Generated compliance report files (CSV, Excel, PDF)';
COMMENT ON TABLE compliance_report_submissions IS 'Tracking of report submissions to Bank of Namibia';

COMMENT ON COLUMN compliance_monthly_stats.report_month IS 'First day of the reporting month (e.g., 2026-01-01 for January 2026)';
COMMENT ON COLUMN compliance_monthly_stats.status IS 'Report status: draft (being prepared), finalized (ready for submission), submitted (sent to BoN), approved (acknowledged by BoN)';
