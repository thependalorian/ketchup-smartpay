/**
 * Fixed Migration Runner
 * 
 * Executes migrations properly by running entire SQL file as one statement
 */

import { neon } from '@neondatabase/serverless';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { config } from 'dotenv';
import { createHash } from 'crypto';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const NEW_MIGRATIONS = [
  'migration_nampost_branches.sql',
  'migration_recommendation_engine.sql',
  'migration_leadership_boards.sql',
  'migration_merchant_agent_onboarding.sql',
  'migration_geoclustering.sql',
];

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
  } catch (error: any) {
    if (!error.message.includes('already exists')) {
      throw error;
    }
  }
}

async function isMigrationExecuted(filename: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT migration_name, status
      FROM migration_history 
      WHERE migration_name = ${filename} AND status = 'completed'
    `;
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

function calculateChecksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

async function executeMigration(filename: string): Promise<{ success: boolean; error?: string; time: number }> {
  const startTime = Date.now();
  console.log(`\n📄 Executing: ${filename}...`);

  try {
    const migrationPath = join(process.cwd(), 'sql', filename);
    let migrationContent = await readFile(migrationPath, 'utf-8');
    
    // Remove migration history insert to avoid duplicate
    migrationContent = migrationContent.replace(
      /INSERT INTO migration_history[\s\S]*?ON CONFLICT.*?DO NOTHING;/g,
      ''
    );
    
    const checksum = calculateChecksum(migrationContent);

    // Check if already executed
    const alreadyExecuted = await isMigrationExecuted(filename);
    if (alreadyExecuted) {
      console.log(`⏭️  Skipped (already executed): ${filename}`);
      return { success: true, time: 0 };
    }

    // Execute entire migration as one statement
    // Neon serverless driver handles multi-statement SQL properly
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
        '{"description": "Ecosystem migration", "executed_by": "run-migrations-fixed.ts"}'
      )
      ON CONFLICT (migration_name) DO UPDATE
      SET status = 'completed',
          checksum = ${checksum},
          execution_time_ms = ${Date.now() - startTime}
    `;

    const executionTime = Date.now() - startTime;
    console.log(`✅ Completed: ${filename} (${executionTime}ms)`);
    
    return { success: true, time: executionTime };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`❌ Failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    
    // Record failure
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
      // Ignore
    }

    return { success: false, error: error.message, time: executionTime };
  }
}

async function main() {
  console.log('🚀 Running Ecosystem Migrations (Fixed)\n');
  console.log('='.repeat(60));

  try {
    await ensureMigrationHistoryTable();

    let successCount = 0;
    let failCount = 0;

    for (const migration of NEW_MIGRATIONS) {
      const result = await executeMigration(migration);
      
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        console.error(`\n❌ Migration failed: ${migration}`);
        console.error(`   Stopping execution.`);
        break;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📋 Total: ${NEW_MIGRATIONS.length}`);

    if (failCount === 0) {
      console.log('\n🎉 All migrations completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Some migrations failed.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Migration runner error:', error.message);
    process.exit(1);
  }
}

main();
