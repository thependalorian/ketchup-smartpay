-- Migration History Tracking Table
-- Version: 0.0.1
-- Purpose: Track all applied database migrations
-- Created: 2025-01-17

-- ============================================================================
-- MIGRATION HISTORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS migration_history (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL UNIQUE,
  migration_version VARCHAR(50),
  checksum VARCHAR(64),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by VARCHAR(255) DEFAULT 'system',
  execution_time_ms INTEGER,
  status VARCHAR(20) DEFAULT 'completed',
  rollback_sql TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_migration_history_name ON migration_history(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_history_applied_at ON migration_history(applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_history_status ON migration_history(status);

-- Add table comment
COMMENT ON TABLE migration_history IS 'Tracks all applied database migrations for Buffr Payment Companion';
COMMENT ON COLUMN migration_history.migration_name IS 'Unique name of the migration file';
COMMENT ON COLUMN migration_history.migration_version IS 'Semantic version of the migration';
COMMENT ON COLUMN migration_history.checksum IS 'SHA-256 hash of migration content for change detection';
COMMENT ON COLUMN migration_history.applied_at IS 'Timestamp when migration was applied';
COMMENT ON COLUMN migration_history.applied_by IS 'User or system that applied the migration';
COMMENT ON COLUMN migration_history.execution_time_ms IS 'Time taken to execute the migration in milliseconds';
COMMENT ON COLUMN migration_history.status IS 'Status: pending, running, completed, failed, rolled_back';
COMMENT ON COLUMN migration_history.rollback_sql IS 'SQL to rollback this migration if needed';
COMMENT ON COLUMN migration_history.metadata IS 'Additional metadata about the migration';

-- ============================================================================
-- SEED EXISTING MIGRATIONS INTO HISTORY
-- ============================================================================

INSERT INTO migration_history (migration_name, migration_version, status, metadata)
VALUES
  ('schema.sql', '1.0.0', 'completed', '{"seeded": true, "description": "Base schema"}'),
  ('migration_add_fields.sql', '1.0.1', 'completed', '{"seeded": true}'),
  ('migrate-existing-schema.sql', '1.1.0', 'completed', '{"seeded": true}'),
  ('migration_auth.sql', '1.2.0', 'completed', '{"seeded": true}'),
  ('migration_gamification.sql', '1.3.0', 'completed', '{"seeded": true}'),
  ('migration_learning.sql', '1.4.0', 'completed', '{"seeded": true}'),
  ('migration_push_notifications.sql', '1.5.0', 'completed', '{"seeded": true}'),
  ('migration_exchange_rates.sql', '1.6.0', 'completed', '{"seeded": true}'),
  ('migration_vouchers.sql', '1.7.0', 'completed', '{"seeded": true}'),
  ('migration_audit_logs.sql', '1.8.0', 'completed', '{"seeded": true}'),
  ('migration_user_status.sql', '1.9.0', 'completed', '{"seeded": true}'),
  ('migration_dormant_wallets.sql', '1.10.0', 'completed', '{"seeded": true}'),
  ('migration_realtime_processing.sql', '1.11.0', 'completed', '{"seeded": true}'),
  ('migration_incident_reporting.sql', '1.12.0', 'completed', '{"seeded": true}'),
  ('migration_insurance_products.sql', '1.13.0', 'completed', '{"seeded": true}'),
  ('migration_tickets.sql', '1.14.0', 'completed', '{"seeded": true}'),
  ('migration_add_admin_role.sql', '1.15.0', 'completed', '{"seeded": true}')
ON CONFLICT (migration_name) DO NOTHING;
