/**
 * Integration Tests with Real Database
 * 
 * Location: scripts/integration-tests.ts
 * Purpose: Test API logic against live Neon PostgreSQL database
 * 
 * Run: npx tsx scripts/integration-tests.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
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

// Test results tracking
interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<any>): Promise<void> {
  const start = Date.now();
  try {
    const details = await testFn();
    results.push({
      name,
      status: 'pass',
      duration: Date.now() - start,
      details,
    });
    logger.info(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error: any) {
    results.push({
      name,
      status: 'fail',
      duration: Date.now() - start,
      error: error.message,
    });
    logger.info(`❌ ${name}: ${error.message}`);
  }
}

// ============================================================================
// DATABASE CONNECTION TESTS
// ============================================================================

async function testDatabaseConnection() {
  const result = await sql`SELECT version(), NOW() as current_time`;
  if (!result[0]?.version) throw new Error('No version returned');
  return { version: result[0].version.split(' ')[0], time: result[0].current_time };
}

async function testDatabaseLatency() {
  const iterations = 5;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await sql`SELECT 1`;
    times.push(Date.now() - start);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  
  return { avgMs: avg.toFixed(1), minMs: min, maxMs: max };
}

// ============================================================================
// USERS TABLE TESTS
// ============================================================================

async function testUsersTable() {
  const result = await sql`
    SELECT COUNT(*) as count, 
           COUNT(DISTINCT kyc_level) as kyc_levels
    FROM users
  `;
  return { 
    totalUsers: parseInt(result[0].count), 
    kycLevels: parseInt(result[0].kyc_levels) 
  };
}

async function testUserQuery() {
  const user = await sql`
    SELECT id, external_id, full_name, phone_number, kyc_level, created_at
    FROM users
    LIMIT 1
  `;
  if (user.length === 0) return { found: false, message: 'No users in database' };
  return { 
    found: true, 
    hasId: !!user[0].id,
    hasExternalId: !!user[0].external_id,
    hasFullName: !!user[0].full_name,
    hasCreatedAt: !!user[0].created_at,
  };
}

async function testUserMetadata() {
  const user = await sql`
    SELECT id, metadata 
    FROM users 
    WHERE metadata IS NOT NULL 
    LIMIT 1
  `;
  if (user.length === 0) return { hasMetadata: false };
  return { 
    hasMetadata: true, 
    metadataType: typeof user[0].metadata,
    metadataKeys: user[0].metadata ? Object.keys(user[0].metadata) : [],
  };
}

// ============================================================================
// WALLETS TABLE TESTS
// ============================================================================

async function testWalletsTable() {
  const result = await sql`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT type) as wallet_types,
           SUM(balance) as total_balance
    FROM wallets
  `;
  return { 
    totalWallets: parseInt(result[0].count),
    walletTypes: parseInt(result[0].wallet_types),
    totalBalance: parseFloat(result[0].total_balance || 0),
  };
}

async function testWalletQuery() {
  const wallet = await sql`
    SELECT id, user_id, type, balance, available_balance, currency, created_at
    FROM wallets
    LIMIT 1
  `;
  if (wallet.length === 0) return { found: false };
  return { 
    found: true,
    hasId: !!wallet[0].id,
    hasUserId: !!wallet[0].user_id,
    hasBalance: wallet[0].balance !== undefined,
    hasCurrency: !!wallet[0].currency,
    walletType: wallet[0].type,
  };
}

async function testWalletMetadata() {
  const wallet = await sql`
    SELECT id, metadata 
    FROM wallets 
    WHERE metadata IS NOT NULL 
    LIMIT 1
  `;
  if (wallet.length === 0) return { hasMetadata: false };
  
  const metadata = wallet[0].metadata;
  return { 
    hasMetadata: true,
    hasAutoPayEnabled: metadata?.auto_pay_enabled !== undefined,
    hasCardDetails: !!metadata?.card_details,
    hasSecuritySettings: !!metadata?.security_settings,
    metadataKeys: Object.keys(metadata || {}),
  };
}

// ============================================================================
// TRANSACTIONS TABLE TESTS
// ============================================================================

async function testTransactionsTable() {
  const result = await sql`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT transaction_type) as tx_types,
           COUNT(DISTINCT status) as statuses,
           SUM(amount) as total_amount
    FROM transactions
  `;
  return { 
    totalTransactions: parseInt(result[0].count),
    transactionTypes: parseInt(result[0].tx_types),
    statuses: parseInt(result[0].statuses),
    totalAmount: parseFloat(result[0].total_amount || 0),
  };
}

async function testTransactionQuery() {
  const tx = await sql`
    SELECT id, user_id, amount, currency, transaction_type, status, transaction_time
    FROM transactions
    ORDER BY transaction_time DESC
    LIMIT 1
  `;
  if (tx.length === 0) return { found: false };
  return { 
    found: true,
    hasId: !!tx[0].id,
    hasUserId: !!tx[0].user_id,
    hasAmount: tx[0].amount !== undefined,
    hasType: !!tx[0].transaction_type,
    hasStatus: !!tx[0].status,
    hasTime: !!tx[0].transaction_time,
  };
}

async function testTransactionTypes() {
  const types = await sql`
    SELECT transaction_type, COUNT(*) as count
    FROM transactions
    GROUP BY transaction_type
    ORDER BY count DESC
  `;
  return types.map((t: any) => ({ type: t.transaction_type, count: parseInt(t.count) }));
}

async function testRecentTransactions() {
  const txs = await sql`
    SELECT id, amount, transaction_type, status, transaction_time
    FROM transactions
    WHERE transaction_time > NOW() - INTERVAL '30 days'
    ORDER BY transaction_time DESC
    LIMIT 10
  `;
  return { 
    count: txs.length,
    hasRecentActivity: txs.length > 0,
    oldestInRange: txs.length > 0 ? txs[txs.length - 1].transaction_time : null,
  };
}

// ============================================================================
// CONTACTS TABLE TESTS
// ============================================================================

async function testContactsTable() {
  const result = await sql`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT user_id) as unique_users
    FROM contacts
  `;
  return { 
    totalContacts: parseInt(result[0].count),
    uniqueUsers: parseInt(result[0].unique_users),
  };
}

async function testContactQuery() {
  const contact = await sql`
    SELECT id, user_id, name, phone, email, is_favorite, created_at
    FROM contacts
    LIMIT 1
  `;
  if (contact.length === 0) return { found: false };
  return { 
    found: true,
    hasId: !!contact[0].id,
    hasUserId: !!contact[0].user_id,
    hasName: !!contact[0].name,
    hasPhone: !!contact[0].phone,
    hasEmail: !!contact[0].email,
    isFavorite: contact[0].is_favorite,
  };
}

// ============================================================================
// GROUPS TABLE TESTS
// ============================================================================

async function testGroupsTable() {
  const result = await sql`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT owner_id) as unique_owners
    FROM groups
  `;
  return { 
    totalGroups: parseInt(result[0].count),
    uniqueOwners: parseInt(result[0].unique_owners),
  };
}

async function testGroupMembersTable() {
  const result = await sql`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT group_id) as unique_groups,
           COUNT(DISTINCT user_id) as unique_members
    FROM group_members
  `;
  return { 
    totalMemberships: parseInt(result[0].count),
    uniqueGroups: parseInt(result[0].unique_groups),
    uniqueMembers: parseInt(result[0].unique_members),
  };
}

// ============================================================================
// MONEY REQUESTS TABLE TESTS
// ============================================================================

async function testMoneyRequestsTable() {
  const result = await sql`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT status) as statuses
    FROM money_requests
  `;
  return { 
    totalRequests: parseInt(result[0].count),
    statuses: parseInt(result[0].statuses),
  };
}

async function testRequestStatuses() {
  const statuses = await sql`
    SELECT status, COUNT(*) as count
    FROM money_requests
    GROUP BY status
  `;
  return statuses.map((s: any) => ({ status: s.status, count: parseInt(s.count) }));
}

// ============================================================================
// NOTIFICATIONS TABLE TESTS
// ============================================================================

async function testNotificationsTable() {
  const result = await sql`
    SELECT COUNT(*) as count,
           COUNT(DISTINCT type) as types,
           SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count
    FROM notifications
  `;
  return { 
    totalNotifications: parseInt(result[0].count),
    types: parseInt(result[0].types),
    readCount: parseInt(result[0].read_count || 0),
  };
}

async function testUnreadNotifications() {
  const result = await sql`
    SELECT user_id, COUNT(*) as unread_count
    FROM notifications
    WHERE is_read = false
    GROUP BY user_id
    ORDER BY unread_count DESC
    LIMIT 5
  `;
  return result.map((r: any) => ({ 
    userId: r.user_id, 
    unreadCount: parseInt(r.unread_count) 
  }));
}

// ============================================================================
// JOIN QUERIES (Testing relationships)
// ============================================================================

async function testUserWalletJoin() {
  const result = await sql`
    SELECT u.id as user_id, u.full_name, 
           COUNT(w.id) as wallet_count,
           SUM(w.balance) as total_balance
    FROM users u
    LEFT JOIN wallets w ON u.id = w.user_id
    GROUP BY u.id, u.full_name
    HAVING COUNT(w.id) > 0
    LIMIT 5
  `;
  return { 
    usersWithWallets: result.length,
    sample: result.slice(0, 3).map((r: any) => ({
      hasName: !!r.full_name,
      walletCount: parseInt(r.wallet_count),
      totalBalance: parseFloat(r.total_balance || 0),
    })),
  };
}

async function testUserTransactionJoin() {
  const result = await sql`
    SELECT u.id as user_id, u.full_name,
           COUNT(t.id) as tx_count,
           SUM(t.amount) as total_amount
    FROM users u
    LEFT JOIN transactions t ON u.id = t.user_id
    GROUP BY u.id, u.full_name
    HAVING COUNT(t.id) > 0
    ORDER BY tx_count DESC
    LIMIT 5
  `;
  return { 
    usersWithTransactions: result.length,
    sample: result.slice(0, 3).map((r: any) => ({
      hasName: !!r.full_name,
      txCount: parseInt(r.tx_count),
      totalAmount: parseFloat(r.total_amount || 0),
    })),
  };
}

async function testGroupWithMembers() {
  const result = await sql`
    SELECT g.id, g.name, g.owner_id,
           COUNT(gm.user_id) as member_count
    FROM groups g
    LEFT JOIN group_members gm ON g.id = gm.group_id
    GROUP BY g.id, g.name, g.owner_id
    LIMIT 5
  `;
  return { 
    groupCount: result.length,
    sample: result.map((r: any) => ({
      hasName: !!r.name,
      hasOwner: !!r.owner_id,
      memberCount: parseInt(r.member_count),
    })),
  };
}

// ============================================================================
// ADAPTER LOGIC TESTS
// ============================================================================

async function testUserAdapter() {
  const user = await sql`
    SELECT * FROM users LIMIT 1
  `;
  if (user.length === 0) return { skipped: true, reason: 'No users' };
  
  const raw = user[0];
  
  // Simulate adapter mapping
  const mapped = {
    id: raw.id || raw.external_id,
    phone_number: raw.phone_number,
    email: raw.email,
    first_name: raw.full_name ? raw.full_name.split(' ')[0] : null,
    last_name: raw.full_name ? raw.full_name.split(' ').slice(1).join(' ') : null,
    full_name: raw.full_name,
    avatar: raw.metadata?.avatar || null,
    is_verified: raw.kyc_level ? raw.kyc_level > 0 : false,
    is_two_factor_enabled: raw.metadata?.is_two_factor_enabled || false,
    currency: raw.metadata?.currency || 'N$',
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
  
  return {
    rawHasId: !!raw.id,
    rawHasExternalId: !!raw.external_id,
    mappedId: !!mapped.id,
    mappedFirstName: !!mapped.first_name,
    mappedFullName: !!mapped.full_name,
    mappedCurrency: mapped.currency,
    mappedVerified: mapped.is_verified,
  };
}

async function testWalletAdapter() {
  const wallet = await sql`
    SELECT * FROM wallets LIMIT 1
  `;
  if (wallet.length === 0) return { skipped: true, reason: 'No wallets' };
  
  const raw = wallet[0];
  const metadata = raw.metadata || {};
  
  // Simulate adapter mapping
  const mapped = {
    id: raw.id || raw.external_id,
    userId: raw.user_id,
    name: metadata.name || raw.name || raw.type || 'Wallet',
    type: raw.type || 'personal',
    balance: parseFloat(raw.balance || 0),
    availableBalance: parseFloat(raw.available_balance || raw.balance || 0),
    currency: raw.currency || 'NAD',
    isDefault: metadata.is_default || false,
    autoPayEnabled: metadata.auto_pay_enabled || false,
    autoPayLimit: metadata.auto_pay_limit || 0,
  };
  
  return {
    rawHasId: !!raw.id,
    rawHasBalance: raw.balance !== undefined,
    mappedId: !!mapped.id,
    mappedBalance: mapped.balance,
    mappedCurrency: mapped.currency,
    mappedAutoPayEnabled: mapped.autoPayEnabled,
  };
}

async function testTransactionAdapter() {
  const tx = await sql`
    SELECT * FROM transactions LIMIT 1
  `;
  if (tx.length === 0) return { skipped: true, reason: 'No transactions' };
  
  const raw = tx[0];
  const metadata = raw.metadata || {};
  
  // Map transaction_type to API type
  const typeMap: Record<string, string> = {
    'transfer_in': 'received',
    'transfer_out': 'sent',
    'deposit': 'deposit',
    'withdrawal': 'withdrawal',
    'payment': 'payment',
  };
  
  // Simulate adapter mapping
  const mapped = {
    id: raw.id || raw.external_id,
    walletId: metadata.wallet_id || null,
    type: typeMap[raw.transaction_type] || raw.transaction_type || 'other',
    amount: parseFloat(raw.amount || 0),
    currency: raw.currency || 'NAD',
    description: metadata.description || raw.merchant_name || null,
    category: metadata.category || null,
    recipientId: metadata.recipient_id || null,
    recipientName: metadata.recipient_name || raw.merchant_name || null,
    status: raw.status || 'completed',
    date: raw.transaction_time || raw.created_at,
  };
  
  return {
    rawHasId: !!raw.id,
    rawHasAmount: raw.amount !== undefined,
    rawType: raw.transaction_type,
    mappedType: mapped.type,
    mappedAmount: mapped.amount,
    mappedStatus: mapped.status,
    hasDate: !!mapped.date,
  };
}

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

async function testQueryPerformance() {
  const queries = [
    { name: 'users_count', query: sql`SELECT COUNT(*) FROM users` },
    { name: 'wallets_count', query: sql`SELECT COUNT(*) FROM wallets` },
    { name: 'transactions_count', query: sql`SELECT COUNT(*) FROM transactions` },
    { name: 'complex_join', query: sql`
      SELECT u.id, COUNT(w.id) as wallet_count, COUNT(t.id) as tx_count
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      LEFT JOIN transactions t ON u.id = t.user_id
      GROUP BY u.id
      LIMIT 10
    ` },
  ];
  
  const results: { name: string; ms: number }[] = [];
  
  for (const q of queries) {
    const start = Date.now();
    await q.query;
    results.push({ name: q.name, ms: Date.now() - start });
  }
  
  return results;
}

// ============================================================================
// DATA INTEGRITY TESTS
// ============================================================================

async function testOrphanedWallets() {
  const result = await sql`
    SELECT COUNT(*) as orphaned
    FROM wallets w
    LEFT JOIN users u ON w.user_id = u.id
    WHERE u.id IS NULL
  `;
  return { 
    orphanedWallets: parseInt(result[0].orphaned),
    isClean: parseInt(result[0].orphaned) === 0,
  };
}

async function testOrphanedTransactions() {
  const result = await sql`
    SELECT COUNT(*) as orphaned
    FROM transactions t
    LEFT JOIN users u ON t.user_id = u.id
    WHERE u.id IS NULL
  `;
  return { 
    orphanedTransactions: parseInt(result[0].orphaned),
    isClean: parseInt(result[0].orphaned) === 0,
  };
}

async function testNegativeBalances() {
  const result = await sql`
    SELECT COUNT(*) as negative
    FROM wallets
    WHERE balance < 0
  `;
  return { 
    negativeBalances: parseInt(result[0].negative),
    isClean: parseInt(result[0].negative) === 0,
  };
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  logger.info('🧪 Running Integration Tests with Real Database\n');
  logger.info('═'.repeat(60));
  logger.info('');

  // Connection Tests
  logger.info('📡 CONNECTION TESTS');
  logger.info('-'.repeat(40));
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Database Latency', testDatabaseLatency);
  logger.info('');

  // Users Tests
  logger.info('👤 USERS TABLE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Users Table Stats', testUsersTable);
  await runTest('User Query', testUserQuery);
  await runTest('User Metadata', testUserMetadata);
  await runTest('User Adapter Logic', testUserAdapter);
  logger.info('');

  // Wallets Tests
  logger.info('💳 WALLETS TABLE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Wallets Table Stats', testWalletsTable);
  await runTest('Wallet Query', testWalletQuery);
  await runTest('Wallet Metadata', testWalletMetadata);
  await runTest('Wallet Adapter Logic', testWalletAdapter);
  logger.info('');

  // Transactions Tests
  logger.info('💰 TRANSACTIONS TABLE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Transactions Table Stats', testTransactionsTable);
  await runTest('Transaction Query', testTransactionQuery);
  await runTest('Transaction Types', testTransactionTypes);
  await runTest('Recent Transactions', testRecentTransactions);
  await runTest('Transaction Adapter Logic', testTransactionAdapter);
  logger.info('');

  // Contacts Tests
  logger.info('📇 CONTACTS TABLE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Contacts Table Stats', testContactsTable);
  await runTest('Contact Query', testContactQuery);
  logger.info('');

  // Groups Tests
  logger.info('👥 GROUPS TABLE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Groups Table Stats', testGroupsTable);
  await runTest('Group Members Stats', testGroupMembersTable);
  logger.info('');

  // Money Requests Tests
  logger.info('💸 MONEY REQUESTS TABLE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Money Requests Stats', testMoneyRequestsTable);
  await runTest('Request Statuses', testRequestStatuses);
  logger.info('');

  // Notifications Tests
  logger.info('🔔 NOTIFICATIONS TABLE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Notifications Stats', testNotificationsTable);
  await runTest('Unread Notifications', testUnreadNotifications);
  logger.info('');

  // Join Tests
  logger.info('🔗 RELATIONSHIP TESTS');
  logger.info('-'.repeat(40));
  await runTest('User-Wallet Join', testUserWalletJoin);
  await runTest('User-Transaction Join', testUserTransactionJoin);
  await runTest('Group with Members', testGroupWithMembers);
  logger.info('');

  // Performance Tests
  logger.info('⚡ PERFORMANCE TESTS');
  logger.info('-'.repeat(40));
  await runTest('Query Performance', testQueryPerformance);
  logger.info('');

  // Data Integrity Tests
  logger.info('🔍 DATA INTEGRITY TESTS');
  logger.info('-'.repeat(40));
  await runTest('Orphaned Wallets Check', testOrphanedWallets);
  await runTest('Orphaned Transactions Check', testOrphanedTransactions);
  await runTest('Negative Balance Check', testNegativeBalances);
  logger.info('');

  // Summary
  logger.info('═'.repeat(60));
  logger.info('📊 TEST SUMMARY');
  logger.info('═'.repeat(60));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  logger.info(`\n✅ Passed:  ${passed}`);
  logger.info(`❌ Failed:  ${failed}`);
  logger.info(`⏭️  Skipped: ${skipped}`);
  logger.info(`⏱️  Total:   ${totalDuration}ms`);
  logger.info('');
  
  if (failed > 0) {
    logger.info('Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      logger.info(`  - ${r.name}: ${r.error}`);
    });
    logger.info('');
  }
  
  // Show some interesting details
  logger.info('📈 Database Stats:');
  const stats = results.filter(r => r.details && r.status === 'pass');
  stats.forEach(r => {
    if (r.details && typeof r.details === 'object') {
      const keys = Object.keys(r.details);
      if (keys.some(k => k.includes('count') || k.includes('total') || k.includes('Total'))) {
        logger.info(`  ${r.name}:`, { details: JSON.stringify(r.details) });
      }
    }
  });
  
  logger.info('\n🏁 Integration tests complete!\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
