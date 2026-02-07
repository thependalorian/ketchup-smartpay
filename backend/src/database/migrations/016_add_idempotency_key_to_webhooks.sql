/**
 * Add Idempotency Key to Webhook Events
 *
 * Purpose: Track idempotency keys in webhook_events for duplicate detection
 * PRD Requirement: Idempotency by event id or (voucher_id + status + timestamp)
 */

-- Add idempotency_key column to webhook_events table
ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128);

-- Create index on idempotency_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_webhook_events_idempotency_key ON webhook_events(idempotency_key);

-- Add comment
COMMENT ON COLUMN webhook_events.idempotency_key IS 'Idempotency key for duplicate detection (SHA-256 hash of voucher_id, status, timestamp)';
