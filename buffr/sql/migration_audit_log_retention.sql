-- Migration: Audit Log Retention and Archival Tables
-- Location: sql/migration_audit_log_retention.sql
-- Purpose: Create archive tables for 5-year retention policy (Regulatory Requirement)
-- Date: 2026-01-21
-- Priority: Priority 1 - Critical Foundation

-- ============================================================================
-- ARCHIVE TABLES (For logs older than 5 years)
-- ============================================================================

-- Archive table for main audit logs
CREATE TABLE IF NOT EXISTS audit_logs_archive (
  LIKE audit_logs INCLUDING ALL
);

-- Archive table for PIN audit logs
CREATE TABLE IF NOT EXISTS pin_audit_logs_archive (
  LIKE pin_audit_logs INCLUDING ALL
);

-- Archive table for voucher audit logs
CREATE TABLE IF NOT EXISTS voucher_audit_logs_archive (
  LIKE voucher_audit_logs INCLUDING ALL
);

-- Archive table for transaction audit logs
CREATE TABLE IF NOT EXISTS transaction_audit_logs_archive (
  LIKE transaction_audit_logs INCLUDING ALL
);

-- Archive table for API sync audit logs
CREATE TABLE IF NOT EXISTS api_sync_audit_logs_archive (
  LIKE api_sync_audit_logs INCLUDING ALL
);

-- Archive table for staff audit logs
CREATE TABLE IF NOT EXISTS staff_audit_logs_archive (
  LIKE staff_audit_logs INCLUDING ALL
);

-- ============================================================================
-- INDEXES FOR ARCHIVE TABLES (For fast queries)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_timestamp ON audit_logs_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_event_type ON audit_logs_archive(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_entity_type_id ON audit_logs_archive(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_archive_user_id ON audit_logs_archive(user_id);

CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_archive_timestamp ON pin_audit_logs_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_archive_user_id ON pin_audit_logs_archive(user_id);

CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_archive_timestamp ON voucher_audit_logs_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_archive_voucher_id ON voucher_audit_logs_archive(voucher_id);

CREATE INDEX IF NOT EXISTS idx_transaction_audit_logs_archive_timestamp ON transaction_audit_logs_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_logs_archive_transaction_id ON transaction_audit_logs_archive(transaction_id);

CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_archive_timestamp ON api_sync_audit_logs_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_archive_beneficiary_id ON api_sync_audit_logs_archive(beneficiary_id);

CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_archive_timestamp ON staff_audit_logs_archive(timestamp);
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_archive_staff_id ON staff_audit_logs_archive(staff_id);

-- ============================================================================
-- RETENTION POLICY FUNCTION
-- ============================================================================

-- Function to check retention compliance
CREATE OR REPLACE FUNCTION check_audit_log_retention()
RETURNS TABLE (
  table_name TEXT,
  total_logs BIGINT,
  logs_in_retention BIGINT,
  logs_to_archive BIGINT,
  oldest_log_date TIMESTAMP WITH TIME ZONE,
  retention_cutoff_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
  cutoff_date := NOW() - INTERVAL '5 years';
  
  RETURN QUERY
  SELECT 
    'audit_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp >= cutoff_date)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp < cutoff_date)::BIGINT,
    MIN(timestamp),
    cutoff_date
  FROM audit_logs
  
  UNION ALL
  
  SELECT 
    'pin_audit_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp >= cutoff_date)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp < cutoff_date)::BIGINT,
    MIN(timestamp),
    cutoff_date
  FROM pin_audit_logs
  
  UNION ALL
  
  SELECT 
    'voucher_audit_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp >= cutoff_date)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp < cutoff_date)::BIGINT,
    MIN(timestamp),
    cutoff_date
  FROM voucher_audit_logs
  
  UNION ALL
  
  SELECT 
    'transaction_audit_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp >= cutoff_date)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp < cutoff_date)::BIGINT,
    MIN(timestamp),
    cutoff_date
  FROM transaction_audit_logs
  
  UNION ALL
  
  SELECT 
    'api_sync_audit_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp >= cutoff_date)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp < cutoff_date)::BIGINT,
    MIN(timestamp),
    cutoff_date
  FROM api_sync_audit_logs
  
  UNION ALL
  
  SELECT 
    'staff_audit_logs'::TEXT,
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp >= cutoff_date)::BIGINT,
    COUNT(*) FILTER (WHERE timestamp < cutoff_date)::BIGINT,
    MIN(timestamp),
    cutoff_date
  FROM staff_audit_logs;
END;
$$ LANGUAGE plpgsql;
