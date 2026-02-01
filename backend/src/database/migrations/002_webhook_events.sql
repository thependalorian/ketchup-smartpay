/**
 * Webhook Events Table Migration
 * 
 * Purpose: Store webhook events from Buffr Platform for monitoring and debugging
 * Location: backend/src/database/migrations/002_webhook_events.sql
 */

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  voucher_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_voucher_id ON webhook_events(voucher_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);

-- Comments
COMMENT ON TABLE webhook_events IS 'Stores webhook events received from Buffr Platform';
COMMENT ON COLUMN webhook_events.event_type IS 'Event type: voucher.redeemed, voucher.expired, voucher.delivered, voucher.cancelled, voucher.failed_delivery';
COMMENT ON COLUMN webhook_events.status IS 'Delivery status: pending, delivered, failed';
COMMENT ON COLUMN webhook_events.signature_valid IS 'Whether the HMAC signature was valid';
