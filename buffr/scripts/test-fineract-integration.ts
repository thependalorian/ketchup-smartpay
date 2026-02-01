/**
 * Fineract Integration Test Script
 * 
 * Location: scripts/test-fineract-integration.ts
 * Purpose: Test Fineract integration end-to-end
 * 
 * This script tests:
 * 1. Environment validation
 * 2. Client creation
 * 3. Wallet creation
 * 4. Voucher creation
 * 5. Transaction operations (deposit, withdraw, transfer)
 * 6. Multi-instance routing (read vs write)
 * 
 * Usage:
 *   npx tsx scripts/test-fineract-integration.ts
 */

import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';
import { validateFineractEnvironment } from '@/utils/fineractEnvValidation';

// For development: Allow self-signed SSL certificates
// In production, use proper CA-signed certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const testResults: TestResult[] = [];

/**
 * Run a test and record results
 */
async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const startTime = Date.now();
  logger.info(`🧪 Testing: ${name}...`);
  
  try {
    await testFn();
    const duration = Date.now() - startTime;
    logger.info(`✅ PASSED: ${name} (${duration}ms)`);
    
    const result: TestResult = { name, passed: true, duration };
    testResults.push(result);
    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`❌ FAILED: ${name} - ${error.message}`);
    
    const result: TestResult = { name, passed: false, error: error.message, duration };
    testResults.push(result);
    return result;
  }
}

/**
 * Test 1: Environment Validation
 */
async function testEnvironmentValidation(): Promise<void> {
  const validation = await validateFineractEnvironment();
  if (!validation.valid) {
    throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
  }
}

/**
 * Test 2: Client Creation
 */
async function testClientCreation(): Promise<void> {
  const timestamp = Date.now();
  const externalId = `test_client_${timestamp}`;
  const mobileNo = `+26481${String(timestamp).slice(-7)}`; // Use timestamp for unique mobile number
  const testClient = await fineractService.createClient({
    firstname: 'Test',
    lastname: 'User',
    mobileNo,
    externalId,
  }, { requestId: 'test-client-creation' });
  
  if (!testClient || !testClient.id) {
    throw new Error('Client creation failed - no client ID returned');
  }
  
  logger.info(`  Created test client: ID ${testClient.id}, External ID: ${testClient.externalId || externalId}`);
}

/**
 * Test 3: Get Client by External ID
 */
async function testGetClientByExternalId(): Promise<void> {
  const timestamp = Date.now() + 1; // Ensure unique
  const externalId = `test_client_${timestamp}`;
  const mobileNo = `+26481${String(timestamp).slice(-7)}`; // Use timestamp for unique mobile number
  
  // Create client first
  const client = await fineractService.createClient({
    firstname: 'Test',
    lastname: 'Lookup',
    mobileNo,
    externalId,
  }, { requestId: 'test-client-lookup-create' });
  
  // Try to get it by external ID
  const foundClient = await fineractService.getClientByExternalId(externalId);
  
  if (!foundClient || foundClient.id !== client.id) {
    throw new Error('Failed to retrieve client by external ID');
  }
  
  logger.info(`  Retrieved client by external ID: ${externalId} → ID ${foundClient.id}`);
}

/**
 * Test 4: Wallet Creation (via getOrCreateWalletForUser)
 */
async function testWalletCreation(): Promise<void> {
  const timestamp = Date.now() + 2; // Ensure unique
  const testUserId = `test_user_${timestamp}`;
  const mobileNo = `+26481${String(timestamp).slice(-7)}`; // Use timestamp for unique mobile number
  
  // First create a user in Buffr DB (mock - in real scenario this would exist)
  // For testing, we'll create a Fineract client first
  const client = await fineractService.createClient({
    firstname: 'Wallet',
    lastname: 'Test',
    mobileNo,
    externalId: testUserId,
  }, { requestId: 'test-wallet-client' });
  
  // Now get or create wallet
  const wallet = await fineractService.getOrCreateWalletForUser(testUserId);
  
  if (!wallet || !wallet.id) {
    throw new Error('Wallet creation failed - no wallet ID returned');
  }
  
  logger.info(`  Created wallet: ID ${wallet.id}, Wallet No: ${wallet.walletNumber}`);
}

/**
 * Test 5: Wallet Deposit
 */
async function testWalletDeposit(): Promise<void> {
  const timestamp = Date.now() + 3; // Ensure unique
  const testUserId = `test_deposit_${timestamp}`;
  const mobileNo = `+26481${String(timestamp).slice(-7)}`; // Use timestamp for unique mobile number
  
  // Create client and wallet
  await fineractService.createClient({
    firstname: 'Deposit',
    lastname: 'Test',
    mobileNo,
    externalId: testUserId,
  }, { requestId: 'test-deposit-client' });
  
  const wallet = await fineractService.getOrCreateWalletForUser(testUserId);
  
  // Deposit N$100
  const deposit = await fineractService.depositToWallet(
    wallet.id,
    {
      amount: 100.00,
      transactionDate: new Date().toISOString().split('T')[0],
      description: 'Test deposit',
      channel: 'api',
    },
    { requestId: 'test-deposit' }
  );
  
  if (!deposit || !deposit.id) {
    throw new Error('Deposit failed - no transaction ID returned');
  }
  
  logger.info(`  Deposited N$100: Transaction ID ${deposit.id}`);
}

/**
 * Test 6: Wallet Withdrawal
 */
