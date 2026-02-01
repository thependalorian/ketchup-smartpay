-- Namibian Open Banking Standards - Database Migration
-- Version: 1.0.0
-- Created: 2026-01-26
-- Purpose: Support OAuth 2.0 with PKCE consent flows for Namibian Open Banking Standards v1.0

-- ============================================================================
-- OAUTH CONSENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_consents (
  consent_id VARCHAR(255) PRIMARY KEY,
  account_holder_id VARCHAR(255) NOT NULL,
  data_provider_id VARCHAR(10) NOT NULL, -- Participant ID (APInnnnnn)
  tpp_id VARCHAR(10) NOT NULL, -- TPP Participant ID (APInnnnnn)
  permissions JSONB NOT NULL, -- Array of consent scopes
  status VARCHAR(50) NOT NULL DEFAULT 'AwaitingAuthorisation',
  expiration_date_time TIMESTAMP NOT NULL,
  requested_expiration_date_time TIMESTAMP,
  transaction_from_date_time TIMESTAMP,
  transaction_to_date_time TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status_update_date_time TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(255), -- 'account_holder' or 'tpp'
  
  CONSTRAINT valid_participant_id_format CHECK (
    data_provider_id ~ '^API\d{6}$' AND tpp_id ~ '^API\d{6}$'
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('AwaitingAuthorisation', 'Authorised', 'Rejected', 'Revoked', 'Expired')
  )
);

-- Indexes for oauth_consents
CREATE INDEX IF NOT EXISTS idx_oauth_consents_account_holder ON oauth_consents(account_holder_id);
CREATE INDEX IF NOT EXISTS idx_oauth_consents_tpp ON oauth_consents(tpp_id);
CREATE INDEX IF NOT EXISTS idx_oauth_consents_status ON oauth_consents(status);
CREATE INDEX IF NOT EXISTS idx_oauth_consents_expiration ON oauth_consents(expiration_date_time);
CREATE INDEX IF NOT EXISTS idx_oauth_consents_data_provider ON oauth_consents(data_provider_id);

-- Comments
COMMENT ON TABLE oauth_consents IS 'OAuth 2.0 consent records for Namibian Open Banking';
COMMENT ON COLUMN oauth_consents.consent_id IS 'Unique consent identifier (UUID)';
COMMENT ON COLUMN oauth_consents.account_holder_id IS 'User ID of the account holder';
COMMENT ON COLUMN oauth_consents.data_provider_id IS 'Participant ID of Data Provider (Buffr)';
COMMENT ON COLUMN oauth_consents.tpp_id IS 'Participant ID of Third-Party Provider';
COMMENT ON COLUMN oauth_consents.permissions IS 'JSON array of consent scopes';
COMMENT ON COLUMN oauth_consents.status IS 'Consent status: AwaitingAuthorisation, Authorised, Rejected, Revoked, Expired';
COMMENT ON COLUMN oauth_consents.expiration_date_time IS 'Consent expiration (max 180 days from creation)';

-- ============================================================================
-- OAUTH AUTHORIZATION CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_authorization_codes (
  code VARCHAR(255) PRIMARY KEY,
  client_id VARCHAR(10) NOT NULL, -- TPP Participant ID
  redirect_uri TEXT NOT NULL,
  code_challenge VARCHAR(255) NOT NULL,
  code_challenge_method VARCHAR(10) NOT NULL DEFAULT 'S256',
  scope TEXT NOT NULL,
  account_holder_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP,
  
  CONSTRAINT valid_client_id_format CHECK (client_id ~ '^API\d{6}$')
);

-- Indexes for oauth_authorization_codes
CREATE INDEX IF NOT EXISTS idx_oauth_codes_client ON oauth_authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_account_holder ON oauth_authorization_codes(account_holder_id);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_expires ON oauth_authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_codes_used ON oauth_authorization_codes(used);

