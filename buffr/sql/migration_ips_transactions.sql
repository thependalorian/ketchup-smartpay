/**
 * IPS Transactions Database Migration
 * 
 * Location: sql/migration_ips_transactions.sql
 * Purpose: Track IPS transactions and settlements for monitoring and reconciliation
 * 
 * Compliance: PSDIR-11 (IPS integration tracking)
 * Integration: IPS (Instant Payment Switch) transaction monitoring
 */

-- ============================================================================
-- IPS TRANSACTIONS TABLE
-- ============================================================================

-- Track IPS transactions and their settlement status
CREATE TABLE IF NOT EXISTS ips_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference VARCHAR(100) NOT NULL UNIQUE, -- Links to transactions.payment_reference
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  ips_transaction_id VARCHAR(100) NOT NULL, -- Transaction ID from IPS
  from_account VARCHAR(255) NOT NULL, -- Sender account (wallet ID, VPA, or bank account)
  to_account VARCHAR(255) NOT NULL, -- Recipient account (wallet ID, VPA, or bank account)
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'settled'
  settlement_status VARCHAR(50), -- 'pending', 'settled', 'failed'
  niss_reference VARCHAR(100), -- NISS (RTGS) settlement reference
  settlement_time TIMESTAMP WITH TIME ZONE, -- When settled via NISS
  fees DECIMAL(10, 2) DEFAULT 0, -- Transaction fees
  metadata JSONB, -- Additional IPS response data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ips_transactions_reference ON ips_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_transaction_id ON ips_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_ips_id ON ips_transactions(ips_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_status ON ips_transactions(status);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_settlement_status ON ips_transactions(settlement_status);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_created_at ON ips_transactions(created_at DESC);

-- ============================================================================
-- IPS SETTLEMENTS TABLE
-- ============================================================================

-- Track NISS settlements for IPS transactions
CREATE TABLE IF NOT EXISTS ips_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id VARCHAR(100) NOT NULL UNIQUE, -- Settlement ID from NISS
  ips_transaction_id UUID REFERENCES ips_transactions(id) ON DELETE CASCADE,
  transaction_reference VARCHAR(100) NOT NULL, -- Links to transactions.payment_reference
  settlement_status VARCHAR(50) NOT NULL, -- 'pending', 'settled', 'failed', 'reversed'
  niss_reference VARCHAR(100) NOT NULL, -- NISS (RTGS) settlement reference
  settlement_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  settled_at TIMESTAMP WITH TIME ZONE, -- When settled via NISS
  settlement_fees DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB, -- Additional settlement data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ips_settlements_settlement_id ON ips_settlements(settlement_id);
CREATE INDEX IF NOT EXISTS idx_ips_settlements_ips_transaction_id ON ips_settlements(ips_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ips_settlements_reference ON ips_settlements(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_ips_settlements_status ON ips_settlements(settlement_status);
CREATE INDEX IF NOT EXISTS idx_ips_settlements_niss_reference ON ips_settlements(niss_reference);
CREATE INDEX IF NOT EXISTS idx_ips_settlements_settled_at ON ips_settlements(settled_at DESC);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_ips_transactions_updated_at
  BEFORE UPDATE ON ips_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_ips_updated_at();

CREATE TRIGGER trg_ips_settlements_updated_at
  BEFORE UPDATE ON ips_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_ips_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ips_transactions IS 'IPS (Instant Payment Switch) transaction tracking for wallet-to-wallet and wallet-to-bank transfers';
COMMENT ON TABLE ips_settlements IS 'NISS (RTGS) settlement tracking for IPS transactions';
