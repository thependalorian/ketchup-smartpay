/**
 * Fineract Sync Database Migration
 * 
 * Location: sql/migration_fineract_sync.sql
 * Purpose: Track Fineract synchronization for clients, accounts, and transactions
 * 
 * Architecture: Dual database
 * - Fineract (MySQL/PostgreSQL): Core banking data
 * - Neon PostgreSQL: Application data + sync tracking
 */

-- ============================================================================
-- FINERACT SYNC LOGS TABLE
-- ============================================================================

-- Track synchronization status between Buffr and Fineract
CREATE TABLE IF NOT EXISTS fineract_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'client', 'account', 'transaction'
  entity_id UUID NOT NULL, -- ID in Buffr application database
  fineract_id BIGINT NOT NULL, -- ID in Fineract system
  sync_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  sync_error TEXT, -- Error message if sync failed
  synced_at TIMESTAMP WITH TIME ZONE, -- When sync completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(entity_type, entity_id)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_fineract_sync_logs_entity ON fineract_sync_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_fineract_sync_logs_fineract_id ON fineract_sync_logs(fineract_id);
CREATE INDEX IF NOT EXISTS idx_fineract_sync_logs_status ON fineract_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_fineract_sync_logs_synced_at ON fineract_sync_logs(synced_at DESC);

-- ============================================================================
-- FINERACT ACCOUNTS TABLE
-- ============================================================================

-- Map Buffr users to Fineract accounts
CREATE TABLE IF NOT EXISTS fineract_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fineract_client_id BIGINT NOT NULL, -- Client ID in Fineract
  fineract_account_id BIGINT NOT NULL, -- Account ID in Fineract
  account_type VARCHAR(50) NOT NULL, -- 'SAVINGS', 'CURRENT', 'LOAN'
  account_no VARCHAR(100), -- Account number from Fineract
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'closed'
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, account_type)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_fineract_accounts_user_id ON fineract_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_fineract_accounts_client_id ON fineract_accounts(fineract_client_id);
CREATE INDEX IF NOT EXISTS idx_fineract_accounts_account_id ON fineract_accounts(fineract_account_id);
CREATE INDEX IF NOT EXISTS idx_fineract_accounts_account_no ON fineract_accounts(account_no);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fineract_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_fineract_sync_logs_updated_at
  BEFORE UPDATE ON fineract_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_fineract_updated_at();

CREATE TRIGGER trg_fineract_accounts_updated_at
  BEFORE UPDATE ON fineract_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_fineract_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE fineract_sync_logs IS 'Track synchronization between Buffr application and Fineract core banking system';
COMMENT ON TABLE fineract_accounts IS 'Map Buffr users to Fineract accounts for dual database architecture';
