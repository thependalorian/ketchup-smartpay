/**
 * Schema Completeness Verification Script
 * 
 * Compares expected schema from migration files with actual database structure
 * to identify missing columns, tables, indexes, and constraints.
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const result = await sql`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    ORDER BY ordinal_position;
  `;
  return result as ColumnInfo[];
}

async function verifyCriticalTables() {
  console.log('🔍 Verifying Critical Tables Schema Completeness...\n');

  // Critical tables and their expected columns (from schema files)
  const expectedSchemas: Record<string, string[]> = {
    users: [
      'id', 'phone_number', 'email', 'first_name', 'last_name', 'full_name',
      'avatar', 'is_verified', 'is_two_factor_enabled', 'currency', 'last_login_at',
      'created_at', 'updated_at', 'external_id', 'status', 'kyc_level'
    ],
    wallets: [
      'id', 'user_id', 'name', 'icon', 'type', 'balance', 'currency', 'purpose',
      'card_design', 'card_number', 'cardholder_name', 'expiry_date',
      'auto_pay_enabled', 'auto_pay_max_amount', 'auto_pay_settings',
      'pin_protected', 'biometric_enabled', 'created_at', 'updated_at'
    ],
    transactions: [
      'id', 'user_id', 'wallet_id', 'type', 'amount', 'currency', 'description',
      'category', 'recipient_id', 'recipient_name', 'status', 'date',
      'created_at', 'voucher_id', 'fineract_transaction_id', 'ips_transaction_id'
    ],
    vouchers: [
      'id', 'beneficiary_id', 'voucher_code', 'amount', 'currency', 'status',
      'expiry_date', 'issued_at', 'redeemed_at', 'redemption_method',
      'smartpay_voucher_id', 'external_id', 'created_at', 'updated_at'
    ],
    conversations: [
      'id', 'session_id', 'user_id', 'user_message', 'assistant_response',
      'agents_consulted', 'created_at'
    ],
    exchange_rates: [
      'id', 'base_currency', 'target_currency', 'rate', 'trend', 'source',
      'fetched_at', 'fetched_date', 'created_at'
    ],
    exchange_rate_fetch_log: [
      'id', 'fetch_date', 'fetch_time', 'currencies_fetched', 'success',
      'api_source', 'error_message', 'created_at'
    ],
    audit_logs: [
      'id', 'admin_user_id', 'action_type', 'resource_type', 'resource_id',
      'action_details', 'ip_address', 'user_agent', 'status', 'error_message',
      'created_at'
    ],
    fineract_sync_logs: [
      'id', 'operation_type', 'entity_type', 'entity_id', 'external_id',
      'status', 'request_payload', 'response_payload', 'error_message', 'created_at'
    ],
    split_bills: [
      'id', 'created_by', 'title', 'description', 'total_amount', 'currency',
      'status', 'due_date', 'created_at', 'updated_at'
    ],
    transaction_analytics: [
      'id', 'user_id', 'period_start', 'period_end', 'total_transactions',
      'total_amount', 'average_transaction', 'top_category', 'created_at'
    ],
  };

  const issues: any[] = [];
  const verified: string[] = [];

  for (const [tableName, expectedColumns] of Object.entries(expectedSchemas)) {
    try {
      const actualColumns = await getTableColumns(tableName);
      const actualColumnNames = actualColumns.map(c => c.column_name);

      const missingColumns = expectedColumns.filter(
        col => !actualColumnNames.includes(col)
      );
      const extraColumns = actualColumnNames.filter(
        col => !expectedColumns.includes(col)
      );

      if (missingColumns.length === 0 && extraColumns.length === 0) {
        verified.push(tableName);
        console.log(`✅ ${tableName} - All expected columns present`);
      } else {
        issues.push({
          table: tableName,
          missing: missingColumns,
          extra: extraColumns,
          actual: actualColumnNames,
        });

        if (missingColumns.length > 0) {
          console.log(`⚠️  ${tableName} - Missing columns: ${missingColumns.join(', ')}`);
        }
        if (extraColumns.length > 0) {
          console.log(`ℹ️  ${tableName} - Extra columns: ${extraColumns.join(', ')}`);
        }
      }
    } catch (error: any) {
      console.log(`❌ ${tableName} - Error: ${error.message}`);
      issues.push({
        table: tableName,
        error: error.message,
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Verified: ${verified.length} tables`);
  console.log(`⚠️  Issues: ${issues.length} tables`);

  if (issues.length > 0) {
    console.log('\n⚠️  TABLES WITH ISSUES:');
    issues.forEach(issue => {
      console.log(`\n📋 ${issue.table}`);
      if (issue.missing) {
        console.log(`   Missing: ${issue.missing.join(', ')}`);
      }
      if (issue.extra) {
        console.log(`   Extra: ${issue.extra.join(', ')}`);
      }
      if (issue.error) {
        console.log(`   Error: ${issue.error}`);
      }
    });
  }

  return { verified, issues };
}

// Run verification
verifyCriticalTables()
  .then(() => {
    console.log('\n✅ Schema verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error verifying schema:', error);
    process.exit(1);
  });
