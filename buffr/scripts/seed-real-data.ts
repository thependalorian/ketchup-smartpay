/**
 * Seed Real Test Data
 * 
 * Location: scripts/seed-real-data.ts
 * Purpose: Populate database with realistic test data
 * 
 * Run: npx tsx scripts/seed-real-data.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import logger, { log } from '@/utils/logger';

// Load environment variables
function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.join(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
      return;
    }
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Namibian names for realistic data
const firstNames = ['Johannes', 'Maria', 'Petrus', 'Anna', 'Simon', 'Helena', 'David', 'Sarah', 'Michael', 'Elizabeth'];
const lastNames = ['Nangolo', 'Shikongo', 'Nghipandulwa', 'Iipumbu', 'Kamati', 'Sheehama', 'Nghidishange', 'Amukugo', 'Shilongo', 'Ndemufayo'];

function randomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return { first, last, full: `${first} ${last}` };
}

function randomPhone() {
  const prefixes = ['811', '812', '813', '814', '815', '816', '817', '818', '819'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+264${prefix}${number}`;
}

function randomAmount(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(daysBack: number) {
  const now = new Date();
  const past = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return past.toISOString();
}

async function seedData() {
  logger.info('🌱 Seeding Real Test Data\n');
  logger.info('═'.repeat(50));

  try {
    // ========== USERS ==========
    logger.info('\n👤 Creating Users...');
    const users: any[] = [];
    
    for (let i = 0; i < 5; i++) {
      const name = randomName();
      const userId = randomUUID();
      const externalId = `user-${i + 1}`;
      
      await sql`
        INSERT INTO users (id, external_id, full_name, phone_number, email, kyc_level, created_at, updated_at, metadata)
        VALUES (
          ${userId},
          ${externalId},
          ${name.full},
          ${randomPhone()},
          ${name.first.toLowerCase()}@buffr.ai,
          ${Math.floor(Math.random() * 4)},
          ${randomDate(90)},
          NOW(),
          ${JSON.stringify({ currency: 'NAD', avatar: null, is_two_factor_enabled: false })}
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          updated_at = NOW()
      `;
      
      users.push({ id: userId, externalId, name: name.full });
      logger.info(`   ✅ User ${i + 1}: ${name.full} (${externalId})`);
    }

    // ========== WALLETS ==========
    logger.info('\n💳 Creating Wallets...');
    const wallets: any[] = [];
    const walletTypes = ['personal', 'savings', 'business'];
    
    for (const user of users) {
      // Each user gets 1-3 wallets
      const numWallets = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numWallets; i++) {
        const walletId = randomUUID();
        const walletType = walletTypes[i % walletTypes.length];
        const balance = randomAmount(100, 50000);
        
        await sql`
          INSERT INTO wallets (id, user_id, name, type, currency, balance, available_balance, status, is_default, created_at, updated_at, metadata)
          VALUES (
            ${walletId},
            ${user.id},
            ${walletType === 'personal' ? 'Main Wallet' : walletType === 'savings' ? 'Savings' : 'Business Account'},
            ${walletType},
            ${'NAD'},
            ${balance},
            ${balance},
            ${'active'},
            ${i === 0},
            ${randomDate(60)},
            NOW(),
            ${JSON.stringify({ 
              auto_pay_enabled: Math.random() > 0.5,
              auto_pay_limit: 5000,
              security_settings: { require_pin: true, biometric_enabled: false }
            })}
          )
          ON CONFLICT (id) DO UPDATE SET
            balance = EXCLUDED.balance,
            updated_at = NOW()
        `;
        
        wallets.push({ id: walletId, userId: user.id, type: walletType, balance });
      }
    }
    logger.info(`   ✅ Created ${wallets.length} wallets`);

    // ========== TRANSACTIONS ==========
    logger.info('\n💰 Creating Transactions...');
    const txTypes = ['transfer_in', 'transfer_out', 'deposit', 'withdrawal', 'payment'];
    const statuses = ['completed', 'pending', 'failed'];
    const merchants = ['Pick n Pay', 'Shoprite', 'Checkers', 'Spar', 'Woermann Brock', 'Game', 'Edgars', 'MTC Airtime'];
    let txCount = 0;
    
    for (const user of users) {
      const numTx = Math.floor(Math.random() * 20) + 5;
      
      for (let i = 0; i < numTx; i++) {
        const txId = randomUUID();
        const txType = txTypes[Math.floor(Math.random() * txTypes.length)];
        const amount = randomAmount(10, 5000);
        const status = statuses[Math.floor(Math.random() * 10) < 8 ? 0 : Math.floor(Math.random() * 3)];
        const merchant = merchants[Math.floor(Math.random() * merchants.length)];
        
        await sql`
          INSERT INTO transactions (id, external_id, user_id, amount, currency, transaction_type, status, transaction_time, merchant_name, created_at, updated_at, metadata)
          VALUES (
            ${txId},
            ${'tx-' + txId.substring(0, 8)},
            ${user.id},
            ${amount},
            ${'NAD'},
            ${txType},
            ${status},
            ${randomDate(30)},
            ${merchant},
            NOW(),
            NOW(),
            ${JSON.stringify({
              description: `${txType.replace('_', ' ')} - ${merchant}`,
              category: txType === 'payment' ? 'shopping' : txType === 'transfer_in' ? 'income' : 'expense',
              wallet_id: wallets.find(w => w.userId === user.id)?.id || null,
            })}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        txCount++;
      }
    }
    logger.info(`   ✅ Created ${txCount} transactions`);

    // ========== CONTACTS ==========
    logger.info('\n📇 Creating Contacts...');
    let contactCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Each user has some contacts (other users + random)
      for (let j = 0; j < users.length; j++) {
        if (i !== j) {
          const contactId = randomUUID();
          const otherUser = users[j];
          
          await sql`
            INSERT INTO contacts (id, user_id, name, phone, email, is_favorite, created_at, updated_at)
            VALUES (
              ${contactId},
              ${user.id},
              ${otherUser.name},
              ${randomPhone()},
              ${otherUser.name.split(' ')[0].toLowerCase()}@buffr.ai,
              ${Math.random() > 0.7},
              ${randomDate(45)},
              NOW()
            )
            ON CONFLICT (id) DO NOTHING
          `;
          contactCount++;
        }
      }
    }
    logger.info(`   ✅ Created ${contactCount} contacts`);

    // ========== GROUPS ==========
    logger.info('\n👥 Creating Groups...');
    const groupNames = ['Family Savings', 'Work Team', 'Sports Club', 'Church Fund'];
    let groupCount = 0;
    
    for (let i = 0; i < 2; i++) {
      const groupId = randomUUID();
      const owner = users[i];
      
      await sql`
        INSERT INTO groups (id, name, description, owner_id, target_amount, current_amount, created_at, updated_at)
        VALUES (
          ${groupId},
          ${groupNames[i]},
          ${'Collective savings for ' + groupNames[i].toLowerCase()},
          ${owner.id},
          ${randomAmount(10000, 100000)},
          ${randomAmount(1000, 10000)},
          ${randomDate(60)},
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      
      // Add members
      for (let j = 0; j < Math.min(3, users.length); j++) {
        if (j !== i) {
          await sql`
            INSERT INTO group_members (id, group_id, user_id, role, contribution_amount, created_at)
            VALUES (
              ${randomUUID()},
              ${groupId},
              ${users[j].id},
              ${j === 0 ? 'admin' : 'member'},
              ${randomAmount(100, 1000)},
              ${randomDate(30)}
            )
            ON CONFLICT DO NOTHING
          `;
        }
      }
      groupCount++;
    }
    logger.info(`   ✅ Created ${groupCount} groups with members`);

    // ========== MONEY REQUESTS ==========
    logger.info('\n💸 Creating Money Requests...');
    const requestStatuses = ['pending', 'approved', 'declined', 'completed'];
    let requestCount = 0;
    
    for (let i = 0; i < 8; i++) {
      const fromUser = users[Math.floor(Math.random() * users.length)];
      const toUser = users.find(u => u.id !== fromUser.id) || users[0];
      
      await sql`
        INSERT INTO money_requests (id, from_user_id, to_user_id, amount, currency, note, status, created_at, updated_at)
        VALUES (
          ${randomUUID()},
          ${fromUser.id},
          ${toUser.id},
          ${randomAmount(50, 2000)},
          ${'NAD'},
          ${'Request for ' + ['lunch', 'rent share', 'utilities', 'groceries'][Math.floor(Math.random() * 4)]},
          ${requestStatuses[Math.floor(Math.random() * requestStatuses.length)]},
          ${randomDate(14)},
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      requestCount++;
    }
    logger.info(`   ✅ Created ${requestCount} money requests`);

    // ========== NOTIFICATIONS ==========
    logger.info('\n🔔 Creating Notifications...');
    const notifTypes = ['transaction', 'security', 'promotion', 'system'];
    let notifCount = 0;
    
    for (const user of users) {
      const numNotifs = Math.floor(Math.random() * 10) + 3;
      
      for (let i = 0; i < numNotifs; i++) {
        const type = notifTypes[Math.floor(Math.random() * notifTypes.length)];
        
        await sql`
          INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
          VALUES (
            ${randomUUID()},
            ${user.id},
            ${type},
            ${type === 'transaction' ? 'Payment Received' : 
              type === 'security' ? 'Login Alert' : 
              type === 'promotion' ? 'Special Offer' : 'System Update'},
            ${type === 'transaction' ? 'You received N$ ' + randomAmount(50, 500).toFixed(2) : 
              type === 'security' ? 'New login detected from your device' : 
              type === 'promotion' ? 'Get 10% off your next transfer!' : 'App updated successfully'},
            ${Math.random() > 0.4},
            ${randomDate(7)}
          )
          ON CONFLICT (id) DO NOTHING
        `;
        notifCount++;
      }
    }
    logger.info(`   ✅ Created ${notifCount} notifications`);

    // ========== SUMMARY ==========
    logger.info('\n═'.repeat(50));
    logger.info('📊 SEED SUMMARY');
    logger.info('═'.repeat(50));
    logger.info(`\n   👤 Users:         ${users.length}`);
    logger.info(`   💳 Wallets:        ${wallets.length}`);
    logger.info(`   💰 Transactions:   ${txCount}`);
    logger.info(`   📇 Contacts:       ${contactCount}`);
    logger.info(`   👥 Groups:         ${groupCount}`);
    logger.info(`   💸 Requests:       ${requestCount}`);
    logger.info(`   🔔 Notifications:  ${notifCount}`);
    logger.info('\n✅ Database seeded successfully!\n');

  } catch (error) {
    log.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
