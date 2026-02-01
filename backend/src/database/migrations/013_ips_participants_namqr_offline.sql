-- IPS Participant Directory and NAMQR offline support
-- Migration: 013_ips_participants_namqr_offline.sql
-- Purpose: ips_participants table for DB-backed participant directory; namqr_codes.offline for offline QR redemption.
-- References: Template implementations, Namibian Open Banking, NAMQR specification.

-- IPS participants (banks, fintechs) – load from DB with fallback to env/config
CREATE TABLE IF NOT EXISTS ips_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  bic VARCHAR(20),
  endpoint VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ips_participants_bic ON ips_participants(bic) WHERE bic IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ips_participants_status ON ips_participants(status);

-- NAMQR offline redemption: QR codes can be generated/validated for offline use (sync when online)
ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS offline BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_namqr_codes_offline ON namqr_codes(offline) WHERE offline = true;
