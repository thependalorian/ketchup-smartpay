/**
 * Schema Fixes Migration Runner
 *
 * Location: scripts/run-schema-fixes.ts
 * Purpose: Execute schema fixes migration and record in history
 * Usage: npx tsx scripts/run-schema-fixes.ts
 *
 * This script:
 * 1. Creates the migration_history table if needed
 * 2. Runs the schema fixes migration
 * 3. Records the migration in history
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import logger, { log } from '@/utils/logger';

// Load environment variables
function loadEnv(): void {
  const envPaths = ['.env.local', '.env'];

  for (const envPath of envPaths) {
    try {
      accessSync(envPath);
      const envFile = readFileSync(envPath, 'utf-8');
      envFile.split('\n').forEach((line: string) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes
          value = value.replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      logger.info(`✅ Loaded environment from ${envPath}`);
      return;
    } catch {
      // Continue to next file
    }
  }
  logger.info('⚠️  No .env file found, using existing environment variables');
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

function calculateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex').substring(0, 16);
}

async function runMigration(filename: string): Promise<{ success: boolean; time: number }> {
  const migrationPath = join(process.cwd(), 'sql', filename);

  try {
    accessSync(migrationPath);
  } catch {
    log.error(`❌ Migration file not found: ${migrationPath}`);
    return { success: false, time: 0 };
  }

  const content = readFileSync(migrationPath, 'utf-8');
  const checksum = calculateChecksum(content);
  const startTime = Date.now();

  logger.info(`\n🔄 Running: ${filename}`);
  logger.info(`   Checksum: ${checksum}`);

  try {
    // Execute the migration - Neon serverless supports .query() for raw SQL
    // Split by semicolons and execute each statement
    const statements = content
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        // Use .query() method for raw SQL DDL statements
        await (sql as any).query(statement);
      }
    }

    const executionTime = Date.now() - startTime;
    logger.info(`   ✅ Completed in ${executionTime}ms`);

    return { success: true, time: executionTime };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`   ❌ Failed: ${errorMessage}`);
    return { success: false, time: Date.now() - startTime };
  }
}

async function main() {
  logger.info('='.repeat(60));
  logger.info('BUFFR SCHEMA FIXES MIGRATION');
  logger.info('='.repeat(60));
  logger.info('');
  logger.info(`Database: ${DATABASE_URL?.substring(0, 50)}...`);
  logger.info('');

  // Step 1: Create migration history table
  logger.info('📋 Step 1: Creating migration history table...');
  const historyResult = await runMigration('migration_000_history.sql');

  if (!historyResult.success) {
    // Try inline creation if file doesn't work
    logger.info('   Attempting inline creation...');
    try {
      await (sql as any).query(`
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          migration_version VARCHAR(50),
          checksum VARCHAR(64),
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          applied_by VARCHAR(255) DEFAULT 'system',
          execution_time_ms INTEGER,
          status VARCHAR(20) DEFAULT 'completed',
          rollback_sql TEXT,
          metadata JSONB DEFAULT '{}'
        )
      `);
      logger.info('   ✅ Migration history table created inline');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('already exists')) {
        logger.info('   ℹ️  Migration history table already exists');
      } else {
        log.error('   ❌ Failed to create history table:', errorMessage);
        process.exit(1);
      }
    }
  }

  // Step 2: Check if schema fixes already applied
  logger.info('\n📋 Step 2: Checking if schema fixes already applied...');
  try {
    const existing = await sql`
      SELECT status FROM migration_history
      WHERE migration_name = 'migration_003_schema_fixes.sql'
      AND status = 'completed'
    `;

    if (existing.length > 0) {
      logger.info('   ℹ️  Schema fixes already applied, skipping...');
    } else {
      // Step 3: Run schema fixes migration
      logger.info('\n📋 Step 3: Running schema fixes migration...');
      const schemaResult = await runMigration('migration_003_schema_fixes.sql');

      if (!schemaResult.success) {
        log.error('\n❌ Schema fixes migration failed');
        process.exit(1);
      }

      // Record in history
      try {
        await sql`
          INSERT INTO migration_history (
            migration_name,
            migration_version,
            execution_time_ms,
            status,
            metadata
          )
          VALUES (
            'migration_003_schema_fixes.sql',
            '3.0.0',
            ${schemaResult.time},
            'completed',
            '{"description": "Add missing schema fields"}'::jsonb
          )
          ON CONFLICT (migration_name) DO UPDATE SET
            status = 'completed',
            execution_time_ms = ${schemaResult.time},
            applied_at = NOW()
        `;
      } catch {
        // Ignore if already recorded
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.info('   ⚠️  Could not check history:', { errorMessage });

    // Still try to run the migration
    logger.info('\n📋 Running schema fixes migration...');
    const schemaResult = await runMigration('migration_003_schema_fixes.sql');

    if (!schemaResult.success) {
      log.error('\n❌ Schema fixes migration failed');
      process.exit(1);
    }
  }

  // Summary
  logger.info('\n');
  logger.info('='.repeat(60));
  logger.info('MIGRATION COMPLETE');
  logger.info('='.repeat(60));
  logger.info('');
  logger.info('✅ Migration history table ready');
  logger.info('✅ Schema fixes applied');
  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Run: npx tsx scripts/verify-schema.ts');
  logger.info('  2. Run: npm run typecheck');
  logger.info('  3. Run: npm test');
  logger.info('');
}

main().catch((error) => {
  log.error('❌ Migration failed:', error);
  process.exit(1);
});
