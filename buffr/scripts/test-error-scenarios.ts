/**
 * Error Scenario Testing Script
 * 
 * Location: scripts/test-error-scenarios.ts
 * Purpose: Test error scenarios following TrueLayer error patterns
 * 
 * Based on TrueLayer: Payments API Errors
 * - 400: Invalid Parameters
 * - 401: Unauthenticated
 * - 403: Forbidden
 * - 409: Idempotency Conflict
 * - 422: Idempotency Key Reuse
 * - 429: Rate Limit Exceeded
 * - 500: Server Error
 * 
 * Usage:
 *   npx tsx scripts/test-error-scenarios.ts
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.TOKEN || '';

interface ErrorTest {
  name: string;
  expectedCode: string;
  expectedStatus: number;
  request: {
    endpoint: string;
    method: 'GET' | 'POST';
    body?: any;
    headers?: Record<string, string>;
  };
}

const errorTests: ErrorTest[] = [
  {
    name: '400 - Missing Required Fields',
    expectedCode: 'BUFFR.Field.Missing',
    expectedStatus: 400,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'POST',
      body: {
        // Missing Data.Initiation
      },
    },
  },
  {
    name: '400 - Invalid Amount (< 1 minor unit)',
    expectedCode: 'BUFFR.Amount.Invalid',
    expectedStatus: 400,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'POST',
      body: {
        Data: {
          Initiation: {
            InstructedAmount: {
              Amount: '0.00', // Invalid: must be ≥ 1 minor unit
              Currency: 'NAD',
            },
          },
        },
      },
    },
  },
  {
    name: '400 - Invalid Currency',
    expectedCode: 'BUFFR.Field.Invalid',
    expectedStatus: 400,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'POST',
      body: {
        Data: {
          Initiation: {
            InstructedAmount: {
              Amount: '10.00',
              Currency: 'USD', // Invalid: only NAD supported
            },
          },
        },
      },
    },
  },
  {
    name: '401 - Missing Authentication',
    expectedCode: 'BUFFR.Auth.Unauthorized',
    expectedStatus: 401,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'GET',
      headers: {
        // No Authorization header
      },
    },
  },
  {
    name: '401 - Invalid Token',
    expectedCode: 'BUFFR.Auth.TokenInvalid',
    expectedStatus: 401,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'GET',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    },
  },
  {
    name: '403 - Forbidden Access',
    expectedCode: 'BUFFR.Auth.Forbidden',
    expectedStatus: 403,
    request: {
      endpoint: '/api/v1/admin/merchant-accounts',
      method: 'GET',
      headers: {
        // Regular user token (not admin)
      },
    },
  },
  {
    name: '404 - Resource Not Found',
    expectedCode: 'BUFFR.Resource.NotFound',
    expectedStatus: 404,
    request: {
      endpoint: '/api/v1/payments/domestic-payments/non-existent-id',
      method: 'GET',
    },
  },
  {
    name: '409 - Idempotency Conflict',
    expectedCode: 'BUFFR.Resource.Conflict',
    expectedStatus: 409,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'POST',
      body: {
        Data: {
          Initiation: {
            InstructedAmount: {
              Amount: '10.00',
              Currency: 'NAD',
            },
          },
        },
      },
      headers: {
        'Idempotency-Key': 'test-conflict-key',
      },
    },
  },
  {
    name: '422 - Idempotency Key Reuse',
    expectedCode: 'BUFFR.Field.Invalid',
    expectedStatus: 422,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'POST',
      body: {
        Data: {
          Initiation: {
            InstructedAmount: {
              Amount: '20.00', // Different amount, same key
              Currency: 'NAD',
            },
          },
        },
      },
      headers: {
        'Idempotency-Key': 'test-reuse-key',
      },
    },
  },
  {
    name: '429 - Rate Limit Exceeded',
    expectedCode: 'BUFFR.RateLimit.Exceeded',
    expectedStatus: 429,
    request: {
      endpoint: '/api/v1/payments/domestic-payments',
      method: 'GET',
      // Would need to make many requests quickly
    },
  },
];

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

  if (AUTH_TOKEN && !headers.Authorization) {
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
 * Test error scenario
 */
async function testErrorScenario(test: ErrorTest): Promise<{ pass: boolean; message: string }> {
  console.log(`Testing: ${test.name}...`);

  try {
    const result = await makeRequest(
      test.request.endpoint,
      test.request.method,
      test.request.body,
      test.request.headers || {}
    );

    const hasCorrectStatus = result.status === test.expectedStatus;
    const hasCorrectCode = result.data.Code === test.expectedCode;

    if (hasCorrectStatus && hasCorrectCode) {
      return {
        pass: true,
        message: `✅ Correct error: ${test.expectedCode} (${test.expectedStatus})`,
      };
    } else if (hasCorrectStatus) {
      return {
        pass: false,
        message: `⚠️  Status correct (${test.expectedStatus}) but code mismatch: expected ${test.expectedCode}, got ${result.data.Code || 'N/A'}`,
      };
    } else {
      return {
        pass: false,
        message: `❌ Status mismatch: expected ${test.expectedStatus}, got ${result.status}`,
      };
    }
  } catch (error: any) {
    return {
      pass: false,
      message: `❌ Error: ${error.message}`,
    };
  }
}

/**
 * Test rate limiting (429)
 */
async function testRateLimiting() {
  console.log('\n🚦 Testing Rate Limiting (429)...\n');

  // Make rapid requests to trigger rate limit
  const requests = [];
  for (let i = 0; i < 20; i++) {
    requests.push(
      makeRequest('/api/v1/payments/domestic-payments', 'GET').catch(() => ({
        status: 0,
        data: {},
      }))
    );
  }

  const results = await Promise.all(requests);
  const rateLimited = results.some((r) => r.status === 429);

  if (rateLimited) {
    console.log('  ✅ Rate limiting working (429 received)');
  } else {
    console.log('  ⚠️  Rate limiting not triggered (may need more requests or different endpoint)');
  }
}

/**
 * Run all error tests
 */
async function runTests() {
  console.log('🚨 Error Scenario Testing (TrueLayer Pattern)\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Missing'}\n`);

  const results: Array<{ test: string; pass: boolean; message: string }> = [];

  for (const test of errorTests) {
    const result = await testErrorScenario(test);
    results.push({
      test: test.name,
      pass: result.pass,
      message: result.message,
    });
    console.log(`  ${result.message}\n`);
  }

  await testRateLimiting();

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('Error Test Results\n');

  results.forEach((result) => {
    const icon = result.pass ? '✅' : '❌';
    console.log(`${icon} ${result.test}`);
    console.log(`   ${result.message}`);
  });

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`\n📖 See: docs/TRUELAYER_TESTING_PLAN.md for error handling patterns`);

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

export { runTests, testErrorScenario, testRateLimiting };