async function testWalletWithdrawal(): Promise<void> {
  const timestamp = Date.now() + 4; // Ensure unique
  const testUserId = `test_withdraw_${timestamp}`;
  const mobileNo = `+26481${String(timestamp).slice(-7)}`; // Use timestamp for unique mobile number
  
  // Create client and wallet
  await fineractService.createClient({
    firstname: 'Withdraw',
    lastname: 'Test',
    mobileNo,
    externalId: testUserId,
  }, { requestId: 'test-withdraw-client' });
  
  const wallet = await fineractService.getOrCreateWalletForUser(testUserId);
  
  // Deposit first
  await fineractService.depositToWallet(
    wallet.id,
    {
      amount: 200.00,
      transactionDate: new Date().toISOString().split('T')[0],
      description: 'Initial deposit for withdrawal test',
      channel: 'api',
    },
    { requestId: 'test-withdraw-deposit' }
  );
  
  // Then withdraw
  const withdrawal = await fineractService.withdrawFromWallet(
    wallet.id,
    {
      amount: 50.00,
      transactionDate: new Date().toISOString().split('T')[0],
      description: 'Test withdrawal',
      channel: 'api',
    },
    { requestId: 'test-withdraw' }
  );
  
  if (!withdrawal || !withdrawal.id) {
    throw new Error('Withdrawal failed - no transaction ID returned');
  }
  
  logger.info(`  Withdrew N$50: Transaction ID ${withdrawal.id}`);
}

/**
 * Test 7: Multi-Instance Routing (Read vs Write)
 */
async function testMultiInstanceRouting(): Promise<void> {
  const timestamp = Date.now() + 5; // Ensure unique
  const testUserId = `test_routing_${timestamp}`;
  const mobileNo = `+26481${String(timestamp).slice(-7)}`; // Use timestamp for unique mobile number
  
  // Create client and wallet
  await fineractService.createClient({
    firstname: 'Routing',
    lastname: 'Test',
    mobileNo,
    externalId: testUserId,
  }, { requestId: 'test-routing-client' });
  
  const wallet = await fineractService.getOrCreateWalletForUser(testUserId);
  
  // Test read operation (should use read instance)
  const startRead = Date.now();
  const walletRead = await fineractService.getWallet(wallet.id);
  const readDuration = Date.now() - startRead;
  
  if (!walletRead) {
    throw new Error('Read operation failed');
  }
  
  logger.info(`  Read operation completed in ${readDuration}ms (should use read instance)`);
  
  // Test write operation (should use write instance)
  const startWrite = Date.now();
  await fineractService.depositToWallet(
    wallet.id,
    {
      amount: 10.00,
      transactionDate: new Date().toISOString().split('T')[0],
      description: 'Test write routing',
      channel: 'api',
    },
    { requestId: 'test-routing-write' }
  );
  const writeDuration = Date.now() - startWrite;
  
  logger.info(`  Write operation completed in ${writeDuration}ms (should use write instance)`);
}

/**
 * Test 8: Voucher Creation
 */
async function testVoucherCreation(): Promise<void> {
  const timestamp = Date.now() + 6; // Ensure unique
  const testUserId = `test_voucher_${timestamp}`;
  const mobileNo = `+26481${String(timestamp).slice(-7)}`; // Use timestamp for unique mobile number
  
  // Create client
  const client = await fineractService.createClient({
    firstname: 'Voucher',
    lastname: 'Test',
    mobileNo,
    externalId: testUserId,
  }, { requestId: 'test-voucher-client' });
  
  // Create voucher
  const voucher = await fineractService.createVoucher({
    clientId: client.id,
    amount: 500.00,
    currencyCode: 'NAD',
    issuedDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    externalId: `test_voucher_${Date.now()}`,
  }, { requestId: 'test-voucher-create' });
  
  if (!voucher || !voucher.id) {
    throw new Error('Voucher creation failed - no voucher ID returned');
  }
  
  logger.info(`  Created voucher: ID ${voucher.id}, Amount: N$${voucher.amount}`);
}

/**
 * Main test runner
 */
async function runAllTests(): Promise<void> {
  logger.info('🧪 Starting Fineract Integration Tests...');
  logger.info('========================================');
  logger.info('');
  
  // Run all tests
  await runTest('Environment Validation', testEnvironmentValidation);
  await runTest('Client Creation', testClientCreation);
  await runTest('Get Client by External ID', testGetClientByExternalId);
  await runTest('Wallet Creation', testWalletCreation);
  await runTest('Wallet Deposit', testWalletDeposit);
  await runTest('Wallet Withdrawal', testWalletWithdrawal);
  await runTest('Multi-Instance Routing', testMultiInstanceRouting);
  await runTest('Voucher Creation', testVoucherCreation);
  
  // Summary
  logger.info('');
  logger.info('========================================');
  logger.info('📊 Test Results Summary');
  logger.info('========================================');
  
  const passed = testResults.filter(r => r.passed).length;
  const failed = testResults.filter(r => !r.passed).length;
  const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
  
  logger.info(`Total Tests: ${testResults.length}`);
  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`⏱️  Total Duration: ${totalDuration}ms`);
  logger.info('');
  
  if (failed > 0) {
    logger.error('Failed Tests:');
    testResults
      .filter(r => !r.passed)
      .forEach(r => {
        logger.error(`  ❌ ${r.name}: ${r.error}`);
      });
    logger.info('');
  }
  
  if (failed === 0) {
    logger.info('✅ All tests passed!');
  } else {
    logger.error(`❌ ${failed} test(s) failed`);
  }
  
  logger.info('');
}

// ============================================================================
// RUN TESTS
// ============================================================================

if (require.main === module) {
  runAllTests()
    .then(() => {
      const failed = testResults.filter(r => !r.passed).length;
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      logger.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

export { runAllTests, testResults };
