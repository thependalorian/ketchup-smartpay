/**
 * Status Events Table Migration
 * 
 * Purpose: Track voucher status change history for monitoring and auditing
 * Location: backend/src/database/migrations/003_status_events.sql
 */

-- Status events table
CREATE TABLE IF NOT EXISTS status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id VARCHAR(100) NOT NULL,
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  triggered_by VARCHAR(50) NOT NULL DEFAULT 'system', -- 'system', 'webhook', 'manual'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_status_events_voucher_id ON status_events(voucher_id);
CREATE INDEX IF NOT EXISTS idx_status_events_to_status ON status_events(to_status);
CREATE INDEX IF NOT EXISTS idx_status_events_created_at ON status_events(created_at);

-- Comments
COMMENT ON TABLE status_events IS 'Tracks voucher status change history';
COMMENT ON COLUMN status_events.triggered_by IS 'What triggered the status change: system, webhook, manual';
