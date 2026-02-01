-- Migration: Geoclustering & Demand Forecasting
-- Location: sql/migration_geoclustering.sql
-- Purpose: Store geographic clustering data and demand forecasting
-- Date: 2026-01-26
-- Compliance: Data Protection Act 2019 (anonymized location data)

-- ============================================================================
-- BENEFICIARY CLUSTERS TABLE
-- ============================================================================

-- Beneficiary clusters (K-Means clustering by location)
CREATE TABLE IF NOT EXISTS beneficiary_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(50) NOT NULL,
  cluster_id INTEGER NOT NULL,
  centroid_latitude DECIMAL(10, 8) NOT NULL,
  centroid_longitude DECIMAL(11, 8) NOT NULL,
  beneficiary_count INTEGER DEFAULT 0,
  transaction_volume DECIMAL(15, 2) DEFAULT 0,
  average_transaction_amount DECIMAL(15, 2) DEFAULT 0,
  preferred_cashout_location VARCHAR(50), -- 'nampost' or 'agent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region, cluster_id)
);

-- Indexes for beneficiary clusters
CREATE INDEX IF NOT EXISTS idx_beneficiary_clusters_region ON beneficiary_clusters(region);
-- Note: GIST index requires postgis extension. Using B-tree indexes for coordinates instead.
CREATE INDEX IF NOT EXISTS idx_beneficiary_clusters_latitude ON beneficiary_clusters(centroid_latitude);
CREATE INDEX IF NOT EXISTS idx_beneficiary_clusters_longitude ON beneficiary_clusters(centroid_longitude);

-- ============================================================================
-- AGENT CLUSTERS TABLE
-- ============================================================================

-- Agent clusters (DBSCAN clustering for density analysis)
CREATE TABLE IF NOT EXISTS agent_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(50) NOT NULL,
  cluster_id INTEGER, -- NULL for noise points
  density_type VARCHAR(50), -- 'dense', 'sparse', 'noise'
  agent_count INTEGER DEFAULT 0,
  transaction_volume DECIMAL(15, 2) DEFAULT 0,
  average_liquidity DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for agent clusters
CREATE INDEX IF NOT EXISTS idx_agent_clusters_region ON agent_clusters(region);
CREATE INDEX IF NOT EXISTS idx_agent_clusters_density ON agent_clusters(density_type);

-- ============================================================================
-- DEMAND HOTSPOTS TABLE
-- ============================================================================

-- Demand hotspots (high beneficiary demand + low agent coverage)
CREATE TABLE IF NOT EXISTS demand_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  region VARCHAR(50) NOT NULL,
  beneficiary_density DECIMAL(10, 2), -- Beneficiaries per square km
  transaction_demand_per_month DECIMAL(15, 2),
  current_agent_coverage INTEGER DEFAULT 0, -- Number of agents within 5km
  recommended_agent_count INTEGER DEFAULT 0,
  priority VARCHAR(50), -- 'high', 'medium', 'low'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for demand hotspots
CREATE INDEX IF NOT EXISTS idx_demand_hotspots_region ON demand_hotspots(region);
CREATE INDEX IF NOT EXISTS idx_demand_hotspots_priority ON demand_hotspots(priority);
CREATE INDEX IF NOT EXISTS idx_demand_hotspots_location ON demand_hotspots USING GIST (point(longitude, latitude));

-- ============================================================================
-- COVERAGE GAPS TABLE
-- ============================================================================

-- Coverage gaps (underserved areas)
CREATE TABLE IF NOT EXISTS coverage_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  region VARCHAR(50) NOT NULL,
  beneficiary_count INTEGER DEFAULT 0,
  nearest_agent_distance_km DECIMAL(10, 2),
  recommended_agent_type VARCHAR(50), -- 'small', 'medium', 'large'
  priority VARCHAR(50), -- 'high', 'medium', 'low'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for coverage gaps
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_region ON coverage_gaps(region);
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_priority ON coverage_gaps(priority);
-- Note: GIST index requires postgis extension. Using B-tree indexes for coordinates instead.
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_latitude ON coverage_gaps(latitude);
CREATE INDEX IF NOT EXISTS idx_coverage_gaps_longitude ON coverage_gaps(longitude);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_geoclustering_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_beneficiary_clusters_updated_at
  BEFORE UPDATE ON beneficiary_clusters
  FOR EACH ROW
  EXECUTE FUNCTION update_geoclustering_updated_at();

CREATE TRIGGER trg_demand_hotspots_updated_at
  BEFORE UPDATE ON demand_hotspots
  FOR EACH ROW
  EXECUTE FUNCTION update_geoclustering_updated_at();

CREATE TRIGGER trg_coverage_gaps_updated_at
  BEFORE UPDATE ON coverage_gaps
  FOR EACH ROW
  EXECUTE FUNCTION update_geoclustering_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE beneficiary_clusters IS 'Beneficiary location clusters (K-Means) for demand forecasting';
COMMENT ON TABLE agent_clusters IS 'Agent network density clusters (DBSCAN) for network optimization';
COMMENT ON TABLE demand_hotspots IS 'High-demand areas with low agent coverage (for expansion planning)';
COMMENT ON TABLE coverage_gaps IS 'Underserved areas requiring agent network expansion';

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
  'migration_geoclustering.sql',
  '1.0.0',
  'completed',
  '{"description": "Geographic clustering tables for demand forecasting and network optimization", "tables": ["beneficiary_clusters", "agent_clusters", "demand_hotspots", "coverage_gaps"]}'
)
ON CONFLICT (migration_name) DO NOTHING;
