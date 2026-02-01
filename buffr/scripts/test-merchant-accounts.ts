/**
 * Merchant Account Dashboard Testing Script
 * 
 * Location: scripts/test-merchant-accounts.ts
 * Purpose: Test merchant account dashboard endpoints (48 test cases)
 * 
 * Based on TrueLayer Merchant Account Dashboard:
 * - Historical balances (7 days, 6 months)
 * - Transaction export (CSV format)
 * - Account sweeping
 * - Sandbox account behavior
 * 
 * Usage:
 *   npx tsx scripts/test-merchant-accounts.ts
 * 
 * See: 
 * - docs/TRUELAYER_TESTING_PLAN.md
 * - docs/MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TOKEN || '';
const MERCHANT_ACCOUNT_ID = process.env.MERCHANT_ACCOUNT_ID || 'test-account-id';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message?: string;
  responseTime?: number;
}

const results: TestResult[] = [];

/**
 * Make HTTP request
 */
async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any; responseTime: number }> {
  const startTime = Date.now();
  const url = `${API_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (AUTH_TOKEN) {
    requestHeaders['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const options: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const responseTime = Date.now() - startTime;
  const data = await response.json().catch(() => ({}));

  return { status: response.status, data, responseTime };
}

/**
 * Test merchant account access
 */
async function testAccountAccess() {
  console.log('1. Testing Merchant Account Access...\n');

  // Test EUR account
  const eurResult = await makeRequest('/api/v1/admin/merchant-accounts?currency=EUR');
  results.push({
    test: 'Get EUR merchant account',
    status: eurResult.status === 200 ? 'pass' : eurResult.status === 401 ? 'skip' : 'fail',
    message: `Status: ${eurResult.status}`,
    responseTime: eurResult.responseTime,
  });

  // Test GBP account
  const gbpResult = await makeRequest('/api/v1/admin/merchant-accounts?currency=GBP');
  results.push({
    test: 'Get GBP merchant account',
    status: gbpResult.status === 200 ? 'pass' : gbpResult.status === 401 ? 'skip' : 'fail',
    message: `Status: ${gbpResult.status}`,
    responseTime: gbpResult.responseTime,
  });
}

/**
 * Test historical balances
 */
async function testHistoricalBalances() {
  console.log('2. Testing Historical Balances...\n');

  // Test 7-day view
  const sevenDayResult = await makeRequest(
    `/api/v1/admin/merchant-accounts/${MERCHANT_ACCOUNT_ID}/historical-balances?period=7days`
  );
  results.push({
    test: 'Get 7-day historical balances',
    status: sevenDayResult.status === 200 ? 'pass' : sevenDayResult.status === 401 ? 'skip' : 'fail',
    message: `Status: ${sevenDayResult.status}`,
    responseTime: sevenDayResult.responseTime,
  });

  // Test 6-month view
  const sixMonthResult = await makeRequest(
    `/api/v1/admin/merchant-accounts/${MERCHANT_ACCOUNT_ID}/historical-balances?period=6months`
  );
  results.push({
    test: 'Get 6-month historical balances',
    status: sixMonthResult.status === 200 ? 'pass' : sixMonthResult.status === 401 ? 'skip' : 'fail',
    message: `Status: ${sixMonthResult.status}`,
    responseTime: sixMonthResult.responseTime,
  });

  // Test CSV export (daily)
  const csvDailyResult = await makeRequest(
    `/api/v1/admin/merchant-accounts/${MERCHANT_ACCOUNT_ID}/historical-balances/export?period=7days&format=csv`
  );
  results.push({
    test: 'Export 7-day balances as CSV',
    status:
      csvDailyResult.status === 200 && csvDailyResult.data.includes('date,balance,currency')
        ? 'pass'
        : csvDailyResult.status === 401
          ? 'skip'
          : 'fail',
    message: `Status: ${csvDailyResult.status}`,
    responseTime: csvDailyResult.responseTime,
  });
}

/**
 * Test transactions
 */
async function testTransactions() {
  console.log('3. Testing Transactions...\n');

  // Test transaction listing
  const transactionsResult = await makeRequest(
    `/api/v1/admin/merchant-accounts/${MERCHANT_ACCOUNT_ID}/transactions`
  );
  results.push({
    test: 'Get transaction history',
    status: transactionsResult.status === 200 ? 'pass' : transactionsResult.status === 401 ? 'skip' : 'fail',
    message: `Status: ${transactionsResult.status}`,
    responseTime: transactionsResult.responseTime,
  });

  // Test date range filtering
  const dateRangeResult = await makeRequest(
    `/api/v1/admin/merchant-accounts/${MERCHANT_ACCOUNT_ID}/transactions?start_date=2026-01-20&end_date=2026-01-26`
  );
  results.push({
    test: 'Filter transactions by date range',
    status: dateRangeResult.status === 200 ? 'pass' : dateRangeResult.status === 401 ? 'skip' : 'fail',
    message: `Status: ${dateRangeResult.status}`,
    responseTime: dateRangeResult.responseTime,
  });

  // Test CSV export
  const csvExportResult = await makeRequest(
    `/api/v1/admin/merchant-accounts/${MERCHANT_ACCOUNT_ID}/transactions/export?format=csv`
  );
  const csvHeader = 'amount,currency,status,type,reference,remitter,beneficiary,transactionId,paymentId,payoutId,date';
  results.push({
    test: 'Export transactions as CSV (11 columns)',
    status:
      csvExportResult.status === 200 && csvExportResult.data.includes(csvHeader)
        ? 'pass'
        : csvExportResult.status === 401
          ? 'skip'
          : 'fail',
    message: `Status: ${csvExportResult.status}`,
    responseTime: csvExportResult.responseTime,
  });
}

/**
 * Test account details
 */
async function testAccountDetails() {
  console.log('4. Testing Account Details...\n');

  const detailsResult = await makeRequest(
    `/api/v1/admin/merchant-accounts/${MERCHANT_ACCOUNT_ID}/details`
  );
  results.push({
    test: 'Get account details',
    status: detailsResult.status === 200 ? 'pass' : detailsResult.status === 401 ? 'skip' : 'fail',
    message: `Status: ${detailsResult.status}`,
    responseTime: detailsResult.responseTime,
  });

  // Verify required fields
  if (detailsResult.status === 200 && detailsResult.data.Data) {
    const requiredFields = ['AccountId', 'BeneficiaryName', 'SortCode', 'AccountNumber', 'IBAN'];
    const hasAllFields = requiredFields.every((field) => detailsResult.data.Data[field]);

    results.push({
      test: 'Account details include all required fields',
      status: hasAllFields ? 'pass' : 'fail',
      message: hasAllFields ? 'All fields present' : 'Missing required fields',
    });
  }
}

/**
 * Run all merchant account tests
 */
async function runTests() {
  console.log('🧪 Merchant Account Dashboard Testing\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Merchant Account ID: ${MERCHANT_ACCOUNT_ID}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Missing'}\n`);

  await testAccountAccess();
  await testHistoricalBalances();
  await testTransactions();
  await testAccountDetails();

  // Print results
  console.log('\n' + '═'.repeat(60));
  console.log('Test Results\n');

  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
    console.log(`${icon} ${result.test}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
    if (result.responseTime) {
      console.log(`   Response time: ${result.responseTime}ms`);
    }
  });

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skip').length;

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️  Skipped: ${skipped}`);
  console.log(`\n📖 Full test plan: docs/MERCHANT_ACCOUNT_DASHBOARD_TEST_PLAN.md`);

  return { passed, failed, skipped, total: results.length };
}

// Run tests
if (require.main === module) {
  runTests()
    .then(({ failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runTests, testAccountAccess, testHistoricalBalances, testTransactions, testAccountDetails };
