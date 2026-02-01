-- Migration: Recommendation Engine
-- Location: sql/migration_recommendation_engine.sql
-- Purpose: Create tables for recommendation engine data and effectiveness tracking
-- Date: 2026-01-26
-- Compliance: PSD-12 (operational standards), Data Protection Act 2019

-- ============================================================================
-- RECOMMENDATIONS TABLE
-- ============================================================================

-- Recommendations history (cash-out location, liquidity, etc.)
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL, -- 'cashout_location', 'liquidity_replenishment', 'agent_placement'
  primary_recommendation JSONB NOT NULL, -- {type: 'agent', locationId: 'AGENT-123', name: 'Shoprite Windhoek', distance_km: 0.5, ...}
  alternatives JSONB, -- Array of alternative recommendations
  concentration_alert JSONB, -- Branch concentration data (if applicable)
  user_action VARCHAR(50), -- 'accepted', 'rejected', 'ignored'
  action_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_action ON recommendations(user_action);

-- ============================================================================
-- RECOMMENDATION EFFECTIVENESS TABLE
-- ============================================================================

-- Track recommendation effectiveness for ML model improvement
CREATE TABLE IF NOT EXISTS recommendation_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  outcome VARCHAR(50), -- 'success', 'failure', 'partial'
  user_satisfaction INTEGER, -- 1-5 rating
  wait_time_reduction INTEGER, -- Minutes saved
  distance_optimization DECIMAL(10, 2), -- Kilometers saved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for effectiveness tracking
CREATE INDEX IF NOT EXISTS idx_recommendation_effectiveness_recommendation ON recommendation_effectiveness(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_effectiveness_outcome ON recommendation_effectiveness(outcome);

-- ============================================================================
-- CONCENTRATION ALERTS TABLE
-- ============================================================================

-- High concentration alerts at NamPost branches
CREATE TABLE IF NOT EXISTS concentration_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id VARCHAR(50) NOT NULL,
  concentration_level VARCHAR(50) NOT NULL, -- 'high', 'critical'
  current_load INTEGER NOT NULL,
  max_capacity INTEGER NOT NULL,
  wait_time INTEGER NOT NULL,
  beneficiaries_notified INTEGER DEFAULT 0,
  agents_suggested INTEGER DEFAULT 0,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for concentration alerts
CREATE INDEX IF NOT EXISTS idx_concentration_alerts_branch ON concentration_alerts(branch_id);
CREATE INDEX IF NOT EXISTS idx_concentration_alerts_level ON concentration_alerts(concentration_level);
CREATE INDEX IF NOT EXISTS idx_concentration_alerts_created ON concentration_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concentration_alerts_resolved ON concentration_alerts(resolved_at) WHERE resolved_at IS NULL;

-- ============================================================================
-- LIQUIDITY RECOMMENDATIONS TABLE
-- ============================================================================

-- Liquidity management recommendations for agents
CREATE TABLE IF NOT EXISTS liquidity_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'replenish', 'mark_unavailable', 'request_loan', 'coordinate_with_agents'
  priority VARCHAR(50) NOT NULL, -- 'high', 'medium', 'low'
  details TEXT NOT NULL,
  estimated_impact TEXT,
  demand_forecast JSONB, -- {next24h: 1800.00, next7days: 12000.00, confidence: 0.85}
  agent_action VARCHAR(50), -- 'accepted', 'rejected', 'pending'
  action_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for liquidity recommendations
CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_agent ON liquidity_recommendations(agent_id);
CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_type ON liquidity_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_priority ON liquidity_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_action ON liquidity_recommendations(agent_action);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE recommendations IS 'Recommendation engine history (cash-out location, liquidity, agent placement)';
COMMENT ON TABLE recommendation_effectiveness IS 'Track recommendation effectiveness for ML model improvement';
COMMENT ON TABLE concentration_alerts IS 'High concentration alerts at NamPost branches for recommendation engine';
COMMENT ON TABLE liquidity_recommendations IS 'Liquidity management recommendations for agents';

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
  'migration_recommendation_engine.sql',
  '1.0.0',
  'completed',
  '{"description": "Recommendation engine tables for intelligent routing and liquidity management", "tables": ["recommendations", "recommendation_effectiveness", "concentration_alerts", "liquidity_recommendations"]}'
)
ON CONFLICT (migration_name) DO NOTHING;
