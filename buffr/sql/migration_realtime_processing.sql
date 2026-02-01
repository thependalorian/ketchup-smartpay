-- Real-Time Transaction Processing Migration
-- Location: sql/migration_realtime_processing.sql
-- Purpose: Database schema for PSD-3 §13.3 real-time processing and settlement
-- 
-- === BANK OF NAMIBIA PSD-3 REQUIREMENTS ===
-- 
-- §13.3: Real-Time Processing
-- - All e-money transactions affecting wallet value must be processed in real-time
-- - Daily settlement required
-- - E-money credit as soon as technically possible after money received
-- - E-money debit before credit to payee (or immediately after if short delay required)

-- ============================================================================
-- TRANSACTION PROCESSING EXTENSIONS
-- ============================================================================

-- Add processing timestamps to transactions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS settlement_batch_id UUID,
ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_latency_ms INTEGER;

-- Index for settlement processing
CREATE INDEX IF NOT EXISTS idx_transactions_settlement_status 
ON transactions(settlement_status) 
WHERE settlement_status != 'settled';

CREATE INDEX IF NOT EXISTS idx_transactions_settlement_batch 
ON transactions(settlement_batch_id);

COMMENT ON COLUMN transactions.processing_latency_ms IS 'Time from request to completion in milliseconds (PSD-3 §13.3)';
COMMENT ON COLUMN transactions.settlement_status IS 'pending, processing, settled, failed (PSD-3 §13.3 daily settlement)';

-- ============================================================================
-- SETTLEMENT BATCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS settlement_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Batch Identification
  batch_number VARCHAR(50) UNIQUE NOT NULL, -- Format: STL-YYYYMMDD-XXXX
  batch_date DATE NOT NULL,
  batch_type VARCHAR(20) NOT NULL DEFAULT 'daily', -- 'daily', 'intraday', 'manual'
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  
  -- Timing
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Statistics
  total_transactions INTEGER DEFAULT 0,
  total_credit_amount DECIMAL(15, 2) DEFAULT 0.00,
  total_debit_amount DECIMAL(15, 2) DEFAULT 0.00,
  net_amount DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'NAD',
  
  -- Processing Results
  successful_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  
  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_settlement_batches_date ON settlement_batches(batch_date DESC);
CREATE INDEX IF NOT EXISTS idx_settlement_batches_status ON settlement_batches(status);

