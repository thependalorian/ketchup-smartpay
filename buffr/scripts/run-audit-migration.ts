/**
 * Run Audit Logs Migration
 * 
 * Location: scripts/run-audit-migration.ts
 * Purpose: Execute audit logs migration
 * 
 * Usage:
 *   npx tsx scripts/run-audit-migration.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import { join } from 'path';
import logger, { log } from '@/utils/logger';

// Load environment variables
let envPath = '.env.local';
try {
  accessSync(envPath);
} catch {
  envPath = '.env';
}

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach((line: string) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  logger.warn('Could not load .env file, using environment variables');
}

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  logger.info('🚀 Running Audit Logs Migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'sql', 'migration_audit_logs.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    logger.info('📄 Migration file loaded\n');
    
    // Extract CREATE TABLE and separate statements
    const createTableMatch = migrationSQL.match(/CREATE TABLE[^;]+;/is);
    const indexStatements = migrationSQL.match(/CREATE INDEX[^;]+;/gi) || [];
    const commentStatements = migrationSQL.match(/COMMENT[^;]+;/gi) || [];
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Execute CREATE TABLE first
    if (createTableMatch) {
      try {
        await sql(createTableMatch[0]);
        successCount++;
        logger.info('✅ Created audit_logs table');
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          skippedCount++;
          logger.info('⚠️  audit_logs table already exists');
        } else {
          errorCount++;
          log.error(`❌ Error creating table: ${err.message.substring(0, 100)}`);
        }
      }
    }
    
    // Execute indexes
    for (let i = 0; i < indexStatements.length; i++) {
      try {
        await sql(indexStatements[i]);
        successCount++;
        logger.info(`✅ Created index ${i + 1}`);
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          skippedCount++;
          logger.info(`⚠️  Index ${i + 1} already exists`);
        } else {
          errorCount++;
          log.error(`❌ Error creating index ${i + 1}: ${err.message.substring(0, 100)}`);
        }
      }
    }
    
    // Execute comments
    for (let i = 0; i < commentStatements.length; i++) {
      try {
        await sql(commentStatements[i]);
        successCount++;
      } catch (err: any) {
        // Comments can fail silently
        skippedCount++;
      }
    }
    
    logger.info(`\n📊 Summary: ${successCount} successful, ${skippedCount} skipped, ${errorCount} errors\n`);
    
    // Verify migration
    logger.info('🔍 Verifying migration...\n');
    
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'audit_logs'
      )
    `;
    
    if (tableExists[0]?.exists) {
      logger.info('✅ audit_logs table created');
      
      const indexes = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'audit_logs'
        ORDER BY indexname
      `;
      
      logger.info(`\n📋 Created indexes (${indexes.length}):`);
      indexes.forEach((idx: any) => {
        logger.info(`   ✅ ${idx.indexname}`);
      });
    } else {
      logger.info('⚠️  audit_logs table not found');
    }
    
    logger.info('\n✅ Migration verification complete!\n');
    
  } catch (error: any) {
    log.error('❌ Migration failed:', error.message);
    log.error(error);
    process.exit(1);
  }
}

runMigration().catch(console.error);
