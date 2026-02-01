-- Interoperability, Privacy, and Agent Expansion tables
-- Migration: 012_interop_privacy_agents.sql
-- Purpose: Tables for IPS, NAMQR, beneficiary consent, agent float, and coverage planning (PRD Sections 6–7).

-- Beneficiary consents (PRD FR4.5; ConsentManagementService)
CREATE TABLE IF NOT EXISTS beneficiary_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(beneficiary_id, consent_type)
);
CREATE INDEX IF NOT EXISTS idx_beneficiary_consents_beneficiary_id ON beneficiary_consents(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_consents_consent_type ON beneficiary_consents(consent_type);

-- NAMQR codes (PRD FR2.3, FR2.8; NAMQRService)
CREATE TABLE IF NOT EXISTS namqr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL UNIQUE,
  merchant_id VARCHAR(100) NOT NULL,
  amount VARCHAR(20) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  reference VARCHAR(255),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload_hash VARCHAR(64),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by_beneficiary_id VARCHAR(50),
  transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_namqr_codes_qr_id ON namqr_codes(qr_id);
CREATE INDEX IF NOT EXISTS idx_namqr_codes_merchant_id ON namqr_codes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_namqr_codes_expires_at ON namqr_codes(expires_at);

-- IPS transactions (PRD FR2.6; IPSIntegrationService)
CREATE TABLE IF NOT EXISTS ips_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(100) NOT NULL,
  payment_id VARCHAR(100) NOT NULL,
  debtor_participant_id VARCHAR(50) NOT NULL,
  debtor_account_id VARCHAR(50) NOT NULL,
  creditor_participant_id VARCHAR(50) NOT NULL,
  creditor_account_id VARCHAR(50) NOT NULL,
  amount VARCHAR(20) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
  reference VARCHAR(255),
  end_to_end_id VARCHAR(100),
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_payment_id ON ips_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_request_id ON ips_transactions(request_id);
CREATE INDEX IF NOT EXISTS idx_ips_transactions_created_at ON ips_transactions(created_at);

-- Agent float (PRD FR7.4; AgentLiquidityService) – snapshot/supplement to agents.liquidity_balance
CREATE TABLE IF NOT EXISTS agent_float (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  current_float DECIMAL(15, 2) NOT NULL DEFAULT 0,
  float_threshold DECIMAL(15, 2) NOT NULL DEFAULT 10000,
  overdraft_limit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id)
);
CREATE INDEX IF NOT EXISTS idx_agent_float_agent_id ON agent_float(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_float_current_float ON agent_float(current_float) WHERE current_float >= 0;

-- Agent coverage by region (PRD FR7.9; AgentCoveragePlanner)
CREATE TABLE IF NOT EXISTS agent_coverage_by_region (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region VARCHAR(50) NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  beneficiary_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(region, agent_id)
);
CREATE INDEX IF NOT EXISTS idx_agent_coverage_by_region_region ON agent_coverage_by_region(region);
CREATE INDEX IF NOT EXISTS idx_agent_coverage_by_region_agent_id ON agent_coverage_by_region(agent_id);
