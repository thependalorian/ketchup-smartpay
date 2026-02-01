/**
 * Seed Test Data Script
 * 
 * Location: scripts/seed-test-data.ts
 * Purpose: Seed database with test data for development
 * 
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import logger, { log } from '@/utils/logger';

// Load environment variables
// Try .env.local first, then .env
let envPath = '.env.local';
try {
  require('fs').accessSync(envPath);
} catch {
  envPath = '.env';
}

// Simple dotenv implementation
const envFile = readFileSync(envPath, 'utf-8');
envFile.split('\n').forEach((line: string) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_CONNECTION_STRING;

if (!DATABASE_URL) {
  log.error('❌ Error: DATABASE_URL or NEON_CONNECTION_STRING not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function seedTestData() {
  try {
    logger.info('🌱 Seeding test data...\n');

    // Create test user
    logger.info('1️⃣ Creating test user...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    await sql`
      INSERT INTO users (id, external_id, phone_number, email, full_name, role, is_admin)
      VALUES (
        ${testUserId},
        'user_1',
        '+264811234567',
        'test@buffr.com',
        'John Doe',
        'user',
        false
      )
      ON CONFLICT (id) DO UPDATE
      SET
        phone_number = EXCLUDED.phone_number,
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name
    `;
    logger.info('   ✅ Test user created\n');

    // Create test wallets
    logger.info('2️⃣ Creating test wallets...');
    const wallets = [
      { name: 'Main Wallet', type: 'personal', balance: 5240.50, icon: 'credit-card' },
      { name: 'Savings', type: 'savings', balance: 12500.00, icon: 'bank' },
      { name: 'Business', type: 'business', balance: 850.00, icon: 'briefcase' },
      { name: 'Emergency Fund', type: 'savings', balance: 3200.00, icon: 'shield' },
    ];

    const walletIds: string[] = [];
    for (const w of wallets) {
      const res = await sql`
        INSERT INTO wallets (user_id, name, type, balance, available_balance, currency, status)
        VALUES (${testUserId}, ${w.name}, ${w.type}, ${w.balance}, ${w.balance}, 'N$', 'active')
        RETURNING id
      `;
      walletIds.push(res[0].id);
    }
    const walletId = walletIds[0];
    logger.info(`   ✅ ${wallets.length} test wallets created\n`);

    // Create test contacts
    logger.info('3️⃣ Creating test contacts...');
    const contacts = [
      { name: 'Elias', phone: '+264612345678' },
      { name: 'Monica', phone: '+264813456789' },
      { name: 'Clara', phone: '+264814567890' },
    ];

    for (const contact of contacts) {
      await sql`
        INSERT INTO contacts (user_id, name, phone, is_favorite)
        VALUES (${testUserId}, ${contact.name}, ${contact.phone}, false)
        ON CONFLICT (user_id, phone) DO NOTHING
      `;
    }
    logger.info(`   ✅ Created ${contacts.length} test contacts\n`);

    // Create test transactions (History for AI)
    logger.info('4️⃣ Creating transaction history...');
    const transactions = [
      { type: 'received', amount: 1500.00, desc: 'Salary Deposit', status: 'completed' },
      { type: 'sent', amount: 450.00, desc: 'Groceries - Shoprite', status: 'completed' },
      { type: 'sent', amount: 120.00, desc: 'MTC Airtime', status: 'completed' },
      { type: 'sent', amount: 2000.00, desc: 'Rent Payment', status: 'completed' },
      { type: 'received', amount: 50.00, desc: 'Refund - Amazon', status: 'completed' },
    ];

    for (const tx of transactions) {
      const externalId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const txTime = new Date(Date.now() - (Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000));
      await sql`
        INSERT INTO transactions (user_id, external_id, amount, currency, transaction_type, status, merchant_name, transaction_time, created_at)
        VALUES (${testUserId}, ${externalId}, ${tx.amount}, 'N$', ${tx.type}, ${tx.status}, ${tx.desc}, ${txTime}, ${txTime})
      `;
    }
    logger.info(`   ✅ ${transactions.length} transactions created\n`);

    // Create test vouchers
    logger.info('5️⃣ Creating test vouchers...');
    await sql`
      INSERT INTO vouchers (user_id, type, title, description, amount, status, issuer, voucher_code)
      VALUES
        (${testUserId}, 'government', 'Social Grant', 'Monthly social grant disbursement', 500.00, 'available', 'Ministry of Finance', 'VCH-GOV-8823'),
        (${testUserId}, 'merchant', 'Shoprite Voucher', 'Holiday shopping reward', 200.00, 'available', 'Shoprite Namibia', 'VCH-SHP-1122')
    `;
    logger.info('   ✅ Test vouchers created\n');

    // Create test notification
    logger.info('5️⃣ Creating test notification...');
    await sql`
      INSERT INTO notifications (
        user_id, type, title, message, is_read
      )
      VALUES (
        ${testUserId},
        'transaction',
        'Payment Received',
        'You received N$ 100.00',
        false
      )
    `;
    logger.info('   ✅ Test notification created\n');

    logger.info('✅ Test data seeding completed!\n');
    logger.info('📊 Summary:');
    logger.info(`   - User: ${testUserId}`);
    logger.info(`   - Wallet: ${walletId}`);
    logger.info(`   - Contacts: ${contacts.length}`);
    logger.info(`   - Transactions: 1`);
    logger.info(`   - Notifications: 1\n`);

  } catch (error: any) {
    log.error('❌ Seeding failed:', error.message);
    log.error('   Error details:', error);
    process.exit(1);
  }
}

// Run seeding
seedTestData();
