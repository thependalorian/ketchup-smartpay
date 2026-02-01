-- Agents table for Ketchup/SmartPay agent network (shared with Buffr/G2P)
-- Migration: 008_agents.sql
-- Purpose: Create agents table so seed.ts and AgentService work. Same schema as buffr/sql/migration_agent_network.sql
--          except wallet_id has no FK (so this backend can run standalone; Buffr can add FK later if needed).

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  wallet_id UUID,
  liquidity_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  cash_on_hand DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
  min_liquidity_required DECIMAL(15, 2) NOT NULL DEFAULT 1000,
  max_daily_cashout DECIMAL(15, 2) NOT NULL DEFAULT 50000,
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 1.5,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_location ON agents(location);
CREATE INDEX IF NOT EXISTS idx_agents_wallet_id ON agents(wallet_id);
CREATE INDEX IF NOT EXISTS idx_agents_coordinates ON agents(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
