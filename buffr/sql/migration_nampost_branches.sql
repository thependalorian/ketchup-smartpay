-- Migration: NamPost Branch Management
-- Location: sql/migration_nampost_branches.sql
-- Purpose: Create tables for NamPost branch coordinates, staff profiles, and load tracking
-- Date: 2026-01-26
-- Compliance: PSD-1, PSD-3, PSD-12, ETA 2019

-- ============================================================================
-- NAMPOST BRANCHES TABLE
-- ============================================================================

-- NamPost branches with GPS coordinates (137-147 branches nationwide)
CREATE TABLE IF NOT EXISTS nampost_branches (
  branch_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL, -- 14 regions of Namibia
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  services TEXT[] NOT NULL, -- ['voucher_redemption', 'cash_out', 'onboarding', 'pin_reset']
  operating_hours JSONB, -- {weekdays: '08:00-17:00', saturday: '08:00-13:00', sunday: 'closed'}
  capacity_metrics JSONB, -- {maxConcurrentTransactions: 50, averageWaitTime: 15, peakHours: ['09:00-11:00', '14:00-16:00']}
  current_load INTEGER DEFAULT 0, -- Current number of transactions in progress
  average_wait_time INTEGER DEFAULT 0, -- Average wait time in minutes
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'closed', 'maintenance', 'high_load'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast geographic queries
CREATE INDEX IF NOT EXISTS idx_nampost_branches_region ON nampost_branches(region);
-- Note: GIST index requires postgis extension. Using B-tree index for coordinates instead.
-- If postgis is available, use: CREATE INDEX IF NOT EXISTS idx_nampost_branches_coordinates ON nampost_branches USING GIST (point(longitude, latitude));
CREATE INDEX IF NOT EXISTS idx_nampost_branches_latitude ON nampost_branches(latitude);
CREATE INDEX IF NOT EXISTS idx_nampost_branches_longitude ON nampost_branches(longitude);
CREATE INDEX IF NOT EXISTS idx_nampost_branches_status ON nampost_branches(status);
CREATE INDEX IF NOT EXISTS idx_nampost_branches_city ON nampost_branches(city);

-- ============================================================================
-- NAMPOST STAFF TABLE
-- ============================================================================

-- NamPost staff profiles (tellers, managers, tech support)
CREATE TABLE IF NOT EXISTS nampost_staff (
  staff_id VARCHAR(50) PRIMARY KEY,
  branch_id VARCHAR(50) NOT NULL REFERENCES nampost_branches(branch_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'teller', 'manager', 'tech_support'
  phone_number VARCHAR(20),
  email VARCHAR(255),
  specialization TEXT[], -- ['voucher_redemption', 'cash_out', 'onboarding', 'pin_reset']
  availability JSONB, -- {schedule: 'Monday-Friday 08:00-17:00', isAvailable: true, currentStatus: 'available'}
  performance_metrics JSONB, -- {transactionsProcessed: 1250, averageProcessingTime: 120, successRate: 98.5, customerSatisfaction: 4.8}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for staff queries
CREATE INDEX IF NOT EXISTS idx_nampost_staff_branch ON nampost_staff(branch_id);
CREATE INDEX IF NOT EXISTS idx_nampost_staff_role ON nampost_staff(role);
CREATE INDEX IF NOT EXISTS idx_nampost_staff_availability ON nampost_staff((availability->>'isAvailable'));

-- ============================================================================
-- NAMPOST BRANCH LOAD TABLE
-- ============================================================================

-- Real-time branch load tracking for concentration detection
CREATE TABLE IF NOT EXISTS nampost_branch_load (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id VARCHAR(50) NOT NULL REFERENCES nampost_branches(branch_id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  current_load INTEGER NOT NULL, -- Current transactions in progress
  wait_time INTEGER NOT NULL, -- Average wait time in minutes
  queue_length INTEGER DEFAULT 0, -- Number of beneficiaries in queue
  concentration_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for load queries
CREATE INDEX IF NOT EXISTS idx_nampost_branch_load_branch ON nampost_branch_load(branch_id);
CREATE INDEX IF NOT EXISTS idx_nampost_branch_load_timestamp ON nampost_branch_load(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_nampost_branch_load_concentration ON nampost_branch_load(concentration_level);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_nampost_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_nampost_branches_updated_at
  BEFORE UPDATE ON nampost_branches
  FOR EACH ROW
  EXECUTE FUNCTION update_nampost_updated_at();

CREATE TRIGGER trg_nampost_staff_updated_at
  BEFORE UPDATE ON nampost_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_nampost_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE nampost_branches IS 'NamPost branches with GPS coordinates (137-147 branches nationwide)';
COMMENT ON TABLE nampost_staff IS 'NamPost staff profiles (tellers, managers, tech support)';
COMMENT ON TABLE nampost_branch_load IS 'Real-time branch load tracking for concentration detection and recommendation engine';

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
  'migration_nampost_branches.sql',
  '1.0.0',
  'completed',
  '{"description": "NamPost branch management with GPS coordinates, staff profiles, and real-time load tracking", "tables": ["nampost_branches", "nampost_staff", "nampost_branch_load"]}'
)
ON CONFLICT (migration_name) DO NOTHING;
