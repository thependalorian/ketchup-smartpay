/**
 * Run Trust Account Migration
 * 
 * Location: scripts/run-trust-account-migration.ts
 * Purpose: Execute trust account migration and validate tables
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import logger, { log } from '@/utils/logger';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  logger.info('🚀 Running Trust Account Migration...\n');

  try {
    // Read migration file
    const migrationPath = resolve(process.cwd(), 'sql/migration_trust_account.sql');
    accessSync(migrationPath);
    const migration = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements (handle multi-line)
    const statements = migration
      .split(';')
      .map(s => {
        // Remove comments
        const lines = s.split('\n').map(line => {
          const commentIndex = line.indexOf('--');
          return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        });
        return lines.join('\n').trim();
      })
      .filter(s => s.length > 0 && !s.match(/^\s*$/));

    let success = 0;
    let skipped = 0;
    let errors = 0;

    for (const stmt of statements) {
      if (!stmt || stmt.length < 10) continue;

      try {
        await (sql as any).query(stmt + ';');
        success++;
        logger.info('✅ Executed statement');
      } catch (error: any) {
        const errorMsg = error?.message || '';
        if (
          errorMsg.includes('already exists') ||
          errorMsg.includes('duplicate') ||
          (errorMsg.includes('relation') && errorMsg.includes('already'))
        ) {
          skipped++;
          logger.info('⚠️  Already exists (skipped)');
        } else {
          errors++;
          log.error(`❌ Error: ${errorMsg.substring(0, 150)}`);
        }
      }
    }

    logger.info(`\n📊 Migration Summary: ${success} successful, ${skipped} skipped, ${errors} errors\n`);

    // Validate tables exist
    logger.info('🔍 Validating tables...\n');
    const tables = ['trust_account', 'trust_account_transactions', 'trust_account_reconciliation_log'];
    
    for (const table of tables) {
      try {
        const result = await (sql as any).query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table]
        );
        
        const exists = result.rows?.[0]?.exists || result[0]?.exists;
        if (exists) {
          logger.info(`✅ Table '${table}' exists`);
        } else {
          logger.info(`❌ Table '${table}' does NOT exist`);
        }
      } catch (error: any) {
        log.error(`❌ Error checking table '${table}': ${error.message}`);
      }
    }

    logger.info('\n✅ Migration validation complete!\n');
  } catch (error: any) {
    log.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