-- Comments
COMMENT ON TABLE oauth_authorization_codes IS 'OAuth 2.0 authorization codes for PKCE flow';
COMMENT ON COLUMN oauth_authorization_codes.code IS 'Authorization code (43-128 characters, URL-safe)';
COMMENT ON COLUMN oauth_authorization_codes.code_challenge IS 'PKCE code challenge (Base64URL(SHA256(code_verifier)))';
COMMENT ON COLUMN oauth_authorization_codes.expires_at IS 'Code expiration (10 minutes from creation)';

-- ============================================================================
-- OAUTH PUSHED AUTHORIZATION REQUESTS (PAR) TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS oauth_par_requests (
  request_uri VARCHAR(500) PRIMARY KEY,
  client_id VARCHAR(10) NOT NULL, -- TPP Participant ID
  redirect_uri TEXT NOT NULL,
  code_challenge VARCHAR(255) NOT NULL,
  code_challenge_method VARCHAR(10) NOT NULL DEFAULT 'S256',
  scope TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP,
  
  CONSTRAINT valid_par_client_id_format CHECK (client_id ~ '^API\d{6}$')
);

-- Indexes for oauth_par_requests
CREATE INDEX IF NOT EXISTS idx_oauth_par_client ON oauth_par_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_oauth_par_expires ON oauth_par_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_par_used ON oauth_par_requests(used);

-- Comments
COMMENT ON TABLE oauth_par_requests IS 'Pushed Authorization Requests (PAR) - RFC 9126';
COMMENT ON COLUMN oauth_par_requests.request_uri IS 'Request URI (urn:ietf:params:oauth:request_uri:...)';
COMMENT ON COLUMN oauth_par_requests.expires_at IS 'PAR expiration (10 minutes from creation)';

-- ============================================================================
-- SERVICE LEVEL METRICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_level_metrics (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  participant_id VARCHAR(10),
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  total_response_time_ms BIGINT NOT NULL DEFAULT 0,
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_metrics_participant_id CHECK (
    participant_id IS NULL OR participant_id ~ '^API\d{6}$'
  ),
  CONSTRAINT unique_endpoint_participant_period UNIQUE (endpoint, participant_id, period_start)
);

