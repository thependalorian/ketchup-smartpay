/**
 * Database Structure Validation Script
 * 
 * Location: scripts/validate-database-structure.ts
 * Purpose: Validate database structure after migrations
 * 
 * Usage:
 *   npx tsx scripts/validate-database-structure.ts
 * 
 * This script:
 * 1. Connects to the database
 * 2. Validates all expected tables exist
 * 3. Validates table structures (columns, indexes, constraints)
 * 4. Validates foreign key relationships
 * 5. Reports any missing or incorrect structures
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

interface ForeignKeyInfo {
  constraint_name: string;
  table_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
}

// Expected tables from our migrations
const EXPECTED_TABLES = [
  // Core tables
  'users',
  'wallets',
  'transactions',
  'vouchers',
  'voucher_redemptions',
  
  // Agent network
  'agents',
  'agent_liquidity_logs',
  'agent_transactions',
  'agent_settlements',
  'agent_network_analytics',
  'agent_performance',
  'agent_network_expansion_recommendations',
  
  // NamPost
  'nampost_branches',
  'nampost_staff',
  'nampost_branch_load',
  
  // Recommendation engine
  'recommendations',
  'recommendation_effectiveness',
  'concentration_alerts',
  'liquidity_recommendations',
  
  // Leadership boards
  'leaderboard_rankings',
  'leaderboard_incentives',
  'bottleneck_metrics',
  
  // Onboarding
  'merchant_onboarding',
  'agent_onboarding',
  'onboarding_documents',
  
  // Geoclustering
  'beneficiary_clusters',
  'agent_clusters',
  'demand_hotspots',
  'coverage_gaps',
  
  // Open Banking
  'oauth_consents',
  'oauth_authorization_codes',
  'oauth_par_requests',
  'service_level_metrics',
  'participants',
  'payments',
  'automated_request_tracking',
  
  // Compliance
  'audit_logs',
  'pin_audit_logs',
  'voucher_audit_logs',
  'transaction_audit_logs',
  'api_sync_audit_logs',
  'staff_audit_logs',
  'migration_history',
  'token_vault_parameters',
  
  // Other
  'bills',
  'merchants',
  'notifications',
  'contacts',
  'groups',
  'requests',
  'tickets',
  'insurance_products',
  'exchange_rates',
  'push_notifications',
  'ussd_sessions',
  'fineract_accounts',
  'fineract_vouchers',
  'fineract_sync_logs',
  'ips_transactions',
  'trust_account',
  'dormant_wallets',
  'incident_reports',
  'savings_wallets',
  'beneficiary_feedback',
  'voucher_expiry_warnings',
  'support_system',
  'split_bills',
  'analytics',
  'compliance_reporting',
];

// Critical columns to validate
const CRITICAL_COLUMNS: Record<string, string[]> = {
  'nampost_branches': ['branch_id', 'name', 'latitude', 'longitude', 'region', 'current_load', 'status'],
  'nampost_staff': ['staff_id', 'branch_id', 'name', 'role'],
  'nampost_branch_load': ['id', 'branch_id', 'timestamp', 'current_load', 'concentration_level'],
  'recommendations': ['id', 'user_id', 'recommendation_type', 'primary_recommendation'],
  'recommendation_effectiveness': ['id', 'recommendation_id', 'outcome'],
  'concentration_alerts': ['id', 'branch_id', 'concentration_level', 'current_load'],
  'liquidity_recommendations': ['id', 'agent_id', 'recommendation_type', 'priority'],
  'leaderboard_rankings': ['id', 'category', 'period', 'participant_id', 'rank', 'total_score'],
  'leaderboard_incentives': ['id', 'ranking_id', 'amount', 'status'],
  'bottleneck_metrics': ['id', 'date', 'bottleneck_reduction_percentage'],
  'merchant_onboarding': ['onboarding_id', 'business_name', 'status', 'progress'],
  'agent_onboarding': ['onboarding_id', 'business_name', 'agent_type', 'status', 'progress'],
  'onboarding_documents': ['id', 'onboarding_id', 'document_type', 'verification_status'],
  'beneficiary_clusters': ['id', 'region', 'cluster_id', 'centroid_latitude', 'centroid_longitude'],
  'agent_clusters': ['id', 'region', 'cluster_id', 'density_type'],
  'demand_hotspots': ['id', 'location_address', 'latitude', 'longitude', 'region', 'priority'],
  'coverage_gaps': ['id', 'location_address', 'latitude', 'longitude', 'region', 'priority'],
  'oauth_consents': ['consent_id', 'account_holder_id', 'data_provider_id', 'tpp_id', 'status'],
  'oauth_authorization_codes': ['code', 'client_id', 'account_holder_id', 'expires_at'],
  'oauth_par_requests': ['request_uri', 'client_id', 'expires_at'],
  'service_level_metrics': ['id', 'endpoint', 'participant_id', 'period_start'],
  'participants': ['participant_id', 'name', 'role', 'status'],
  'payments': ['id', 'payer_account_id', 'beneficiary_account_id', 'amount', 'tpp_id'],
  'automated_request_tracking': ['id', 'account_holder_id', 'endpoint', 'request_date'],
};

async function getExistingTables(): Promise<string[]> {
  const result = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  return result.map((row: any) => row.table_name);
}

async function getTableColumns(tableName: string): Promise<TableInfo[]> {
  const result = await sql`
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = ${tableName}
    ORDER BY ordinal_position;
  `;
  return result as TableInfo[];
}

async function getTableIndexes(tableName: string): Promise<IndexInfo[]> {
  const result = await sql`
    SELECT 
      indexname,
      tablename,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename = ${tableName}
    ORDER BY indexname;
  `;
  return result as IndexInfo[];
}

async function getForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
  const result = await sql`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = ${tableName}
    AND tc.table_schema = 'public';
  `;
  return result as ForeignKeyInfo[];
}

async function validateTableStructure() {
  console.log('🔍 Validating Database Structure...\n');
  
  const existingTables = await getExistingTables();
  const missingTables: string[] = [];
  const extraTables: string[] = [];
  
  // Check for missing tables
  for (const expectedTable of EXPECTED_TABLES) {
    if (!existingTables.includes(expectedTable)) {
      missingTables.push(expectedTable);
    }
  }
  
  // Check for unexpected tables (optional - just report)
  for (const existingTable of existingTables) {
    if (!EXPECTED_TABLES.includes(existingTable)) {
      extraTables.push(existingTable);
    }
  }
  
  console.log(`📊 Table Summary:`);
  console.log(`   Expected: ${EXPECTED_TABLES.length}`);
  console.log(`   Found: ${existingTables.length}`);
  console.log(`   Missing: ${missingTables.length}`);
  console.log(`   Extra: ${extraTables.length}\n`);
  
  if (missingTables.length > 0) {
    console.log('❌ Missing Tables:');
    missingTables.forEach(table => console.log(`   - ${table}`));
    console.log('');
  }
  
  if (extraTables.length > 0) {
    console.log('ℹ️  Extra Tables (not in expected list):');
    extraTables.forEach(table => console.log(`   - ${table}`));
    console.log('');
  }
  
  // Validate critical columns
  console.log('🔍 Validating Critical Columns...\n');
  const columnIssues: string[] = [];
  
  for (const [tableName, requiredColumns] of Object.entries(CRITICAL_COLUMNS)) {
    if (!existingTables.includes(tableName)) {
      continue; // Skip if table doesn't exist
    }
    
    const columns = await getTableColumns(tableName);
    const columnNames = columns.map(c => c.column_name);
    
    for (const requiredColumn of requiredColumns) {
      if (!columnNames.includes(requiredColumn)) {
        columnIssues.push(`${tableName}.${requiredColumn}`);
      }
    }
  }
  
  if (columnIssues.length > 0) {
    console.log('❌ Missing Critical Columns:');
    columnIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  } else {
    console.log('✅ All critical columns present\n');
  }
  
  // Validate indexes for key tables
  console.log('🔍 Validating Indexes...\n');
  const indexIssues: string[] = [];
  
  const tablesNeedingIndexes = [
    'nampost_branches',
    'nampost_staff',
    'nampost_branch_load',
    'recommendations',
    'leaderboard_rankings',
    'oauth_consents',
    'participants',
  ];
  
  for (const tableName of tablesNeedingIndexes) {
    if (!existingTables.includes(tableName)) {
      continue;
    }
    
    const indexes = await getTableIndexes(tableName);
    const indexNames = indexes.map(i => i.indexname.toLowerCase());
    
    // Check for common index patterns
    const expectedIndexPatterns = [
      `idx_${tableName}_`,
      `idx_${tableName.replace('_', '')}_`,
    ];
    
    if (indexes.length === 0) {
      indexIssues.push(`${tableName}: No indexes found`);
    }
  }
  
  if (indexIssues.length > 0) {
    console.log('⚠️  Index Warnings:');
    indexIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  } else {
    console.log('✅ Index validation passed\n');
  }
  
  // Validate foreign keys
  console.log('🔍 Validating Foreign Keys...\n');
  const fkIssues: string[] = [];
  
  const tablesWithFKs = [
    'nampost_staff',
    'nampost_branch_load',
    'recommendation_effectiveness',
    'leaderboard_incentives',
    'onboarding_documents',
    'liquidity_recommendations',
  ];
  
  for (const tableName of tablesWithFKs) {
    if (!existingTables.includes(tableName)) {
      continue;
    }
    
    const foreignKeys = await getForeignKeys(tableName);
    
    if (foreignKeys.length === 0 && tableName === 'nampost_staff') {
      fkIssues.push(`${tableName}: Missing foreign key to nampost_branches`);
    }
  }
  
  if (fkIssues.length > 0) {
    console.log('⚠️  Foreign Key Warnings:');
    fkIssues.forEach(issue => console.log(`   - ${issue}`));
    console.log('');
  } else {
    console.log('✅ Foreign key validation passed\n');
  }
  
  // Summary
  console.log('📋 Validation Summary:');
  console.log(`   ✅ Tables: ${existingTables.length - missingTables.length}/${EXPECTED_TABLES.length} present`);
  console.log(`   ${missingTables.length > 0 ? '❌' : '✅'} Missing Tables: ${missingTables.length}`);
  console.log(`   ${columnIssues.length > 0 ? '❌' : '✅'} Missing Columns: ${columnIssues.length}`);
  console.log(`   ${indexIssues.length > 0 ? '⚠️' : '✅'} Index Issues: ${indexIssues.length}`);
  console.log(`   ${fkIssues.length > 0 ? '⚠️' : '✅'} Foreign Key Issues: ${fkIssues.length}\n`);
  
  if (missingTables.length === 0 && columnIssues.length === 0) {
    console.log('🎉 Database structure validation PASSED!');
    return true;
  } else {
    console.log('❌ Database structure validation FAILED. Please review issues above.');
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Database Structure Validation...\n');
    
    // Test connection
    await sql`SELECT 1`;
    console.log('✅ Database connection successful\n');
    
    const isValid = await validateTableStructure();
    
    process.exit(isValid ? 0 : 1);
  } catch (error: any) {
    console.error('❌ Validation error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
