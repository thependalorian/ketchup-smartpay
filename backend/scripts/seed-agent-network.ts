/**
 * Agent Network Seed Script
 * 
 * Seeds the database with:
 * - 300 agents (pos_agent, mobile_agent, nampost, mobile_unit)
 * - POS terminals for each POS agent
 * - ATM records with cash levels
 * - Mobile unit details with equipment and routes
 * - Transaction analytics data
 * 
 * Run: cd backend && npx tsx scripts/seed-agent-network.ts
 */

import { sql } from '../src/database/connection';

// Namibia regions
const NAMIBIAN_REGIONS = [
  'Khomas', 'Erongo', 'Oshana', 'Omusati', 'Ohangwena',
  'Oshikoto', 'Kavango East', 'Kavango West', 'Zambezi',
  'Kunene', 'Otjozondjupa', 'Omaheke', 'Hardap', 'Karas'
];

const POS_AGENT_NAMES = [
  'Katutura Corner Shop', 'Coastal Supermarket', 'Northern Traders',
  'Rundu Quick Stop', 'Walvis Bay Convenience', 'Oshakati Mini Mart',
  'Ondangwa Trading', 'Ongwediva General', 'Tsumeb Retail',
  'Swakopmund Express', 'Rehoboth Store', 'Keetmanshoop Shop'
];

const MOBILE_AGENT_NAMES = [
  'Windhoek Mobile Cash', 'Erongo Mobile Services', 'Oshana Mobile Agent',
  'Kavango Mobile Cash', 'Ohangwena Mobile', 'Oshikoto Mobile Agent'
];

const MOBILE_UNIT_NAMES = [
  'MU-Khomas-001', 'MU-Khomas-002', 'MU-Erongo-001', 'MU-Oshana-001',
  'MU-Oshana-002', 'MU-Kavango-001', 'MU-Kunene-001', 'MU-Ohangwena-001'
];

