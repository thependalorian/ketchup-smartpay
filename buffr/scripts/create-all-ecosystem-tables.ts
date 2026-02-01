/**
 * Create All Ecosystem Tables Directly
 * 
 * Creates all ecosystem tables using template literals
 * Ensures tables are created properly
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

async function createAllTables() {
  console.log('🚀 Creating All Ecosystem Tables\n');
  console.log('='.repeat(60));

  let created = 0;
  let skipped = 0;
  let errors = 0;

  // 1. NamPost Branches
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
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_region ON nampost_branches(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_latitude ON nampost_branches(latitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_longitude ON nampost_branches(longitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_status ON nampost_branches(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branches_city ON nampost_branches(city)`;
    console.log('✅ nampost_branches');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  nampost_branches (already exists)');
    } else {
      errors++;
      console.log(`❌ nampost_branches: ${error.message.substring(0, 80)}`);
    }
  }

  // 2. NamPost Staff
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS nampost_staff (
        staff_id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL REFERENCES nampost_branches(branch_id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        phone_number VARCHAR(20),
        email VARCHAR(255),
        specialization TEXT[],
        availability JSONB,
        performance_metrics JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_staff_branch ON nampost_staff(branch_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_staff_role ON nampost_staff(role)`;
    console.log('✅ nampost_staff');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  nampost_staff (already exists)');
    } else {
      errors++;
      console.log(`❌ nampost_staff: ${error.message.substring(0, 80)}`);
    }
  }

  // 3. NamPost Branch Load
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS nampost_branch_load (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id VARCHAR(50) NOT NULL REFERENCES nampost_branches(branch_id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        current_load INTEGER NOT NULL,
        wait_time INTEGER NOT NULL,
        queue_length INTEGER DEFAULT 0,
        concentration_level VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branch_load_branch ON nampost_branch_load(branch_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branch_load_timestamp ON nampost_branch_load(timestamp DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_nampost_branch_load_concentration ON nampost_branch_load(concentration_level)`;
    console.log('✅ nampost_branch_load');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  nampost_branch_load (already exists)');
    } else {
      errors++;
      console.log(`❌ nampost_branch_load: ${error.message.substring(0, 80)}`);
    }
  }

  // 4. Recommendations
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        recommendation_type VARCHAR(50) NOT NULL,
        primary_recommendation JSONB NOT NULL,
        alternatives JSONB,
        concentration_alert JSONB,
        user_action VARCHAR(50),
        action_timestamp TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recommendations_type ON recommendations(recommendation_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recommendations_created ON recommendations(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recommendations_action ON recommendations(user_action)`;
    console.log('✅ recommendations');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  recommendations (already exists)');
    } else {
      errors++;
      console.log(`❌ recommendations: ${error.message.substring(0, 80)}`);
    }
  }

  // 5. Recommendation Effectiveness
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS recommendation_effectiveness (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
        outcome VARCHAR(50),
        user_satisfaction INTEGER,
        wait_time_reduction INTEGER,
        distance_optimization DECIMAL(10, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_recommendation_effectiveness_recommendation ON recommendation_effectiveness(recommendation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recommendation_effectiveness_outcome ON recommendation_effectiveness(outcome)`;
    console.log('✅ recommendation_effectiveness');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  recommendation_effectiveness (already exists)');
    } else {
      errors++;
      console.log(`❌ recommendation_effectiveness: ${error.message.substring(0, 80)}`);
    }
  }

  // 6. Concentration Alerts
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS concentration_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        branch_id VARCHAR(50) NOT NULL,
        concentration_level VARCHAR(50) NOT NULL,
        current_load INTEGER NOT NULL,
        max_capacity INTEGER NOT NULL,
        wait_time INTEGER NOT NULL,
        beneficiaries_notified INTEGER DEFAULT 0,
        agents_suggested INTEGER DEFAULT 0,
        resolved_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_concentration_alerts_branch ON concentration_alerts(branch_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_concentration_alerts_level ON concentration_alerts(concentration_level)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_concentration_alerts_created ON concentration_alerts(created_at DESC)`;
    console.log('✅ concentration_alerts');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  concentration_alerts (already exists)');
    } else {
      errors++;
      console.log(`❌ concentration_alerts: ${error.message.substring(0, 80)}`);
    }
  }

  // 7. Liquidity Recommendations
  // Note: Foreign key to agents table - will be added after agents table exists
  try {
    // First check if agents table exists
    const agentsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'agents'
      ) as exists
    `;
    
    const hasAgentsTable = agentsExists[0]?.exists || false;
    
    if (hasAgentsTable) {
      await sql`
        CREATE TABLE IF NOT EXISTS liquidity_recommendations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
          recommendation_type VARCHAR(50) NOT NULL,
          priority VARCHAR(50) NOT NULL,
          details TEXT NOT NULL,
          estimated_impact TEXT,
          demand_forecast JSONB,
          agent_action VARCHAR(50),
          action_timestamp TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
    } else {
      // Create without foreign key constraint if agents table doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS liquidity_recommendations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          agent_id UUID NOT NULL,
          recommendation_type VARCHAR(50) NOT NULL,
          priority VARCHAR(50) NOT NULL,
          details TEXT NOT NULL,
          estimated_impact TEXT,
          demand_forecast JSONB,
          agent_action VARCHAR(50),
          action_timestamp TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('   ⚠️  Created without foreign key (agents table not found)');
    }
    await sql`CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_agent ON liquidity_recommendations(agent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_type ON liquidity_recommendations(recommendation_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_priority ON liquidity_recommendations(priority)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_liquidity_recommendations_action ON liquidity_recommendations(agent_action)`;
    console.log('✅ liquidity_recommendations');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  liquidity_recommendations (already exists)');
    } else {
      errors++;
      console.log(`❌ liquidity_recommendations: ${error.message.substring(0, 80)}`);
    }
  }

  // 8. Leaderboard Rankings
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard_rankings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL,
        participant_id VARCHAR(255) NOT NULL,
        participant_name VARCHAR(255) NOT NULL,
        rank INTEGER NOT NULL,
        metrics JSONB NOT NULL,
        total_score DECIMAL(5, 2) NOT NULL,
        incentive_amount DECIMAL(15, 2),
        incentive_currency VARCHAR(3) DEFAULT 'NAD',
        incentive_type VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(category, period, participant_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_category ON leaderboard_rankings(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_period ON leaderboard_rankings(period)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_rank ON leaderboard_rankings(category, period, rank)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_participant ON leaderboard_rankings(participant_id)`;
    console.log('✅ leaderboard_rankings');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  leaderboard_rankings (already exists)');
    } else {
      errors++;
      console.log(`❌ leaderboard_rankings: ${error.message.substring(0, 80)}`);
    }
  }

  // 9. Leaderboard Incentives
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS leaderboard_incentives (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ranking_id UUID NOT NULL REFERENCES leaderboard_rankings(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'NAD',
        incentive_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        paid_at TIMESTAMP WITH TIME ZONE,
        payment_reference VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_incentives_ranking ON leaderboard_incentives(ranking_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_incentives_status ON leaderboard_incentives(status)`;
    console.log('✅ leaderboard_incentives');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  leaderboard_incentives (already exists)');
    } else {
      errors++;
      console.log(`❌ leaderboard_incentives: ${error.message.substring(0, 80)}`);
    }
  }

  // 10. Bottleneck Metrics
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bottleneck_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE NOT NULL,
        nampost_branch_load_before DECIMAL(5, 2),
        nampost_branch_load_after DECIMAL(5, 2),
        agent_network_usage_percentage DECIMAL(5, 2),
        bottleneck_reduction_percentage DECIMAL(5, 2),
        beneficiaries_routed_to_agents INTEGER DEFAULT 0,
        average_wait_time_reduction INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_bottleneck_metrics_date ON bottleneck_metrics(date DESC)`;
    console.log('✅ bottleneck_metrics');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  bottleneck_metrics (already exists)');
    } else {
      errors++;
      console.log(`❌ bottleneck_metrics: ${error.message.substring(0, 80)}`);
    }
  }

  // 11. Merchant Onboarding
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS merchant_onboarding (
        onboarding_id VARCHAR(50) PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        business_type VARCHAR(50) NOT NULL,
        location JSONB NOT NULL,
        contact JSONB NOT NULL,
        documents JSONB,
        status VARCHAR(50) DEFAULT 'document_verification',
        progress INTEGER DEFAULT 0,
        current_step VARCHAR(100),
        completed_steps TEXT[],
        pending_steps TEXT[],
        estimated_completion DATE,
        issues JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_merchant_onboarding_status ON merchant_onboarding(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_merchant_onboarding_business_type ON merchant_onboarding(business_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_merchant_onboarding_created ON merchant_onboarding(created_at DESC)`;
    console.log('✅ merchant_onboarding');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  merchant_onboarding (already exists)');
    } else {
      errors++;
      console.log(`❌ merchant_onboarding: ${error.message.substring(0, 80)}`);
    }
  }

  // 12. Agent Onboarding
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agent_onboarding (
        onboarding_id VARCHAR(50) PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        agent_type VARCHAR(50) NOT NULL,
        location JSONB NOT NULL,
        contact JSONB NOT NULL,
        liquidity_requirements JSONB,
        documents JSONB,
        status VARCHAR(50) DEFAULT 'document_verification',
        progress INTEGER DEFAULT 0,
        current_step VARCHAR(100),
        completed_steps TEXT[],
        pending_steps TEXT[],
        estimated_completion DATE,
        issues JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_onboarding_status ON agent_onboarding(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_onboarding_agent_type ON agent_onboarding(agent_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_onboarding_created ON agent_onboarding(created_at DESC)`;
    console.log('✅ agent_onboarding');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  agent_onboarding (already exists)');
    } else {
      errors++;
      console.log(`❌ agent_onboarding: ${error.message.substring(0, 80)}`);
    }
  }

  // 13. Onboarding Documents
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS onboarding_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        onboarding_id VARCHAR(50) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        document_data BYTEA,
        document_url TEXT,
        verification_status VARCHAR(50) DEFAULT 'pending',
        verified_at TIMESTAMP WITH TIME ZONE,
        verified_by VARCHAR(255),
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_onboarding_documents_onboarding ON onboarding_documents(onboarding_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_onboarding_documents_type ON onboarding_documents(document_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_onboarding_documents_status ON onboarding_documents(verification_status)`;
    console.log('✅ onboarding_documents');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  onboarding_documents (already exists)');
    } else {
      errors++;
      console.log(`❌ onboarding_documents: ${error.message.substring(0, 80)}`);
    }
  }

  // 14. Beneficiary Clusters
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS beneficiary_clusters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        region VARCHAR(50) NOT NULL,
        cluster_id INTEGER NOT NULL,
        centroid_latitude DECIMAL(10, 8) NOT NULL,
        centroid_longitude DECIMAL(11, 8) NOT NULL,
        beneficiary_count INTEGER DEFAULT 0,
        transaction_volume DECIMAL(15, 2) DEFAULT 0,
        average_transaction_amount DECIMAL(15, 2) DEFAULT 0,
        preferred_cashout_location VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(region, cluster_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiary_clusters_region ON beneficiary_clusters(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiary_clusters_latitude ON beneficiary_clusters(centroid_latitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiary_clusters_longitude ON beneficiary_clusters(centroid_longitude)`;
    console.log('✅ beneficiary_clusters');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  beneficiary_clusters (already exists)');
    } else {
      errors++;
      console.log(`❌ beneficiary_clusters: ${error.message.substring(0, 80)}`);
    }
  }

  // 15. Agent Clusters
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS agent_clusters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        region VARCHAR(50) NOT NULL,
        cluster_id INTEGER,
        density_type VARCHAR(50),
        agent_count INTEGER DEFAULT 0,
        transaction_volume DECIMAL(15, 2) DEFAULT 0,
        average_liquidity DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_clusters_region ON agent_clusters(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_clusters_density ON agent_clusters(density_type)`;
    console.log('✅ agent_clusters');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  agent_clusters (already exists)');
    } else {
      errors++;
      console.log(`❌ agent_clusters: ${error.message.substring(0, 80)}`);
    }
  }

  // 16. Demand Hotspots
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS demand_hotspots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_address VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        region VARCHAR(50) NOT NULL,
        beneficiary_density DECIMAL(10, 2),
        transaction_demand_per_month DECIMAL(15, 2),
        current_agent_coverage INTEGER DEFAULT 0,
        recommended_agent_count INTEGER DEFAULT 0,
        priority VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_demand_hotspots_region ON demand_hotspots(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_demand_hotspots_priority ON demand_hotspots(priority)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_demand_hotspots_latitude ON demand_hotspots(latitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_demand_hotspots_longitude ON demand_hotspots(longitude)`;
    console.log('✅ demand_hotspots');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  demand_hotspots (already exists)');
    } else {
      errors++;
      console.log(`❌ demand_hotspots: ${error.message.substring(0, 80)}`);
    }
  }

  // 17. Coverage Gaps
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS coverage_gaps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        location_address VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        region VARCHAR(50) NOT NULL,
        beneficiary_count INTEGER DEFAULT 0,
        nearest_agent_distance_km DECIMAL(10, 2),
        recommended_agent_type VARCHAR(50),
        priority VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_coverage_gaps_region ON coverage_gaps(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_coverage_gaps_priority ON coverage_gaps(priority)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_coverage_gaps_latitude ON coverage_gaps(latitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_coverage_gaps_longitude ON coverage_gaps(longitude)`;
    console.log('✅ coverage_gaps');
    created++;
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      skipped++;
      console.log('⏭️  coverage_gaps (already exists)');
    } else {
      errors++;
      console.log(`❌ coverage_gaps: ${error.message.substring(0, 80)}`);
    }
  }

  // Create trigger functions
  console.log('\n📋 Creating trigger functions...');
  
  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION update_nampost_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ update_nampost_updated_at function');
  } catch (error: any) {
    console.log(`⏭️  update_nampost_updated_at: ${error.message.includes('already') ? 'exists' : error.message.substring(0, 50)}`);
  }

  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION update_leaderboard_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ update_leaderboard_updated_at function');
  } catch (error: any) {
    console.log(`⏭️  update_leaderboard_updated_at: ${error.message.includes('already') ? 'exists' : error.message.substring(0, 50)}`);
  }

  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ update_onboarding_updated_at function');
  } catch (error: any) {
    console.log(`⏭️  update_onboarding_updated_at: ${error.message.includes('already') ? 'exists' : error.message.substring(0, 50)}`);
  }

  try {
    await sql.unsafe(`
      CREATE OR REPLACE FUNCTION update_geoclustering_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ update_geoclustering_updated_at function');
  } catch (error: any) {
    console.log(`⏭️  update_geoclustering_updated_at: ${error.message.includes('already') ? 'exists' : error.message.substring(0, 50)}`);
  }

  // Create triggers
  console.log('\n📋 Creating triggers...');
  
  const triggers = [
    { name: 'trg_nampost_branches_updated_at', table: 'nampost_branches', function: 'update_nampost_updated_at' },
    { name: 'trg_nampost_staff_updated_at', table: 'nampost_staff', function: 'update_nampost_updated_at' },
    { name: 'trg_leaderboard_rankings_updated_at', table: 'leaderboard_rankings', function: 'update_leaderboard_updated_at' },
    { name: 'trg_merchant_onboarding_updated_at', table: 'merchant_onboarding', function: 'update_onboarding_updated_at' },
    { name: 'trg_agent_onboarding_updated_at', table: 'agent_onboarding', function: 'update_onboarding_updated_at' },
    { name: 'trg_beneficiary_clusters_updated_at', table: 'beneficiary_clusters', function: 'update_geoclustering_updated_at' },
    { name: 'trg_demand_hotspots_updated_at', table: 'demand_hotspots', function: 'update_geoclustering_updated_at' },
    { name: 'trg_coverage_gaps_updated_at', table: 'coverage_gaps', function: 'update_geoclustering_updated_at' },
  ];

  for (const trigger of triggers) {
    try {
      await sql.unsafe(`
        DROP TRIGGER IF EXISTS ${trigger.name} ON ${trigger.table};
        CREATE TRIGGER ${trigger.name}
          BEFORE UPDATE ON ${trigger.table}
          FOR EACH ROW
          EXECUTE FUNCTION ${trigger.function}();
      `);
      console.log(`✅ ${trigger.name}`);
    } catch (error: any) {
      console.log(`⏭️  ${trigger.name}: ${error.message.includes('already') ? 'exists' : error.message.substring(0, 50)}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  return { created, skipped, errors };
}

async function verifyTables() {
  console.log('\n🔍 Verifying tables...\n');
  
  const expectedTables = [
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
  
  const results: { table: string; exists: boolean; columns?: number }[] = [];
  
  for (const tableName of expectedTables) {
    try {
      const existsResult = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        ) as exists
      `;
      const exists = existsResult[0]?.exists || false;
      
      let columns = 0;
      if (exists) {
        const colsResult = await sql`
          SELECT COUNT(*) as count
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        `;
        columns = parseInt(colsResult[0]?.count || '0');
      }
      
      results.push({ table: tableName, exists, columns });
      const status = exists ? '✅' : '❌';
      console.log(`   ${status} ${tableName}${exists ? ` (${columns} columns)` : ''}`);
    } catch (error: any) {
      results.push({ table: tableName, exists: false });
      console.log(`   ❌ ${tableName} - Error: ${error.message.substring(0, 50)}`);
    }
  }
  
  const existingCount = results.filter(r => r.exists).length;
  const missingCount = results.filter(r => !r.exists).length;
  
  console.log(`\n📊 Verification Summary:`);
  console.log(`   ✅ Existing: ${existingCount}/${expectedTables.length}`);
  console.log(`   ❌ Missing: ${missingCount}/${expectedTables.length}`);
  
  return missingCount === 0;
}

async function main() {
  try {
    const result = await createAllTables();
    const allTablesExist = await verifyTables();

    if (allTablesExist && result.errors === 0) {
      console.log('\n🎉 All ecosystem tables created and verified successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tables may be missing or errors occurred.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
