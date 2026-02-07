-- Initial Database Schema for Ketchup SmartPay
-- Migration: 001_initial_schema.sql

-- Beneficiaries Table
CREATE TABLE IF NOT EXISTS beneficiaries (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  region VARCHAR(50) NOT NULL,
  grant_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_payment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vouchers Table
CREATE TABLE IF NOT EXISTS vouchers (
  id VARCHAR(100) PRIMARY KEY,
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  beneficiary_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  grant_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'issued',
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redemption_method VARCHAR(50),
  region VARCHAR(50) NOT NULL,
  voucher_code VARCHAR(50) UNIQUE,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_beneficiaries_region ON beneficiaries(region);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(status);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_grant_type ON beneficiaries(grant_type);
CREATE INDEX IF NOT EXISTS idx_vouchers_beneficiary_id ON vouchers(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_region ON vouchers(region);
CREATE INDEX IF NOT EXISTS idx_vouchers_expiry_date ON vouchers(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_code ON vouchers(voucher_code);

-- Status Events Table (NOTE: This table is now created by run.ts with extended schema)
-- Original schema kept for reference only - do not run this migration standalone
-- CREATE TABLE IF NOT EXISTS status_events (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   voucher_id VARCHAR(100) NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
--   status VARCHAR(50) NOT NULL,
--   metadata JSONB,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

CREATE INDEX IF NOT EXISTS idx_status_events_voucher_id ON status_events(voucher_id);
CREATE INDEX IF NOT EXISTS idx_status_events_created_at ON status_events(created_at);
