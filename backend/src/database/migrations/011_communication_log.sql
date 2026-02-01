-- Communication Log Migration
-- Purpose: Log outbound communications to beneficiaries (SMS, USSD, Buffr in-app)
-- Location: backend/src/database/migrations/011_communication_log.sql

CREATE TABLE IF NOT EXISTS communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('sms', 'ussd', 'buffr_in_app', 'email')),
  recipient_type VARCHAR(50) NOT NULL DEFAULT 'beneficiary',
  recipient_id VARCHAR(100),
  recipient_phone VARCHAR(20),
  recipient_user_id VARCHAR(100),
  template_id VARCHAR(100),
  subject TEXT,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  external_id VARCHAR(255),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_communication_log_channel ON communication_log(channel);
CREATE INDEX IF NOT EXISTS idx_communication_log_recipient_id ON communication_log(recipient_id);
CREATE INDEX IF NOT EXISTS idx_communication_log_status ON communication_log(status);
CREATE INDEX IF NOT EXISTS idx_communication_log_created_at ON communication_log(created_at);

COMMENT ON TABLE communication_log IS 'Outbound communications to beneficiaries: SMS, USSD, Buffr in-app, email';
