/**
 * USSD Sessions Database Migration
 * 
 * Location: sql/migration_ussd_sessions.sql
 * Purpose: Store USSD sessions in database (alternative to Redis)
 * 
 * Note: In production, Redis is recommended for session storage.
 * This table provides a database-backed alternative if Redis is not available.
 */

-- ============================================================================
-- USSD SESSIONS TABLE
-- ============================================================================

-- Store USSD session state in database
CREATE TABLE IF NOT EXISTS ussd_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) NOT NULL UNIQUE, -- USSD session ID from gateway
  phone_number VARCHAR(20) NOT NULL,
  menu_state VARCHAR(50) NOT NULL DEFAULT 'main', -- Current menu state
  data JSONB NOT NULL DEFAULT '{}', -- Stored data for multi-step flows
  pin_verified BOOLEAN NOT NULL DEFAULT false,
  attempts INTEGER NOT NULL DEFAULT 0, -- PIN attempt counter
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Session expiry (5 minutes from last activity)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_session_id ON ussd_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_phone_number ON ussd_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_ussd_sessions_expires_at ON ussd_sessions(expires_at);

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_ussd_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ussd_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ussd_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trg_ussd_sessions_updated_at
  BEFORE UPDATE ON ussd_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_ussd_sessions_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ussd_sessions IS 'USSD session storage (alternative to Redis for session management)';
COMMENT ON FUNCTION cleanup_expired_ussd_sessions IS 'Clean up expired USSD sessions (call periodically)';
