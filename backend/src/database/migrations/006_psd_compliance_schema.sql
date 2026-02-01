-- ============================================================================
-- Migration: 006_psd_compliance_schema.sql
-- Purpose: Namibian Payment System Determinations (PSD-1, PSD-3, PSD-12) Compliance
-- Regulatory Requirements:
--   - PSD-3: E-Money Issuer Requirements
--   - PSD-12: Operational and Cybersecurity Standards
--   - PSD-1: Payment Service Provider Licensing
-- ============================================================================

-- ============================================================================
-- PSD-3 COMPLIANCE: Trust Account Management (Section 11.2)
-- ============================================================================

-- Trust Account Daily Reconciliation
-- Requirement: 100% coverage of outstanding e-money liabilities
-- Frequency: Daily reconciliation required
-- Deficiency Resolution: Within 1 business day
CREATE TABLE IF NOT EXISTS trust_account_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date DATE NOT NULL UNIQUE,
  trust_account_balance DECIMAL(15,2) NOT NULL,
  outstanding_emoney_liabilities DECIMAL(15,2) NOT NULL,
  coverage_percentage DECIMAL(5,2) NOT NULL,
  deficiency_amount DECIMAL(15,2),
  interest_earned DECIMAL(15,2) DEFAULT 0,
  interest_withdrawn DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'compliant', 'deficient', 'resolved'
  reconciled_by VARCHAR(100),
  resolution_date TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_reconciliation_date ON trust_account_reconciliation(reconciliation_date DESC);
CREATE INDEX IF NOT EXISTS idx_trust_reconciliation_status ON trust_account_reconciliation(status);

COMMENT ON TABLE trust_account_reconciliation IS 'PSD-3 Section 11.2: Daily reconciliation to ensure 100% trust account coverage';

-- ============================================================================
-- PSD-12 COMPLIANCE: System Uptime Monitoring (Section 13.1)
-- ============================================================================

