-- Buffr Database Schema
-- Location: sql/schema.sql
-- Purpose: PostgreSQL schema for Buffr React Native app
-- Database: Neon PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE (Basic - extend as needed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  full_name VARCHAR(255),
  avatar TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_two_factor_enabled BOOLEAN DEFAULT FALSE,
  currency VARCHAR(10) DEFAULT 'N$',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- WALLETS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  type VARCHAR(50) DEFAULT 'personal',
  balance DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'N$',
  purpose TEXT,
  card_design INTEGER DEFAULT 2,
  card_number VARCHAR(4),
  cardholder_name VARCHAR(255),
  expiry_date VARCHAR(5),
  
  -- AutoPay Settings
  auto_pay_enabled BOOLEAN DEFAULT FALSE,
  auto_pay_max_amount DECIMAL(15, 2),
  auto_pay_settings JSONB,
  auto_pay_frequency VARCHAR(20),
  auto_pay_deduct_date VARCHAR(50),
  auto_pay_deduct_time VARCHAR(20),
  auto_pay_amount DECIMAL(15, 2),
  auto_pay_repayments INTEGER,
  auto_pay_payment_method VARCHAR(255),
  
  -- Security Settings
  pin_protected BOOLEAN DEFAULT FALSE,
  biometric_enabled BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_auto_pay_enabled ON wallets(auto_pay_enabled) WHERE auto_pay_enabled = TRUE;

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- 'sent', 'received', 'payment', 'transfer_in', 'transfer_out'
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'N$',
  description TEXT,
  category VARCHAR(100),
  recipient_id VARCHAR(255),
  recipient_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- ============================================================================
-- AUTOPAY RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS autopay_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL, -- 'recurring', 'scheduled', 'minimum_balance'
  amount DECIMAL(15, 2) NOT NULL,
  frequency VARCHAR(20), -- 'weekly', 'bi-weekly', 'monthly'
  recipient_id VARCHAR(255),
  recipient_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  next_execution_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for autopay_rules
CREATE INDEX IF NOT EXISTS idx_autopay_rules_wallet_id ON autopay_rules(wallet_id);
CREATE INDEX IF NOT EXISTS idx_autopay_rules_user_id ON autopay_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_autopay_rules_next_execution ON autopay_rules(next_execution_date) WHERE is_active = TRUE;

-- ============================================================================
-- AUTOPAY TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS autopay_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES autopay_rules(id) ON DELETE SET NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'pending'
  executed_at TIMESTAMP DEFAULT NOW(),
  failure_reason TEXT,
  recipient_id VARCHAR(255),
  recipient_name VARCHAR(255),
  rule_description TEXT,
  authorisation_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for autopay_transactions
CREATE INDEX IF NOT EXISTS idx_autopay_transactions_wallet_id ON autopay_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_autopay_transactions_rule_id ON autopay_transactions(rule_id);
CREATE INDEX IF NOT EXISTS idx_autopay_transactions_user_id ON autopay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_autopay_transactions_executed_at ON autopay_transactions(executed_at DESC);

-- ============================================================================
-- CONTACTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, phone)
);

-- Indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_is_favorite ON contacts(is_favorite) WHERE is_favorite = TRUE;

-- ============================================================================
-- GROUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2),
  current_amount DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'N$',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for groups
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON groups(owner_id);

-- ============================================================================
-- GROUP MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  contribution DECIMAL(15, 2) DEFAULT 0.00,
  is_owner BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Indexes for group_members
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- ============================================================================
-- MONEY REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS money_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id VARCHAR(255) NOT NULL,
  to_user_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  paid_amount DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'N$',
  note TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'declined', 'expired'
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for money_requests
CREATE INDEX IF NOT EXISTS idx_money_requests_from_user_id ON money_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_to_user_id ON money_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_money_requests_status ON money_requests(status);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'transaction', 'request', 'payment', 'system'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- Related transaction, request, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_autopay_rules_updated_at BEFORE UPDATE ON autopay_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_money_requests_updated_at BEFORE UPDATE ON money_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
