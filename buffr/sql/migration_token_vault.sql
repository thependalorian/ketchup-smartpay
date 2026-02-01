/**
 * Token Vault Database Migration
 * 
 * Location: sql/migration_token_vault.sql
 * Purpose: Store Token Vault parameters for QR code validation
 * 
 * Compliance: NamQR v5.0, Token Vault System
 * Integration: Token Vault for QR code parameter storage and validation
 */

-- ============================================================================
-- TOKEN VAULT PARAMETERS TABLE
-- ============================================================================

-- Store NamQR parameters securely in Token Vault
CREATE TABLE IF NOT EXISTS token_vault_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_vault_id VARCHAR(100) NOT NULL UNIQUE, -- Unique identifier from Token Vault
  voucher_id UUID REFERENCES vouchers(id) ON DELETE CASCADE, -- If voucher QR
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL, -- If merchant QR
  namqr_data JSONB NOT NULL, -- Complete NamQR TLV data structure
  purpose_code VARCHAR(10), -- Purpose code (e.g., "18" for government vouchers)
  amount DECIMAL(15, 2), -- Transaction amount (if applicable)
  currency VARCHAR(3) DEFAULT 'NAD',
  is_static BOOLEAN NOT NULL DEFAULT false, -- Static or dynamic QR
  expires_at TIMESTAMP WITH TIME ZONE, -- Expiry for dynamic QR codes
  stored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_token_vault_parameters_token_id ON token_vault_parameters(token_vault_id);
CREATE INDEX IF NOT EXISTS idx_token_vault_parameters_voucher_id ON token_vault_parameters(voucher_id);
CREATE INDEX IF NOT EXISTS idx_token_vault_parameters_merchant_id ON token_vault_parameters(merchant_id);
CREATE INDEX IF NOT EXISTS idx_token_vault_parameters_purpose_code ON token_vault_parameters(purpose_code);
CREATE INDEX IF NOT EXISTS idx_token_vault_parameters_expires_at ON token_vault_parameters(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_token_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trg_token_vault_parameters_updated_at
  BEFORE UPDATE ON token_vault_parameters
  FOR EACH ROW
  EXECUTE FUNCTION update_token_vault_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE token_vault_parameters IS 'Token Vault parameter storage for NamQR code validation (NamQR v5.0 compliance)';
