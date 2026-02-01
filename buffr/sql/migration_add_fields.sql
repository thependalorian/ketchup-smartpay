-- Migration: Add missing fields to existing tables
-- Run this after initial schema.sql if tables already exist

-- Add last_login_at to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Add paid_amount and paid_at to money_requests table
ALTER TABLE money_requests ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE money_requests ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;

-- Update money_requests status constraint to include 'partial'
-- Note: This is just a comment - PostgreSQL doesn't enforce ENUM constraints on VARCHAR
-- The application code handles the status validation
