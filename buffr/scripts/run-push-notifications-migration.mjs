/**
 * Push Notifications Migration Script
 * Run: node scripts/run-push-notifications-migration.mjs
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('🚀 Starting Push Notifications Migration...\n');

  try {
    // 1. Create push_tokens table
    console.log('Creating push_tokens table...');
    await sql`
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
      )
    `;
    console.log('✅ push_tokens table created');

    // 2. Create notification_logs table
    console.log('Creating notification_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        target_users JSONB DEFAULT '[]',
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ notification_logs table created');

    // 3. Create notification_preferences table
    console.log('Creating notification_preferences table...');
    await sql`
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
      )
    `;
    console.log('✅ notification_preferences table created');

    // 4. Create indexes
    console.log('Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id)`;
    console.log('✅ Indexes created');

    console.log('\n✅ Push Notifications Migration Complete!');
    console.log('\nTables created:');
    console.log('  - push_tokens (stores Expo push tokens)');
    console.log('  - notification_logs (audit trail for sent notifications)');
    console.log('  - notification_preferences (user notification settings)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