function generatePOSSerial(): string {
  const prefix = 'POS';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function generateTerminalId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TERM-${timestamp}-${random}`;
}

function generateATMId(): string {
  return `ATM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

function randomOffset(lat: number, lng: number, radiusKm: number = 5): { lat: number; lng: number } {
  const latOffset = (Math.random() - 0.5) * (radiusKm / 111);
  const lngOffset = (Math.random() - 0.5) * (radiusKm / 111);
  return {
    lat: Math.round((lat + latOffset) * 1000000) / 1000000,
    lng: Math.round((lng + lngOffset) * 1000000) / 1000000
  };
}

const NAMPOST_OFFICES: Record<string, { lat: number; lng: number }> = {
  'Windhoek Main': { lat: -22.5626, lng: 17.0841 },
  'Katutura': { lat: -22.5211, lng: 17.0598 },
  'Swakopmund': { lat: -22.6758, lng: 14.5258 },
  'Walvis Bay': { lat: -22.9521, lng: 14.5068 },
  'Oshakati Main': { lat: -17.7895, lng: 15.7058 },
  'Ondangwa': { lat: -17.9074, lng: 15.9706 },
  'Ongwediva': { lat: -17.7731, lng: 15.7645 },
  'Rundu': { lat: -17.9136, lng: 19.7623 },
  'Keetmanshoop': { lat: -26.5642, lng: 18.1310 },
  'Otjiwarongo': { lat: -20.4545, lng: 16.6645 },
  'Gobabis': { lat: -22.3990, lng: 18.9740 },
  'Mariental': { lat: -24.5998, lng: 17.9413 },
  'Tsumeb': { lat: -19.2312, lng: 17.7133 },
  'Outapi': { lat: -17.5111, lng: 14.9849 },
  'Oshikango': { lat: -17.3978, lng: 15.8907 }
};

async function seedAgents() {
  console.log('🌱 Seeding agent network...');
  
  // Seed POS Agents (120)
  console.log('  Creating 120 POS agents...');
  for (let i = 0; i < 120; i++) {
    const region = NAMIBIAN_REGIONS[Math.floor(Math.random() * NAMIBIAN_REGIONS.length)];
    const officeKeys = Object.keys(NAMPOST_OFFICES);
    const baseOffice = NAMPOST_OFFICES[officeKeys[Math.floor(Math.random() * officeKeys.length)]];
    const coords = randomOffset(baseOffice.lat, baseOffice.lng, 15);
    
    const name = `${POS_AGENT_NAMES[i % POS_AGENT_NAMES.length]} ${region} ${i + 1}`;
    const liquidity = 50000 + Math.floor(Math.random() * 150000);
    const maxDaily = 20000 + Math.floor(Math.random() * 80000);
    
    try {
      const agentResult = await sql`
        INSERT INTO agents (
          name, type, location, latitude, longitude,
          liquidity_balance, cash_on_hand, status,
          min_liquidity_required, max_daily_cashout,
          commission_rate, contact_phone, contact_email
        ) VALUES (
          ${name}, 'pos_agent', ${region}, ${coords.lat}, ${coords.lng},
          ${liquidity}, ${liquidity}, 'active',
          ${10000}, ${maxDaily},
          ${1.0 + Math.random() * 1.5}, ${'+26481' + Math.floor(1000000 + Math.random() * 8999999)},
          ${`agent${i + 1}@buffr.ai`}
        )
        RETURNING id
      `;
      
      const agentId = (agentResult[0] as any).id;
      
      await sql`
        INSERT INTO pos_terminals (
          terminal_id, serial_number, agent_id, merchant_id, merchant_name,
          location, latitude, longitude, status, device_id,
          provisioned_at, current_cash_balance, last_heartbeat_at
        ) VALUES (
          ${generateTerminalId()}, ${generatePOSSerial()}, ${agentId}, ${'MERCH-' + (i + 1).toString().padStart(5, '0')},
          ${name}, ${region}, ${coords.lat}, ${coords.lng}, 'active',
          ${'DEV-' + generatePOSSerial().substring(4)}, NOW(),
          ${liquidity * 0.3}, NOW()
        )
      `;
      
      await seedAgentTransactions(agentId, 30);
      
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating POS agent ${i}:`, error.message);
      }
    }
    
    if ((i + 1) % 20 === 0) {
      console.log(`    Created ${i + 1}/120 POS agents...`);
    }
  }
  
  // Seed Mobile Agents (60)
  console.log('  Creating 60 mobile agents...');
  for (let i = 0; i < 60; i++) {
    const region = NAMIBIAN_REGIONS[Math.floor(Math.random() * NAMIBIAN_REGIONS.length)];
    const officeKeys = Object.keys(NAMPOST_OFFICES);
    const baseOffice = NAMPOST_OFFICES[officeKeys[Math.floor(Math.random() * officeKeys.length)]];
    const coords = randomOffset(baseOffice.lat, baseOffice.lng, 25);
    
    const name = `${MOBILE_AGENT_NAMES[i % MOBILE_AGENT_NAMES.length]} ${region}`;
    const liquidity = 20000 + Math.floor(Math.random() * 80000);
    
    try {
      await sql`
        INSERT INTO agents (
          name, type, location, latitude, longitude,
          liquidity_balance, cash_on_hand, status,
          min_liquidity_required, max_daily_cashout,
          commission_rate, contact_phone, contact_email
        ) VALUES (
          ${name}, 'mobile_agent', ${region}, ${coords.lat}, ${coords.lng},
          ${liquidity}, ${liquidity}, 'active',
          ${5000}, ${10000 + Math.floor(Math.random() * 40000)},
          ${1.5 + Math.random() * 2.0}, ${'+26482' + Math.floor(1000000 + Math.random() * 8999999)},
          ${`mobile${i + 1}@buffr.ai`}
        )
      `;
      
      const agentsResult = await sql`SELECT id FROM agents WHERE name = ${name}`;
      if (agentsResult.length > 0) {
        await seedAgentTransactions((agentsResult[0] as any).id, 30);
      }
      
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating mobile agent ${i}:`, error.message);
      }
    }
  }
  
  // Seed NamPost Offices liquidity tracking
  console.log('  Seeding NamPost liquidity tracking...');
  const nampostAgents = await sql`SELECT id, location FROM agents WHERE type = 'nampost'`;
  for (const agent of nampostAgents as any[]) {
    const liquidity = 100000 + Math.floor(Math.random() * 300000);
    try {
      await sql`
        INSERT INTO agent_float (agent_id, current_float, float_threshold, overdraft_limit, updated_at)
        VALUES (${agent.id}, ${liquidity}, ${50000}, ${100000}, NOW())
        ON CONFLICT (agent_id) DO UPDATE SET current_float = ${liquidity}, updated_at = NOW()
      `;
    } catch (error: any) {
      // Ignore
    }
  }
  
  // Seed Mobile Units (30)
  console.log('  Creating 30 mobile units...');
  for (let i = 0; i < 30; i++) {
    const region = NAMIBIAN_REGIONS[Math.floor(Math.random() * NAMIBIAN_REGIONS.length)];
    const officeKeys = Object.keys(NAMPOST_OFFICES);
    const baseOffice = NAMPOST_OFFICES[officeKeys[Math.floor(Math.random() * officeKeys.length)]];
    const coords = randomOffset(baseOffice.lat, baseOffice.lng, 5);
    
    const name = `${MOBILE_UNIT_NAMES[i % MOBILE_UNIT_NAMES.length]} - ${region}`;
    const maxCapacity = 300000 + Math.floor(Math.random() * 400000);
    
    try {
      const unitResult = await sql`
        INSERT INTO agents (
          name, type, location, latitude, longitude,
          liquidity_balance, cash_on_hand, status,
          min_liquidity_required, max_daily_cashout,
          commission_rate, contact_phone, contact_email
        ) VALUES (
          ${name}, 'mobile_unit', ${region}, ${coords.lat}, ${coords.lng},
          ${maxCapacity * 0.8}, ${maxCapacity * 0.8}, 'active',
          ${50000}, ${maxCapacity},
          ${0.5 + Math.random() * 0.5}, ${'+26484' + Math.floor(1000000 + Math.random() * 8999999)},
          ${`unit${i + 1}@buffr.ai`}
        )
        RETURNING id
      `;
      
      const unitId = (unitResult[0] as any).id;
      
      await sql`
        INSERT INTO mobile_unit_details (
          agent_id, vehicle_registration, vehicle_make, vehicle_model, vehicle_year,
          vehicle_type, team_lead_name, team_lead_phone, team_size, assigned_regions,
          primary_region, max_cash_capacity, current_cash_onboard, route_status
        ) VALUES (
          ${unitId}, ${'MU-' + (i + 1).toString().padStart(3, '0')},
          ${['Toyota', 'Ford', 'Isuzu', 'Nissan', 'Hyundai'][Math.floor(Math.random() * 5)]},
          ${['Hiace', 'Transit', 'D-Max', 'Navara', 'H-1'][Math.floor(Math.random() * 5)]},
          ${2018 + Math.floor(Math.random() * 6)},
          'van',
          ${['Johannes', 'Maria', 'David', 'Anna', 'Thomas'][Math.floor(Math.random() * 5)] + ' ' +
           ['Shikongo', 'Hamutenya', 'Nangolo', 'Iyambo', 'Mbambo'][Math.floor(Math.random() * 5)]},
          ${'+26481' + Math.floor(1000000 + Math.random() * 8999999)},
          ${2 + Math.floor(Math.random() * 3)},
          ARRAY[${region}, ${NAMIBIAN_REGIONS[Math.floor(Math.random() * NAMIBIAN_REGIONS.length)]}],
          ${region}, ${maxCapacity}, ${maxCapacity * 0.8}, 'depot'
        )
      `;
      
      const equipment = [
        { code: 'cash_dispenser', assetId: `CD-${i + 1}`.padStart(10, '0') },
        { code: 'cash_cassette', assetId: `CC-${i + 1}`.padStart(10, '0') },
        { code: 'gps_tracker', assetId: `GPS-${i + 1}`.padStart(10, '0') },
        { code: 'tablet', assetId: `TBL-${i + 1}`.padStart(10, '0') }
      ];
      
      for (const eq of equipment) {
        await sql`
          INSERT INTO mobile_unit_equipment (mobile_unit_id, equipment_type_code, asset_id, status, issued_at)
          VALUES (${unitId}, ${eq.code}, ${eq.assetId}, 'in_use', NOW())
        `;
      }
      
      await seedMobileUnitRoute(unitId, region);
      
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating mobile unit ${i}:`, error.message);
      }
    }
  }
  
  console.log('✅ Agent network seeded successfully!');
}

async function seedAgentTransactions(agentId: string, days: number) {
  for (let d = 0; d < days; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    
    const transactionCount = 5 + Math.floor(Math.random() * 20);
    const successfulCount = Math.floor(transactionCount * (0.85 + Math.random() * 0.15));
    const avgValue = 500 + Math.random() * 1500;
    const totalVolume = successfulCount * avgValue;
    
    await sql`
      INSERT INTO agent_transactions (
        agent_id, transaction_date, transaction_count, successful_count, failed_count,
        total_cashout_amount, total_commission_earned, avg_transaction_value,
        success_rate, vouchers_redeemed, unique_beneficiaries_served
      ) VALUES (
        ${agentId}, ${date.toISOString().split('T')[0]}, ${transactionCount},
        ${successfulCount}, ${transactionCount - successfulCount},
        ${totalVolume}, ${totalVolume * 0.015}, ${avgValue},
        ${(successfulCount / transactionCount) * 100},
        ${successfulCount}, ${Math.floor(successfulCount * 0.9)}
      )
      ON CONFLICT (agent_id, transaction_date) DO NOTHING
    `;
  }
}

async function seedMobileUnitRoute(unitId: string, region: string) {
  const stops = 3 + Math.floor(Math.random() * 5);
  const officeKeys = Object.keys(NAMPOST_OFFICES);
  const baseOffice = NAMPOST_OFFICES[officeKeys.find(k => k.includes(region)) || 'Windhoek Main'] || { lat: -22.5626, lng: 17.0841 };
  
  try {
    const routeResult = await sql`
      INSERT INTO mobile_unit_routes (
        mobile_unit_id, route_name, route_date, planned_stops,
        departed_depot_at, route_status, total_distance_km
      ) VALUES (
        ${unitId}, ${`Route ${region} ${new Date().toISOString().split('T')[0]}`},
        NOW()::date, ${stops}, NOW(), 'in_progress',
        ${50 + Math.random() * 100}
      )
      RETURNING id
    `;
    
    const routeId = (routeResult[0] as any).id;
    
    for (let s = 0; s < stops; s++) {
      const coords = randomOffset(baseOffice.lat, baseOffice.lng, 20 + s * 5);
      const beneficiaries = 10 + Math.floor(Math.random() * 30);
      const amount = beneficiaries * (400 + Math.random() * 800);
      
      await sql`
        INSERT INTO mobile_unit_stops (
          route_id, stop_number, location_name, latitude, longitude,
          actual_arrival, beneficiaries_served, transactions_completed,
          total_amount, stop_status
        ) VALUES (
          ${routeId}, ${s + 1},
          ${`Stop ${s + 1} - ${region} Area`},
          ${coords.lat}, ${coords.lng},
          new Date(Date.now() - (stops - s) * 3600000),
          ${beneficiaries}, ${beneficiaries},
          ${amount}, 'completed'
        )
      `;
    }
    
    const stopStats = await sql`
      SELECT SUM(transactions_completed) as tx, SUM(total_amount) as amt
      FROM mobile_unit_stops WHERE route_id = ${routeId}
    `;
    
    await sql`
      UPDATE mobile_unit_routes SET
        total_transactions = ${(stopStats[0] as any).tx || 0},
        total_volume = ${(stopStats[0] as any).amt || 0},
        completed_stops = ${stops},
        completed_route_at = NOW()
      WHERE id = ${routeId}
    `;
    
  } catch (error: any) {
    // Ignore
  }
}

async function seedATMs() {
  console.log('🌱 Seeding ATM network...');
  
  const atmLocations = [
    { name: 'ATM Windhoek Independence Ave', region: 'Khomas', lat: -22.5590, lng: 17.0860 },
    { name: 'ATM Windhoek Wernhill', region: 'Khomas', lat: -22.5550, lng: 17.0780 },
    { name: 'ATM Katutura', region: 'Khomas', lat: -22.5200, lng: 17.0610 },
    { name: 'ATM Walvis Bay Main', region: 'Erongo', lat: -22.9490, lng: 14.5080 },
    { name: 'ATM Swakopmund', region: 'Erongo', lat: -22.6760, lng: 14.5240 },
    { name: 'ATM Rundu', region: 'Kavango East', lat: -17.9110, lng: 19.7630 },
    { name: 'ATM Oshakati', region: 'Oshana', lat: -17.7900, lng: 15.7040 },
    { name: 'ATM Ondangwa', region: 'Oshana', lat: -17.9080, lng: 15.9690 },
    { name: 'ATM Otjiwarongo', region: 'Otjozondjupa', lat: -20.4550, lng: 16.6630 },
    { name: 'ATM Keetmanshoop', region: 'Karas', lat: -26.5650, lng: 18.1300 },
    { name: 'ATM Gobabis', region: 'Omaheke', lat: -22.4000, lng: 18.9730 },
    { name: 'ATM Mariental', region: 'Hardap', lat: -24.6000, lng: 17.9400 }
  ];
  
  for (const loc of atmLocations) {
    const cashLevel = 20 + Math.floor(Math.random() * 80);
    
    try {
      await sql`
        INSERT INTO atms (
          terminal_id, location, region, latitude, longitude, bank_name,
          status, cash_level_percent, last_cassette_change_at, last_serviced_at,
          denominations_supported, cash_in_supported
        ) VALUES (
          ${generateATMId()}, ${loc.name}, ${loc.region}, ${loc.lat}, ${loc.lng},
          ${['Bank of Namibia', 'Standard Bank', 'FirstRand', 'Nedbank'][Math.floor(Math.random() * 4)]},
          ${cashLevel < 20 ? 'low_cash' : 'operational'},
          ${cashLevel}, NOW() - INTERVAL '7 days', NOW() - INTERVAL '30 days',
          ARRAY[20, 50, 100, 200], false
        )
      `;
      
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating ATM ${loc.name}:`, error.message);
      }
    }
  }
  
  console.log('✅ ATMs seeded successfully!');
}

