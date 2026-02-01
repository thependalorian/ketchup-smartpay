/**
 * Reconciliation Records Table Migration
 * 
 * Purpose: Store reconciliation results between Ketchup SmartPay and Buffr Platform
 * Location: backend/src/database/migrations/004_reconciliation_records.sql
 */

-- Reconciliation records table
CREATE TABLE IF NOT EXISTS reconciliation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL,
  reconciliation_date DATE NOT NULL,
  ketchup_status VARCHAR(50) NOT NULL,
  buffr_status VARCHAR(50) NOT NULL,
  match BOOLEAN NOT NULL,
  discrepancy TEXT,
  last_verified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_voucher_id ON reconciliation_records(voucher_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_date ON reconciliation_records(reconciliation_date);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_match ON reconciliation_records(match);

-- Comments
COMMENT ON TABLE reconciliation_records IS 'Stores reconciliation results between Ketchup and Buffr';
COMMENT ON COLUMN reconciliation_records.match IS 'Whether Ketchup and Buffr statuses match';
