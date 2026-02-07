/**
 * Add Beneficiary Duplicate Detection Columns
 *
 * Purpose: Track id_number and hash for duplicate beneficiary detection
 * PRD Requirement: National ID Numbers with hash for duplicate detection
 */

-- Add id_number column if not exists (for national ID tracking)
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);

-- Add national_id_hash for duplicate detection (one-way hash)
ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS national_id_hash VARCHAR(128);

-- Add index on national_id_hash for fast duplicate lookups
CREATE INDEX IF NOT EXISTS idx_beneficiaries_national_id_hash ON beneficiaries(national_id_hash);

-- Add index on id_number for lookups
CREATE INDEX IF NOT EXISTS idx_beneficiaries_id_number ON beneficiaries(id_number);

-- Comments
COMMENT ON COLUMN beneficiaries.id_number IS 'National ID number for beneficiary identification';
COMMENT ON COLUMN beneficiaries.national_id_hash IS 'SHA-256 hash of id_number for duplicate detection (one-way, non-reversible)';