-- Indexes for service_level_metrics
CREATE INDEX IF NOT EXISTS idx_slm_endpoint ON service_level_metrics(endpoint);
CREATE INDEX IF NOT EXISTS idx_slm_participant ON service_level_metrics(participant_id);
CREATE INDEX IF NOT EXISTS idx_slm_period ON service_level_metrics(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_slm_created ON service_level_metrics(created_at);

-- Comments
COMMENT ON TABLE service_level_metrics IS 'Service level metrics for Namibian Open Banking compliance (99.9% availability, 300ms response time)';
COMMENT ON COLUMN service_level_metrics.endpoint IS 'API endpoint path';
COMMENT ON COLUMN service_level_metrics.participant_id IS 'TPP Participant ID (optional)';
COMMENT ON COLUMN service_level_metrics.period_start IS 'Start of metrics period (hourly aggregation)';
COMMENT ON COLUMN service_level_metrics.period_end IS 'End of metrics period';

-- ============================================================================
-- PARTICIPANTS TABLE (TPPs and Data Providers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS participants (
  participant_id VARCHAR(10) PRIMARY KEY, -- APInnnnnn format
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'TPP' or 'DP' (Data Provider)
  status VARCHAR(20) NOT NULL DEFAULT 'Active', -- 'Active', 'Suspended', 'Revoked'
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  suspended_at TIMESTAMP,
  revoked_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_participant_id CHECK (participant_id ~ '^API\d{6}$'),
  CONSTRAINT valid_role CHECK (role IN ('TPP', 'DP')),
  CONSTRAINT valid_participant_status CHECK (status IN ('Active', 'Suspended', 'Revoked'))
);

-- Indexes for participants
CREATE INDEX IF NOT EXISTS idx_participants_role ON participants(role);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_registered ON participants(registered_at);

-- Comments
COMMENT ON TABLE participants IS 'Registry of TPPs and Data Providers for Namibian Open Banking';
COMMENT ON COLUMN participants.participant_id IS 'Participant ID in APInnnnnn format';
COMMENT ON COLUMN participants.role IS 'Role: TPP (Third-Party Provider) or DP (Data Provider)';
COMMENT ON COLUMN participants.status IS 'Status: Active, Suspended, Revoked';

-- ============================================================================
-- PAYMENTS TABLE (for PIS - Payment Initiation Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(255) PRIMARY KEY,
  payer_account_id VARCHAR(255) NOT NULL,
  beneficiary_account_id VARCHAR(255) NOT NULL,
  amount BIGINT NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  payment_type VARCHAR(50) NOT NULL DEFAULT 'Domestic On-us',
  status VARCHAR(50) NOT NULL DEFAULT 'Accepted',
  reference TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  tpp_id VARCHAR(10) NOT NULL, -- TPP Participant ID
  consent_id VARCHAR(255) NOT NULL, -- Consent ID
  
  CONSTRAINT valid_tpp_id_format CHECK (tpp_id ~ '^API\d{6}$'),
  CONSTRAINT valid_status CHECK (
    status IN ('Accepted', 'Rejected', 'Pending', 'Completed', 'Failed')
  ),
  CONSTRAINT fk_payments_consent FOREIGN KEY (consent_id) REFERENCES oauth_consents(consent_id) ON DELETE CASCADE
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_account_id);
CREATE INDEX IF NOT EXISTS idx_payments_beneficiary ON payments(beneficiary_account_id);
CREATE INDEX IF NOT EXISTS idx_payments_tpp ON payments(tpp_id);
CREATE INDEX IF NOT EXISTS idx_payments_consent ON payments(consent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);

-- Comments
COMMENT ON TABLE payments IS 'Payment initiation records for Namibian Open Banking PIS';
COMMENT ON COLUMN payments.payment_type IS 'Payment type: Domestic On-us, Domestic EFT (EnCR), Domestic EFT (NRTC)';
COMMENT ON COLUMN payments.tpp_id IS 'TPP Participant ID that initiated the payment';
COMMENT ON COLUMN payments.consent_id IS 'Consent ID used for this payment';

-- ============================================================================
-- AUTOMATED REQUEST TRACKING (for 4 requests/day limit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS automated_request_tracking (
  id SERIAL PRIMARY KEY,
  account_holder_id VARCHAR(255) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_date DATE NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_account_endpoint_date UNIQUE (account_holder_id, endpoint, request_date)
);

-- Indexes for automated_request_tracking
CREATE INDEX IF NOT EXISTS idx_art_account_holder ON automated_request_tracking(account_holder_id);
CREATE INDEX IF NOT EXISTS idx_art_endpoint ON automated_request_tracking(endpoint);
CREATE INDEX IF NOT EXISTS idx_art_date ON automated_request_tracking(request_date);

-- Comments
COMMENT ON TABLE automated_request_tracking IS 'Tracks automated requests per Account Holder (max 4 per day per Account Holder)';
COMMENT ON COLUMN automated_request_tracking.request_date IS 'Date of requests (for daily limit enforcement)';

-- ============================================================================
-- SEED DATA: Register Buffr as Data Provider
-- ============================================================================

INSERT INTO participants (participant_id, name, role, status, metadata)
VALUES (
  'API000001',
  'Buffr',
  'DP',
  'Active',
  '{"description": "Buffr Payment Companion - Data Provider for Namibian Open Banking", "website": "https://buffr.com"}'
)
ON CONFLICT (participant_id) DO UPDATE
SET status = 'Active',
    metadata = EXCLUDED.metadata;

-- ============================================================================
-- MIGRATION HISTORY ENTRY
-- ============================================================================

INSERT INTO migration_history (
  migration_name,
  migration_version,
  status,
  metadata
)
VALUES (
  'migration_namibian_open_banking.sql',
  '1.0.0',
  'completed',
  '{"description": "Namibian Open Banking Standards v1.0 - OAuth 2.0 with PKCE, consent management, service level metrics", "standards": "Namibian Open Banking Standards v1.0 (25 April 2025)"}'
)
ON CONFLICT (migration_name) DO NOTHING;