-- ============================================================================
-- PROCESSING METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS processing_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Time Period
  metric_date DATE NOT NULL,
  metric_hour INTEGER NOT NULL, -- 0-23
  
  -- Volume Metrics
  total_transactions INTEGER DEFAULT 0,
  successful_transactions INTEGER DEFAULT 0,
  failed_transactions INTEGER DEFAULT 0,
  
  -- Latency Metrics (milliseconds)
  avg_latency_ms DECIMAL(10, 2) DEFAULT 0,
  min_latency_ms INTEGER,
  max_latency_ms INTEGER,
  p95_latency_ms INTEGER, -- 95th percentile
  p99_latency_ms INTEGER, -- 99th percentile
  
  -- Value Metrics
  total_value DECIMAL(15, 2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'NAD',
  
  -- Compliance Metrics (PSD-12 §13 - 99.9% uptime)
  uptime_seconds INTEGER DEFAULT 3600, -- seconds of uptime in the hour
  downtime_seconds INTEGER DEFAULT 0,
  uptime_percentage DECIMAL(5, 2) DEFAULT 100.00,
  
  -- Errors
  error_count INTEGER DEFAULT 0,
  timeout_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(metric_date, metric_hour)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_processing_metrics_date ON processing_metrics(metric_date DESC);

-- ============================================================================
-- SYSTEM HEALTH TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Health Check
  check_time TIMESTAMP NOT NULL DEFAULT NOW(),
  check_type VARCHAR(50) NOT NULL, -- 'heartbeat', 'api', 'database', 'payment_gateway'
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'healthy', 'degraded', 'down'
  response_time_ms INTEGER,
  
  -- Details
  details JSONB,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for recent health checks
CREATE INDEX IF NOT EXISTS idx_system_health_time ON system_health(check_time DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_type ON system_health(check_type, check_time DESC);

-- Cleanup old health records (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_health_records()
RETURNS void AS $$
BEGIN
  DELETE FROM system_health WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: GENERATE SETTLEMENT BATCH NUMBER
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_settlement_batch_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(batch_number FROM 'STL-[0-9]{8}-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM settlement_batches
  WHERE batch_number LIKE 'STL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  NEW.batch_number := 'STL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_generate_settlement_batch_number ON settlement_batches;
CREATE TRIGGER trg_generate_settlement_batch_number
BEFORE INSERT ON settlement_batches
FOR EACH ROW
WHEN (NEW.batch_number IS NULL)
EXECUTE FUNCTION generate_settlement_batch_number();

-- ============================================================================
-- FUNCTION: CALCULATE PROCESSING LATENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_processing_latency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.processing_completed_at IS NOT NULL AND NEW.processing_started_at IS NOT NULL THEN
    NEW.processing_latency_ms := EXTRACT(EPOCH FROM (NEW.processing_completed_at - NEW.processing_started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_processing_latency ON transactions;
CREATE TRIGGER trg_calculate_processing_latency
BEFORE UPDATE ON transactions
FOR EACH ROW
WHEN (NEW.processing_completed_at IS NOT NULL AND NEW.processing_started_at IS NOT NULL)
EXECUTE FUNCTION calculate_processing_latency();

-- ============================================================================
-- VIEW: PENDING SETTLEMENT TRANSACTIONS
-- ============================================================================

CREATE OR REPLACE VIEW v_pending_settlement AS
SELECT
  t.id,
  t.external_id,
  t.user_id,
  t.amount,
  t.currency,
  t.transaction_type,
  t.status,
  t.transaction_time,
  t.processing_latency_ms,
  t.settlement_status,
  DATE(t.transaction_time) AS transaction_date
FROM transactions t
WHERE t.settlement_status = 'pending'
  AND t.status = 'completed'
ORDER BY t.transaction_time ASC;

-- ============================================================================
-- VIEW: DAILY PROCESSING SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW v_daily_processing_summary AS
SELECT
  DATE(transaction_time) AS processing_date,
  COUNT(*) AS total_transactions,
  COUNT(*) FILTER (WHERE status = 'completed') AS successful,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  AVG(processing_latency_ms)::DECIMAL(10,2) AS avg_latency_ms,
  MAX(processing_latency_ms) AS max_latency_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_latency_ms) AS p95_latency_ms,
  SUM(amount) FILTER (WHERE transaction_type = 'credit') AS total_credits,
  SUM(amount) FILTER (WHERE transaction_type = 'debit') AS total_debits,
  SUM(amount) AS total_volume
FROM transactions
WHERE transaction_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE(transaction_time)
ORDER BY processing_date DESC;

-- ============================================================================
-- VIEW: UPTIME DASHBOARD
-- ============================================================================

CREATE OR REPLACE VIEW v_uptime_dashboard AS
SELECT
  metric_date,
  SUM(total_transactions) AS daily_transactions,
  AVG(avg_latency_ms)::DECIMAL(10,2) AS daily_avg_latency_ms,
  SUM(uptime_seconds) AS total_uptime_seconds,
  SUM(downtime_seconds) AS total_downtime_seconds,
  (SUM(uptime_seconds)::DECIMAL / NULLIF(SUM(uptime_seconds) + SUM(downtime_seconds), 0) * 100)::DECIMAL(5,2) AS uptime_percentage,
  SUM(error_count) AS daily_errors,
  SUM(total_value) AS daily_value
FROM processing_metrics
GROUP BY metric_date
ORDER BY metric_date DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE settlement_batches IS 'Daily settlement batches per PSD-3 §13.3';
COMMENT ON TABLE processing_metrics IS 'Real-time processing metrics per PSD-3 §13.3 and PSD-12 §13';
COMMENT ON TABLE system_health IS 'System health checks for 99.9% uptime requirement (PSD-12 §13)';
COMMENT ON VIEW v_pending_settlement IS 'Transactions pending daily settlement';
COMMENT ON VIEW v_daily_processing_summary IS 'Daily processing summary for compliance reporting';
COMMENT ON VIEW v_uptime_dashboard IS 'System uptime dashboard for PSD-12 §13 compliance';
