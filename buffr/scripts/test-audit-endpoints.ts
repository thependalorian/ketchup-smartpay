/**
 * Test Audit Log Endpoints
 * 
 * Location: scripts/test-audit-endpoints.ts
 * Purpose: Test audit log retention and backup functionality
 * 
 * Usage:
 *   npx tsx scripts/test-audit-endpoints.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { getRetentionStats } from '../services/auditLogRetention';
import logger, { log } from '@/utils/logger';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

async function testRetentionStats() {
  logger.info('🧪 Testing audit log retention statistics...\n');

  try {
    const stats = await getRetentionStats();
    
    logger.info('📊 Retention Statistics:');
    logger.info(JSON.stringify(stats, null, 2));
    
    logger.info('\n✅ Retention stats retrieved successfully!');
  } catch (error: any) {
    log.error('❌ Error getting retention stats:', error.message);
    if (error.message?.includes('does not exist')) {
      logger.info('⚠️  Note: Base audit log tables may not exist yet. Run base migration first.');
    }
  }
}

async function testTableExistence() {
  logger.info('\n🔍 Checking table existence...\n');
  
  const sql = neon(DATABASE_URL);
  const tables = [
    'audit_logs',
    'pin_audit_logs',
    'voucher_audit_logs',
    'transaction_audit_logs',
    'api_sync_audit_logs',
    'staff_audit_logs',
    'audit_logs_archive',
    'pin_audit_logs_archive',
    'voucher_audit_logs_archive',
    'transaction_audit_logs_archive',
    'api_sync_audit_logs_archive',
    'staff_audit_logs_archive',
  ];

  for (const tableName of tables) {
    try {
      const result = await sql.unsafe(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
        ) as exists
      `);
      
      const exists = result[0]?.exists;
      logger.info(`${exists ? '✅' : '❌'} ${tableName}`);
    } catch (error: any) {
      logger.info(`❌ ${tableName} (error: ${error.message})`);
    }
  }
}

async function main() {
  await testTableExistence();
  await testRetentionStats();
}

main().catch(console.error);
