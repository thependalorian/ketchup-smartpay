-- =============================================================================
-- Cashback System Migration
-- =============================================================================
-- Purpose: Implement complete cashback system for Buffr
-- Author: AI Implementation System
-- Date: January 28, 2026
-- Status: Production Ready
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 1. CASHBACK CONFIGURATION TABLE
-- =============================================================================
-- Stores cashback rates by merchant and category

CREATE TABLE IF NOT EXISTS cashback_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_type VARCHAR(20) NOT NULL CHECK (config_type IN ('merchant', 'category', 'global')),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    category_code VARCHAR(50),
    cashback_percentage DECIMAL(5,2) NOT NULL CHECK (cashback_percentage >= 0 AND cashback_percentage <= 100),
    cashback_cap_per_transaction DECIMAL(12,2),
    cashback_cap_per_day DECIMAL(12,2),
    cashback_cap_per_month DECIMAL(12,2),
    min_transaction_amount DECIMAL(12,2) DEFAULT 0,
    max_transaction_amount DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    valid_from TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    
    -- Constraints
    CONSTRAINT chk_valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from),
    CONSTRAINT chk_merchant_or_category CHECK (
        (config_type = 'merchant' AND merchant_id IS NOT NULL AND category_code IS NULL) OR
        (config_type = 'category' AND category_code IS NOT NULL AND merchant_id IS NULL) OR
        (config_type = 'global' AND merchant_id IS NULL AND category_code IS NULL)
    )
);

-- Indexes for cashback_config
CREATE INDEX IF NOT EXISTS idx_cashback_config_merchant ON cashback_config(merchant_id) WHERE merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cashback_config_category ON cashback_config(category_code) WHERE category_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cashback_config_active ON cashback_config(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cashback_config_type ON cashback_config(config_type);

COMMENT ON TABLE cashback_config IS 'Cashback rate configuration by merchant, category, or global';
COMMENT ON COLUMN cashback_config.config_type IS 'Type of configuration: merchant, category, or global';
COMMENT ON COLUMN cashback_config.cashback_percentage IS 'Percentage of transaction amount to return as cashback (0-100)';
COMMENT ON COLUMN cashback_config.cashback_cap_per_transaction IS 'Maximum cashback amount per transaction';

-- =============================================================================
-- 2. CASHBACK TRANSACTIONS TABLE
-- =============================================================================
-- Stores individual cashback events

CREATE TABLE IF NOT EXISTS cashback_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    config_id UUID REFERENCES cashback_config(id) ON DELETE SET NULL,
    
    -- Transaction details
    transaction_amount DECIMAL(12,2) NOT NULL,
    cashback_percentage DECIMAL(5,2) NOT NULL,
    cashback_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NAD',
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'expired', 'cancelled')),
    status_reason TEXT,
    
    -- Timing
    earned_at TIMESTAMP DEFAULT NOW(),
    credited_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_positive_amounts CHECK (transaction_amount > 0 AND cashback_amount > 0),
    CONSTRAINT chk_percentage_range CHECK (cashback_percentage >= 0 AND cashback_percentage <= 100),
    CONSTRAINT chk_cashback_not_exceed_transaction CHECK (cashback_amount <= transaction_amount)
);

