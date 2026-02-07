/**
 * Idempotency Records Table Migration
 *
 * Purpose: Store idempotency keys to prevent duplicate processing
 * PRD Requirement: "All distribution and webhook handlers accept idempotency key"
 * Aligned with buffr/utils/idempotency.ts
 */

-- Idempotency keys table for duplicate prevention (aligned with buffr)
CREATE TABLE IF NOT EXISTS idempotency_keys (
  idempotency_key VARCHAR(128) NOT NULL,
  endpoint_prefix VARCHAR(64) NOT NULL DEFAULT 'distribution',
  response_status INTEGER NOT NULL,
  response_body JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + interval '24 hours',
  PRIMARY KEY (idempotency_key, endpoint_prefix)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at);

-- Comments
COMMENT ON TABLE idempotency_keys IS 'Stores idempotency keys to prevent duplicate processing in webhooks and distribution';
COMMENT ON COLUMN idempotency_keys.idempotency_key IS 'Unique idempotency key (SHA-256 hash of voucher_id, status, timestamp)';
COMMENT ON COLUMN idempotency_keys.endpoint_prefix IS 'Endpoint prefix (distribution, webhook, voucher)';
COMMENT ON COLUMN idempotency_keys.response_status IS 'HTTP status code of the cached response';
COMMENT ON COLUMN idempotency_keys.response_body IS 'Cached response data for duplicate requests';
COMMENT ON COLUMN idempotency_keys.expires_at IS 'TTL for idempotency key (24 hours default)';
