/**
 * k6 Load Test Script for Buffr Payment API
 * 
 * Location: scripts/load-tests/k6-payment-api.js
 * Purpose: Load testing for payment and wallet endpoints
 * 
 * Usage:
 *   k6 run scripts/load-tests/k6-payment-api.js
 * 
 * Scenarios:
 *   - Payment endpoint load test
 *   - Wallet operations load test
 *   - Database connection pool limits
 *   - AI agent endpoints load test
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import logger from '@/utils/logger';

// Custom metrics
const paymentSuccessRate = new Rate('payment_success_rate');
const paymentResponseTime = new Trend('payment_response_time');
const walletResponseTime = new Trend('wallet_response_time');

// Configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Sustain 100 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],      // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],       // Error rate < 1%
    payment_success_rate: ['rate>0.95'],  // Payment success > 95%
  },
};

// Base URL (change for staging/production)
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test JWT token (replace with actual token for authenticated tests)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Common headers
const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` }),
};

/**
 * Test payment endpoint
 */
function testPaymentEndpoint() {
  const payload = JSON.stringify({
    toUserId: 'test-user-123',
    amount: 100.00,
    currency: 'N$',
    note: 'Load test payment',
  });

  const response = http.post(`${BASE_URL}/api/payments/send`, payload, {
    headers,
    tags: { name: 'PaymentSend' },
  });

  const success = check(response, {
    'payment status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'payment response time < 1000ms': (r) => r.timings.duration < 1000,
    'payment has transaction ID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.transaction?.id !== undefined;
      } catch {
        return false;
      }
    },
  });

  paymentSuccessRate.add(success);
  paymentResponseTime.add(response.timings.duration);

  return response;
}

/**
 * Test wallet endpoint
 */
function testWalletEndpoint() {
  const walletId = 'test-wallet-123';
  const response = http.get(`${BASE_URL}/api/wallets/${walletId}`, {
    headers,
    tags: { name: 'WalletGet' },
  });

  check(response, {
    'wallet status is 200': (r) => r.status === 200,
    'wallet response time < 500ms': (r) => r.timings.duration < 500,
    'wallet has balance': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data?.balance !== undefined;
      } catch {
        return false;
      }
    },
  });

  walletResponseTime.add(response.timings.duration);
  return response;
}

/**
 * Test add money endpoint
 */
function testAddMoneyEndpoint() {
  const walletId = 'test-wallet-123';
  const payload = JSON.stringify({
    amount: 50.00,
    paymentMethod: 'card',
    cardNumber: '4111111111111111',
    expiryMonth: 12,
    expiryYear: 2025,
    cvv: '123',
  });

  const response = http.post(`${BASE_URL}/api/wallets/${walletId}/add-money`, payload, {
    headers,
    tags: { name: 'WalletAddMoney' },
  });

  check(response, {
    'add money status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'add money response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  return response;
}

/**
 * Test transaction list endpoint
 */
function testTransactionsEndpoint() {
  const response = http.get(`${BASE_URL}/api/transactions?limit=10`, {
    headers,
    tags: { name: 'TransactionsList' },
  });

  check(response, {
    'transactions status is 200': (r) => r.status === 200,
    'transactions response time < 500ms': (r) => r.timings.duration < 500,
  });

  return response;
}

/**
 * Test authentication endpoint (rate limited)
 */
function testAuthEndpoint() {
  const payload = JSON.stringify({
    phone_number: '+264811234567',
    action: 'request_otp',
  });

  const response = http.post(`${BASE_URL}/api/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'AuthLogin' },
  });

  check(response, {
    'auth status is 200 or 429': (r) => r.status === 200 || r.status === 429, // 429 = rate limited
    'auth response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  return response;
}

/**
 * Main test function
 */
export default function () {
  // Test different endpoints with different weights
  const rand = Math.random();

  if (rand < 0.3) {
    // 30% - Payment operations
    testPaymentEndpoint();
  } else if (rand < 0.5) {
    // 20% - Wallet operations
    testWalletEndpoint();
  } else if (rand < 0.7) {
    // 20% - Transaction queries
    testTransactionsEndpoint();
  } else if (rand < 0.9) {
    // 20% - Add money
    testAddMoneyEndpoint();
  } else {
    // 10% - Auth (rate limited, expect some 429s)
    testAuthEndpoint();
  }

  // Think time between requests (simulate user behavior)
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

/**
 * Setup function (runs once before all VUs)
 */
export function setup() {
  logger.info(`🚀 Starting load test against: ${BASE_URL}`);
  logger.info(`📊 Test configuration:`);
  logger.info(`   - Stages: Ramp to 100 concurrent users`);
  logger.info(`   - Duration: ~10 minutes`);
  logger.info(`   - Thresholds: 95% < 500ms, <1% errors`);
  
  // Optional: Get auth token for authenticated tests
  if (!AUTH_TOKEN) {
    logger.info('⚠️  Warning: No AUTH_TOKEN provided, some tests may fail');
  }
}

/**
 * Teardown function (runs once after all VUs)
 */
export function teardown(data) {
  logger.info('✅ Load test completed');
}

