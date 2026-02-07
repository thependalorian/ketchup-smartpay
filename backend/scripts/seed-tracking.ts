import { sql } from '../src/database/connection';
import { v4 as uuidv4 } from 'uuid';

async function seedAgentNetwork() {
  console.log('🌱 Seeding Agent Network Tracking Data...\n');

  // Get existing agents
  const agents = await sql`SELECT id, type, name, location, latitude, longitude FROM agents`;
  console.log(`Found ${agents.length} agents to work with`);

  // Seed POS Terminals for pos_agent type
  const posAgents = agents.filter((a: any) => a.type === 'pos_agent');
  console.log(`\n📱 Seeding ${posAgents.length} POS Terminals...`);
  
  for (const agent of posAgents) {
    const serialNums = ['POS-WD-' + Math.random().toString(36).substring(2, 8).toUpperCase()];
    for (const sn of serialNums) {
      await sql`
        INSERT INTO pos_terminals (id, agent_id, serial_number, model, status, location, cash_balance, daily_limit, last_activity, created_at)
        VALUES (
          ${uuidv4()}, 
          ${agent.id}, 
          ${sn}, 
          ${'Verifone VX520'}, 
          ${'active'}, 
          ${agent.location || 'Windhoek'}, 
          ${Math.floor(Math.random() * 50000) + 10000}, 
          ${150000}, 
          ${new Date().toISOString()}, 
          ${new Date().toISOString()}
        )
      `;
    }
  }
  console.log('✅ POS Terminals seeded');

  // Seed Mobile Unit Details
  const mobileUnits = agents.filter((a: any) => a.type === 'mobile_unit');
  console.log(`\n🚐 Seeding ${mobileUnits.length} Mobile Unit Details...`);
  
  const vehicleTypes = ['Toyota Hilux', 'Ford Ranger', 'Isuzu KB', 'Nissan Navarra'];
  const teamLeaders = ['John M.', 'Sarah K.', 'Michael T.', 'Anna L.', 'Robert H.'];
  
  for (let i = 0; i < mobileUnits.length; i++) {
    const agent = mobileUnits[i];
    const muId = uuidv4();
    const loc = agent.location || 'Windhoek';
    
    await sql`
      INSERT INTO mobile_unit_details (
        id, agent_id, vehicle_type, vehicle_plate, team_leader, status, 
        current_gps_lat, current_gps_lng, current_region, current_district,
        departure_time, operating_hours, created_at
      )
      VALUES (
        ${muId}, ${agent.id}, ${vehicleTypes[i % vehicleTypes.length]}, 
        ${'54-' + String(Math.floor(Math.random() * 9000) + 1000)}, 
        ${teamLeaders[i % teamLeaders.length]}, ${'active'},
        ${-22.57 + (Math.random() - 0.5) * 2}, ${17.0 + (Math.random() - 0.5) * 3},
        ${loc}, ${loc},
        ${new Date(Date.now() - Math.random() * 86400000).toISOString()},
        ${Math.floor(Math.random() * 8) + 4}, ${new Date().toISOString()}
      )
    `;

    // Add equipment
    const equipment = [
      { name: 'POS Terminal (Primary)', qty: 2, condition: 'good' },
      { name: 'POS Terminal (Backup)', qty: 1, condition: 'good' },
      { name: '4G Router', qty: 1, condition: 'good' },
      { name: 'Portable Printer', qty: 1, condition: 'fair' },
      { name: 'Power Bank (20000mAh)', qty: 4, condition: 'good' },
      { name: 'Cash Box', qty: 1, condition: 'good' },
    ];

    for (const eq of equipment) {
      await sql`
        INSERT INTO mobile_unit_equipment (id, mobile_unit_id, equipment_name, quantity, condition_status, last_checked)
        VALUES (${uuidv4()}, ${muId}, ${eq.name}, ${eq.qty}, ${eq.condition}, ${new Date().toISOString()})
      `;
    }

    // Add drivers/assistants
    const names = ['Driver: Peter J.', 'Assistant: Maria S.', 'Helper: Tom B.'];
    for (const name of names.slice(0, Math.floor(Math.random() * 2) + 2)) {
      await sql`
        INSERT INTO mobile_unit_drivers (id, mobile_unit_id, name, role, phone, status)
        VALUES (${uuidv4()}, ${muId}, ${name}, ${name.includes('Driver') ? 'driver' : 'assistant'},
        ${'+264 81 ' + String(Math.floor(Math.random() * 9000000) + 1000000)}, ${'active'})
      `;
    }
  }
  console.log('✅ Mobile Units, Equipment & Drivers seeded');

  // Seed NamPost Branches and Staff
  console.log('\n🏢 Seeding NamPost Network...');
  const nampostAgents = agents.filter((a: any) => a.type === 'nampost');
  
  const branchNames = [
    'Windhoek Main', 'Okahandja', 'Rehoboth', 'Mariental', 
    'Keetmanshoop', 'Otjiwarongo', 'Tsumeb', 'Oshakati',
    'Rundu', 'Walvis Bay', 'Swakopmund', 'Gobabis'
  ];

  const regions = ['Erongo', 'Hardap', 'Kavango', 'Kunene', 'Ohangwena', 'Omaheke', 'Omusati', 'Osana', 'Oshana', 'Oshikoto', 'Otjozondjupa', 'Khomas'];

  for (let i = 0; i < Math.min(nampostAgents.length, branchNames.length); i++) {
    const agent = nampostAgents[i];
    const branchId = uuidv4();
    
    await sql`
      INSERT INTO nampost_branches (id, agent_id, branch_name, region, district, address, status, opening_hours, created_at)
      VALUES (
        ${branchId}, ${agent.id}, ${branchNames[i]}, ${regions[i % regions.length]},
        ${branchNames[i]}, ${branchNames[i] + ' Post Office'}, ${'active'},
        ${'08:00-16:30'}, ${new Date().toISOString()}
      )
    `;

    // Add staff
    await sql`
      INSERT INTO nampost_staff (id, branch_id, name, role, phone, status)
      VALUES (
        ${uuidv4()}, ${branchId}, ${'Branch Manager ' + (i+1)}, ${'manager'},
        ${'+264 61 ' + String(Math.floor(Math.random() * 900000) + 100000)}, ${'active'}
      )
    `;
    await sql`
      INSERT INTO nampost_staff (id, branch_id, name, role, phone, status)
      VALUES (
        ${uuidv4()}, ${branchId}, ${'Clerk ' + (i+1)}, ${'clerk'},
        ${'+264 61 ' + String(Math.floor(Math.random() * 900000) + 100000)}, ${'active'}
      )
    `;

    // Add daily load
    await sql`
      INSERT INTO nampost_branch_load (id, branch_id, date, cash_in_transit, expected_disbursement, actual_disbursement, closing_balance, status)
      VALUES (
        ${uuidv4()}, ${branchId}, ${new Date().toISOString().split('T')[0]},
        ${Math.floor(Math.random() * 200000) + 50000}, ${Math.floor(Math.random() * 100000) + 20000},
        ${Math.floor(Math.random() * 80000) + 15000}, ${Math.floor(Math.random() * 50000) + 10000}, ${'completed'}
      )
    `;
  }
  console.log('✅ NamPost Branches, Staff & Daily Loads seeded');

  // Seed POS Transactions (historical data)
  console.log('\n💰 Seeding POS Transactions (30 days)...');
  const posTerminals = await sql`SELECT id, agent_id FROM pos_terminals`;
  
  for (let days = 30; days >= 0; days--) {
    const date = new Date(Date.now() - days * 86400000);
    for (const terminal of posTerminals) {
      const numTx = Math.floor(Math.random() * 15) + 5;
      for (let t = 0; t < numTx; t++) {
        const amount = Math.floor(Math.random() * 2000) + 100;
        const voucherCode = 'BFR-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        await sql`
          INSERT INTO pos_transactions (id, terminal_id, agent_id, transaction_type, amount, voucher_code, status, timestamp)
          VALUES (
            ${uuidv4()}, ${terminal.id}, ${terminal.agent_id}, ${'voucher_redemption'},
            ${amount}, ${voucherCode}, ${'completed'}, ${date.toISOString()}
          )
        `;
      }
    }
  }
  console.log('✅ POS Transactions seeded');

  // Seed POS Daily Summaries
  console.log('\n📊 Seeding POS Daily Summaries...');
  for (let days = 30; days >= 0; days--) {
    const date = new Date(Date.now() - days * 86400000);
    for (const terminal of posTerminals) {
      const totalTx = Math.floor(Math.random() * 20) + 8;
      const totalAmount = Math.floor(Math.random() * 30000) + 10000;
      await sql`
        INSERT INTO pos_daily_summaries (id, terminal_id, agent_id, date, total_transactions, total_amount, avg_transaction, success_rate, created_at)
        VALUES (
          ${uuidv4()}, ${terminal.id}, ${terminal.agent_id}, ${date.toISOString().split('T')[0]},
          ${totalTx}, ${totalAmount}, ${Math.floor(totalAmount / totalTx)}, ${0.95 + Math.random() * 0.05}, ${new Date().toISOString()}
        )
      `;
    }
  }
  console.log('✅ POS Daily Summaries seeded');

  console.log('\n🎉 Agent Network seeding complete!');
  console.log('Summary:');
  console.log(`  - POS Terminals: ${posTerminals.length}`);
  console.log(`  - Mobile Units: ${mobileUnits.length}`);
  console.log(`  - NamPost Branches: ${Math.min(nampostAgents.length, branchNames.length)}`);
}

seedAgentNetwork()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('Seed failed:', e.message);
    process.exit(1);
  });
