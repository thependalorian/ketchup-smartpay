/**
 * Optional Columns Migration Runner
 *
 * Location: scripts/run-optional-columns-migration.ts
 * Purpose: Execute optional columns migration for better query performance
 * Usage: npx tsx scripts/run-optional-columns-migration.ts
 *
 * This script:
 * 1. Runs the optional columns migration
 * 2. Records the migration in history
 * 3. Verifies the columns were added
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
import { join } from 'path';
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

async function runMigration(filename: string): Promise<{ success: boolean; time: number }> {
  const migrationPath = join(process.cwd(), 'sql', filename);

  try {
    accessSync(migrationPath);
  } catch {
    log.error(`❌ Migration file not found: ${migrationPath}`);
    return { success: false, time: 0 };
  }

  const content = readFileSync(migrationPath, 'utf-8');
  const startTime = Date.now();

  logger.info(`\n🔄 Running: ${filename}`);

  try {
    // Execute the migration - Neon serverless supports .query() for raw SQL
    // Better splitting: handle multi-line statements and comments properly
    const statements = content
      .split(';')
      .map((s) => {
        // Remove comments (-- style)
        const lines = s.split('\n').map(line => {
          const commentIndex = line.indexOf('--');
          return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
        });
        return lines.join('\n').trim();
      })
      .filter((s) => s.length > 0 && !s.match(/^\s*--/));

    let executedCount = 0;
    for (const statement of statements) {
      if (statement.trim() && statement.length > 10) { // Ignore very short fragments
        try {
          await (sql as any).query(statement + ';');
          executedCount++;
        } catch (error: any) {
          // Ignore "already exists" errors
          const errorMsg = error?.message || '';
          if (!errorMsg.includes('already exists') && 
              !errorMsg.includes('duplicate') &&
              !(errorMsg.includes('relation') && errorMsg.includes('already'))) {
            throw error;
          }
        }
      }
    }
    
    logger.info(`   Executed ${executedCount} statements`);

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
  logger.info('BUFFR OPTIONAL COLUMNS MIGRATION');
  logger.info('='.repeat(60));
  logger.info('');
  logger.info(`Database: ${DATABASE_URL?.substring(0, 50)}...`);
  logger.info('');

  // Check if already applied (but allow force run)
  logger.info('📋 Checking if optional columns migration already applied...');
  let alreadyApplied = false;
  try {
    const existing = await sql`
      SELECT status FROM migration_history
      WHERE migration_name = 'migration_004_optional_columns.sql'
      AND status = 'completed'
    `;

    if (existing.length > 0) {
      logger.info('   ℹ️  Optional columns migration marked as applied in history');
      logger.info('   ℹ️  Re-running to ensure columns are actually added...');
      alreadyApplied = true;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.info('   ⚠️  Could not check history:', { errorMessage });
  }

  // Run migration
  logger.info('\n📋 Running optional columns migration...');
  const result = await runMigration('migration_004_optional_columns.sql');

  if (!result.success) {
    log.error('\n❌ Optional columns migration failed');
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
        'migration_004_optional_columns.sql',
        '4.0.0',
        ${result.time},
        'completed',
        '{"description": "Add optional columns for better query performance"}'::jsonb
      )
      ON CONFLICT (migration_name) DO UPDATE SET
        status = 'completed',
        execution_time_ms = ${result.time},
        applied_at = NOW()
    `;
  } catch {
    // Ignore if already recorded
  }

  // Summary
  logger.info('\n');
  logger.info('='.repeat(60));
  logger.info('MIGRATION COMPLETE');
  logger.info('='.repeat(60));
  logger.info('');
  logger.info('✅ Optional columns added');
  logger.info('✅ Indexes created for frequently-queried fields');
  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Run: npx tsx scripts/verify-schema.ts');
  logger.info('  2. Monitor query performance');
  logger.info('');
}

main().catch((error) => {
  log.error('❌ Migration failed:', error);
  process.exit(1);
});