-- System Uptime Logs
-- Requirement: 99.9% availability for critical systems
-- Monitoring: Continuous real-time monitoring
CREATE TABLE IF NOT EXISTS system_uptime_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  check_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL, -- 'up', 'down', 'degraded'
  response_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uptime_service_timestamp ON system_uptime_logs(service_name, check_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_status ON system_uptime_logs(status);

-- System Availability Summary (Daily)
CREATE TABLE IF NOT EXISTS system_availability_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name VARCHAR(100) NOT NULL,
  summary_date DATE NOT NULL,
  total_checks INTEGER NOT NULL DEFAULT 0,
  successful_checks INTEGER NOT NULL DEFAULT 0,
  failed_checks INTEGER NOT NULL DEFAULT 0,
  availability_percentage DECIMAL(5,4) NOT NULL,
  total_downtime_minutes INTEGER DEFAULT 0,
  incidents_count INTEGER DEFAULT 0,
  meets_sla BOOLEAN DEFAULT TRUE, -- TRUE if >= 99.9%
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_name, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_availability_service_date ON system_availability_summary(service_name, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_availability_sla ON system_availability_summary(meets_sla);

COMMENT ON TABLE system_availability_summary IS 'PSD-12 Section 13.1: 99.9% uptime requirement tracking';

-- ============================================================================
-- PSD-12 COMPLIANCE: Incident Response (Section 11.13-11.15)
-- ============================================================================

-- Cybersecurity Incidents
-- Requirement: Report to BoN within 24 hours (preliminary), 30 days (full assessment)
-- Recovery Time Objective (RTO): 2 hours
-- Recovery Point Objective (RPO): 5 minutes
CREATE TABLE IF NOT EXISTS cybersecurity_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type VARCHAR(50) NOT NULL, -- 'cyberattack', 'fraud', 'data_breach', 'system_failure', 'unauthorized_access'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  affected_systems TEXT[],
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  detected_by VARCHAR(100),
  
  -- PSD-12 Reporting Requirements
  reported_to_bon_at TIMESTAMP WITH TIME ZONE,
  preliminary_report_sent BOOLEAN DEFAULT FALSE,
  preliminary_report_data JSONB,
  impact_assessment_sent BOOLEAN DEFAULT FALSE,
  impact_assessment_data JSONB,
  
  -- PSD-12 Impact Metrics (Section 11.15)
  financial_loss DECIMAL(15,2) DEFAULT 0,
  data_loss_records INTEGER DEFAULT 0,
  availability_loss_minutes INTEGER DEFAULT 0,
  affected_users_count INTEGER DEFAULT 0,
  
  -- Recovery Metrics
  status VARCHAR(50) NOT NULL DEFAULT 'detected', -- 'detected', 'investigating', 'contained', 'recovered', 'closed'
  containment_time TIMESTAMP WITH TIME ZONE,
  recovery_time TIMESTAMP WITH TIME ZONE,
  recovery_time_minutes INTEGER, -- Must be <= 120 min (2 hours RTO)
  
  -- Root Cause & Remediation
  root_cause TEXT,
  remediation_actions TEXT,
  preventive_measures TEXT,
  
  -- Follow-up
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by VARCHAR(100),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON cybersecurity_incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON cybersecurity_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON cybersecurity_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON cybersecurity_incidents(incident_type);

COMMENT ON TABLE cybersecurity_incidents IS 'PSD-12 Section 11.13-11.15: Cybersecurity incident tracking and reporting';

-- ============================================================================
-- PSD-3 COMPLIANCE: Dormant Wallet Management (Section 11.4)
-- ============================================================================

-- Dormant Wallets
-- Requirement: Wallet dormant after 6 months of no activity
-- Notification: 1 month before dormancy
-- No fees on dormant wallets
CREATE TABLE IF NOT EXISTS dormant_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  wallet_balance DECIMAL(10,2) NOT NULL,
  last_transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  dormancy_approaching_date DATE, -- 5 months after last transaction
  dormancy_date DATE, -- 6 months after last transaction
  customer_notified_date DATE,
  notification_sent BOOLEAN DEFAULT FALSE,
  
  status VARCHAR(50) NOT NULL DEFAULT 'active', 
  -- Status: 'active', 'approaching_dormancy', 'dormant', 'funds_returned', 'funds_to_separate_account', 'terminated'
  
  -- Resolution (PSD-3 Section 11.4.5)
  resolution_method VARCHAR(100), -- 'returned_to_primary_account', 'returned_to_customer', 'returned_to_sender', 'separate_account'
  resolution_date DATE,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dormant_beneficiary ON dormant_wallets(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_dormant_status ON dormant_wallets(status);
CREATE INDEX IF NOT EXISTS idx_dormant_date ON dormant_wallets(dormancy_date);

COMMENT ON TABLE dormant_wallets IS 'PSD-3 Section 11.4: Dormant wallet management (6-month inactivity)';

-- ============================================================================
-- PSD-3 & PSD-1: Reporting to Bank of Namibia
-- ============================================================================

-- Monthly Reports to Bank of Namibia
-- Requirement: Submit by 10th of following month (PSD-3 Section 23.2)
CREATE TABLE IF NOT EXISTS bon_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month DATE NOT NULL, -- First day of the month being reported (e.g., 2024-01-01 for January)
  report_type VARCHAR(50) NOT NULL, -- 'psp_returns', 'emoney_statistics', 'agent_return'
  
  -- E-Money Statistics
  total_registered_users INTEGER,
  total_active_wallets INTEGER,
  total_dormant_wallets INTEGER,
  outstanding_emoney_liabilities DECIMAL(15,2),
  trust_account_balance DECIMAL(15,2),
  trust_account_interest DECIMAL(15,2),
  
  -- Transaction Statistics
  total_transactions_volume INTEGER,
  total_transactions_value DECIMAL(15,2),
  cash_in_volume INTEGER,
  cash_in_value DECIMAL(15,2),
  cash_out_volume INTEGER,
  cash_out_value DECIMAL(15,2),
  p2p_volume INTEGER,
  p2p_value DECIMAL(15,2),
  
  -- Capital
  capital_held DECIMAL(15,2),
  capital_requirement DECIMAL(15,2),
  
  -- Report Metadata
  report_data JSONB, -- Full report in structured JSON
  generated_by VARCHAR(100),
  generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Submission to BoN
  submitted_to_bon BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_by VARCHAR(100),
  due_date DATE NOT NULL, -- 10th of following month
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(report_month, report_type)
);

CREATE INDEX IF NOT EXISTS idx_bon_reports_month ON bon_monthly_reports(report_month DESC);
CREATE INDEX IF NOT EXISTS idx_bon_reports_type ON bon_monthly_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_bon_reports_submitted ON bon_monthly_reports(submitted_to_bon);
CREATE INDEX IF NOT EXISTS idx_bon_reports_due_date ON bon_monthly_reports(due_date);

COMMENT ON TABLE bon_monthly_reports IS 'PSD-3 Section 23: Monthly reporting to Bank of Namibia';

-- ============================================================================
-- PSD-1: Agent Annual Return (Section 16.15)
-- ============================================================================

-- Agent Annual Returns (Table 1)
-- Requirement: Submit by January 31 annually
CREATE TABLE IF NOT EXISTS agent_annual_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_year INTEGER NOT NULL,
  agent_number INTEGER, -- Sequential number in report
  agent_id VARCHAR(50),
  agent_name VARCHAR(255) NOT NULL,
  location_city VARCHAR(100),
  location_region VARCHAR(100),
  services_offered TEXT[], -- Array of services: ['cash_in', 'cash_out', 'voucher_redemption']
  status VARCHAR(20) NOT NULL, -- 'active', 'inactive'
  pool_account_balance DECIMAL(15,2),
  transaction_volume INTEGER,
  transaction_value DECIMAL(15,2),
  
  -- Submission tracking
  submitted_to_bon BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  due_date DATE NOT NULL, -- January 31 of following year
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(return_year, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_returns_year ON agent_annual_returns(return_year DESC);
CREATE INDEX IF NOT EXISTS idx_agent_returns_status ON agent_annual_returns(status);
CREATE INDEX IF NOT EXISTS idx_agent_returns_submitted ON agent_annual_returns(submitted_to_bon);

COMMENT ON TABLE agent_annual_returns IS 'PSD-1 Section 16.15: Agent annual returns (Table 1)';

-- ============================================================================
-- PSD-12 COMPLIANCE: Two-Factor Authentication (Section 12.2)
-- ============================================================================

-- Two-Factor Authentication Logs
-- Requirement: 2FA required for EVERY payment transaction
CREATE TABLE IF NOT EXISTS two_factor_auth_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(50), -- 'beneficiary', 'agent', 'admin'
  auth_method VARCHAR(50) NOT NULL, -- 'sms_otp', 'email_otp', 'authenticator_app', 'biometric'
  transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'withdrawal', 'transfer', 'voucher_redemption'
  transaction_id VARCHAR(100),
  transaction_amount DECIMAL(10,2),
  
  -- OTP Details
  otp_code VARCHAR(10), -- Hashed in production
  otp_sent_at TIMESTAMP WITH TIME ZONE,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  otp_attempts INTEGER DEFAULT 0,
  
  -- Authentication Result
  auth_status VARCHAR(20) NOT NULL, -- 'pending', 'success', 'failed', 'expired', 'blocked'
  verified_at TIMESTAMP WITH TIME ZONE,
  failure_reason VARCHAR(255),
  
  -- Security
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_2fa_user_id ON two_factor_auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_transaction_id ON two_factor_auth_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_2fa_status ON two_factor_auth_logs(auth_status);
CREATE INDEX IF NOT EXISTS idx_2fa_created_at ON two_factor_auth_logs(created_at DESC);

COMMENT ON TABLE two_factor_auth_logs IS 'PSD-12 Section 12.2: Two-factor authentication logs for all payment transactions';

-- ============================================================================
-- PSD-3 COMPLIANCE: Capital Requirements (Section 11.5)
-- ============================================================================

-- Capital Requirements Tracking
-- Initial Capital: N$1.5 million
-- Ongoing Capital: Average of outstanding e-money liabilities (6-month rolling average)
CREATE TABLE IF NOT EXISTS capital_requirements_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_date DATE NOT NULL UNIQUE,
  
  -- Initial Capital (PSD-3 Section 11.5.2)
  initial_capital_required DECIMAL(15,2) NOT NULL DEFAULT 1500000, -- N$1.5M
  initial_capital_held DECIMAL(15,2) NOT NULL,
  
  -- Ongoing Capital (PSD-3 Section 11.5.3)
  outstanding_liabilities_avg_6mo DECIMAL(15,2) NOT NULL, -- 6-month rolling average
  ongoing_capital_required DECIMAL(15,2) NOT NULL,
  ongoing_capital_held DECIMAL(15,2) NOT NULL,
  
  -- Liquid Assets (PSD-3 Section 11.5.4)
  liquid_assets JSONB, -- Breakdown: cash, govt_bonds, short_term_instruments
  liquid_assets_total DECIMAL(15,2) NOT NULL,
  
  -- Compliance Status
  compliance_status VARCHAR(20) NOT NULL, -- 'compliant', 'deficient', 'waiver_granted'
  deficiency_amount DECIMAL(15,2),
  waiver_granted BOOLEAN DEFAULT FALSE,
  waiver_expiry_date DATE,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capital_tracking_date ON capital_requirements_tracking(tracking_date DESC);
CREATE INDEX IF NOT EXISTS idx_capital_compliance ON capital_requirements_tracking(compliance_status);

COMMENT ON TABLE capital_requirements_tracking IS 'PSD-3 Section 11.5: Capital requirements monitoring (N$1.5M initial + ongoing)';

-- ============================================================================
-- PSD-3: E-Wallet Balances (Outstanding Liabilities)
-- ============================================================================

-- E-Wallet Balances
-- Purpose: Track all customer wallet balances for liability calculation
CREATE TABLE IF NOT EXISTS ewallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  pending_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Wallet Status
  wallet_status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'dormant', 'suspended', 'closed'
  last_transaction_date TIMESTAMP WITH TIME ZONE,
  
  -- Limits
  daily_transaction_limit DECIMAL(10,2),
  monthly_transaction_limit DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(beneficiary_id)
);

CREATE INDEX IF NOT EXISTS idx_ewallet_beneficiary ON ewallet_balances(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_ewallet_status ON ewallet_balances(wallet_status);

COMMENT ON TABLE ewallet_balances IS 'PSD-3: E-wallet balances for outstanding liability calculation';

-- ============================================================================
-- E-Wallet Transactions (For Transaction History)
-- ============================================================================

-- E-Wallet Transactions
-- Purpose: Track all e-wallet transactions for reporting and reconciliation
CREATE TABLE IF NOT EXISTS ewallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref VARCHAR(100) UNIQUE NOT NULL,
  
  -- Transaction Parties
  from_beneficiary_id VARCHAR(50) REFERENCES beneficiaries(id),
  to_beneficiary_id VARCHAR(50) REFERENCES beneficiaries(id),
  agent_id VARCHAR(50),
  
  -- Transaction Details
  transaction_type VARCHAR(50) NOT NULL, -- 'cash_in', 'cash_out', 'p2p_transfer', 'voucher_redemption', 'payment', 'reversal'
  amount DECIMAL(10,2) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NAD',
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'reversed'
  
  -- 2FA Reference (PSD-12)
  requires_2fa BOOLEAN DEFAULT TRUE,
  two_factor_auth_id UUID REFERENCES two_factor_auth_logs(id),
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB,
  failure_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ewallet_txn_from ON ewallet_transactions(from_beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_ewallet_txn_to ON ewallet_transactions(to_beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_ewallet_txn_type ON ewallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_ewallet_txn_status ON ewallet_transactions(status);
CREATE INDEX IF NOT EXISTS idx_ewallet_txn_initiated ON ewallet_transactions(initiated_at DESC);

COMMENT ON TABLE ewallet_transactions IS 'E-wallet transaction history for PSD-3 reporting';

-- ============================================================================
-- PSD-12: Backup and Recovery Logs
-- ============================================================================

-- Backup Logs
-- Requirement: RPO of 5 minutes (backups every 5 minutes)
CREATE TABLE IF NOT EXISTS backup_recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type VARCHAR(50) NOT NULL, -- 'automated', 'manual', 'recovery_test'
  backup_scope VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'differential'
  
  -- Backup Details
  backup_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  backup_completed_at TIMESTAMP WITH TIME ZONE,
  backup_size_mb DECIMAL(10,2),
  backup_location TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL, -- 'in_progress', 'completed', 'failed'
  error_message TEXT,
  
  -- Recovery Testing (PSD-12 Section 11.11: Test twice per year)
  is_recovery_test BOOLEAN DEFAULT FALSE,
  recovery_test_date DATE,
  recovery_test_successful BOOLEAN,
  recovery_time_minutes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_started ON backup_recovery_logs(backup_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_status ON backup_recovery_logs(status);
CREATE INDEX IF NOT EXISTS idx_backup_recovery_test ON backup_recovery_logs(is_recovery_test);

COMMENT ON TABLE backup_recovery_logs IS 'PSD-12 Section 11.11: Backup logs and recovery testing (RPO 5 minutes, RTO 2 hours)';

-- ============================================================================
-- PSD-1 & PSD-12: Compliance Audit Trail
-- ============================================================================

-- Compliance Audit Trail
-- Purpose: Track all compliance-related actions and reviews
CREATE TABLE IF NOT EXISTS compliance_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_type VARCHAR(50) NOT NULL, -- 'reconciliation', 'capital_check', 'incident_review', 'report_submission'
  regulation VARCHAR(20) NOT NULL, -- 'PSD-1', 'PSD-3', 'PSD-12', 'Open Banking'
  section VARCHAR(50),
  
  action_taken VARCHAR(255) NOT NULL,
  performed_by VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Details
  before_state JSONB,
  after_state JSONB,
  result VARCHAR(50), -- 'compliant', 'non_compliant', 'resolved', 'escalated'
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_type ON compliance_audit_trail(audit_type);
CREATE INDEX IF NOT EXISTS idx_audit_regulation ON compliance_audit_trail(regulation);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON compliance_audit_trail(timestamp DESC);

COMMENT ON TABLE compliance_audit_trail IS 'Comprehensive audit trail for regulatory compliance actions';

-- ============================================================================
-- Compliance Dashboard Metrics (Real-time View)
-- ============================================================================

-- Compliance Dashboard Summary
-- Purpose: Real-time compliance status overview
CREATE TABLE IF NOT EXISTS compliance_dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- PSD-3 Metrics
  trust_account_compliant BOOLEAN DEFAULT FALSE,
  capital_compliant BOOLEAN DEFAULT FALSE,
  dormant_wallets_count INTEGER DEFAULT 0,
  monthly_report_overdue BOOLEAN DEFAULT FALSE,
  
  -- PSD-12 Metrics
  current_uptime_percentage DECIMAL(5,4),
  uptime_sla_met BOOLEAN DEFAULT TRUE,
  open_incidents_count INTEGER DEFAULT 0,
  critical_incidents_count INTEGER DEFAULT 0,
  last_backup_time TIMESTAMP WITH TIME ZONE,
  rpo_compliant BOOLEAN DEFAULT TRUE,
  
  -- PSD-1 Metrics
  agent_return_submitted BOOLEAN DEFAULT FALSE,
  pending_notifications_count INTEGER DEFAULT 0,
  
  -- Overall Status
  overall_compliance_score DECIMAL(5,2), -- Percentage 0-100
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(metric_date)
);

CREATE INDEX IF NOT EXISTS idx_compliance_metrics_date ON compliance_dashboard_metrics(metric_date DESC);

COMMENT ON TABLE compliance_dashboard_metrics IS 'Real-time compliance status dashboard';

-- ============================================================================
-- Migration Completion Log
-- ============================================================================

INSERT INTO compliance_audit_trail (
  audit_type,
  regulation,
  action_taken,
  performed_by,
  result,
  notes
) VALUES (
  'schema_migration',
  'PSD-1,PSD-3,PSD-12',
  'Created compliance tracking schema',
  'System',
  'compliant',
  'Migration 006: PSD compliance tables created successfully'
);
