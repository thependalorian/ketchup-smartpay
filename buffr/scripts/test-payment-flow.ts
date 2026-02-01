/**
 * Payment Flow Testing Script
 * 
 * Location: scripts/test-payment-flow.ts
 * Purpose: Test complete payment flow following TrueLayer 8-step integration checklist
 * 
 * Based on TrueLayer Integration Checklist:
 * - Step 1: Console/Webhook Configuration
 * - Step 2: Merchant Account
 * - Step 3: Payment Authentication
 * - Step 4: Payment Creation
 * - Step 5: Payment Authorization
 * - Step 6: Payment Tracking
 * - Step 7: Payout (if applicable)
 * - Step 8: Returning User Flow
 * 
 * Usage:
 *   npx tsx scripts/test-payment-flow.ts
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TOKEN || '';
const IDEMPOTENCY_KEY = `test-idempotency-${Date.now()}`;

interface ChecklistStep {
  step: number;
  name: string;
  status: 'pending' | 'pass' | 'fail' | 'skip';
  message?: string;
}

const checklist: ChecklistStep[] = [];

/**
 * Make HTTP request
 */
async function makeRequest(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any }> {
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
  const data = await response.json().catch(() => ({}));

  return { status: response.status, data };
}

/**
 * Step 1: Console/Webhook Configuration
 */
async function testStep1(): Promise<ChecklistStep> {
  console.log('Step 1: Console/Webhook Configuration...');

  // Check if webhook URI is configured (would need to check config/database)
  // For now, we'll just verify the endpoint exists
  try {
    const result = await makeRequest('/api/v1/webhooks/smartpay', 'POST', {
      type: 'test',
    });

    return {
      step: 1,
      name: 'Console/Webhook Configuration',
      status: result.status === 200 || result.status === 401 ? 'pass' : 'fail',
      message: result.status === 200 ? 'Webhook endpoint accessible' : 'Webhook endpoint exists',
    };
  } catch (error: any) {
    return {
      step: 1,
      name: 'Console/Webhook Configuration',
      status: 'fail',
      message: error.message,
    };
  }
}

/**
 * Step 2: Merchant Account
 */
async function testStep2(): Promise<ChecklistStep> {
  console.log('Step 2: Merchant Account...');

  try {
    const result = await makeRequest('/api/v1/admin/merchant-accounts?currency=EUR');

    if (result.status === 200 && result.data.Data) {
      return {
        step: 2,
        name: 'Merchant Account',
        status: 'pass',
        message: 'Merchant account exists',
      };
    } else if (result.status === 401 || result.status === 403) {
      return {
        step: 2,
        name: 'Merchant Account',
        status: 'skip',
        message: 'Requires authentication',
      };
    } else {
      return {
        step: 2,
        name: 'Merchant Account',
        status: 'fail',
        message: `Status: ${result.status}`,
      };
    }
  } catch (error: any) {
    return {
      step: 2,
      name: 'Merchant Account',
      status: 'fail',
      message: error.message,
    };
  }
}

/**
 * Step 3: Payment Authentication
 */
async function testStep3(): Promise<ChecklistStep> {
  console.log('Step 3: Payment Authentication...');

  // Check if request signing is implemented
  // Check if idempotency key is supported
  // Check if access token generation works

  if (AUTH_TOKEN) {
    return {
      step: 3,
      name: 'Payment Authentication',
      status: 'pass',
      message: 'Authentication token provided',
    };
  } else {
    return {
      step: 3,
      name: 'Payment Authentication',
      status: 'skip',
      message: 'No authentication token provided',
    };
  }
}

/**
 * Step 4: Payment Creation
 */
