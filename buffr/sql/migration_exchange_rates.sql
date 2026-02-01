-- Exchange Rates Migration
-- Location: sql/migration_exchange_rates.sql
-- Purpose: Create table for storing exchange rates fetched from exchangerate.host API
-- Fetched twice daily to stay within API rate limits (100 requests/month)

-- ============================================================================
-- EXCHANGE RATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  target_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(15, 6) NOT NULL,
  trend VARCHAR(10) DEFAULT 'stable', -- 'up', 'down', 'stable'
  source VARCHAR(100) DEFAULT 'exchangerate.host',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one rate per currency pair per fetch time
  CONSTRAINT unique_rate_per_fetch UNIQUE (base_currency, target_currency, fetched_at)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_base_currency ON exchange_rates(base_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_target_currency ON exchange_rates(target_currency);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_fetched_at ON exchange_rates(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_latest ON exchange_rates(base_currency, target_currency, fetched_at DESC);

-- ============================================================================
-- EXCHANGE RATE FETCH LOG TABLE
-- ============================================================================
-- Track when rates were fetched to ensure we only fetch twice per day
CREATE TABLE IF NOT EXISTS exchange_rate_fetch_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fetch_date DATE NOT NULL,
  fetch_time TIME NOT NULL,
  currencies_fetched INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  api_source VARCHAR(100) DEFAULT 'exchangerate.host',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one fetch per day (we'll fetch twice: morning and evening)
  CONSTRAINT unique_fetch_per_time UNIQUE (fetch_date, fetch_time)
);

-- Index for fetch log queries
CREATE INDEX IF NOT EXISTS idx_fetch_log_date ON exchange_rate_fetch_log(fetch_date DESC);
CREATE INDEX IF NOT EXISTS idx_fetch_log_success ON exchange_rate_fetch_log(success, fetch_date DESC);

-- ============================================================================
-- FUNCTION: Get Latest Exchange Rates
-- ============================================================================
-- Returns the most recent exchange rates for a base currency
CREATE OR REPLACE FUNCTION get_latest_exchange_rates(
  p_base_currency VARCHAR(3) DEFAULT 'NAD',
  p_target_currencies VARCHAR(3)[] DEFAULT ARRAY['USD', 'EUR', 'GBP', 'ZAR', 'BWP', 'CNY', 'JPY', 'AUD']
)
RETURNS TABLE (
  target_currency VARCHAR(3),
  rate DECIMAL(15, 6),
  trend VARCHAR(10),
  fetched_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (er.target_currency)
    er.target_currency,
    er.rate,
    er.trend,
    er.fetched_at
  FROM exchange_rates er
  WHERE er.base_currency = p_base_currency
    AND er.target_currency = ANY(p_target_currencies)
  ORDER BY er.target_currency, er.fetched_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Check if Rates Need Fetching
-- ============================================================================
-- Returns true if rates should be fetched (less than 2 fetches today)
CREATE OR REPLACE FUNCTION should_fetch_exchange_rates()
RETURNS BOOLEAN AS $$
DECLARE
  fetch_count INTEGER;
  current_date DATE := CURRENT_DATE;
BEGIN
  SELECT COUNT(*) INTO fetch_count
  FROM exchange_rate_fetch_log
  WHERE fetch_date = current_date
    AND success = TRUE;
  
  -- Fetch twice per day: once in morning (before 12:00) and once in evening (after 12:00)
  RETURN fetch_count < 2;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE exchange_rates IS 'Stores exchange rates fetched from exchangerate.host API. Rates are fetched twice daily to stay within 100 requests/month limit.';
COMMENT ON TABLE exchange_rate_fetch_log IS 'Tracks when exchange rates were fetched to ensure we only fetch twice per day.';
COMMENT ON FUNCTION get_latest_exchange_rates IS 'Returns the most recent exchange rates for specified currencies.';
COMMENT ON FUNCTION should_fetch_exchange_rates IS 'Checks if exchange rates should be fetched (less than 2 fetches today).';

