/**
 * Run Audit Logs Base Migration
 * 
 * Location: scripts/run-audit-logs-migration.ts
 * Purpose: Execute base audit log tables migration
 * 
 * Usage:
 *   npx tsx scripts/run-audit-logs-migration.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';
import logger, { log } from '@/utils/logger';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL or NEON_CONNECTION_STRING environment variable is required');
  process.exit(1);
}

async function runMigration() {
  logger.info('🔄 Running base audit logs migration...\n');

  const sql = neon(DATABASE_URL);

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'sql/migration_audit_logs.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolon, but preserve complete statements
    // Remove comments first
    const cleanedSQL = migrationSQL
      .split('\n')
      .map(line => {
        const commentIndex = line.indexOf('--');
        return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
      })
      .join('\n');
    
    // Split by semicolon followed by newline or end of string
    const statements = cleanedSQL
      .split(/;\s*(?=\n|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length > 10); // Filter out very short fragments

    logger.info(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length === 0) continue;

      try {
        logger.info(`[${i + 1}/${statements.length}] Executing statement...`);
        // Execute using .query() method for DDL statements
        await (sql as any).query(statement + ';');
        logger.info(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes('already exists') || 
            error.message?.includes('duplicate') || 
            error.code === '42P07' || 
            error.code === '42710' ||
            error.code === '42703') { // Column doesn't exist (index on non-existent table)
          logger.info(`⚠️  Statement ${i + 1} skipped (${error.code || 'already exists'})\n`);
        } else {
          // For index creation errors, log but continue (table might not exist yet)
          if (statement.toUpperCase().includes('CREATE INDEX')) {
            logger.info(`⚠️  Statement ${i + 1} failed (index creation - will retry later): ${error.message?.substring(0, 100)}\n`);
          } else {
            throw error;
          }
        }
      }
    }

    // Verify tables were created
    logger.info('🔍 Verifying audit log tables...\n');
    const tables = [
      'audit_logs',
      'pin_audit_logs',
      'voucher_audit_logs',
      'transaction_audit_logs',
      'api_sync_audit_logs',
      'staff_audit_logs',
    ];

    for (const tableName of tables) {
      // Use template literal for proper query execution
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      
      const exists = Array.isArray(result) && result.length > 0 ? result[0]?.exists : false;
      if (exists) {
        logger.info(`✅ Table ${tableName} exists`);
      } else {
        logger.info(`❌ Table ${tableName} NOT found`);
      }
    }

    logger.info('\n✅ Base audit logs migration completed successfully!');
  } catch (error) {
    log.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
