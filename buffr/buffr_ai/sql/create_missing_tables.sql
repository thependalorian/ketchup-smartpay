-- ============================================================================
-- BUFFR AI - CREATE MISSING TABLES
-- Creates conversations and exchange_rates tables for AI backend
-- ============================================================================

-- ============================================================================
-- CONVERSATIONS TABLE
-- Stores conversation history for Companion Agent
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_id TEXT,
    user_message TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    agents_consulted TEXT[] DEFAULT '{}',  -- Array of agent names consulted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations (created_at DESC);

-- ============================================================================
-- EXCHANGE RATES TABLE
-- Stores NAD exchange rates fetched from external API
-- ============================================================================

CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL DEFAULT 'NAD',
    target_currency TEXT NOT NULL,
    rate DECIMAL(15, 6) NOT NULL,
    trend TEXT DEFAULT 'stable',  -- 'up', 'down', 'stable'
    source TEXT DEFAULT 'exchangerate.host',
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fetched_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- Date column for unique constraint
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add fetched_date column if table exists without it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exchange_rates' AND column_name = 'fetched_date'
    ) THEN
        ALTER TABLE exchange_rates ADD COLUMN fetched_date DATE;
        -- Populate fetched_date from fetched_at for existing rows
        UPDATE exchange_rates SET fetched_date = DATE(fetched_at) WHERE fetched_date IS NULL;
        -- Set NOT NULL after populating
        ALTER TABLE exchange_rates ALTER COLUMN fetched_date SET NOT NULL;
        ALTER TABLE exchange_rates ALTER COLUMN fetched_date SET DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- Clean up duplicate entries (keep only the most recent for each currency/date combination)
DELETE FROM exchange_rates a USING exchange_rates b
WHERE a.id < b.id
  AND a.base_currency = b.base_currency
  AND a.target_currency = b.target_currency
  AND COALESCE(a.fetched_date, DATE(a.fetched_at)) = COALESCE(b.fetched_date, DATE(b.fetched_at));

-- Ensure fetched_date is populated for all rows
UPDATE exchange_rates SET fetched_date = DATE(fetched_at) WHERE fetched_date IS NULL;

-- Unique constraint: one rate per currency per day
-- Drop existing index if it exists (in case it was created with wrong constraint)
DROP INDEX IF EXISTS idx_exchange_rates_unique;
CREATE UNIQUE INDEX idx_exchange_rates_unique 
    ON exchange_rates (base_currency, target_currency, fetched_date);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_exchange_rates_target_currency ON exchange_rates (target_currency, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched_at ON exchange_rates (fetched_at DESC);

-- ============================================================================
-- EXCHANGE RATE FETCH LOG TABLE
-- Logs each exchange rate fetch operation (for rate limiting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS exchange_rate_fetch_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fetch_date DATE NOT NULL,
    fetch_time TIME NOT NULL,
    currencies_fetched INTEGER NOT NULL DEFAULT 0,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    api_source TEXT DEFAULT 'exchangerate.host',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint: one log entry per date/time combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rate_fetch_log_unique 
    ON exchange_rate_fetch_log (fetch_date, fetch_time);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_exchange_rate_fetch_log_date ON exchange_rate_fetch_log (fetch_date DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rate_fetch_log_success ON exchange_rate_fetch_log (fetch_date, success);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE conversations IS 'Stores conversation history for Buffr AI Companion Agent';
COMMENT ON COLUMN conversations.session_id IS 'Session identifier for grouping related conversations';
COMMENT ON COLUMN conversations.agents_consulted IS 'Array of agent names that were consulted (e.g., ["guardian", "transaction_analyst"])';

COMMENT ON TABLE exchange_rates IS 'Stores NAD exchange rates fetched from external APIs (fetched twice daily)';
COMMENT ON COLUMN exchange_rates.base_currency IS 'Base currency (always NAD for Buffr)';
COMMENT ON COLUMN exchange_rates.target_currency IS 'Target currency code (USD, EUR, GBP, etc.)';
COMMENT ON COLUMN exchange_rates.trend IS 'Rate trend: up, down, or stable';

COMMENT ON TABLE exchange_rate_fetch_log IS 'Logs exchange rate fetch operations for rate limiting (max 2 per day)';
