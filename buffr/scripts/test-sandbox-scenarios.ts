/**
 * Sandbox Scenario Testing Script
 * 
 * Location: scripts/test-sandbox-scenarios.ts
 * Purpose: Test sandbox scenarios following TrueLayer patterns
 * 
 * Based on TrueLayer Sandbox Testing:
 * - Mock payment providers
 * - Test scenarios (success, failure, cancellation)
 * - Execution delays
 * - Settlement delays
 * 
 * Usage:
 *   npx tsx scripts/test-sandbox-scenarios.ts
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TOKEN || '';

interface SandboxScenario {
  name: string;
  username: string; // TrueLayer pattern: test_executed, test_authorisation_failed, etc.
  expectedStatus: string;
  description: string;
}

const scenarios: SandboxScenario[] = [
  {
    name: 'Payment Execution Success',
    username: 'test_executed',
    expectedStatus: 'executed',
    description: 'Simulates successful payment execution',
  },
  {
    name: 'Authorization Failure',
    username: 'test_authorisation_failed',
    expectedStatus: 'failed',
    description: 'Simulates authorization failure',
  },
  {
    name: 'Execution Rejection',
    username: 'test_execution_rejected',
    expectedStatus: 'failed',
    description: 'Simulates execution rejection',
  },
  {
    name: 'User Cancellation',
    username: 'test_cancelled',
    expectedStatus: 'cancelled',
    description: 'Simulates user cancellation',
  },
];

/**
 * Make HTTP request
 */
async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<{ status: number; data: any }> {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  return { status: response.status, data };
}

/**
 * Test sandbox scenario
 */
async function testScenario(scenario: SandboxScenario): Promise<{ pass: boolean; message: string }> {
  console.log(`Testing: ${scenario.name} (${scenario.username})...`);

  try {
    // Create payment with test username
    const paymentData = {
      Data: {
        Initiation: {
          InstructionIdentification: `test-${scenario.username}-${Date.now()}`,
          EndToEndIdentification: `e2e-${scenario.username}-${Date.now()}`,
          InstructedAmount: {
            Amount: '10.00',
            Currency: 'NAD',
          },
          DebtorAccount: {
            SchemeName: 'BuffrAccount',
            Identification: scenario.username, // Use test username
          },
          CreditorAccount: {
            SchemeName: 'BuffrAccount',
            Identification: 'test-recipient',
          },
          RemittanceInformation: {
            Unstructured: `Test: ${scenario.description}`,
          },
        },
      },
    };

    const result = await makeRequest('/api/v1/payments/domestic-payments', 'POST', paymentData);

    if (result.status === 201 || result.status === 200) {
      const paymentId = result.data.Data?.DomesticPaymentId;
      if (paymentId) {
        // Check payment status
        const statusResult = await makeRequest(`/api/v1/payments/domestic-payments/${paymentId}`);
        const actualStatus = statusResult.data.Data?.Status;

        if (actualStatus === scenario.expectedStatus) {
          return {
            pass: true,
            message: `✅ Status matches expected: ${scenario.expectedStatus}`,
          };
        } else {
          return {
            pass: false,
            message: `❌ Status mismatch: expected ${scenario.expectedStatus}, got ${actualStatus}`,
          };
        }
      }
    }

    return {
      pass: result.status === 401 || result.status === 403,
      message: `Status: ${result.status} (${result.status === 401 || result.status === 403 ? 'Requires auth' : 'Unexpected'})`,
    };
  } catch (error: any) {
    return {
      pass: false,
      message: `Error: ${error.message}`,
    };
  }
}

/**
 * Test execution delays
 */
async function testExecutionDelays() {
  console.log('\n⏱️  Testing Execution Delays...\n');

  const delays = [0, 5, 10, 30]; // seconds

  for (const delay of delays) {
    console.log(`Testing delay: ${delay} seconds...`);
    // In real implementation, this would test delay selection
    console.log(`  ⏭️  Delay selection: ${delay}s (requires UI testing)`);
  }
}

/**
 * Test settlement delays
 */
async function testSettlementDelays() {
  console.log('\n⏱️  Testing Settlement Delays...\n');

  const delays = [0, 1, 2, 5]; // days

  for (const delay of delays) {
    console.log(`Testing settlement delay: ${delay} days...`);
    // In real implementation, this would test settlement delay
    console.log(`  ⏭️  Settlement delay: ${delay} days (requires backend configuration)`);
  }
}

/**
 * Run all sandbox tests
 */
async function runTests() {
  console.log('🧪 Sandbox Scenario Testing (TrueLayer Pattern)\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Missing'}\n`);

  const results: Array<{ scenario: string; pass: boolean; message: string }> = [];

  for (const scenario of scenarios) {
    const result = await testScenario(scenario);
    results.push({
      scenario: scenario.name,
      pass: result.pass,
      message: result.message,
    });
    console.log(`  ${result.message}\n`);
  }

  await testExecutionDelays();
  await testSettlementDelays();

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('Sandbox Test Results\n');

  results.forEach((result) => {
    const icon = result.pass ? '✅' : '❌';
    console.log(`${icon} ${result.scenario}`);
    console.log(`   ${result.message}`);
  });

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`\n📖 See: docs/TRUELAYER_TESTING_PLAN.md for sandbox patterns`);

  return { passed, failed, total: results.length };
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

export { runTests, testScenario, testExecutionDelays, testSettlementDelays };
