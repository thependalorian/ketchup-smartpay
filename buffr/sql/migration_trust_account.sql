-- Migration: Trust Account Reconciliation
-- Location: sql/migration_trust_account.sql
-- Purpose: Create trust account tracking and reconciliation tables (PSD-3 Requirement)
-- Date: 2026-01-21
-- Priority: Priority 5 - Trust Account Reconciliation (PSD-3 Daily Requirement)

-- Trust Account Table
-- Tracks the trust account balance and all deposits/withdrawals
CREATE TABLE IF NOT EXISTS trust_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_deposits NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_withdrawals NUMERIC(15, 2) NOT NULL DEFAULT 0,
  e_money_liabilities NUMERIC(15, 2) NOT NULL DEFAULT 0, -- Outstanding e-money (wallet balances)
  reconciliation_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'reconciled', 'discrepancy'
  discrepancy_amount NUMERIC(15, 2) DEFAULT 0, -- Difference between trust account and liabilities
  reconciled_by UUID REFERENCES users(id), -- Admin who reconciled
  reconciled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per day
  UNIQUE(date)
);

-- Trust Account Transactions Table
-- Tracks all trust account movements (deposits, withdrawals, adjustments)
CREATE TABLE IF NOT EXISTS trust_account_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID NOT NULL REFERENCES trust_account(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'adjustment', 'interest', 'fee'
  amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  reference VARCHAR(255), -- Bank reference, transaction ID, etc.
  description TEXT,
  bank_statement_date DATE,
  bank_statement_reference VARCHAR(255),
  created_by UUID REFERENCES users(id), -- Admin who created the transaction
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for trust_account_transactions
CREATE INDEX IF NOT EXISTS idx_trust_account_transactions_account_id ON trust_account_transactions(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_trust_account_transactions_type ON trust_account_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_trust_account_transactions_date ON trust_account_transactions(created_at);

-- Trust Account Reconciliation Log
-- Tracks reconciliation attempts and results
CREATE TABLE IF NOT EXISTS trust_account_reconciliation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date DATE NOT NULL,
  trust_account_balance NUMERIC(15, 2) NOT NULL,
  e_money_liabilities NUMERIC(15, 2) NOT NULL,
  discrepancy_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL, -- 'success', 'discrepancy', 'error'
  error_message TEXT,
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Indexes for trust_account_reconciliation_log
CREATE INDEX IF NOT EXISTS idx_reconciliation_log_date ON trust_account_reconciliation_log(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_reconciliation_log_status ON trust_account_reconciliation_log(status);

-- Comments
COMMENT ON TABLE trust_account IS 'Trust account balance tracking (PSD-3 requirement: trust account must equal 100% of outstanding e-money liabilities)';
COMMENT ON TABLE trust_account_transactions IS 'All trust account movements (deposits, withdrawals, adjustments)';
COMMENT ON TABLE trust_account_reconciliation_log IS 'Daily reconciliation attempts and results';

COMMENT ON COLUMN trust_account.e_money_liabilities IS 'Total outstanding e-money (sum of all wallet balances) - must equal trust account balance';
COMMENT ON COLUMN trust_account.reconciliation_status IS 'Reconciliation status: pending (not yet reconciled), reconciled (balance matches), discrepancy (balance mismatch)';
COMMENT ON COLUMN trust_account.discrepancy_amount IS 'Difference between trust account balance and e-money liabilities (should be 0)';
