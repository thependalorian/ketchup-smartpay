/**
 * Open Banking Schema Migration
 * 
 * Purpose: Implement Namibian Open Banking Standards v1.0
 * Location: backend/src/database/migrations/005_open_banking_schema.sql
 * 
 * Standards Compliance:
 * - Section 9.2.4: Resource Objects (Accounts, Balances, Transactions, Payments)
 * - Section 9.5: Consent and Authentication Standards
 * - Section 5.3: Consent Definitions (180 days max duration)
 */

-- ============================================================
-- OPEN BANKING PARTICIPANTS
-- ============================================================

-- TPPs (Third Party Providers) that can access Open Banking APIs
CREATE TABLE IF NOT EXISTS open_banking_participants (
  participant_id VARCHAR(20) PRIMARY KEY, -- Format: APInnnnnn
  participant_name VARCHAR(255) NOT NULL,
  participant_role VARCHAR(10) NOT NULL, -- 'DP' or 'TPP'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'revoked'
  sectors VARCHAR(50)[] DEFAULT ARRAY['banking'], -- Sectors allowed
  services VARCHAR(50)[] DEFAULT ARRAY['AIS', 'PIS'], -- Services allowed (AIS, PIS)
  contact_email VARCHAR(255),
  contact_url VARCHAR(255),
  certificate_thumbprint TEXT, -- QWAC certificate identifier
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_status ON open_banking_participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_role ON open_banking_participants(participant_role);

-- ============================================================
-- CONSENT MANAGEMENT (OAuth 2.0 with PKCE)
-- ============================================================

-- Authorization Requests (PAR - Pushed Authorization Requests)
CREATE TABLE IF NOT EXISTS oauth_authorization_requests (
  request_uri VARCHAR(100) PRIMARY KEY,
  participant_id VARCHAR(20) NOT NULL REFERENCES open_banking_participants(participant_id),
  beneficiary_id VARCHAR(50) REFERENCES beneficiaries(id),
  code_challenge VARCHAR(128) NOT NULL,
  code_challenge_method VARCHAR(10) NOT NULL DEFAULT 'S256',
  scope TEXT NOT NULL, -- Space-separated scopes
  redirect_uri TEXT NOT NULL,
  state VARCHAR(255),
  nonce VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_requests_participant ON oauth_authorization_requests(participant_id);
CREATE INDEX IF NOT EXISTS idx_auth_requests_expires ON oauth_authorization_requests(expires_at);

-- Authorization Codes (short-lived, 10 minutes max)
CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  code VARCHAR(128) PRIMARY KEY,
  request_uri VARCHAR(100) NOT NULL,
  participant_id VARCHAR(20) NOT NULL REFERENCES open_banking_participants(participant_id),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id),
  scope TEXT NOT NULL,
  code_verifier VARCHAR(128), -- Stored for validation
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_codes_expires ON oauth_authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_codes_used ON oauth_authorization_codes(used);

-- Access Tokens (short-lived, 15 minutes)
CREATE TABLE IF NOT EXISTS oauth_access_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token VARCHAR(255) UNIQUE NOT NULL,
  participant_id VARCHAR(20) NOT NULL REFERENCES open_banking_participants(participant_id),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id),
  scope TEXT NOT NULL,
  token_type VARCHAR(20) DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON oauth_access_tokens(access_token);
CREATE INDEX IF NOT EXISTS idx_access_tokens_expires ON oauth_access_tokens(expires_at);

-- Refresh Tokens (long-lived, 180 days max per standards)
CREATE TABLE IF NOT EXISTS oauth_refresh_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  refresh_token VARCHAR(255) UNIQUE NOT NULL,
  participant_id VARCHAR(20) NOT NULL REFERENCES open_banking_participants(participant_id),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id),
  scope TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Max 180 days per standards
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason VARCHAR(50), -- 'user_request', 'tpp_request', 'expiry', 'security'
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON oauth_refresh_tokens(refresh_token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON oauth_refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON oauth_refresh_tokens(revoked);

-- ============================================================
-- OPEN BANKING ACCOUNTS (Banking Resource Objects)
-- ============================================================

-- Accounts resource (Section 9.2.4)
CREATE TABLE IF NOT EXISTS open_banking_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id),
  account_type VARCHAR(50) NOT NULL, -- 'e-wallet', 'current', 'savings', 'credit_card'
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed'
  opened_date DATE,
  closed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(beneficiary_id, account_number)
);

