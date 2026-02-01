/**
 * Migration: Voucher Expiry Warnings System
 * 
 * Location: sql/migration_voucher_expiry_warnings.sql
 * Purpose: Track voucher expiry warnings to prevent beneficiary loss
 * 
 * Features:
 * - Track expiry warnings sent (7, 3, 1 day before expiry)
 * - Prevent duplicate warnings
 * - Analytics tracking for expiry warning effectiveness
 */

-- ============================================================================
-- VOUCHER EXPIRY WARNINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS voucher_expiry_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  warning_type VARCHAR(50) NOT NULL, -- '7_days', '3_days', '1_day', 'expiry_day'
  days_until_expiry INTEGER NOT NULL, -- Days remaining until expiry
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  channel VARCHAR(50) NOT NULL, -- 'sms', 'push', 'ussd', 'email'
  status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'failed', 'delivered'
  error_message TEXT,
  redeemed_after_warning BOOLEAN DEFAULT FALSE, -- Whether voucher was redeemed after this warning
  redeemed_at TIMESTAMP WITH TIME ZONE, -- When redeemed (if redeemed after warning)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_voucher_expiry_warnings_voucher_id ON voucher_expiry_warnings(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_expiry_warnings_user_id ON voucher_expiry_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_expiry_warnings_warning_type ON voucher_expiry_warnings(warning_type);
CREATE INDEX IF NOT EXISTS idx_voucher_expiry_warnings_sent_at ON voucher_expiry_warnings(sent_at);
CREATE INDEX IF NOT EXISTS idx_voucher_expiry_warnings_status ON voucher_expiry_warnings(status);

-- Unique constraint: One warning per type per voucher
CREATE UNIQUE INDEX IF NOT EXISTS idx_voucher_expiry_warnings_unique 
  ON voucher_expiry_warnings(voucher_id, warning_type);

-- ============================================================================
-- VOUCHER EXPIRY ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS voucher_expiry_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_vouchers_expiring INTEGER DEFAULT 0,
  warnings_sent_7_days INTEGER DEFAULT 0,
  warnings_sent_3_days INTEGER DEFAULT 0,
  warnings_sent_1_day INTEGER DEFAULT 0,
  warnings_sent_expiry_day INTEGER DEFAULT 0,
  vouchers_redeemed_after_warning INTEGER DEFAULT 0,
  vouchers_expired INTEGER DEFAULT 0,
  expired_voucher_rate DECIMAL(5,2) DEFAULT 0, -- Percentage of vouchers that expired
  redemption_rate_after_warning DECIMAL(5,2) DEFAULT 0, -- Percentage redeemed after warning
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_voucher_expiry_analytics_date ON voucher_expiry_analytics(date);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE voucher_expiry_warnings IS 'Tracks expiry warnings sent to beneficiaries to prevent voucher loss';
COMMENT ON COLUMN voucher_expiry_warnings.warning_type IS 'Type of warning: 7_days, 3_days, 1_day, expiry_day';
COMMENT ON COLUMN voucher_expiry_warnings.redeemed_after_warning IS 'Whether voucher was redeemed after this warning was sent';
COMMENT ON TABLE voucher_expiry_analytics IS 'Daily analytics on voucher expiry warnings and redemption rates';
