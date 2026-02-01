/**
 * Direct Table Check
 * 
 * Location: scripts/check-tables-direct.ts
 * Purpose: Directly query database to check if new tables exist
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log('🔍 Checking for new ecosystem tables...\n');

  const tablesToCheck = [
    'nampost_branches',
    'nampost_staff',
    'nampost_branch_load',
    'recommendations',
    'recommendation_effectiveness',
    'concentration_alerts',
    'liquidity_recommendations',
    'leaderboard_rankings',
    'leaderboard_incentives',
    'bottleneck_metrics',
    'merchant_onboarding',
    'agent_onboarding',
    'onboarding_documents',
    'beneficiary_clusters',
    'agent_clusters',
    'demand_hotspots',
    'coverage_gaps',
  ];

  try {
    // Check migration history
    console.log('📋 Migration History:');
    const history = await sql`
      SELECT migration_name, status, applied_at
      FROM migration_history
      WHERE migration_name LIKE 'migration_%'
      ORDER BY applied_at DESC
      LIMIT 10
    `;
    history.forEach((row: any) => {
      console.log(`   ${row.status === 'completed' ? '✅' : '❌'} ${row.migration_name} - ${row.applied_at}`);
    });

    console.log('\n📊 Table Existence Check:');
    for (const tableName of tablesToCheck) {
      try {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          ) as exists
        `;
        const exists = result[0]?.exists || false;
        console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
        
        if (exists) {
          // Get row count
          const countResult = await sql.unsafe(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`      Rows: ${countResult[0]?.count || 0}`);
        }
      } catch (error: any) {
        console.log(`   ❌ ${tableName} - Error: ${error.message.substring(0, 100)}`);
      }
    }

    // Check for any errors in migration history
    console.log('\n🔍 Checking for migration errors:');
    const errors = await sql`
      SELECT migration_name, status, metadata
      FROM migration_history
      WHERE status = 'failed'
      ORDER BY applied_at DESC
    `;
    if (errors.length > 0) {
      errors.forEach((row: any) => {
        console.log(`   ❌ ${row.migration_name}: ${JSON.stringify(row.metadata)}`);
      });
    } else {
      console.log('   ✅ No failed migrations found');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
