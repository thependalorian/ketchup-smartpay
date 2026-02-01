-- Dormant Wallet Management Migration
-- Location: sql/migration_dormant_wallets.sql
-- Purpose: Add dormancy tracking to wallets per PSD-3 §11.4
-- 
-- === BANK OF NAMIBIA PSD-3 REQUIREMENTS ===
-- 
-- §11.4.1: Wallet dormant after 6 months no transactions
-- §11.4.2: Customer notified 1 month before 6-month period
-- §11.4.3: No fees charged on dormant wallets
-- §11.4.4: Dormant funds not intermediated or treated as income
-- §11.4.5: Funds handling: return to customer, estate, sender, or hold for 3 years
-- §11.4.6: Monthly reporting of dormant/terminated wallets

-- ============================================================================
-- ADD DORMANCY COLUMNS TO WALLETS TABLE
-- ============================================================================

ALTER TABLE wallets
ADD COLUMN IF NOT EXISTS last_transaction_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS dormancy_status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS dormancy_warning_sent_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS dormancy_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS dormancy_scheduled_release_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS dormancy_notes TEXT;

-- Add check constraint for dormancy_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_dormancy_status'
  ) THEN
    ALTER TABLE wallets
    ADD CONSTRAINT chk_dormancy_status
    CHECK (dormancy_status IN ('active', 'warning', 'dormant', 'closed', 'funds_released'));
  END IF;
END $$;

-- Update existing wallets: set last_transaction_at from latest transaction
UPDATE wallets w
SET last_transaction_at = (
  SELECT MAX(t.date)
  FROM transactions t
  WHERE t.wallet_id = w.id
)
WHERE last_transaction_at IS NULL;

-- Set created_at as last_transaction_at for wallets with no transactions
UPDATE wallets
SET last_transaction_at = created_at
WHERE last_transaction_at IS NULL;

-- ============================================================================
-- CREATE DORMANCY EVENTS LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_dormancy_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'warning_sent', 'marked_dormant', 'reactivated', 'funds_returned', 'closed'
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  balance_at_event DECIMAL(15, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for dormancy events
CREATE INDEX IF NOT EXISTS idx_dormancy_events_wallet_id ON wallet_dormancy_events(wallet_id);
CREATE INDEX IF NOT EXISTS idx_dormancy_events_user_id ON wallet_dormancy_events(user_id);
CREATE INDEX IF NOT EXISTS idx_dormancy_events_type ON wallet_dormancy_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dormancy_events_created_at ON wallet_dormancy_events(created_at DESC);

-- ============================================================================
-- CREATE DORMANCY REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS wallet_dormancy_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_month DATE NOT NULL, -- First day of report month
  report_type VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual'
  
  -- Counts
  total_wallets INTEGER,
  active_wallets INTEGER,
  warning_wallets INTEGER,
  dormant_wallets INTEGER,
  closed_wallets INTEGER,
  
  -- Amounts
  total_dormant_balance DECIMAL(15, 2),
  funds_released_this_period DECIMAL(15, 2),
  new_dormant_wallets INTEGER,
  reactivated_wallets INTEGER,
  
  -- Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by VARCHAR(255),
  report_data JSONB, -- Full report data for archival
  
  UNIQUE(report_month, report_type)
);

-- Indexes for dormancy reports
CREATE INDEX IF NOT EXISTS idx_dormancy_reports_month ON wallet_dormancy_reports(report_month DESC);
CREATE INDEX IF NOT EXISTS idx_dormancy_reports_type ON wallet_dormancy_reports(report_type);

-- ============================================================================
-- INDEXES FOR DORMANCY QUERIES
-- ============================================================================

-- Index for finding wallets needing warning (5 months without activity)
CREATE INDEX IF NOT EXISTS idx_wallets_dormancy_warning
ON wallets(last_transaction_at)
WHERE dormancy_status = 'active'
  AND dormancy_warning_sent_at IS NULL;

-- Index for finding dormant wallets (6+ months)
CREATE INDEX IF NOT EXISTS idx_wallets_dormant
ON wallets(dormancy_status, last_transaction_at)
WHERE dormancy_status IN ('warning', 'dormant');

-- Index for finding wallets with balance (for dormancy processing)
CREATE INDEX IF NOT EXISTS idx_wallets_with_balance
ON wallets(balance)
WHERE balance > 0;

