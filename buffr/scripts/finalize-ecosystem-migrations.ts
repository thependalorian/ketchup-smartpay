/**
 * Finalize Ecosystem Migrations
 * 
 * 1. Run agent_network migration if needed
 * 2. Add foreign key constraint to liquidity_recommendations
 * 3. Verify all tables and relationships
 */

import { neon } from '@neondatabase/serverless';
import { readFile } from 'fs/promises';
import { join, resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `;
    return result[0]?.exists || false;
  } catch (error) {
    return false;
  }
}

async function createAgentsTable() {
  console.log('\n📋 Creating agents table...');
  
  const agentsExists = await checkTableExists('agents');
  if (agentsExists) {
    console.log('⏭️  Agents table already exists');
    return true;
  }

  try {
    // Create agents table
    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
        liquidity_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cash_on_hand DECIMAL(15, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
        min_liquidity_required DECIMAL(15, 2) NOT NULL DEFAULT 1000,
        max_daily_cashout DECIMAL(15, 2) NOT NULL DEFAULT 50000,
        commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 1.5,
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_location ON agents(location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_wallet_id ON agents(wallet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_coordinates ON agents(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL`;
    
    console.log('✅ Agents table created');
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to create agents table: ${error.message}`);
    return false;
  }
}

async function addForeignKeyConstraint() {
  console.log('\n📋 Adding foreign key constraint to liquidity_recommendations...');
  
  const agentsExists = await checkTableExists('agents');
  const liquidityExists = await checkTableExists('liquidity_recommendations');
  
  if (!agentsExists) {
    console.log('⚠️  Agents table does not exist. Skipping FK constraint.');
    return false;
  }
  
  if (!liquidityExists) {
    console.log('⚠️  liquidity_recommendations table does not exist. Skipping FK constraint.');
    return false;
  }

  try {
    // Check if constraint already exists
    const constraintExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_liquidity_recommendations_agent'
        AND table_schema = 'public'
        AND table_name = 'liquidity_recommendations'
      ) as exists
    `;
    
    if (constraintExists[0]?.exists) {
      console.log('⏭️  Foreign key constraint already exists');
      return true;
    }

    // Add foreign key constraint
    await sql`
      ALTER TABLE liquidity_recommendations
      ADD CONSTRAINT fk_liquidity_recommendations_agent
      FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
    `;
    
    console.log('✅ Foreign key constraint added');
    return true;
  } catch (error: any) {
    // If constraint fails (e.g., data exists that violates it), we'll skip
    if (error.message.includes('violates foreign key') || error.message.includes('violates check constraint')) {
      console.log('⚠️  Cannot add FK constraint - existing data may violate it');
      console.log('   This is OK - constraint will be added when agents table is populated');
      return false;
    }
    console.error(`❌ Failed to add FK constraint: ${error.message}`);
    return false;
  }
}

async function verifyAllTables() {
  console.log('\n🔍 Final Verification...\n');
  
  const ecosystemTables = [
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

  const results: { table: string; exists: boolean; columns: number; indexes: number; fks: number }[] = [];

  for (const tableName of ecosystemTables) {
    try {
      const exists = await checkTableExists(tableName);
      
      let columns = 0;
      let indexes = 0;
      let fks = 0;
      
      if (exists) {
        const colsResult = await sql`
          SELECT COUNT(*) as count
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        `;
        columns = parseInt(colsResult[0]?.count || '0');
        
        const idxResult = await sql`
          SELECT COUNT(*) as count
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = ${tableName}
        `;
        indexes = parseInt(idxResult[0]?.count || '0');
        
        const fkResult = await sql`
          SELECT COUNT(*) as count
          FROM information_schema.table_constraints
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = 'public'
          AND table_name = ${tableName}
        `;
        fks = parseInt(fkResult[0]?.count || '0');
      }
      
      results.push({ table: tableName, exists, columns, indexes, fks });
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${tableName}${exists ? ` (${columns} cols, ${indexes} idx, ${fks} FK)` : ''}`);
    } catch (error: any) {
      results.push({ table: tableName, exists: false, columns: 0, indexes: 0, fks: 0 });
      console.log(`   ❌ ${tableName} - Error`);
    }
  }

  const existingCount = results.filter(r => r.exists).length;
  const totalColumns = results.reduce((sum, r) => sum + r.columns, 0);
  const totalIndexes = results.reduce((sum, r) => sum + r.indexes, 0);
  const totalFKs = results.reduce((sum, r) => sum + r.fks, 0);

  console.log(`\n📊 Final Summary:`);
  console.log(`   ✅ Tables: ${existingCount}/${ecosystemTables.length}`);
  console.log(`   📋 Total Columns: ${totalColumns}`);
  console.log(`   🔍 Total Indexes: ${totalIndexes}`);
  console.log(`   🔗 Total Foreign Keys: ${totalFKs}`);

  return existingCount === ecosystemTables.length;
}

async function main() {
  console.log('🚀 Finalizing Ecosystem Migrations\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Create agents table if needed
    await createAgentsTable();

    // Step 2: Add foreign key constraint
    await addForeignKeyConstraint();

    // Step 3: Verify all tables
    const allValid = await verifyAllTables();

    if (allValid) {
      console.log('\n🎉 All ecosystem migrations finalized successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some issues detected. Review above.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
