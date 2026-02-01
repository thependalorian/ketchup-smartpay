/**
 * Seed Agent Clusters with Real Data
 * 
 * Location: scripts/seed-agent-clusters.ts
 * Purpose: Seed database with realistic agent cluster data based on:
 * - NamPost branch locations
 * - Regional population distribution
 * - Agent network optimization
 * 
 * Usage:
 *   npx tsx scripts/seed-agent-clusters.ts
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

async function seedAgentClusters() {
  console.log('🌱 Seeding Agent Clusters...\n');

  try {
    // Get all NamPost branches grouped by region
    const branches = await sql`
      SELECT region, COUNT(*) as branch_count, 
             AVG(latitude) as avg_lat, AVG(longitude) as avg_lng
      FROM nampost_branches
      GROUP BY region
      ORDER BY region
    `;

    console.log(`📋 Found ${branches.length} regions with branches\n`);

    let seeded = 0;

    for (const region of branches) {
      // Create agent clusters around NamPost branches
      // Each region gets clusters based on branch count
      const clusterCount = Math.max(2, Math.ceil(parseInt(region.branch_count || '0') / 3));
      
      for (let i = 0; i < clusterCount; i++) {
        // Generate cluster centroid near region center
        const centroidLat = parseFloat(region.avg_lat || '0') + (Math.random() - 0.5) * 0.5;
        const centroidLng = parseFloat(region.avg_lng || '0') + (Math.random() - 0.5) * 0.5;
        
        // Estimate agent count (3-10 agents per cluster)
        const agentCount = 3 + Math.floor(Math.random() * 8);
        
        // Density type based on agent count
        const densityType = agentCount > 7 ? 'dense' : agentCount > 4 ? 'sparse' : 'noise';
        
        // Average liquidity (N$)
        const avgLiquidity = 50000 + Math.random() * 100000;
        
        // Transaction volume estimate (based on agent count and liquidity)
        const transactionVolume = avgLiquidity * agentCount * 0.1; // 10% of liquidity per month

        try {
          await sql`
            INSERT INTO agent_clusters (
              region, cluster_id, density_type, agent_count,
              transaction_volume, average_liquidity,
              created_at, updated_at
            ) VALUES (
              ${region.region},
              ${i + 1},
              ${densityType},
              ${agentCount},
              ${transactionVolume},
              ${avgLiquidity},
              NOW(),
              NOW()
            )
          `;

          seeded++;
          if (seeded % 5 === 0) {
            console.log(`   ✅ Seeded ${seeded} agent clusters...`);
          }
        } catch (error: any) {
          console.error(`   ❌ Error seeding cluster ${clusterName}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✅ Agent clusters seeded: ${seeded}`);
    console.log(`   📋 Regions processed: ${branches.length}\n`);

    // Verify seeding
    const count = await sql`SELECT COUNT(*) as count FROM agent_clusters`;
    const totalAgents = await sql`
      SELECT SUM(agent_count) as total FROM agent_clusters
    `;
    
    console.log(`✅ Total agent clusters in database: ${count[0]?.count || 0}`);
    console.log(`✅ Total agents represented: ${parseInt(totalAgents[0]?.total || '0')}\n`);

    console.log('🎉 Agent clusters seeding completed!\n');
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedAgentClusters();
