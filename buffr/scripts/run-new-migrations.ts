/**
 * Run New Ecosystem Migrations
 * 
 * Location: scripts/run-new-migrations.ts
 * Purpose: Run the 5 new ecosystem migration files
 * 
 * Usage:
 *   npx tsx scripts/run-new-migrations.ts
 * 
 * Migrations:
 * 1. migration_nampost_branches.sql
 * 2. migration_recommendation_engine.sql
 * 3. migration_leadership_boards.sql
 * 4. migration_merchant_agent_onboarding.sql
 * 5. migration_geoclustering.sql
 */

import { neon } from '@neondatabase/serverless';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { config } from 'dotenv';
import { createHash } from 'crypto';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// New migrations to run
const NEW_MIGRATIONS = [
  'migration_nampost_branches.sql',
  'migration_recommendation_engine.sql',
  'migration_leadership_boards.sql',
  'migration_merchant_agent_onboarding.sql',
  'migration_geoclustering.sql',
];

interface MigrationResult {
  filename: string;
  success: boolean;
  error?: string;
  executionTime: number;
}

async function ensureMigrationHistoryTable() {
  try {
    await sql`
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
    `;
    console.log('✅ Migration history table ready');
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      throw error;
    }
  }
}

async function isMigrationExecuted(filename: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT migration_name 
      FROM migration_history 
      WHERE migration_name = ${filename}
    `;
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

function calculateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function executeMigration(filename: string): Promise<MigrationResult> {
  const startTime = Date.now();
  console.log(`\n📄 Executing: ${filename}...`);

  try {
    const migrationPath = join(process.cwd(), 'sql', filename);
    const migrationContent = await readFile(migrationPath, 'utf-8');
    const checksum = calculateChecksum(migrationContent);

    // Check if already executed
    const alreadyExecuted = await isMigrationExecuted(filename);
    if (alreadyExecuted) {
      console.log(`⏭️  Skipped (already executed): ${filename}`);
      return {
        filename,
        success: true,
        executionTime: 0,
      };
    }

    // Execute migration SQL
    await sql.unsafe(migrationContent);

    // Record in migration history
    await sql`
      INSERT INTO migration_history (
        migration_name,
        migration_version,
        checksum,
        applied_by,
        execution_time_ms,
        status,
        metadata
      )
      VALUES (
        ${filename},
        '1.0.0',
        ${checksum},
        'system',
        ${Date.now() - startTime},
        'completed',
        '{"description": "Ecosystem migration", "executed_by": "run-new-migrations.ts"}'
      )
    `;

    const executionTime = Date.now() - startTime;
    console.log(`✅ Completed: ${filename} (${executionTime}ms)`);
    
    return {
      filename,
      success: true,
      executionTime,
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    
    // Record failure in migration history
    try {
      await sql`
        INSERT INTO migration_history (
          migration_name,
          migration_version,
          applied_by,
          execution_time_ms,
          status,
          metadata
        )
        VALUES (
          ${filename},
          '1.0.0',
          'system',
          ${executionTime},
          'failed',
          ${JSON.stringify({ error: error.message })}
        )
        ON CONFLICT (migration_name) DO UPDATE
        SET status = 'failed',
            metadata = ${JSON.stringify({ error: error.message })}
      `;
    } catch (historyError) {
      // Ignore history errors
    }

    return {
      filename,
      success: false,
      error: error.message,
      executionTime,
    };
  }
}

async function main() {
  console.log('🚀 Running New Ecosystem Migrations\n');
  console.log('=' .repeat(60));

  try {
    // Ensure migration history table exists
    await ensureMigrationHistoryTable();

    const results: MigrationResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Execute each migration
    for (const migration of NEW_MIGRATIONS) {
      const result = await executeMigration(migration);
      results.push(result);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`\n❌ Migration failed: ${migration}`);
        console.error(`   Stopping execution.`);
        break; // Stop on first failure
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📋 Total: ${NEW_MIGRATIONS.length}`);

    if (failCount === 0) {
      console.log('\n🎉 All migrations completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some migrations failed. Please review errors above.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Migration runner error:', error.message);
    process.exit(1);
  }
}

main();