CREATE INDEX IF NOT EXISTS idx_ob_accounts_beneficiary ON open_banking_accounts(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_ob_accounts_status ON open_banking_accounts(status);
CREATE INDEX IF NOT EXISTS idx_ob_accounts_type ON open_banking_accounts(account_type);

-- Balances resource (Section 9.2.4)
CREATE TABLE IF NOT EXISTS open_banking_balances (
  balance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES open_banking_accounts(account_id) ON DELETE CASCADE,
  balance_type VARCHAR(50) NOT NULL, -- 'current', 'available', 'credit_limit'
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  as_of_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ob_balances_account ON open_banking_balances(account_id);
CREATE INDEX IF NOT EXISTS idx_ob_balances_type ON open_banking_balances(balance_type);

-- Transactions resource (Section 9.2.4)
CREATE TABLE IF NOT EXISTS open_banking_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES open_banking_accounts(account_id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'debit', 'credit', 'fee', 'interest'
  transaction_reference VARCHAR(100),
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  posting_date DATE NOT NULL,
  value_date DATE,
  balance_after DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'posted', -- 'pending', 'posted', 'reversed'
  merchant_name VARCHAR(255),
  merchant_category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ob_transactions_account ON open_banking_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_ob_transactions_date ON open_banking_transactions(posting_date);
CREATE INDEX IF NOT EXISTS idx_ob_transactions_type ON open_banking_transactions(transaction_type);

-- ============================================================
-- OPEN BANKING PAYMENTS (PIS - Payment Initiation Services)
-- ============================================================

-- Payments resource (Section 9.2.4 & 9.2.5)
CREATE TABLE IF NOT EXISTS open_banking_payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id VARCHAR(20) NOT NULL REFERENCES open_banking_participants(participant_id),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id), -- Payer
  debtor_account_id UUID NOT NULL REFERENCES open_banking_accounts(account_id),
  payment_type VARCHAR(50) NOT NULL, -- 'on-us', 'eft-enhanced', 'eft-nrtc'
  creditor_name VARCHAR(255) NOT NULL,
  creditor_account VARCHAR(50) NOT NULL,
  creditor_bank_code VARCHAR(20),
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NAD',
  reference VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'processing', 'completed', 'failed', 'rejected'
  status_reason TEXT,
  instruction_id VARCHAR(100) UNIQUE, -- TPP's reference
  end_to_end_id VARCHAR(100), -- Payment system reference
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ob_payments_participant ON open_banking_payments(participant_id);
CREATE INDEX IF NOT EXISTS idx_ob_payments_beneficiary ON open_banking_payments(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_ob_payments_status ON open_banking_payments(status);
CREATE INDEX IF NOT EXISTS idx_ob_payments_initiated ON open_banking_payments(initiated_at);

-- Beneficiaries (Payees) resource
CREATE TABLE IF NOT EXISTS open_banking_beneficiaries (
  beneficiary_payee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id), -- Account Holder
  account_id UUID NOT NULL REFERENCES open_banking_accounts(account_id),
  payee_name VARCHAR(255) NOT NULL,
  payee_account VARCHAR(50) NOT NULL,
  payee_bank_code VARCHAR(20),
  payee_reference VARCHAR(100),
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(beneficiary_id, account_id, payee_account)
);

CREATE INDEX IF NOT EXISTS idx_ob_beneficiaries_account ON open_banking_beneficiaries(account_id);
CREATE INDEX IF NOT EXISTS idx_ob_beneficiaries_beneficiary ON open_banking_beneficiaries(beneficiary_id);

-- ============================================================
-- AUDIT & COMPLIANCE
-- ============================================================

-- API Access Log (for monitoring and reporting)
CREATE TABLE IF NOT EXISTS open_banking_api_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id VARCHAR(20) REFERENCES open_banking_participants(participant_id),
  beneficiary_id VARCHAR(50) REFERENCES beneficiaries(id),
  endpoint VARCHAR(255) NOT NULL,
  http_method VARCHAR(10) NOT NULL,
  http_status INTEGER,
  response_time_ms INTEGER,
  error_code VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ob_api_logs_participant ON open_banking_api_logs(participant_id);
CREATE INDEX IF NOT EXISTS idx_ob_api_logs_endpoint ON open_banking_api_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_ob_api_logs_created ON open_banking_api_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ob_api_logs_status ON open_banking_api_logs(http_status);

-- Consent Audit Trail
CREATE TABLE IF NOT EXISTS open_banking_consent_audit (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id),
  participant_id VARCHAR(20) NOT NULL REFERENCES open_banking_participants(participant_id),
  action VARCHAR(50) NOT NULL, -- 'granted', 'revoked', 'expired', 'refreshed'
  scope TEXT NOT NULL,
  duration_days INTEGER,
  revocation_reason VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ob_consent_audit_beneficiary ON open_banking_consent_audit(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_ob_consent_audit_participant ON open_banking_consent_audit(participant_id);
CREATE INDEX IF NOT EXISTS idx_ob_consent_audit_created ON open_banking_consent_audit(created_at);

-- ============================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE open_banking_participants IS 'Namibian Open Banking v1.0: Registered Data Providers and TPPs';
COMMENT ON TABLE oauth_authorization_requests IS 'OAuth 2.0 PAR (Pushed Authorization Requests) - RFC 9126';
COMMENT ON TABLE oauth_authorization_codes IS 'OAuth 2.0 Authorization Codes with PKCE - RFC 7636';
COMMENT ON TABLE oauth_access_tokens IS 'OAuth 2.0 Access Tokens (15 min expiry)';
COMMENT ON TABLE oauth_refresh_tokens IS 'OAuth 2.0 Refresh Tokens (180 days max per standards)';
COMMENT ON TABLE open_banking_accounts IS 'Banking Resource Object: Accounts (Section 9.2.4)';
COMMENT ON TABLE open_banking_balances IS 'Banking Resource Object: Balances (Section 9.2.4)';
COMMENT ON TABLE open_banking_transactions IS 'Banking Resource Object: Transactions (Section 9.2.4)';
COMMENT ON TABLE open_banking_payments IS 'Banking Resource Object: Payments - PIS (Section 9.2.4)';
COMMENT ON TABLE open_banking_beneficiaries IS 'Banking Resource Object: Beneficiaries/Payees (Section 9.2.4)';
COMMENT ON TABLE open_banking_api_logs IS 'API access logs for compliance reporting (Section 10.1)';
COMMENT ON TABLE open_banking_consent_audit IS 'Consent audit trail for compliance';
