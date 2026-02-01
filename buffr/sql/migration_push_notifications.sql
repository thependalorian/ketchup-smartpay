-- ============================================================================
-- PUSH NOTIFICATIONS MIGRATION
-- Version: 5.13.0
-- Purpose: Push notification token storage and logging
-- ============================================================================

-- Push Tokens Table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for push_tokens
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_unique ON push_tokens(user_id, token);

-- Notification Logs Table (for tracking sent notifications)
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  target_users JSONB DEFAULT '[]',
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at DESC);

-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE,
  transactions_enabled BOOLEAN DEFAULT true,
  security_enabled BOOLEAN DEFAULT true,
  promotions_enabled BOOLEAN DEFAULT true,
  reminders_enabled BOOLEAN DEFAULT true,
  achievements_enabled BOOLEAN DEFAULT true,
  quests_enabled BOOLEAN DEFAULT true,
  learning_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Updated_at trigger for push_tokens
CREATE OR REPLACE FUNCTION update_push_tokens_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS push_tokens_updated_at ON push_tokens;
CREATE TRIGGER push_tokens_updated_at
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_timestamp();

-- Updated_at trigger for notification_preferences
DROP TRIGGER IF EXISTS notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_timestamp();

-- View for active tokens per user
CREATE OR REPLACE VIEW v_user_push_tokens AS
SELECT 
  user_id,
  COUNT(*) as total_tokens,
  COUNT(*) FILTER (WHERE platform = 'ios') as ios_tokens,
  COUNT(*) FILTER (WHERE platform = 'android') as android_tokens,
  MAX(updated_at) as last_activity
FROM push_tokens
WHERE is_active = true
GROUP BY user_id;

COMMENT ON TABLE push_tokens IS 'Stores Expo push notification tokens for users';
COMMENT ON TABLE notification_logs IS 'Logs all sent push notifications for audit';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification types';
