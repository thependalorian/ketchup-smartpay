/**
 * Transaction Analytics Database Schema
 * 
 * Location: sql/migration_analytics.sql
 * Purpose: Create analytics tables for transaction data analysis and product development insights
 * 
 * Priority: 11 (Product Development)
 * Deadline: Q2 2026
 * 
 * These tables enable:
 * - Transaction volume and frequency analysis
 * - User behavior tracking
 * - Merchant analytics
 * - Geographic insights
 * - Payment method adoption
 * - Channel analytics (mobile app vs USSD)
 * - Product development recommendations
 */

-- ============================================================================
-- TRANSACTION ANALYTICS
-- ============================================================================

-- Transaction analytics (aggregated from transactions table)
CREATE TABLE IF NOT EXISTS transaction_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'p2p', 'merchant', 'bill_payment', 'bank_transfer', 'cash_out', etc.
  payment_method VARCHAR(50), -- 'qr_code', 'buffr_id', 'ussd', 'bank_transfer', 'wallet'
  merchant_category VARCHAR(100), -- If merchant payment
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_volume DECIMAL(15, 2) NOT NULL DEFAULT 0, -- Total amount
  average_transaction_amount DECIMAL(10, 2),
  median_transaction_amount DECIMAL(10, 2),
  min_transaction_amount DECIMAL(10, 2),
  max_transaction_amount DECIMAL(10, 2),
  unique_users INTEGER NOT NULL DEFAULT 0,
  unique_merchants INTEGER, -- If merchant payments
  hour_of_day INTEGER, -- 0-23 for hourly analysis (NULL for daily aggregates)
  day_of_week INTEGER, -- 0-6 for weekly patterns (NULL for daily aggregates)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(date, transaction_type, payment_method, merchant_category, hour_of_day)
);

-- Indexes for fast analytics queries
CREATE INDEX IF NOT EXISTS idx_transaction_analytics_date ON transaction_analytics(date);
CREATE INDEX IF NOT EXISTS idx_transaction_analytics_type ON transaction_analytics(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_analytics_payment_method ON transaction_analytics(payment_method);
CREATE INDEX IF NOT EXISTS idx_transaction_analytics_date_type ON transaction_analytics(date, transaction_type);

-- ============================================================================
-- USER BEHAVIOR ANALYTICS
-- ============================================================================

-- User behavior analytics
CREATE TABLE IF NOT EXISTS user_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  wallet_balance DECIMAL(10, 2),
  average_balance DECIMAL(10, 2), -- Average balance for the day
  transaction_count INTEGER NOT NULL DEFAULT 0,
  total_spent DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_received DECIMAL(10, 2) NOT NULL DEFAULT 0,
  preferred_payment_method VARCHAR(50), -- Most used payment method
  cash_out_count INTEGER DEFAULT 0,
  cash_out_amount DECIMAL(10, 2) DEFAULT 0,
  merchant_payment_count INTEGER DEFAULT 0,
  merchant_payment_amount DECIMAL(10, 2) DEFAULT 0,
  p2p_transfer_count INTEGER DEFAULT 0,
  p2p_transfer_amount DECIMAL(10, 2) DEFAULT 0,
  bill_payment_count INTEGER DEFAULT 0,
  bill_payment_amount DECIMAL(10, 2) DEFAULT 0,
  spending_velocity DECIMAL(10, 2), -- Days between voucher credit and first transaction
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_user_date ON user_behavior_analytics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_behavior_analytics_date ON user_behavior_analytics(date);

-- ============================================================================
-- MERCHANT ANALYTICS
-- ============================================================================

-- Merchant analytics (for merchant payments)
CREATE TABLE IF NOT EXISTS merchant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL, -- NULL if merchant not in system
  merchant_name VARCHAR(255), -- Store merchant name even if merchant_id is NULL
  date DATE NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  total_volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
  average_transaction_amount DECIMAL(10, 2),
  unique_customers INTEGER NOT NULL DEFAULT 0,
  payment_method_breakdown JSONB, -- {qr_code: count, buffr_id: count, ussd: count, etc.}
  peak_hours JSONB, -- {hour: transaction_count} for hourly analysis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(merchant_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_merchant_analytics_merchant_date ON merchant_analytics(merchant_id, date);
CREATE INDEX IF NOT EXISTS idx_merchant_analytics_date ON merchant_analytics(date);
CREATE INDEX IF NOT EXISTS idx_merchant_analytics_name ON merchant_analytics(merchant_name);

-- ============================================================================
-- GEOGRAPHIC ANALYTICS
-- ============================================================================

-- Geographic analytics (if location data available)
CREATE TABLE IF NOT EXISTS geographic_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(100), -- Region or city
  date DATE NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  total_volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  cash_out_ratio DECIMAL(5, 2), -- Percentage of transactions that are cash-outs
  digital_payment_ratio DECIMAL(5, 2), -- Percentage of digital payments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(region, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_geographic_analytics_region_date ON geographic_analytics(region, date);
CREATE INDEX IF NOT EXISTS idx_geographic_analytics_date ON geographic_analytics(date);

-- ============================================================================
-- PAYMENT METHOD ANALYTICS
-- ============================================================================

-- Payment method analytics
CREATE TABLE IF NOT EXISTS payment_method_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method VARCHAR(50) NOT NULL, -- 'qr_code', 'buffr_id', 'ussd', 'bank_transfer', 'wallet'
  date DATE NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  total_volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
  average_transaction_amount DECIMAL(10, 2),
  unique_users INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5, 2), -- Percentage of successful transactions
  average_processing_time_ms INTEGER, -- Average processing time in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(payment_method, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_method_analytics_method_date ON payment_method_analytics(payment_method, date);
CREATE INDEX IF NOT EXISTS idx_payment_method_analytics_date ON payment_method_analytics(date);

-- ============================================================================
-- CHANNEL ANALYTICS
-- ============================================================================

-- Channel analytics (mobile app vs USSD)
CREATE TABLE IF NOT EXISTS channel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(50) NOT NULL, -- 'mobile_app', 'ussd'
  date DATE NOT NULL,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  total_volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
  unique_users INTEGER NOT NULL DEFAULT 0,
  average_transaction_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(channel, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_channel_analytics_channel_date ON channel_analytics(channel, date);
CREATE INDEX IF NOT EXISTS idx_channel_analytics_date ON channel_analytics(date);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_transaction_analytics_updated_at
  BEFORE UPDATE ON transaction_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trg_user_behavior_analytics_updated_at
  BEFORE UPDATE ON user_behavior_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trg_merchant_analytics_updated_at
  BEFORE UPDATE ON merchant_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trg_geographic_analytics_updated_at
  BEFORE UPDATE ON geographic_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trg_payment_method_analytics_updated_at
  BEFORE UPDATE ON payment_method_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

CREATE TRIGGER trg_channel_analytics_updated_at
  BEFORE UPDATE ON channel_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_analytics_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE transaction_analytics IS 'Aggregated transaction analytics by type, payment method, and time';
COMMENT ON TABLE user_behavior_analytics IS 'Daily user behavior analytics including spending patterns and preferences';
COMMENT ON TABLE merchant_analytics IS 'Merchant transaction analytics for business intelligence';
COMMENT ON TABLE geographic_analytics IS 'Geographic transaction analytics for regional insights';
COMMENT ON TABLE payment_method_analytics IS 'Payment method adoption and performance analytics';
COMMENT ON TABLE channel_analytics IS 'Channel analytics (mobile app vs USSD) for user preference analysis';
