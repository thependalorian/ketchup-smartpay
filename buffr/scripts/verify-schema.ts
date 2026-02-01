/**
 * Schema Verification Script
 *
 * Location: scripts/verify-schema.ts
 * Purpose: Verify database schema matches code expectations
 * Usage: npx tsx scripts/verify-schema.ts
 *
 * This script checks that all required columns exist in the database
 * and reports any missing or extra columns.
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, accessSync } from 'fs';
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
      logger.info(`Loaded environment from ${envPath}`);
      return;
    } catch {
      // Continue to next file
    }
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Define expected schema based on types/database.ts
const EXPECTED_SCHEMA: Record<string, { required: string[]; recommended: string[] }> = {
  users: {
    required: ['id', 'phone_number', 'is_verified', 'created_at'],
    recommended: [
      'external_id',
      'kyc_level',
      'metadata',
      'email',
      'first_name',
      'last_name',
      'full_name',
      'avatar',
      'is_two_factor_enabled',
      'currency',
      'status',
      'role',
      'buffr_id',
      'last_login_at',
      'updated_at',
    ],
  },
  wallets: {
    required: ['id', 'user_id', 'name', 'balance', 'currency', 'created_at'],
    recommended: [
      'available_balance',
      'is_default',
      'status',
      'metadata',
      'icon',
      'type',
      'purpose',
      'card_design',
      'card_number',
      'cardholder_name',
      'expiry_date',
      'auto_pay_enabled',
      'auto_pay_max_amount',
      'auto_pay_frequency',
      'pin_protected',
      'biometric_enabled',
      'last_transaction_at',
      'dormancy_status',
      'updated_at',
    ],
  },
  transactions: {
    required: ['id', 'user_id', 'amount', 'status', 'created_at'],
    recommended: [
      'external_id',
      'wallet_id',
      'type',
      'transaction_type',
      'transaction_time',
      'currency',
      'description',
      'category',
      'recipient_id',
      'recipient_name',
      'merchant_name',
      'merchant_category',
      'merchant_id',
      'metadata',
      'date',
      'processing_started_at',
      'settlement_status',
    ],
  },
  contacts: {
    required: ['id', 'user_id', 'name', 'created_at'],
    recommended: ['phone_number', 'email', 'avatar', 'bank_code', 'is_favorite', 'metadata', 'updated_at'],
  },
  groups: {
    required: ['id', 'name', 'owner_id', 'created_at'], // Note: schema uses owner_id, not creator_id
    recommended: [
      'description',
      'type',
      'avatar',
      'target_amount',
      'current_amount',
      'currency',
      'is_active',
      'metadata',
      'updated_at',
    ],
  },
  money_requests: {
    required: ['id', 'from_user_id', 'to_user_id', 'amount', 'status', 'created_at'], // Note: schema uses from_user_id/to_user_id, not requester_id/recipient_id
    recommended: ['currency', 'description', 'paid_amount', 'paid_at', 'expires_at', 'metadata', 'updated_at'],
  },
  notifications: {
    required: ['id', 'user_id', 'title', 'message', 'created_at'],
    recommended: ['type', 'data', 'is_read', 'read_at'],
  },
  migration_history: {
    required: ['id', 'migration_name', 'applied_at', 'status'],
    recommended: ['migration_version', 'checksum', 'applied_by', 'execution_time_ms', 'rollback_sql', 'metadata'],
  },
};

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    const columns = await sql<ColumnInfo[]>`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    return columns.map((c) => c.column_name);
  } catch {
    return [];
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${tableName}
    `;
    return result.length > 0;
  } catch {
    return false;
  }
}

async function verifySchema() {
  logger.info('='.repeat(60));
  logger.info('BUFFR SCHEMA VERIFICATION');
  logger.info('='.repeat(60));
  logger.info('');

  let totalIssues = 0;
  let totalWarnings = 0;
  let totalPassed = 0;

  for (const [tableName, expectations] of Object.entries(EXPECTED_SCHEMA)) {
    logger.info(`\n📋 Table: ${tableName}`);
    logger.info('-'.repeat(40));

    // Check if table exists
    const exists = await tableExists(tableName);
    if (!exists) {
      logger.info(`   ❌ TABLE MISSING: ${tableName}`);
      totalIssues++;
      continue;
    }

    const columns = await getTableColumns(tableName);

    // Check required columns
    logger.info('   Required columns:');
    for (const required of expectations.required) {
      if (columns.includes(required)) {
        logger.info(`   ✅ ${required}`);
        totalPassed++;
      } else {
        logger.info(`   ❌ MISSING: ${required}`);
        totalIssues++;
      }
    }

    // Check recommended columns
    logger.info('   Recommended columns:');
    for (const recommended of expectations.recommended) {
      if (columns.includes(recommended)) {
        logger.info(`   ✅ ${recommended}`);
        totalPassed++;
      } else {
        logger.info(`   ⚠️  missing: ${recommended}`);
        totalWarnings++;
      }
    }

    // List extra columns
    const allExpected = [...expectations.required, ...expectations.recommended];
    const extraColumns = columns.filter((c) => !allExpected.includes(c));
    if (extraColumns.length > 0) {
      logger.info(`   ℹ️  Extra columns: ${extraColumns.join(', ')}`);
    }
  }

  // Check migration history
  logger.info('\n📋 Migration History');
  logger.info('-'.repeat(40));

  try {
    const migrations = await sql<{ migration_name: string; status: string; applied_at: Date }[]>`
      SELECT migration_name, status, applied_at
      FROM migration_history
      ORDER BY applied_at DESC
      LIMIT 10
    `;

    if (migrations.length === 0) {
      logger.info('   ⚠️  No migrations recorded');
    } else {
      logger.info(`   ✅ ${migrations.length} migrations tracked`);
      for (const m of migrations.slice(0, 5)) {
        const date = new Date(m.applied_at).toISOString().split('T')[0];
        logger.info(`      - ${m.migration_name} (${m.status}, ${date})`);
      }
    }
  } catch {
    logger.info('   ⚠️  migration_history table not accessible');
    totalWarnings++;
  }

  // Summary
  logger.info('\n');
  logger.info('='.repeat(60));
  logger.info('VERIFICATION SUMMARY');
  logger.info('='.repeat(60));
  logger.info(`   ✅ Passed: ${totalPassed}`);
  logger.info(`   ❌ Critical Issues: ${totalIssues}`);
  logger.info(`   ⚠️  Warnings: ${totalWarnings}`);

  if (totalIssues === 0 && totalWarnings === 0) {
    logger.info('\n   🎉 Schema verification PASSED!\n');
    process.exit(0);
  } else if (totalIssues === 0) {
    logger.info('\n   ✅ Schema verification PASSED with warnings.');
    logger.info('   Run migrations to add recommended columns.\n');
    process.exit(0);
  } else {
    logger.info('\n   ❌ Schema verification FAILED.');
    logger.info('   Run: npx tsx scripts/run-schema-fixes.ts\n');
    process.exit(1);
  }
}

verifySchema().catch((error) => {
  log.error('❌ Verification failed:', error);
  process.exit(1);
});
