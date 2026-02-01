-- Migration: Add Admin Role Support
-- Location: sql/migration_add_admin_role.sql
-- Purpose: Add role-based access control for admin portal and compliance endpoints
-- Date: 2025-12-18
-- Updated: 2025-12-18 - Added granular admin roles for RBAC system

-- Add role column to users table (if not exists)
-- Supports both 'role' VARCHAR and 'is_admin' BOOLEAN for flexibility
-- Admin roles: 'support', 'compliance', 'super-admin', 'admin', 'administrator'
-- Regular users: 'user' (default)
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    COMMENT ON COLUMN users.role IS 'User role: user (default), support, compliance, super-admin, admin, administrator';
  END IF;

  -- Add is_admin column if it doesn't exist (for backward compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN users.is_admin IS 'Legacy admin flag (use role column instead)';
  END IF;

  -- Add permissions column for granular permission control (JSONB for flexibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'permissions'
  ) THEN
    ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN users.permissions IS 'Granular permissions for admin roles (JSONB object)';
  END IF;

  -- Add MFA enabled flag for admin portal
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'mfa_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN users.mfa_enabled IS 'Multi-factor authentication enabled (required for admin portal)';
  END IF;

  -- Add MFA secret for TOTP (Time-based One-Time Password)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'mfa_secret'
  ) THEN
    ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);
    COMMENT ON COLUMN users.mfa_secret IS 'MFA secret key for TOTP (encrypted in production)';
  END IF;

  -- Create index for role lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_role'
  ) THEN
    CREATE INDEX idx_users_role ON users(role);
  END IF;

  -- Create index for is_admin lookups
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_is_admin'
  ) THEN
    CREATE INDEX idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
  END IF;

  -- Create index for admin roles (support, compliance, super-admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_admin_roles'
  ) THEN
    CREATE INDEX idx_users_admin_roles ON users(role) 
    WHERE role IN ('support', 'compliance', 'super-admin', 'admin', 'administrator');
  END IF;

  -- Create index for MFA enabled users
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_users_mfa_enabled'
  ) THEN
    CREATE INDEX idx_users_mfa_enabled ON users(mfa_enabled) WHERE mfa_enabled = TRUE;
  END IF;
END $$;

-- Update existing users to have 'user' role if NULL
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Set is_admin based on role for backward compatibility
-- All admin roles (support, compliance, super-admin, admin, administrator) are considered admins
UPDATE users SET is_admin = TRUE 
WHERE role IN ('support', 'compliance', 'super-admin', 'admin', 'administrator');

-- Create admin_roles enum type for validation (optional, for better data integrity)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'user',
      'support',
      'compliance',
      'super-admin',
      'admin',
      'administrator'
    );
  END IF;
END $$;

-- Add constraint to ensure role values are valid (optional, can be added later if needed)
-- ALTER TABLE users ADD CONSTRAINT check_valid_role 
-- CHECK (role IN ('user', 'support', 'compliance', 'super-admin', 'admin', 'administrator'));

