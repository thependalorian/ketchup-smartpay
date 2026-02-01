/**
 * Seed Coverage Gaps with Real Data
 * 
 * Location: scripts/seed-coverage-gaps.ts
 * Purpose: Identify and seed coverage gaps in service areas based on:
 * - Beneficiary clusters without nearby branches
 * - Low agent coverage areas
 * - High demand areas with insufficient capacity
 * 
 * Usage:
 *   npx tsx scripts/seed-coverage-gaps.ts
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

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function seedCoverageGaps() {
  console.log('🌱 Seeding Coverage Gaps...\n');

  try {
    // Get all beneficiary clusters
    const clusters = await sql`
      SELECT id, cluster_id, region, centroid_latitude, centroid_longitude,
             beneficiary_count
      FROM beneficiary_clusters
      ORDER BY region, cluster_id
    `;

    // Get all NamPost branches
    const branches = await sql`
      SELECT branch_id, region, latitude, longitude
      FROM nampost_branches
    `;

    console.log(`📋 Analyzing ${clusters.length} beneficiary clusters against ${branches.length} branches\n`);

    let gapsFound = 0;
    let seeded = 0;

    for (const cluster of clusters) {
      const clusterLat = parseFloat(cluster.centroid_latitude);
      const clusterLng = parseFloat(cluster.centroid_longitude);
      
      // Find nearest branch
      let nearestBranch: any = null;
      let minDistance = Infinity;

      for (const branch of branches) {
        const distance = calculateDistance(
          clusterLat,
          clusterLng,
          parseFloat(branch.latitude),
          parseFloat(branch.longitude)
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestBranch = branch;
        }
      }

      // Identify gaps: clusters > 15km from nearest branch or high beneficiary count with low coverage
      const clusterBeneficiaryCount = parseInt(cluster.beneficiary_count || '0');
      const isGap = minDistance > 15 || (clusterBeneficiaryCount > 5000 && minDistance > 10);
      
      if (isGap) {
        const gapPriority = minDistance > 25 ? 'high' : minDistance > 20 ? 'medium' : 'low';
        const affectedBeneficiaries = parseInt(cluster.beneficiary_count || '0');
        
        // Recommended agent type based on distance and beneficiary count
        let recommendedAgentType = 'small';
        if (minDistance > 20 || affectedBeneficiaries > 5000) {
          recommendedAgentType = 'large';
        } else if (minDistance > 15 || affectedBeneficiaries > 2000) {
          recommendedAgentType = 'medium';
        }

        // Generate location address
        const locationAddress = `${cluster.region} - Cluster ${cluster.cluster_id} (${Math.round(minDistance)}km from nearest branch)`;

        try {
          await sql`
            INSERT INTO coverage_gaps (
              location_address, latitude, longitude, region,
              beneficiary_count, nearest_agent_distance_km,
              recommended_agent_type, priority, created_at, updated_at
            ) VALUES (
              ${locationAddress},
              ${clusterLat},
              ${clusterLng},
              ${cluster.region},
              ${affectedBeneficiaries},
              ${minDistance},
              ${recommendedAgentType},
              ${gapPriority},
              NOW(),
              NOW()
            )
          `;

          gapsFound++;
          seeded++;

          if (seeded % 10 === 0) {
            console.log(`   ✅ Identified ${seeded} coverage gaps...`);
          }
        } catch (error: any) {
          console.error(`   ❌ Error seeding gap for ${cluster.cluster_id}: ${error.message}`);
        }
      }
    }

    console.log(`\n📊 Seeding Summary:`);
    console.log(`   ✅ Coverage gaps identified: ${gapsFound}`);
    console.log(`   📋 Clusters analyzed: ${clusters.length}\n`);

    // Verify seeding
    const count = await sql`SELECT COUNT(*) as count FROM coverage_gaps`;
    const totalAffected = await sql`
      SELECT SUM(beneficiary_count) as total FROM coverage_gaps
    `;
    
    console.log(`✅ Total coverage gaps in database: ${count[0]?.count || 0}`);
    console.log(`✅ Total affected beneficiaries: ${parseInt(totalAffected[0]?.total || '0').toLocaleString()}\n`);

    // Gap priority breakdown
    const priorityBreakdown = await sql`
      SELECT priority, COUNT(*) as count
      FROM coverage_gaps
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END
    `;

    console.log('📊 Gap Priority Breakdown:');
    for (const row of priorityBreakdown) {
      console.log(`   ${row.priority}: ${row.count} gaps`);
    }
    console.log('');

    console.log('🎉 Coverage gaps seeding completed!\n');
  } catch (error: any) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedCoverageGaps();
