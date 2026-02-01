-- Migration: Merchant/Agent Onboarding
-- Location: sql/migration_merchant_agent_onboarding.sql
-- Purpose: Track merchant and agent onboarding progress
-- Date: 2026-01-26
-- Compliance: PSD-1 (agent management), Data Protection Act 2019

-- ============================================================================
-- MERCHANT ONBOARDING TABLE
-- ============================================================================

-- Merchant onboarding tracking
CREATE TABLE IF NOT EXISTS merchant_onboarding (
  onboarding_id VARCHAR(50) PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(50) NOT NULL, -- 'small_retailer', 'medium_retailer', 'large_retailer'
  location JSONB NOT NULL, -- {address: '...', latitude: -22.5609, longitude: 17.0658, region: 'Khomas'}
  contact JSONB NOT NULL, -- {phone: '+264811234567', email: 'manager@shoprite.na'}
  documents JSONB, -- {businessLicense: 'base64', ownerID: 'base64', bankStatement: 'base64'}
  status VARCHAR(50) DEFAULT 'document_verification', -- 'document_verification', 'kyc_verification', 'location_verification', 'technical_setup', 'training', 'activation', 'completed', 'rejected'
  progress INTEGER DEFAULT 0, -- Percentage (0-100)
  current_step VARCHAR(100),
  completed_steps TEXT[],
  pending_steps TEXT[],
  estimated_completion DATE,
  issues JSONB DEFAULT '[]', -- Array of blocking issues
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for merchant onboarding
CREATE INDEX IF NOT EXISTS idx_merchant_onboarding_status ON merchant_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_merchant_onboarding_business_type ON merchant_onboarding(business_type);
CREATE INDEX IF NOT EXISTS idx_merchant_onboarding_created ON merchant_onboarding(created_at DESC);

-- ============================================================================
-- AGENT ONBOARDING TABLE
-- ============================================================================

-- Agent onboarding tracking
CREATE TABLE IF NOT EXISTS agent_onboarding (
  onboarding_id VARCHAR(50) PRIMARY KEY,
  business_name VARCHAR(255) NOT NULL,
  agent_type VARCHAR(50) NOT NULL, -- 'small', 'medium', 'large'
  location JSONB NOT NULL, -- {address: '...', latitude: -22.5200, longitude: 17.0800, region: 'Khomas'}
  contact JSONB NOT NULL, -- {phone: '+264812345678', email: 'owner@localshop.na'}
  liquidity_requirements JSONB, -- {minLiquidity: 1000.00, maxDailyCashout: 10000.00}
  documents JSONB, -- {businessLicense: 'base64', ownerID: 'base64', bankStatement: 'base64'}
  status VARCHAR(50) DEFAULT 'document_verification',
  progress INTEGER DEFAULT 0,
  current_step VARCHAR(100),
  completed_steps TEXT[],
  pending_steps TEXT[],
  estimated_completion DATE,
  issues JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for agent onboarding
CREATE INDEX IF NOT EXISTS idx_agent_onboarding_status ON agent_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_agent_onboarding_agent_type ON agent_onboarding(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_onboarding_created ON agent_onboarding(created_at DESC);

-- ============================================================================
-- ONBOARDING DOCUMENTS TABLE
-- ============================================================================

-- Onboarding documents (separate table for large document storage)
CREATE TABLE IF NOT EXISTS onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id VARCHAR(50) NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'business_license', 'owner_id', 'bank_statement', 'tax_clearance'
  document_data BYTEA, -- Base64 encoded document (or reference to object storage)
  document_url TEXT, -- URL to document in object storage (if stored externally)
  verification_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for onboarding documents
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_onboarding ON onboarding_documents(onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_type ON onboarding_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_onboarding_documents_status ON onboarding_documents(verification_status);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trg_merchant_onboarding_updated_at
  BEFORE UPDATE ON merchant_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

CREATE TRIGGER trg_agent_onboarding_updated_at
  BEFORE UPDATE ON agent_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_onboarding_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE merchant_onboarding IS 'Merchant onboarding tracking (POS terminal integration)';
COMMENT ON TABLE agent_onboarding IS 'Agent onboarding tracking (cash-out services)';
COMMENT ON TABLE onboarding_documents IS 'Onboarding documents storage (business license, ID, bank statements)';

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
  'migration_merchant_agent_onboarding.sql',
  '1.0.0',
  'completed',
  '{"description": "Merchant and agent onboarding tracking with document verification", "tables": ["merchant_onboarding", "agent_onboarding", "onboarding_documents"]}'
)
ON CONFLICT (migration_name) DO NOTHING;
