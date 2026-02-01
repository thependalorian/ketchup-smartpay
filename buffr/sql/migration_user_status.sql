-- Migration: Add Status Column to Users Table
-- Location: sql/migration_user_status.sql
-- Purpose: Enable user suspension, locking, and status tracking for Admin Portal
-- Date: 2025-12-19

-- Add status column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
END $$;

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add comment
COMMENT ON COLUMN users.status IS 'User account status: active, suspended, locked, pending_verification';

-- Update existing users to active if they were null
UPDATE users SET status = 'active' WHERE status IS NULL;