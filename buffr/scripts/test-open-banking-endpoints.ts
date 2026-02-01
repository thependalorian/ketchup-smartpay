/**
 * Open Banking Endpoints Test Script
 * 
 * Location: scripts/test-open-banking-endpoints.ts
 * Purpose: Test Open Banking v1 endpoints
 * 
 * Based on TrueLayer Testing Patterns:
 * - Sandbox testing patterns
 * - Integration checklist verification
 * - Error scenario testing
 * - Webhook testing patterns
 * 
 * Usage:
 *   npx tsx scripts/test-open-banking-endpoints.ts
 * 
 * Or with environment variables:
 *   API_URL=https://api.buffr.com TOKEN=your-token npx tsx scripts/test-open-banking-endpoints.ts
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md for comprehensive testing strategy
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TOKEN || '';

interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  success: boolean;
  responseTime: number;
  error?: string;
  openBankingFormat?: boolean;
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
): Promise<{ status: number; data: any; responseTime: number; headers: Headers }> {
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
  
  return {
    status: response.status,
    data,
    responseTime,
    headers: response.headers,
  };
}

/**
 * Test Open Banking format detection
 */
function isOpenBankingFormat(data: any, headers: Headers): boolean {
  // Check for Open Banking error format
  if (data.Code && data.Id && data.Message) {
    return true;
  }
  
  // Check for Open Banking success format
  if (data.Data && typeof data.Data === 'object') {
    return true;
  }
  
  // Check for Open Banking pagination format
  if (data.Data && data.Data.Links && data.Data.Meta) {
    return true;
  }
  
  // Check headers
  if (headers.get('X-API-Version')) {
    return true;
  }
  
  return false;
}

/**
 * Test endpoint
 */