-- Indexes for cashback_transactions
CREATE INDEX IF NOT EXISTS idx_cashback_tx_user ON cashback_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_tx_transaction ON cashback_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_cashback_tx_merchant ON cashback_transactions(merchant_id) WHERE merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cashback_tx_status ON cashback_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cashback_tx_earned ON cashback_transactions(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashback_tx_expires ON cashback_transactions(expires_at) WHERE status = 'pending';

COMMENT ON TABLE cashback_transactions IS 'Individual cashback transactions earned by users';
COMMENT ON COLUMN cashback_transactions.status IS 'pending: not yet credited, credited: added to balance, expired: past expiry date, cancelled: transaction reversed';

-- =============================================================================
-- 3. CASHBACK BALANCES TABLE
-- =============================================================================
-- Tracks user cashback balances

CREATE TABLE IF NOT EXISTS cashback_balances (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- Balance amounts
    total_earned DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    available_balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    pending_balance DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    redeemed_amount DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    expired_amount DECIMAL(12,2) DEFAULT 0.00 NOT NULL,
    
    currency VARCHAR(10) DEFAULT 'NAD',
    
    -- Tracking
    last_earned_at TIMESTAMP,
    last_redeemed_at TIMESTAMP,
    total_transactions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_balances_non_negative CHECK (
        total_earned >= 0 AND 
        available_balance >= 0 AND 
        pending_balance >= 0 AND
        redeemed_amount >= 0 AND
        expired_amount >= 0
    ),
    CONSTRAINT chk_balance_consistency CHECK (
        total_earned >= (available_balance + redeemed_amount + expired_amount)
    )
);

-- Index for active balances
CREATE INDEX IF NOT EXISTS idx_cashback_balances_available ON cashback_balances(available_balance) WHERE available_balance > 0;

COMMENT ON TABLE cashback_balances IS 'User cashback balance summary';
COMMENT ON COLUMN cashback_balances.total_earned IS 'Total cashback earned all time';
COMMENT ON COLUMN cashback_balances.available_balance IS 'Currently available for redemption';
COMMENT ON COLUMN cashback_balances.pending_balance IS 'Cashback earned but not yet credited';
COMMENT ON COLUMN cashback_balances.redeemed_amount IS 'Total cashback redeemed/used';

-- =============================================================================
-- 4. CASHBACK REDEMPTIONS TABLE
-- =============================================================================
-- Tracks when users redeem cashback

CREATE TABLE IF NOT EXISTS cashback_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Redemption details
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NAD',
    redemption_type VARCHAR(30) DEFAULT 'wallet_credit' CHECK (redemption_type IN ('wallet_credit', 'payment_discount', 'transfer')),
    
    -- Associated records
    wallet_id UUID REFERENCES wallets(id),
    transaction_id UUID REFERENCES transactions(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    status_reason TEXT,
    
    -- Timing
    redeemed_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_positive_redemption CHECK (amount > 0)
);

-- Indexes for cashback_redemptions
CREATE INDEX IF NOT EXISTS idx_cashback_redemptions_user ON cashback_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_redemptions_status ON cashback_redemptions(status);
CREATE INDEX IF NOT EXISTS idx_cashback_redemptions_date ON cashback_redemptions(redeemed_at DESC);

COMMENT ON TABLE cashback_redemptions IS 'Cashback redemption history';

-- =============================================================================
-- 5. FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update cashback balance after transaction
CREATE OR REPLACE FUNCTION update_cashback_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update balance when cashback transaction status changes
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status != OLD.status) THEN
        -- Insert or update user balance
        INSERT INTO cashback_balances (user_id, currency, last_earned_at, total_transactions)
        VALUES (NEW.user_id, NEW.currency, NOW(), 1)
        ON CONFLICT (user_id) DO UPDATE SET
            total_earned = cashback_balances.total_earned + 
                CASE WHEN NEW.status = 'credited' THEN NEW.cashback_amount ELSE 0 END,
            available_balance = cashback_balances.available_balance + 
                CASE WHEN NEW.status = 'credited' THEN NEW.cashback_amount ELSE 0 END,
            pending_balance = cashback_balances.pending_balance + 
                CASE 
                    WHEN NEW.status = 'pending' THEN NEW.cashback_amount
                    WHEN NEW.status = 'credited' AND TG_OP = 'UPDATE' THEN -NEW.cashback_amount
                    ELSE 0
                END,
            expired_amount = cashback_balances.expired_amount + 
                CASE WHEN NEW.status = 'expired' THEN NEW.cashback_amount ELSE 0 END,
            last_earned_at = CASE 
                WHEN NEW.status IN ('pending', 'credited') THEN NOW() 
                ELSE cashback_balances.last_earned_at 
            END,
            total_transactions = cashback_balances.total_transactions + 1,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update balance on cashback transaction changes
