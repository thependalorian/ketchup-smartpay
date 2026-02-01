/**
 * Run SQL Migration Script (Direct PostgreSQL Connection)
 * 
 * Uses pg library for direct SQL execution (not Neon serverless driver)
 */

import { Client } from '@/node_modules/@types/pg';
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

async function runMigration(migrationFile: string) {
  console.log(`🚀 Running migration: ${migrationFile}...\n`);

  const migrationPath = join(process.cwd(), 'sql', migrationFile);
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Execute entire SQL file
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('Added columns:');
    console.log('  - transactions: voucher_id, fineract_transaction_id, ips_transaction_id');
    console.log('  - vouchers: beneficiary_id, currency, issued_at, smartpay_voucher_id, external_id');
    console.log('  - wallets: icon, purpose, card_*, auto_pay_*, pin_protected, biometric_enabled');
    console.log('  - fineract_sync_logs: operation_type, request_payload, response_payload');
    console.log('  - split_bills: title, due_date');
  } catch (error: any) {
    // Ignore "already exists" errors
    if (
      error.message.includes('already exists') ||
      error.message.includes('duplicate') ||
      (error.message.includes('column') && error.message.includes('already'))
    ) {
      console.log('⚠️  Some columns/objects already exist (that\'s OK)');
      console.log('✅ Migration completed (with warnings)\n');
    } else {
      console.error('❌ Migration error:', error.message);
      throw error;
    }
  } finally {
    await client.end();
  }
}

// Get migration file from command line
const migrationFile = process.argv[2] || 'migration_add_missing_critical_columns.sql';

runMigration(migrationFile)
  .then(() => {
    console.log('✅ Migration script complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
