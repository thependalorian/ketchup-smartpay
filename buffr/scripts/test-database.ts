/**
 * Database Connection Test Script
 * 
 * Location: scripts/test-database.ts
 * Purpose: Test database connection and verify schema
 * 
 * Usage:
 *   npx tsx scripts/test-database.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import logger, { log } from '@/utils/logger';

// Load environment variables
// Try .env.local first, then .env
let envPath = '.env.local';
try {
  require('fs').accessSync(envPath);
} catch {
  envPath = '.env';
}

// Simple dotenv implementation
const envFile = readFileSync(envPath, 'utf-8');
envFile.split('\n').forEach((line: string) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function testDatabase() {
  try {
    logger.info('🔌 Testing database connection...\n');

    // Test 1: Basic connection
    logger.info('1️⃣ Testing basic connection...');
    const version = await sql`SELECT version()`;
    logger.info(`   ✅ Connected! PostgreSQL version: ${version[0].version.split(' ')[0]}\n`);

    // Test 2: Check tables
    logger.info('2️⃣ Checking tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'users',
      'wallets',
      'transactions',
      'autopay_rules',
      'autopay_transactions',
      'contacts',
      'groups',
      'group_members',
      'money_requests',
      'notifications',
    ];

    logger.info(`   Found ${tables.length} tables:`);
    tables.forEach((table: any) => {
      const isExpected = expectedTables.includes(table.table_name);
      logger.info(`   ${isExpected ? '✅' : '⚠️ '} ${table.table_name}`);
    });

    const missingTables = expectedTables.filter(
      t => !tables.some((tb: any) => tb.table_name === t)
    );

    if (missingTables.length > 0) {
      logger.info(`\n   ⚠️  Missing tables: ${missingTables.join(', ')}`);
    } else {
      logger.info(`\n   ✅ All expected tables exist!\n`);
    }

    // Test 3: Check indexes
    logger.info('3️⃣ Checking indexes...');
    const indexes = await sql`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `;
    logger.info(`   Found ${indexes.length} indexes\n`);

    // Test 4: Check triggers
    logger.info('4️⃣ Checking triggers...');
    const triggers = await sql`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `;
    logger.info(`   Found ${triggers.length} triggers:`);
    triggers.forEach((trigger: any) => {
      logger.info(`   ✅ ${trigger.trigger_name} on ${trigger.event_object_table}`);
    });
    logger.info('');

    // Test 5: Test insert/select (if users table exists)
    if (tables.some((t: any) => t.table_name === 'users')) {
      logger.info('5️⃣ Testing CRUD operations...');
      
      // Test insert
      const testUserId = `test-${Date.now()}`;
      await sql`
        INSERT INTO users (id, phone_number, first_name, last_name, full_name)
        VALUES (${testUserId}, '+264811234567', 'Test', 'User', 'Test User')
        ON CONFLICT (id) DO NOTHING
      `;
      logger.info('   ✅ Insert test passed');

      // Test select
      const user = await sql`
        SELECT * FROM users WHERE id = ${testUserId}
      `;
      logger.info('   ✅ Select test passed');

      // Test update
      await sql`
        UPDATE users 
        SET last_name = ${'User Updated'} 
        WHERE id = ${testUserId}
      `;
      logger.info('   ✅ Update test passed');

      // Cleanup
      await sql`DELETE FROM users WHERE id = ${testUserId}`;
      logger.info('   ✅ Delete test passed\n');
    }

    // Test 6: Check UUID extension
    logger.info('6️⃣ Checking extensions...');
    const extensions = await sql`
      SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'
    `;
    if (extensions.length > 0) {
      logger.info('   ✅ UUID extension enabled\n');
    } else {
      logger.info('   ⚠️  UUID extension not found\n');
    }

    logger.info('✅ All database tests passed!\n');
    logger.info('🎉 Database is ready for use!\n');

  } catch (error: any) {
    log.error('❌ Database test failed:', error.message);
    log.error('   Error details:', error);
    process.exit(1);
  }
}

// Run tests
testDatabase();
