/**
 * Agent Network Database Migration
 * 
 * Location: sql/migration_agent_network.sql
 * Purpose: Create tables for agent network management (M-PESA model)
 * 
 * Agent Network:
 * - Small agents: Mom & pop shops (local agents)
 * - Medium agents: Regional agents (multiple locations)
 * - Large agents: National chains (Shoprite, Model, OK Foods)
 * 
 * Features:
 * - Agent onboarding and management
 * - Liquidity monitoring and alerts
 * - Availability tracking
 * - Settlement processing
 * - Commission calculation
 */

-- ============================================================================
-- AGENTS TABLE
-- ============================================================================

-- Agent network for cash-out services
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'small', 'medium', 'large'
  location VARCHAR(255) NOT NULL, -- Physical location address
  latitude DECIMAL(10, 8), -- For geographic queries
  longitude DECIMAL(11, 8), -- For geographic queries
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL, -- Agent's wallet for liquidity
  liquidity_balance DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Available liquidity for cash-outs
  cash_on_hand DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Physical cash available
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval', -- 'active', 'inactive', 'suspended', 'pending_approval'
  min_liquidity_required DECIMAL(15, 2) NOT NULL DEFAULT 1000, -- Minimum liquidity threshold
  max_daily_cashout DECIMAL(15, 2) NOT NULL DEFAULT 50000, -- Maximum daily cash-out limit
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 1.5, -- Commission percentage (e.g., 1.5 for 1.5%)
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_location ON agents(location);
CREATE INDEX IF NOT EXISTS idx_agents_wallet_id ON agents(wallet_id);
CREATE INDEX IF NOT EXISTS idx_agents_coordinates ON agents(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- AGENT LIQUIDITY LOGS TABLE
-- ============================================================================

-- Track agent liquidity changes over time
CREATE TABLE IF NOT EXISTS agent_liquidity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  liquidity_balance DECIMAL(15, 2) NOT NULL,
  cash_on_hand DECIMAL(15, 2) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notes TEXT, -- Reason for liquidity change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_agent_liquidity_logs_agent_id ON agent_liquidity_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_liquidity_logs_timestamp ON agent_liquidity_logs(timestamp DESC);

-- ============================================================================
-- AGENT TRANSACTIONS TABLE
-- ============================================================================

-- Track all agent transactions (cash-out, cash-in, commissions)
CREATE TABLE IF NOT EXISTS agent_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL, -- If voucher redemption
  amount DECIMAL(15, 2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'cash_out', 'cash_in', 'commission'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  metadata JSONB, -- Additional transaction data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_agent_transactions_agent_id ON agent_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_beneficiary_id ON agent_transactions(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_voucher_id ON agent_transactions(voucher_id);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_status ON agent_transactions(status);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_type ON agent_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_agent_transactions_created_at ON agent_transactions(created_at DESC);

-- ============================================================================
-- AGENT SETTLEMENTS TABLE
-- ============================================================================

-- Track agent settlements (monthly commission payments)
CREATE TABLE IF NOT EXISTS agent_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  settlement_period VARCHAR(20) NOT NULL, -- e.g., "2026-01" (YYYY-MM format)
  total_amount DECIMAL(15, 2) NOT NULL, -- Total transaction amount for period
  commission DECIMAL(15, 2) NOT NULL, -- Commission earned
  settlement_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  settled_at TIMESTAMP WITH TIME ZONE, -- When settlement was completed
  metadata JSONB, -- Additional settlement data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(agent_id, settlement_period)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_agent_settlements_agent_id ON agent_settlements(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_settlements_period ON agent_settlements(settlement_period);
CREATE INDEX IF NOT EXISTS idx_agent_settlements_status ON agent_settlements(settlement_status);
CREATE INDEX IF NOT EXISTS idx_agent_settlements_settled_at ON agent_settlements(settled_at DESC);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_updated_at();

CREATE TRIGGER trg_agent_transactions_updated_at
  BEFORE UPDATE ON agent_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_updated_at();

CREATE TRIGGER trg_agent_settlements_updated_at
  BEFORE UPDATE ON agent_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE agents IS 'Agent network for cash-out services (M-PESA model)';
COMMENT ON TABLE agent_liquidity_logs IS 'Agent liquidity tracking for monitoring and alerts';
COMMENT ON TABLE agent_transactions IS 'All agent transactions (cash-out, cash-in, commissions)';
COMMENT ON TABLE agent_settlements IS 'Agent settlement tracking for commission payments';
