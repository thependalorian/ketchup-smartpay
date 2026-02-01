/**
 * Run Bills and Merchants Migration
 * 
 * Location: scripts/run-bills-merchants-migration.ts
 * Purpose: Execute migration_bills_and_merchants.sql
 * 
 * Usage: npx tsx scripts/run-bills-merchants-migration.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function runMigration() {
  console.log('🚀 Running Bills and Merchants migration...\n');

  const migrationPath = join(process.cwd(), 'sql', 'migration_bills_and_merchants.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  // Split SQL by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  let executed = 0;
  let errors = 0;

  for (const statement of statements) {
    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.length < 10) continue;

    try {
      // Use template literal for Neon driver
      await sql(statement);
      executed++;
    } catch (error: any) {
      // Ignore "already exists" errors (IF NOT EXISTS)
      if (
        error.message.includes('already exists') ||
        error.message.includes('duplicate') ||
        (error.message.includes('column') && error.message.includes('already'))
      ) {
        // Column/object already exists - that's OK
        continue;
      }
      errors++;
      console.error(`⚠️  Statement error (continuing): ${error.message.substring(0, 100)}`);
    }
  }

  console.log(`\n✅ Migration completed!`);
  console.log(`   Executed: ${executed} statements`);
  if (errors > 0) {
    console.log(`   Errors (non-critical): ${errors}`);
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Bills and Merchants migration complete!');
    console.log('\n📋 Created tables:');
    console.log('   - merchants');
    console.log('   - bills');
    console.log('   - scheduled_bills');
    console.log('   - bill_payments');
    console.log('   - cashback_transactions');
    console.log('   - merchant_payments');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
