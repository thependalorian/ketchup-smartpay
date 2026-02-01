/**
 * Bills and Merchants Database Migration
 * 
 * Location: sql/migration_bills_and_merchants.sql
 * Purpose: Create tables for bill payments and merchant network with cashback
 * 
 * Compliance: PSD-12, Open Banking v1
 * Integration: IPP (Instant Payment Platform) for cashback processing
 * 
 * Features:
 * - Bill payment management
 * - Scheduled bill payments
 * - Merchant network with cashback rates
 * - Cashback transaction tracking
 */

-- ============================================================================
-- MERCHANTS TABLE
-- ============================================================================

-- Merchants participating in cashback program
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'supermarket', 'retail', 'restaurant', etc.
  location VARCHAR(255) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8), -- For geographic queries
  longitude DECIMAL(11, 8), -- For geographic queries
  cashback_rate DECIMAL(5, 2) NOT NULL DEFAULT 2.0, -- Percentage (e.g., 2.0 for 2%)
  is_active BOOLEAN DEFAULT TRUE,
  is_open BOOLEAN DEFAULT TRUE, -- Current availability status
  phone VARCHAR(20),
  email VARCHAR(255),
  opening_hours TEXT, -- e.g., "Mon-Fri: 8am-6pm"
  qr_code VARCHAR(255) UNIQUE, -- Merchant QR code for payments
  owner_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL, -- Merchant owner (if registered)
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL, -- Merchant wallet for cashback funding
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category);
CREATE INDEX IF NOT EXISTS idx_merchants_location ON merchants(location);
CREATE INDEX IF NOT EXISTS idx_merchants_is_active ON merchants(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_merchants_is_open ON merchants(is_open) WHERE is_open = TRUE;
CREATE INDEX IF NOT EXISTS idx_merchants_qr_code ON merchants(qr_code) WHERE qr_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_merchants_coordinates ON merchants(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_merchants_owner_id ON merchants(owner_id) WHERE owner_id IS NOT NULL;

-- ============================================================================
-- BILLS TABLE
-- ============================================================================

-- User bills (utilities, services, etc.)
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Bill name (e.g., "Electricity Bill")
  provider VARCHAR(255) NOT NULL, -- Service provider (e.g., "NamPower")
  account_number VARCHAR(100) NOT NULL, -- User's account number with provider
  category VARCHAR(50) NOT NULL, -- 'utilities', 'water', 'internet', 'tv', 'insurance', 'other'
  amount DECIMAL(15, 2) NOT NULL,
  minimum_amount DECIMAL(15, 2), -- Minimum payment required
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(15, 2), -- Amount actually paid (can be partial)
  payment_reference VARCHAR(255), -- Transaction reference
  metadata JSONB, -- Additional bill data (provider-specific)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_category ON bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_provider ON bills(provider);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_is_paid ON bills(is_paid) WHERE is_paid = FALSE;
CREATE INDEX IF NOT EXISTS idx_bills_user_category ON bills(user_id, category);

-- ============================================================================
-- SCHEDULED BILLS TABLE
-- ============================================================================

-- Scheduled/recurring bill payments
CREATE TABLE IF NOT EXISTS scheduled_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES bills(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL, -- Wallet to pay from
  schedule_type VARCHAR(50) NOT NULL, -- 'monthly', 'weekly', 'custom'
  amount DECIMAL(15, 2) NOT NULL, -- Amount to pay each time
  is_active BOOLEAN DEFAULT TRUE,
  next_payment_date DATE NOT NULL,
  last_payment_date DATE,
  payment_count INTEGER DEFAULT 0, -- Number of times paid
  metadata JSONB, -- Schedule configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_scheduled_bills_user_id ON scheduled_bills(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_bills_bill_id ON scheduled_bills(bill_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_bills_is_active ON scheduled_bills(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_scheduled_bills_next_payment ON scheduled_bills(next_payment_date) WHERE is_active = TRUE;

-- ============================================================================
-- BILL PAYMENTS TABLE
-- ============================================================================

-- Bill payment transactions
CREATE TABLE IF NOT EXISTS bill_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  payment_reference VARCHAR(255),
  receipt_url TEXT, -- Receipt/document URL
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill_id ON bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_user_id ON bill_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_transaction_id ON bill_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_payment_date ON bill_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_bill_payments_status ON bill_payments(status);

-- ============================================================================
-- CASHBACK TRANSACTIONS TABLE
-- ============================================================================

-- Cashback earned from merchant payments
CREATE TABLE IF NOT EXISTS cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  payment_amount DECIMAL(15, 2) NOT NULL, -- Original payment amount
  cashback_amount DECIMAL(15, 2) NOT NULL, -- Cashback earned
  cashback_rate DECIMAL(5, 2) NOT NULL, -- Rate used (percentage)
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  credited_at TIMESTAMP WITH TIME ZONE, -- When cashback was credited
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL, -- Wallet cashback was credited to
  metadata JSONB, -- Additional data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_user_id ON cashback_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_merchant_id ON cashback_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_transaction_id ON cashback_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_created_at ON cashback_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashback_transactions_status ON cashback_transactions(status);

-- ============================================================================
-- MERCHANT PAYMENTS TABLE
-- ============================================================================

-- Payments made at merchants (with cashback tracking)
CREATE TABLE IF NOT EXISTS merchant_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  amount DECIMAL(15, 2) NOT NULL,
  cashback_amount DECIMAL(15, 2) DEFAULT 0, -- Cashback earned
  cashback_rate DECIMAL(5, 2), -- Rate used
  payment_method VARCHAR(50) DEFAULT 'qr_code', -- 'qr_code', 'manual'
  qr_code VARCHAR(255), -- QR code used (if applicable)
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_merchant_payments_user_id ON merchant_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_merchant_id ON merchant_payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_transaction_id ON merchant_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_payment_date ON merchant_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_payments_status ON merchant_payments(status);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bills_merchants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS trg_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_bills_merchants_updated_at();

CREATE TRIGGER IF NOT EXISTS trg_bills_updated_at
  BEFORE UPDATE ON bills
  FOR EACH ROW
  EXECUTE FUNCTION update_bills_merchants_updated_at();

CREATE TRIGGER IF NOT EXISTS trg_scheduled_bills_updated_at
  BEFORE UPDATE ON scheduled_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_bills_merchants_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE merchants IS 'Merchants participating in cashback program (merchant-funded cashback)';
COMMENT ON TABLE bills IS 'User bills for utilities, services, etc.';
COMMENT ON TABLE scheduled_bills IS 'Scheduled/recurring bill payments';
COMMENT ON TABLE bill_payments IS 'Bill payment transaction records';
COMMENT ON TABLE cashback_transactions IS 'Cashback earned from merchant payments (merchant-funded)';
COMMENT ON TABLE merchant_payments IS 'Payments made at merchants with cashback tracking';