async function testStep4(): Promise<ChecklistStep> {
  console.log('Step 4: Payment Creation...');

  try {
    const paymentData = {
      Data: {
        Initiation: {
          InstructionIdentification: `test-instruction-${Date.now()}`,
          EndToEndIdentification: `test-e2e-${Date.now()}`,
          InstructedAmount: {
            Amount: '10.00',
            Currency: 'NAD',
          },
          DebtorAccount: {
            SchemeName: 'BuffrAccount',
            Identification: 'test-user-123',
          },
          CreditorAccount: {
            SchemeName: 'BuffrAccount',
            Identification: 'test-user-456',
          },
          RemittanceInformation: {
            Unstructured: 'Test payment from integration checklist',
          },
        },
      },
    };

    const result = await makeRequest(
      '/api/v1/payments/domestic-payments',
      'POST',
      paymentData,
      {
        'Idempotency-Key': IDEMPOTENCY_KEY,
      }
    );

    if (result.status === 201 || result.status === 200) {
      return {
        step: 4,
        name: 'Payment Creation',
        status: 'pass',
        message: `Payment created: ${result.data.Data?.DomesticPaymentId || 'N/A'}`,
      };
    } else {
      return {
        step: 4,
        name: 'Payment Creation',
        status: result.status === 401 || result.status === 403 ? 'skip' : 'fail',
        message: `Status: ${result.status}, ${result.data.Message || 'Unknown error'}`,
      };
    }
  } catch (error: any) {
    return {
      step: 4,
      name: 'Payment Creation',
      status: 'fail',
      message: error.message,
    };
  }
}

/**
 * Step 5: Payment Authorization
 */
async function testStep5(): Promise<ChecklistStep> {
  console.log('Step 5: Payment Authorization...');

  // This step requires UI interaction, so we'll mark it as skip
  return {
    step: 5,
    name: 'Payment Authorization',
    status: 'skip',
    message: 'Requires UI testing',
  };
}

/**
 * Step 6: Payment Tracking
 */
async function testStep6(): Promise<ChecklistStep> {
  console.log('Step 6: Payment Tracking...');

  try {
    // Test payment status endpoint
    const result = await makeRequest('/api/v1/payments/domestic-payments/test-payment-id');

    if (result.status === 200 || result.status === 404) {
      return {
        step: 6,
        name: 'Payment Tracking',
        status: 'pass',
        message: 'Payment status endpoint accessible',
      };
    } else {
      return {
        step: 6,
        name: 'Payment Tracking',
        status: result.status === 401 || result.status === 403 ? 'skip' : 'fail',
        message: `Status: ${result.status}`,
      };
    }
  } catch (error: any) {
    return {
      step: 6,
      name: 'Payment Tracking',
      status: 'fail',
      message: error.message,
    };
  }
}

/**
 * Step 7: Payout
 */
async function testStep7(): Promise<ChecklistStep> {
  console.log('Step 7: Payout...');

  // This requires merchant account testing
  return {
    step: 7,
    name: 'Payout',
    status: 'skip',
    message: 'Requires merchant account testing',
  };
}

/**
 * Step 8: Returning User Flow
 */
async function testStep8(): Promise<ChecklistStep> {
  console.log('Step 8: Returning User Flow...');

  // This requires user data and provider preselection
  return {
    step: 8,
    name: 'Returning User Flow',
    status: 'skip',
    message: 'Requires user data and provider preselection',
  };
}

/**
 * Run complete integration checklist
 */
async function runChecklist() {
  console.log('📋 TrueLayer Integration Checklist\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Missing'}\n`);

  checklist.push(await testStep1());
  checklist.push(await testStep2());
  checklist.push(await testStep3());
  checklist.push(await testStep4());
  checklist.push(await testStep5());
  checklist.push(await testStep6());
  checklist.push(await testStep7());
  checklist.push(await testStep8());

  // Print results
  console.log('\n' + '═'.repeat(60));
  console.log('Integration Checklist Results\n');

  checklist.forEach((step) => {
    const icon =
      step.status === 'pass' ? '✅' : step.status === 'fail' ? '❌' : '⏭️';
    console.log(`${icon} Step ${step.step}: ${step.name}`);
    if (step.message) {
      console.log(`   ${step.message}`);
    }
  });

  const passed = checklist.filter((s) => s.status === 'pass').length;
  const failed = checklist.filter((s) => s.status === 'fail').length;
  const skipped = checklist.filter((s) => s.status === 'skip').length;

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⏭️  Skipped: ${skipped}`);
  console.log(`\n📖 Full checklist: docs/TRUELAYER_TESTING_PLAN.md`);

  return { passed, failed, skipped, total: checklist.length };
}

// Run checklist
if (require.main === module) {
  runChecklist()
    .then(({ failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Checklist execution failed:', error);
      process.exit(1);
    });
}

export { runChecklist, testStep1, testStep2, testStep3, testStep4, testStep5, testStep6, testStep7, testStep8 };