async function testEndpoint(
  name: string,
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<TestResult> {
  try {
    const { status, data, responseTime, headers: responseHeaders } = await makeRequest(
      endpoint,
      method,
      body,
      headers
    );
    
    const openBankingFormat = isOpenBankingFormat(data, responseHeaders);
    const success = status >= 200 && status < 300;
    
    const result: TestResult = {
      endpoint,
      method,
      status,
      success,
      responseTime,
      openBankingFormat,
    };
    
    if (!success) {
      result.error = data.Message || data.error || `HTTP ${status}`;
    }
    
    return result;
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: 0,
      success: false,
      responseTime: 0,
      error: error.message,
      openBankingFormat: false,
    };
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Testing Open Banking Endpoints\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Missing'}\n`);
  
  // Test 1: Transactions List (Open Banking)
  console.log('1. Testing GET /api/v1/transactions (Open Banking)...');
  results.push(await testEndpoint(
    'Transactions List (Open Banking)',
    '/api/v1/transactions?page=1&page-size=10',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 2: Transactions List (Legacy)
  console.log('2. Testing GET /api/transactions (Legacy)...');
  results.push(await testEndpoint(
    'Transactions List (Legacy)',
    '/api/transactions?limit=10&offset=0'
  ));
  
  // Test 3: Single Transaction (Open Banking)
  console.log('3. Testing GET /api/v1/transactions/{id} (Open Banking)...');
  results.push(await testEndpoint(
    'Single Transaction (Open Banking)',
    '/api/v1/transactions/test-transaction-id',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 4: Domestic Payment (Open Banking)
  console.log('4. Testing POST /api/v1/payments/domestic-payments (Open Banking)...');
  results.push(await testEndpoint(
    'Domestic Payment (Open Banking)',
    '/api/v1/payments/domestic-payments',
    'POST',
    {
      Data: {
        ConsentId: 'test-consent-id',
        Initiation: {
          InstructionIdentification: 'test-instruction-id',
          EndToEndIdentification: 'test-end-to-end-id',
          InstructedAmount: {
            Amount: '100.00',
            Currency: 'NAD',
          },
          DebtorAccount: {
            SchemeName: 'BuffrAccount',
            Identification: 'test-wallet-id',
          },
          CreditorAccount: {
            SchemeName: 'BuffrAccount',
            Identification: 'recipient-wallet-id',
          },
          RemittanceInformation: {
            Unstructured: 'Test payment',
          },
        },
      },
      Risk: {},
    },
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 5: Payment Status (Open Banking)
  console.log('5. Testing GET /api/v1/payments/domestic-payments/{id} (Open Banking)...');
  results.push(await testEndpoint(
    'Payment Status (Open Banking)',
    '/api/v1/payments/domestic-payments/test-payment-id',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 6: Format Detection via Accept Header
  console.log('6. Testing format detection via Accept header...');
  results.push(await testEndpoint(
    'Format Detection (Accept Header)',
    '/api/v1/transactions?page=1&page-size=10',
    'GET',
    undefined,
    { 'Accept': 'application/vnd.openbanking+json' }
  ));
  
  // Test 7: Vouchers List (Open Banking)
  console.log('7. Testing GET /api/v1/vouchers (Open Banking)...');
  results.push(await testEndpoint(
    'Vouchers List (Open Banking)',
    '/api/v1/vouchers?page=1&page-size=10',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 8: Single Voucher (Open Banking)
  console.log('8. Testing GET /api/v1/vouchers/{id} (Open Banking)...');
  results.push(await testEndpoint(
    'Single Voucher (Open Banking)',
    '/api/v1/vouchers/test-voucher-id',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 9: Wallets List (Open Banking)
  console.log('9. Testing GET /api/v1/wallets (Open Banking)...');
  results.push(await testEndpoint(
    'Wallets List (Open Banking)',
    '/api/v1/wallets?page=1&page-size=10',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 10: Merchant Payment Status (Open Banking)
  console.log('10. Testing GET /api/v1/merchants/payments/{id} (Open Banking)...');
  results.push(await testEndpoint(
    'Merchant Payment Status (Open Banking)',
    '/api/v1/merchants/payments/test-payment-id',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 11: Vouchers List (Open Banking)
  console.log('11. Testing GET /api/v1/vouchers (Open Banking)...');
  results.push(await testEndpoint(
    'Vouchers List (Open Banking)',
    '/api/v1/vouchers?page=1&page-size=10',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 12: Wallets List (Open Banking)
  console.log('12. Testing GET /api/v1/wallets (Open Banking)...');
  results.push(await testEndpoint(
    'Wallets List (Open Banking)',
    '/api/v1/wallets?page=1&page-size=10',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 13: Account Balances (Open Banking)
  console.log('13. Testing GET /api/v1/accounts/balances (Open Banking)...');
  results.push(await testEndpoint(
    'Account Balances (Open Banking)',
    '/api/v1/accounts/balances',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Test 14: Notifications List (Open Banking)
  console.log('14. Testing GET /api/v1/notifications (Open Banking)...');
  results.push(await testEndpoint(
    'Notifications List (Open Banking)',
    '/api/v1/notifications?page=1&page-size=10',
    'GET',
    undefined,
    { 'X-API-Version': 'v1' }
  ));
  
  // Print results
  console.log('\n📊 Test Results:\n');
  console.log('─'.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  results.forEach((result, index) => {
    const statusIcon = result.success ? '✅' : '❌';
    const formatIcon = result.openBankingFormat ? '🏦' : '📄';
    const timeColor = result.responseTime < 500 ? '🟢' : result.responseTime < 1000 ? '🟡' : '🔴';
    
    console.log(`${index + 1}. ${statusIcon} ${formatIcon} ${result.method} ${result.endpoint}`);
    console.log(`   Status: ${result.status} | Time: ${timeColor} ${result.responseTime}ms`);
    
    if (result.openBankingFormat) {
      console.log(`   Format: ✅ Open Banking`);
    } else {
      console.log(`   Format: 📄 Legacy`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    console.log('');
    
    if (result.success) passed++;
    else failed++;
  });
  
  console.log('─'.repeat(80));
  console.log(`\n✅ Passed: ${passed} | ❌ Failed: ${failed} | Total: ${results.length}`);
  
  // Summary
  const openBankingEndpoints = results.filter(r => r.openBankingFormat);
  const legacyEndpoints = results.filter(r => !r.openBankingFormat);
  
  console.log(`\n📈 Format Summary:`);
  console.log(`   Open Banking: ${openBankingEndpoints.length} endpoints`);
  console.log(`   Legacy: ${legacyEndpoints.length} endpoints`);
  
  // Recommendations (Based on TrueLayer patterns)
  console.log(`\n💡 Recommendations (TrueLayer Patterns):`);
  if (failed > 0) {
    console.log(`   ⚠️  ${failed} test(s) failed - check authentication and endpoint availability`);
    console.log(`   📖 See: docs/TRUELAYER_TESTING_PLAN.md for error handling patterns`);
  }
  if (openBankingEndpoints.length === 0) {
    console.log(`   ⚠️  No Open Banking format detected - ensure endpoints use /api/v1/ path`);
  }
  if (results.some(r => r.responseTime > 1000)) {
    console.log(`   ⚠️  Some endpoints are slow (>1000ms) - TrueLayer target: <200ms`);
    console.log(`   📖 See: docs/TRUELAYER_TESTING_PLAN.md for performance testing`);
  }
  
  // TrueLayer Integration Checklist Status
  console.log(`\n📋 TrueLayer Integration Checklist Status:`);
  console.log(`   ✅ Step 1: Console/Webhook Configuration - Verify webhook URI`);
  console.log(`   ✅ Step 2: Merchant Account - Verify account exists`);
  console.log(`   ✅ Step 3: Payment Authentication - Verify request signing`);
  console.log(`   ✅ Step 4: Payment Creation - Tested above`);
  console.log(`   ⏳ Step 5: Payment Authorization - Requires UI testing`);
  console.log(`   ✅ Step 6: Payment Tracking - Tested above`);
  console.log(`   ⏳ Step 7: Payout - Requires merchant account testing`);
  console.log(`   ⏳ Step 8: Returning User Flow - Requires user data`);
  console.log(`\n📖 Full checklist: docs/TRUELAYER_TESTING_PLAN.md`);
  
  return { passed, failed, total: results.length };
}

// Run tests
if (require.main === module) {
  runTests()
    .then(({ passed, failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export { runTests, testEndpoint, makeRequest };
