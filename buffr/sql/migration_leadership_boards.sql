-- Migration: Leadership Boards & Gamification
-- Location: sql/migration_leadership_boards.sql
-- Purpose: Create tables for leaderboard rankings and incentive awards
-- Date: 2026-01-26
-- Compliance: PSD-1 (governance), Data Protection Act 2019 (anonymization)

-- ============================================================================
-- LEADERBOARD RANKINGS TABLE
-- ============================================================================

-- Leaderboard rankings (agents, NamPost branches, beneficiaries)
CREATE TABLE IF NOT EXISTS leaderboard_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL, -- 'agents', 'nampost', 'beneficiaries'
  period VARCHAR(20) NOT NULL, -- '2026-01' (YYYY-MM format)
  participant_id VARCHAR(255) NOT NULL, -- Agent ID, branch ID, or user ID
  participant_name VARCHAR(255) NOT NULL,
  rank INTEGER NOT NULL,
  metrics JSONB NOT NULL, -- {transactionVolume: 1250, bottleneckReduction: 450, liquidityUtilization: 75.5, availabilityRate: 98.5, customerSatisfaction: 4.8}
  total_score DECIMAL(5, 2) NOT NULL,
  incentive_amount DECIMAL(15, 2),
  incentive_currency VARCHAR(3) DEFAULT 'NAD',
  incentive_type VARCHAR(50), -- 'monthly_cashback', 'operational_bonus', 'voucher'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, period, participant_id)
);

-- Indexes for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_category ON leaderboard_rankings(category);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_period ON leaderboard_rankings(period);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_rank ON leaderboard_rankings(category, period, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_participant ON leaderboard_rankings(participant_id);

-- ============================================================================
-- LEADERBOARD INCENTIVES TABLE
-- ============================================================================

-- Incentive awards tracking
CREATE TABLE IF NOT EXISTS leaderboard_incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranking_id UUID NOT NULL REFERENCES leaderboard_rankings(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  incentive_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed'
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for incentive tracking
CREATE INDEX IF NOT EXISTS idx_leaderboard_incentives_ranking ON leaderboard_incentives(ranking_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_incentives_status ON leaderboard_incentives(status);

-- ============================================================================
-- BOTTLENECK METRICS TABLE
-- ============================================================================

-- NamPost bottleneck reduction metrics
CREATE TABLE IF NOT EXISTS bottleneck_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  nampost_branch_load_before DECIMAL(5, 2), -- Average load percentage before intervention
  nampost_branch_load_after DECIMAL(5, 2), -- Average load percentage after intervention
  agent_network_usage_percentage DECIMAL(5, 2), -- Percentage of transactions via agents
  bottleneck_reduction_percentage DECIMAL(5, 2), -- Overall reduction percentage
  beneficiaries_routed_to_agents INTEGER DEFAULT 0,
  average_wait_time_reduction INTEGER, -- Minutes reduced
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- Indexes for bottleneck metrics
CREATE INDEX IF NOT EXISTS idx_bottleneck_metrics_date ON bottleneck_metrics(date DESC);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leaderboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_leaderboard_rankings_updated_at
  BEFORE UPDATE ON leaderboard_rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE leaderboard_rankings IS 'Leaderboard rankings for agents, NamPost branches, and beneficiaries (gamification for bottleneck alleviation)';
COMMENT ON TABLE leaderboard_incentives IS 'Incentive awards tracking for leaderboard winners';
COMMENT ON TABLE bottleneck_metrics IS 'NamPost bottleneck reduction metrics (daily tracking)';

-- ============================================================================
-- MIGRATION HISTORY ENTRY
-- ============================================================================

INSERT INTO migration_history (
  migration_name,
  migration_version,
  status,
  metadata
)
VALUES (
  'migration_leadership_boards.sql',
  '1.0.0',
  'completed',
  '{"description": "Leadership boards and gamification tables for alleviating NamPost bottlenecks", "tables": ["leaderboard_rankings", "leaderboard_incentives", "bottleneck_metrics"]}'
)
ON CONFLICT (migration_name) DO NOTHING;
