-- Migration: Comprehensive Audit Trail System
-- Location: sql/migration_audit_logs.sql
-- Purpose: Complete audit logging for all operations (Regulatory & Compliance Requirement)
-- Date: 2026-01-21
-- Priority: Priority 1 - Critical Foundation

-- ============================================================================
-- MAIN AUDIT LOGS TABLE (Comprehensive audit log for all operations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- 'voucher_issued', 'voucher_redeemed', 'pin_reset', etc.
  entity_type VARCHAR(50) NOT NULL, -- 'voucher', 'transaction', 'user', 'account', etc.
  entity_id UUID NOT NULL, -- ID of the affected entity
  user_id UUID, -- User who performed the action (if applicable)
  staff_id UUID, -- Staff member who performed the action (if applicable)
  location VARCHAR(255), -- NamPost branch, mobile unit, or system location
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'verify', 'redeem', etc.
  old_values JSONB, -- Previous state (for updates)
  new_values JSONB, -- New state (for updates)
  metadata JSONB, -- Additional context (IP address, device info, etc.)
  smartpay_beneficiary_id VARCHAR(100), -- Link to SmartPay beneficiary
  biometric_verification_id VARCHAR(100), -- Link to biometric verification
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100), -- For tracing requests across systems
  response_status INTEGER, -- HTTP status code
  error_message TEXT, -- If operation failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_staff_id ON audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_smartpay_beneficiary_id ON audit_logs(smartpay_beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_location ON audit_logs(location);

-- ============================================================================
-- PIN OPERATION AUDIT TRAIL (Specific to PIN operations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  staff_id UUID, -- If PIN reset by staff (references staff table when created)
  operation_type VARCHAR(50) NOT NULL, -- 'setup', 'change', 'reset', 'verify'
  location VARCHAR(255) NOT NULL, -- NamPost branch or mobile unit
  biometric_verification_id VARCHAR(100), -- From SmartPay
  id_verification_status BOOLEAN, -- ID document verified
  reason TEXT, -- Reason for PIN reset (if applicable)
  ip_address INET,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for PIN audit logs
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_user_id ON pin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_staff_id ON pin_audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_operation_type ON pin_audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_timestamp ON pin_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pin_audit_logs_location ON pin_audit_logs(location);

-- ============================================================================
-- VOUCHER OPERATION AUDIT TRAIL (Specific to vouchers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS voucher_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id),
  operation_type VARCHAR(50) NOT NULL, -- 'issued', 'verified', 'redeemed', 'expired', 'cancelled'
  user_id UUID REFERENCES users(id),
  staff_id UUID, -- If verified by staff (references staff table when created)
  location VARCHAR(255), -- NamPost branch or mobile unit
  smartpay_beneficiary_id VARCHAR(100) NOT NULL,
  biometric_verification_id VARCHAR(100), -- From SmartPay
  old_status VARCHAR(50), -- Previous status
  new_status VARCHAR(50) NOT NULL, -- New status
  amount DECIMAL(10, 2), -- Voucher amount
  redemption_method VARCHAR(50), -- If redeemed
  settlement_reference VARCHAR(100), -- NamPay reference
  metadata JSONB, -- Additional context
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for voucher audit logs
CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_voucher_id ON voucher_audit_logs(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_operation_type ON voucher_audit_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_user_id ON voucher_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_staff_id ON voucher_audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_smartpay_beneficiary_id ON voucher_audit_logs(smartpay_beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_voucher_audit_logs_timestamp ON voucher_audit_logs(timestamp DESC);

-- ============================================================================
-- TRANSACTION AUDIT TRAIL (All financial transactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transaction_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  transaction_type VARCHAR(50) NOT NULL, -- 'credit', 'debit', 'transfer', 'payment'
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  from_wallet_id UUID REFERENCES wallets(id),
  to_wallet_id UUID REFERENCES wallets(id),
  recipient_id UUID REFERENCES users(id), -- For transfers
  payment_method VARCHAR(50), -- 'wallet', 'bank_transfer', 'qr_code', 'ussd', etc.
  payment_reference VARCHAR(100), -- External reference (NamPay, etc.)
  two_factor_verified BOOLEAN NOT NULL, -- 2FA verification status
  biometric_verification_id VARCHAR(100), -- If biometric used
  ip_address INET,
  device_info JSONB, -- Device fingerprint, app version, etc.
  status VARCHAR(50) NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
  error_message TEXT,
  fraud_check_status VARCHAR(50), -- 'passed', 'flagged', 'blocked'
  guardian_agent_result JSONB, -- Guardian Agent analysis
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for transaction audit logs
CREATE INDEX IF NOT EXISTS idx_transaction_audit_logs_transaction_id ON transaction_audit_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_logs_user_id ON transaction_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_logs_timestamp ON transaction_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_logs_status ON transaction_audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_transaction_audit_logs_payment_method ON transaction_audit_logs(payment_method);

-- ============================================================================
-- REAL-TIME API SYNC AUDIT TRAIL (SmartPay ↔ Buffr)
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_sync_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction VARCHAR(10) NOT NULL, -- 'inbound' (SmartPay → Buffr) or 'outbound' (Buffr → SmartPay)
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL, -- 'GET', 'POST', 'PUT', etc.
  request_payload JSONB,
  response_payload JSONB,
  status_code INTEGER,
  response_time_ms INTEGER, -- Response time in milliseconds
  success BOOLEAN NOT NULL,
  error_message TEXT,
  beneficiary_id VARCHAR(100), -- SmartPay beneficiary ID
  voucher_id UUID REFERENCES vouchers(id),
  user_id UUID REFERENCES users(id),
  request_id VARCHAR(100), -- For tracing requests
  retry_count INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for API sync audit logs
CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_direction ON api_sync_audit_logs(direction);
CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_endpoint ON api_sync_audit_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_beneficiary_id ON api_sync_audit_logs(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_voucher_id ON api_sync_audit_logs(voucher_id);
CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_request_id ON api_sync_audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_api_sync_audit_logs_timestamp ON api_sync_audit_logs(timestamp DESC);

-- ============================================================================
-- STAFF ACTION AUDIT TRAIL (All admin/staff operations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL, -- References staff table when created
  action_type VARCHAR(100) NOT NULL, -- 'pin_reset', 'account_modify', 'voucher_verify', etc.
  target_entity_type VARCHAR(50) NOT NULL, -- 'user', 'voucher', 'account', etc.
  target_entity_id UUID NOT NULL,
  location VARCHAR(255) NOT NULL, -- NamPost branch or mobile unit
  action_details JSONB, -- What was done
  authorization_level VARCHAR(50), -- Staff authorization level
  biometric_verification_required BOOLEAN,
  biometric_verification_id VARCHAR(100), -- If required
  ip_address INET,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for staff audit logs
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_staff_id ON staff_audit_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_action_type ON staff_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_target_entity ON staff_audit_logs(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_location ON staff_audit_logs(location);
CREATE INDEX IF NOT EXISTS idx_staff_audit_logs_timestamp ON staff_audit_logs(timestamp DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE audit_logs IS 'Comprehensive audit log for all operations (Regulatory & Compliance Requirement)';
COMMENT ON TABLE pin_audit_logs IS 'PIN operation audit trail (setup, change, reset, verify)';
COMMENT ON TABLE voucher_audit_logs IS 'Voucher operation audit trail (issued, verified, redeemed, expired, cancelled)';
COMMENT ON TABLE transaction_audit_logs IS 'Transaction audit trail (all financial transactions)';
COMMENT ON TABLE api_sync_audit_logs IS 'Real-time API sync audit trail (SmartPay ↔ Buffr communication)';
COMMENT ON TABLE staff_audit_logs IS 'Staff action audit trail (all admin/staff operations)';

