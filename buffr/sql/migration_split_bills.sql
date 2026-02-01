/**
 * Split Bills Database Schema
 * 
 * Location: sql/migration_split_bills.sql
 * Purpose: Create tables for split bill feature (like India's UPI split bill)
 * 
 * This enables users to split bills among multiple participants
 */

-- ============================================================================
-- SPLIT BILLS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'NAD',
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'settled', 'cancelled'
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0.00,
  settled_at TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_split_bills_creator_id ON split_bills(creator_id);
CREATE INDEX IF NOT EXISTS idx_split_bills_status ON split_bills(status);
CREATE INDEX IF NOT EXISTS idx_split_bills_created_at ON split_bills(created_at DESC);

-- ============================================================================
-- SPLIT BILL PARTICIPANTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS split_bill_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_bill_id UUID NOT NULL REFERENCES split_bills(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL, -- Participant's share
  paid_amount DECIMAL(15, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'declined'
  paid_at TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(split_bill_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_split_bill_participants_split_bill_id ON split_bill_participants(split_bill_id);
CREATE INDEX IF NOT EXISTS idx_split_bill_participants_user_id ON split_bill_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_split_bill_participants_status ON split_bill_participants(status);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_split_bills_updated_at
  BEFORE UPDATE ON split_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER IF NOT EXISTS trg_split_bill_participants_updated_at
  BEFORE UPDATE ON split_bill_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE split_bills IS 'Split bill records for group bill splitting';
COMMENT ON TABLE split_bill_participants IS 'Participants in split bills with their payment status';