-- ============================================================================
-- FUNCTION: UPDATE LAST TRANSACTION DATE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wallet_last_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Update wallet last_transaction_at and reactivate if dormant
  UPDATE wallets
  SET 
    last_transaction_at = NOW(),
    dormancy_status = CASE
      WHEN dormancy_status IN ('warning', 'dormant') THEN 'active'
      ELSE dormancy_status
    END,
    dormancy_warning_sent_at = CASE
      WHEN dormancy_status IN ('warning', 'dormant') THEN NULL
      ELSE dormancy_warning_sent_at
    END,
    dormancy_started_at = CASE
      WHEN dormancy_status IN ('warning', 'dormant') THEN NULL
      ELSE dormancy_started_at
    END,
    updated_at = NOW()
  WHERE id = NEW.wallet_id;
  
  -- Log reactivation if wallet was dormant
  IF (SELECT dormancy_status FROM wallets WHERE id = NEW.wallet_id) = 'active' THEN
    INSERT INTO wallet_dormancy_events (wallet_id, user_id, event_type, previous_status, new_status, notes)
    SELECT 
      NEW.wallet_id,
      w.user_id,
      'reactivated',
      'dormant',
      'active',
      'Wallet reactivated due to transaction activity'
    FROM wallets w
    WHERE w.id = NEW.wallet_id
      AND EXISTS (
        SELECT 1 FROM wallet_dormancy_events
        WHERE wallet_id = NEW.wallet_id
          AND event_type = 'marked_dormant'
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transactions
DROP TRIGGER IF EXISTS trg_update_wallet_last_transaction ON transactions;
CREATE TRIGGER trg_update_wallet_last_transaction
AFTER INSERT ON transactions
FOR EACH ROW
WHEN (NEW.wallet_id IS NOT NULL)
EXECUTE FUNCTION update_wallet_last_transaction();

-- ============================================================================
-- VIEW: DORMANT WALLET SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW v_dormant_wallet_summary AS
SELECT
  w.id AS wallet_id,
  w.user_id,
  w.name AS wallet_name,
  w.balance,
  w.currency,
  w.dormancy_status,
  w.last_transaction_at,
  w.dormancy_warning_sent_at,
  w.dormancy_started_at,
  w.created_at,
  u.email AS user_email,
  u.phone_number AS user_phone,
  u.full_name AS user_name,
  -- Calculate days since last transaction
  EXTRACT(DAY FROM NOW() - w.last_transaction_at) AS days_inactive,
  -- Calculate months since last transaction
  EXTRACT(MONTH FROM AGE(NOW(), w.last_transaction_at)) AS months_inactive,
  -- Calculate days until dormancy (if not already dormant)
  CASE
    WHEN w.dormancy_status = 'active' THEN
      183 - EXTRACT(DAY FROM NOW() - w.last_transaction_at)
    ELSE NULL
  END AS days_until_dormant,
  -- Calculate if needs warning (5+ months but less than 6)
  CASE
    WHEN w.dormancy_status = 'active'
      AND w.dormancy_warning_sent_at IS NULL
      AND EXTRACT(DAY FROM NOW() - w.last_transaction_at) >= 152 -- ~5 months
      AND EXTRACT(DAY FROM NOW() - w.last_transaction_at) < 183 -- ~6 months
    THEN TRUE
    ELSE FALSE
  END AS needs_warning
FROM wallets w
LEFT JOIN users u ON w.user_id = u.id
WHERE w.balance > 0 OR w.dormancy_status != 'active';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN wallets.dormancy_status IS 'PSD-3 §11.4 dormancy status: active, warning, dormant, closed, funds_released';
COMMENT ON COLUMN wallets.last_transaction_at IS 'Last transaction date for dormancy calculation (PSD-3 §11.4.1)';
COMMENT ON COLUMN wallets.dormancy_warning_sent_at IS 'Date when 5-month warning was sent (PSD-3 §11.4.2)';
COMMENT ON COLUMN wallets.dormancy_started_at IS 'Date when wallet became dormant (6 months inactive)';
COMMENT ON COLUMN wallets.dormancy_scheduled_release_at IS 'Date when funds can be released after 3-year hold (PSD-3 §11.4.5)';
COMMENT ON TABLE wallet_dormancy_events IS 'Audit log for all dormancy-related wallet events';
COMMENT ON TABLE wallet_dormancy_reports IS 'Monthly reports for Bank of Namibia (PSD-3 §11.4.6)';
