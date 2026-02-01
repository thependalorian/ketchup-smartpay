/**
 * Direct Table Creation
 * 
 * Create tables directly to test if SQL works
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

async function createNamPostBranches() {
  console.log('Creating nampost_branches table...\n');
  
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS nampost_branches (
        branch_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        region VARCHAR(50) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        phone_number VARCHAR(20),
        email VARCHAR(255),
        services TEXT[] NOT NULL,
        operating_hours JSONB,
        capacity_metrics JSONB,
        current_load INTEGER DEFAULT 0,
        average_wait_time INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ nampost_branches table created');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_region ON nampost_branches(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_latitude ON nampost_branches(latitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_longitude ON nampost_branches(longitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_status ON nampost_branches(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_city ON nampost_branches(city)`;
    console.log('✅ Indexes created');
    
    // Verify table exists
    const check = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nampost_branches'
      ) as exists
    `;
    console.log(`\n✅ Table exists: ${check[0]?.exists || false}`);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await createNamPostBranches();
    console.log('\n🎉 Success!');
  } catch (error: any) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

main();
