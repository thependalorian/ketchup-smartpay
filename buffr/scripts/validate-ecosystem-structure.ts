/**
 * Validate Ecosystem Database Structure
 * 
 * Location: scripts/validate-ecosystem-structure.ts
 * Purpose: Validate that all new ecosystem tables and structures exist
 * 
 * Usage:
 *   npx tsx scripts/validate-ecosystem-structure.ts
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Expected tables from new migrations
const EXPECTED_TABLES = {
  'migration_nampost_branches.sql': [
    'nampost_branches',
    'nampost_staff',
    'nampost_branch_load',
  ],
  'migration_recommendation_engine.sql': [
    'recommendations',
    'recommendation_effectiveness',
    'concentration_alerts',
    'liquidity_recommendations',
  ],
  'migration_leadership_boards.sql': [
    'leaderboard_rankings',
    'leaderboard_incentives',
    'bottleneck_metrics',
  ],
  'migration_merchant_agent_onboarding.sql': [
    'merchant_onboarding',
    'agent_onboarding',
    'onboarding_documents',
  ],
  'migration_geoclustering.sql': [
    'beneficiary_clusters',
    'agent_clusters',
    'demand_hotspots',
    'coverage_gaps',
  ],
};

// Expected indexes (key tables)
const EXPECTED_INDEXES = {
  'nampost_branches': [
    'idx_nampost_branches_region',
    'idx_nampost_branches_latitude',
    'idx_nampost_branches_longitude',
    'idx_nampost_branches_status',
    'idx_nampost_branches_city',
  ],
  'nampost_staff': [
    'idx_nampost_staff_branch',
    'idx_nampost_staff_role',
  ],
  'recommendations': [
    'idx_recommendations_user',
    'idx_recommendations_type',
    'idx_recommendations_created',
  ],
  'leaderboard_rankings': [
    'idx_leaderboard_rankings_category',
    'idx_leaderboard_rankings_period',
    'idx_leaderboard_rankings_rank',
  ],
};

interface ValidationResult {
  table: string;
  exists: boolean;
  columns?: string[];
  indexes?: string[];
  foreignKeys?: string[];
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    return result[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

async function getTableColumns(tableName: string): Promise<string[]> {
  try {
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    return result.map((row: any) => row.column_name);
  } catch (error) {
    return [];
  }
}

async function getTableIndexes(tableName: string): Promise<string[]> {
  try {
    const result = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = ${tableName}
    `;
    return result.map((row: any) => row.indexname);
  } catch (error) {
    return [];
  }
}

async function getForeignKeys(tableName: string): Promise<string[]> {
  try {
    const result = await sql`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = ${tableName}
    `;
    return result.map((row: any) => 
      `${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`
    );
  } catch (error) {
    return [];
  }
}

async function validateTable(tableName: string): Promise<ValidationResult> {
  const exists = await checkTableExists(tableName);
  
  if (!exists) {
    return { table: tableName, exists: false };
  }

  const columns = await getTableColumns(tableName);
  const indexes = await getTableIndexes(tableName);
  const foreignKeys = await getForeignKeys(tableName);

  return {
    table: tableName,
    exists: true,
    columns,
    indexes,
    foreignKeys,
  };
}

async function checkMigrationHistory(): Promise<boolean[]> {
  const migrations = Object.keys(EXPECTED_TABLES);
  const results: boolean[] = [];

  for (const migration of migrations) {
    try {
      const result = await sql`
        SELECT migration_name, status
        FROM migration_history
        WHERE migration_name = ${migration}
      `;
      results.push(result.length > 0 && result[0].status === 'completed');
    } catch (error) {
      results.push(false);
    }
  }

  return results;
}

async function main() {
  console.log('🔍 Validating Ecosystem Database Structure\n');
  console.log('='.repeat(60));

  try {
    // Check migration history
    console.log('\n📋 Checking Migration History...');
    const migrationHistory = await checkMigrationHistory();
    const migrations = Object.keys(EXPECTED_TABLES);
    
    migrations.forEach((migration, index) => {
      const status = migrationHistory[index] ? '✅' : '❌';
      console.log(`   ${status} ${migration}`);
    });

    // Validate all tables
    console.log('\n📊 Validating Tables...\n');
    const allTables = Object.values(EXPECTED_TABLES).flat();
    const validationResults: ValidationResult[] = [];

    for (const tableName of allTables) {
      const result = await validateTable(tableName);
      validationResults.push(result);
      
      if (result.exists) {
        console.log(`✅ ${tableName}`);
        console.log(`   Columns: ${result.columns?.length || 0}`);
        console.log(`   Indexes: ${result.indexes?.length || 0}`);
        if (result.foreignKeys && result.foreignKeys.length > 0) {
          console.log(`   Foreign Keys: ${result.foreignKeys.length}`);
        }
      } else {
        console.log(`❌ ${tableName} - NOT FOUND`);
      }
    }

    // Validate key indexes
    console.log('\n🔍 Validating Key Indexes...\n');
    for (const [tableName, expectedIndexes] of Object.entries(EXPECTED_INDEXES)) {
      const tableResult = validationResults.find(r => r.table === tableName);
      if (tableResult?.exists) {
        console.log(`📋 ${tableName}:`);
        for (const indexName of expectedIndexes) {
          const exists = tableResult.indexes?.includes(indexName) || false;
          const status = exists ? '✅' : '❌';
          console.log(`   ${status} ${indexName}`);
        }
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    const existingTables = validationResults.filter(r => r.exists).length;
    const missingTables = validationResults.filter(r => !r.exists).length;
    
    console.log('📊 Validation Summary:');
    console.log(`   ✅ Tables Found: ${existingTables}/${allTables.length}`);
    console.log(`   ❌ Tables Missing: ${missingTables}/${allTables.length}`);
    console.log(`   📋 Migrations Executed: ${migrationHistory.filter(Boolean).length}/${migrations.length}`);

    if (missingTables === 0 && migrationHistory.every(Boolean)) {
      console.log('\n🎉 All ecosystem structures validated successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some structures are missing. Please run migrations.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Validation error:', error.message);
    process.exit(1);
  }
}

main();
