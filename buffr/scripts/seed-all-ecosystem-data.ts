/**
 * Seed All Ecosystem Data
 * 
 * Location: scripts/seed-all-ecosystem-data.ts
 * Purpose: Master script to seed all ecosystem data in correct order
 * 
 * Execution Order:
 * 1. NamPost branches (prerequisite for other data)
 * 2. Beneficiary clusters
 * 3. Demand hotspots (depends on branches)
 * 4. Agent clusters (depends on branches)
 * 5. Coverage gaps (depends on clusters)
 * 
 * Usage:
 *   npx tsx scripts/seed-all-ecosystem-data.ts
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface SeedStep {
  name: string;
  script: string;
  description: string;
  dependencies?: string[];
}

const SEED_STEPS: SeedStep[] = [
  {
    name: 'NamPost Branches',
    script: 'seed-nampost-branches.ts',
    description: 'Seed 147 NamPost branches with real coordinates and data',
  },
  {
    name: 'Beneficiary Clusters',
    script: 'seed-beneficiary-clusters.ts',
    description: 'Seed beneficiary clusters based on 618,110 social grants beneficiaries',
    dependencies: [],
  },
  {
    name: 'Demand Hotspots',
    script: 'seed-demand-hotspots.ts',
    description: 'Seed demand hotspots based on branch load and population density',
    dependencies: ['NamPost Branches'],
  },
  {
    name: 'Agent Clusters',
    script: 'seed-agent-clusters.ts',
    description: 'Seed agent clusters for agent network optimization',
    dependencies: ['NamPost Branches'],
  },
  {
    name: 'Coverage Gaps',
    script: 'seed-coverage-gaps.ts',
    description: 'Identify and seed coverage gaps in service areas',
    dependencies: ['Beneficiary Clusters', 'NamPost Branches'],
  },
];

async function checkDependencies(step: SeedStep): Promise<boolean> {
  if (!step.dependencies || step.dependencies.length === 0) {
    return true;
  }

  // Check if required tables have data
  for (const dep of step.dependencies) {
    if (dep === 'NamPost Branches') {
      const count = await sql`SELECT COUNT(*) as count FROM nampost_branches`;
      if (parseInt(count[0]?.count || '0') === 0) {
        console.log(`   ⚠️  Dependency not met: ${dep} (0 branches found)`);
        return false;
      }
    } else if (dep === 'Beneficiary Clusters') {
      const count = await sql`SELECT COUNT(*) as count FROM beneficiary_clusters`;
      if (parseInt(count[0]?.count || '0') === 0) {
        console.log(`   ⚠️  Dependency not met: ${dep} (0 clusters found)`);
        return false;
      }
    }
  }

  return true;
}

async function runSeedStep(step: SeedStep, stepNumber: number, totalSteps: number): Promise<boolean> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Step ${stepNumber}/${totalSteps}: ${step.name}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📋 ${step.description}\n`);

  // Check dependencies
  const depsMet = await checkDependencies(step);
  if (!depsMet) {
    console.log(`   ⏭️  Skipping ${step.name} - dependencies not met\n`);
    return false;
  }

  try {
    const scriptPath = resolve(process.cwd(), 'scripts', step.script);
    console.log(`🚀 Running: npx tsx ${step.script}\n`);
    
    execSync(`npx tsx ${scriptPath}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    console.log(`\n✅ ${step.name} completed successfully\n`);
    return true;
  } catch (error: any) {
    console.error(`\n❌ ${step.name} failed: ${error.message}\n`);
    return false;
  }
}

async function seedAllEcosystemData() {
  console.log('🌱 Seeding All Ecosystem Data');
  console.log('📊 Based on Namibia 2023 Census and Real Data\n');
  console.log('='.repeat(60));

  const results: { step: string; success: boolean }[] = [];

  for (let i = 0; i < SEED_STEPS.length; i++) {
    const step = SEED_STEPS[i];
    const success = await runSeedStep(step, i + 1, SEED_STEPS.length);
    results.push({ step: step.name, success });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Seeding Summary');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${result.step}`);
  }

  console.log(`\n📈 Results: ${successful}/${results.length} steps completed successfully`);
  
  if (failed > 0) {
    console.log(`   ⚠️  ${failed} step(s) failed or skipped\n`);
  } else {
    console.log(`   🎉 All steps completed!\n`);
  }

  // Final database statistics
  console.log('📊 Final Database Statistics:');
  console.log('='.repeat(60) + '\n');

  try {
    const [branches, clusters, hotspots, agentClusters, gaps] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM nampost_branches`,
      sql`SELECT COUNT(*) as count FROM beneficiary_clusters`,
      sql`SELECT COUNT(*) as count FROM demand_hotspots`,
      sql`SELECT COUNT(*) as count FROM agent_clusters`,
      sql`SELECT COUNT(*) as count FROM coverage_gaps`,
    ]);

    console.log(`   📍 NamPost Branches: ${branches[0]?.count || 0}`);
    console.log(`   👥 Beneficiary Clusters: ${clusters[0]?.count || 0}`);
    console.log(`   🔥 Demand Hotspots: ${hotspots[0]?.count || 0}`);
    console.log(`   🏪 Agent Clusters: ${agentClusters[0]?.count || 0}`);
    console.log(`   ⚠️  Coverage Gaps: ${gaps[0]?.count || 0}\n`);

    const totalBeneficiaries = await sql`
      SELECT SUM(beneficiary_count) as total FROM beneficiary_clusters
    `;
    console.log(`   👥 Total Beneficiaries Represented: ${parseInt(totalBeneficiaries[0]?.total || '0').toLocaleString()}\n`);
  } catch (error: any) {
    console.error(`   ⚠️  Error fetching statistics: ${error.message}\n`);
  }

  console.log('🎉 Ecosystem data seeding process completed!\n');
}

seedAllEcosystemData();