DROP TRIGGER IF EXISTS trg_update_cashback_balance ON cashback_transactions;
CREATE TRIGGER trg_update_cashback_balance
    AFTER INSERT OR UPDATE OF status ON cashback_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_cashback_balance();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cashback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trg_cashback_config_updated ON cashback_config;
CREATE TRIGGER trg_cashback_config_updated
    BEFORE UPDATE ON cashback_config
    FOR EACH ROW
    EXECUTE FUNCTION update_cashback_updated_at();

DROP TRIGGER IF EXISTS trg_cashback_transactions_updated ON cashback_transactions;
CREATE TRIGGER trg_cashback_transactions_updated
    BEFORE UPDATE ON cashback_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_cashback_updated_at();

DROP TRIGGER IF EXISTS trg_cashback_balances_updated ON cashback_balances;
CREATE TRIGGER trg_cashback_balances_updated
    BEFORE UPDATE ON cashback_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_cashback_updated_at();

-- =============================================================================
-- 6. DEFAULT CASHBACK CONFIGURATIONS
-- =============================================================================

-- Insert default global cashback rate (1%)
INSERT INTO cashback_config (
    config_type, 
    cashback_percentage, 
    cashback_cap_per_transaction,
    cashback_cap_per_day,
    cashback_cap_per_month,
    min_transaction_amount,
    is_active
) VALUES (
    'global',
    1.00,
    50.00,
    200.00,
    1000.00,
    10.00,
    TRUE
) ON CONFLICT DO NOTHING;

-- Insert category-specific rates
INSERT INTO cashback_config (
    config_type,
    category_code,
    cashback_percentage,
    cashback_cap_per_transaction,
    min_transaction_amount,
    is_active
) VALUES
    ('category', 'grocery', 2.00, 20.00, 50.00, TRUE),
    ('category', 'fuel', 1.50, 30.00, 100.00, TRUE),
    ('category', 'dining', 3.00, 50.00, 50.00, TRUE),
    ('category', 'shopping', 1.50, 40.00, 100.00, TRUE),
    ('category', 'utilities', 0.50, 10.00, 50.00, TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 7. VIEWS FOR REPORTING
-- =============================================================================

-- View for cashback summary by user
CREATE OR REPLACE VIEW v_cashback_summary AS
SELECT 
    u.id AS user_id,
    u.full_name,
    u.email,
    COALESCE(cb.available_balance, 0) AS available_cashback,
    COALESCE(cb.pending_balance, 0) AS pending_cashback,
    COALESCE(cb.total_earned, 0) AS total_earned,
    COALESCE(cb.redeemed_amount, 0) AS redeemed_amount,
    COALESCE(cb.total_transactions, 0) AS total_transactions,
    cb.last_earned_at,
    cb.last_redeemed_at
FROM users u
LEFT JOIN cashback_balances cb ON u.id = cb.user_id;

COMMENT ON VIEW v_cashback_summary IS 'Summary of cashback balances by user';

-- View for active cashback configurations
CREATE OR REPLACE VIEW v_active_cashback_config AS
SELECT 
    cc.id,
    cc.config_type,
    cc.merchant_id,
    m.name AS merchant_name,
    cc.category_code,
    cc.cashback_percentage,
    cc.cashback_cap_per_transaction,
    cc.min_transaction_amount,
    cc.valid_from,
    cc.valid_until
FROM cashback_config cc
LEFT JOIN merchants m ON cc.merchant_id = m.id
WHERE cc.is_active = TRUE
  AND cc.valid_from <= NOW()
  AND (cc.valid_until IS NULL OR cc.valid_until > NOW());

COMMENT ON VIEW v_active_cashback_config IS 'Currently active cashback configurations';

-- =============================================================================
-- 8. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to application user (adjust role name as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO buffr_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO buffr_app_user;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Cashback system migration completed successfully';
    RAISE NOTICE 'Tables created: cashback_config, cashback_transactions, cashback_balances, cashback_redemptions';
    RAISE NOTICE 'Views created: v_cashback_summary, v_active_cashback_config';
    RAISE NOTICE 'Triggers: Balance updates automated';
    RAISE NOTICE 'Default config: 1%% global + category rates added';
END $$;
