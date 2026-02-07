import { sql } from '../src/database/connection';
import { v4 as uuidv4 } from 'uuid';

async function seedAll() {
  // Seed mobile_unit_equipment
  const mus = await sql`SELECT id, agent_id FROM mobile_unit_details`;
  console.log(`Seeding equipment for ${mus.length} mobile units...`);
  
  const eqTypes = ['POS_TERMINAL_PRIMARY', 'POS_TERMINAL_BACKUP', '4G_ROUTER', 'PRINTER', 'POWERBANK', 'CASHBOX'];
  let eqCount = 0;
  for (const mu of mus) {
    for (const et of eqTypes) {
      const assetId = 'ASSET-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      await sql`
        INSERT INTO mobile_unit_equipment (id, mobile_unit_id, equipment_type_code, asset_id, status, condition_notes, issued_at, created_at)
        VALUES (${uuidv4()}, ${mu.id}, ${et}, ${assetId}, 'active', 'Good condition', NOW(), NOW())
      `;
      eqCount++;
    }
  }
  console.log(`✅ Seeded ${eqCount} equipment items`);
  
  // Seed mobile_unit_drivers
  console.log('Seeding drivers...');
  let driverCount = 0;
  const roles = ['driver', 'assistant', 'helper'];
  for (const mu of mus) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const name = 'Team Member ' + (driverCount + 1);
    const idNum = 'ID' + String(Math.floor(Math.random() * 10000000) + 10000000);
    const phone = '+264 81 ' + String(Math.floor(Math.random() * 9000000) + 1000000);
    await sql`
      INSERT INTO mobile_unit_drivers (id, mobile_unit_id, name, id_number, phone, role, assigned_at, status, created_at, updated_at)
      VALUES (${uuidv4()}, ${mu.id}, ${name}, ${idNum}, ${phone}, ${role}, NOW(), 'active', NOW(), NOW())
    `;
    driverCount++;
  }
  console.log(`✅ Seeded ${driverCount} drivers`);
  
  // Seed nampost_staff
  console.log('Seeding NamPost staff...');
  const branches = await sql`SELECT id FROM nampost_branches`;
  let staffCount = 0;
  for (const branch of branches) {
    const managerName = 'Manager ' + (staffCount + 1);
    const clerkName = 'Clerk ' + (staffCount + 1);
    const email1 = 'staff' + (staffCount + 1) + '@nampost.com.na';
    const email2 = 'clerk' + (staffCount + 1) + '@nampost.com.na';
    const phone1 = '+264 61 ' + String(Math.floor(Math.random() * 900000) + 100000);
    const phone2 = '+264 61 ' + String(Math.floor(Math.random() * 900000) + 100000);
    
    await sql`
      INSERT INTO nampost_staff (staff_id, branch_id, name, role, phone_number, email, specialization, availability, performance_metrics, created_at, updated_at)
      VALUES (${uuidv4()}, ${branch.id}, ${managerName}, 'manager', ${phone1}, ${email1}, 'General', 'full-time', '{}', NOW(), NOW())
    `;
    await sql`
      INSERT INTO nampost_staff (staff_id, branch_id, name, role, phone_number, email, specialization, availability, performance_metrics, created_at, updated_at)
      VALUES (${uuidv4()}, ${branch.id}, ${clerkName}, 'clerk', ${phone2}, ${email2}, 'Transactions', 'full-time', '{}', NOW(), NOW())
    `;
    staffCount += 2;
  }
  console.log(`✅ Seeded ${staffCount} NamPost staff`);
  
  console.log('\n🎉 All seeding complete!');
  process.exit(0);
}

seedAll().catch(e => { console.error(e.message); process.exit(1); });