async function seedPOSDailySummaries() {
  console.log('🌱 Seeding POS daily summaries...');
  
  const terminals = await sql`SELECT id, agent_id FROM pos_terminals LIMIT 100`;
  
  for (const terminal of terminals as any[]) {
    for (let d = 0; d < 30; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      
      const transactions = 10 + Math.floor(Math.random() * 40);
      const failed = Math.floor(transactions * (Math.random() * 0.1));
      const volume = transactions * (300 + Math.random() * 700);
      
      await sql`
        INSERT INTO pos_daily_summaries (
          terminal_id, summary_date, total_transactions, successful_transactions,
          failed_transactions, total_volume, total_fees, total_commission,
          avg_response_time_ms, uptime_percentage
        ) VALUES (
          ${terminal.id}, ${date.toISOString().split('T')[0]},
          ${transactions}, ${transactions - failed},
          ${failed}, ${volume}, ${volume * 0.02}, ${volume * 0.015},
          ${200 + Math.random() * 400}, ${95 + Math.random() * 5}
        )
        ON CONFLICT (terminal_id, summary_date) DO NOTHING
      `;
    }
  }
  
  console.log('✅ POS daily summaries seeded!');
}

async function main() {
  try {
    console.log('Starting agent network seed...');
    
    await seedAgents();
    await seedATMs();
    await seedPOSDailySummaries();
    
    const summary = await sql`
      SELECT type, COUNT(*) as count, SUM(liquidity_balance) as total_liquidity
      FROM agents GROUP BY type
    `;
    
    console.log('\n📊 Agent Network Summary:');
    for (const row of summary as any[]) {
      console.log(`  ${row.type}: ${row.count} agents, N$${Number(row.total_liquidity || 0).toLocaleString()} total liquidity`);
    }
    
    const posCount = await sql`SELECT COUNT(*) as c FROM pos_terminals`;
    const atmCount = await sql`SELECT COUNT(*) as c FROM atms`;
    const muCount = await sql`SELECT COUNT(*) as c FROM mobile_unit_details`;
    
    console.log(`  POS Terminals: ${(posCount[0] as any).c}`);
    console.log(`  ATMs: ${(atmCount[0] as any).c}`);
    console.log(`  Mobile Units: ${(muCount[0] as any).c}`);
    
    console.log('Agent network seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('Agent network seed failed:', error);
    process.exit(1);
  }
}

main();
