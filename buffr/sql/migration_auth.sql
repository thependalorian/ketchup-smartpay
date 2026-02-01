-- Authentication Tables Migration
-- Run this migration to add authentication support to the Buffr database

-- OTP Codes Table - stores temporary OTP codes for phone verification
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);

-- Sessions Table - stores user authentication sessions
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token VARCHAR(100) NOT NULL UNIQUE,
    refresh_token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info JSONB DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_codes 
    WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions 
    WHERE refresh_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Add is_verified column to users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_two_factor_enabled column to users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_two_factor_enabled'
    ) THEN
        ALTER TABLE users ADD COLUMN is_two_factor_enabled BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add buffr_id column to users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'buffr_id'
    ) THEN
        ALTER TABLE users ADD COLUMN buffr_id VARCHAR(50) UNIQUE;
    END IF;
END $$;

-- Create unique index on buffr_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_buffr_id ON users(buffr_id);

-- Add last_login_at column to users if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Trigger to update last_active_at on session access
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_session_activity ON sessions;
CREATE TRIGGER trg_session_activity
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- View for active sessions summary
CREATE OR REPLACE VIEW v_active_sessions AS
SELECT 
    s.id,
    s.user_id,
    u.phone_number,
    u.buffr_id,
    s.device_info,
    s.ip_address,
    s.created_at,
    s.last_active_at,
    s.expires_at,
    CASE 
        WHEN s.expires_at > NOW() THEN 'active'
        ELSE 'expired'
    END as status
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.refresh_expires_at > NOW();

-- Grant permissions (adjust role names as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON otp_codes TO buffr_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO buffr_app;
-- GRANT USAGE, SELECT ON SEQUENCE otp_codes_id_seq TO buffr_app;

COMMENT ON TABLE otp_codes IS 'Temporary OTP codes for phone number verification';
COMMENT ON TABLE sessions IS 'User authentication sessions with access and refresh tokens';
COMMENT ON VIEW v_active_sessions IS 'Active user sessions with user details';
