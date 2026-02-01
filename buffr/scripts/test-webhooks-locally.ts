/**
 * Local Webhook Testing Script
 * 
 * Location: scripts/test-webhooks-locally.ts
 * Purpose: Test webhooks locally following TrueLayer Docker/CLI pattern
 * 
 * Based on TrueLayer Pattern: "Develop and test a webhook endpoint locally"
 * - Docker/CLI routing
 * - Webhook generation
 * - Signature verification
 * 
 * Usage:
 *   npx tsx scripts/test-webhooks-locally.ts
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8080/webhooks';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret';

interface WebhookEvent {
  type: string;
  payment_id?: string;
  timestamp: string;
  data: any;
}

/**
 * Generate webhook signature (TrueLayer pattern: TL-Signature)
 */
function generateWebhookSignature(payload: string, timestamp: string, secret: string): string {
  const crypto = require('crypto');
  const message = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return signature;
}

/**
 * Generate test webhook payload
 */
function generateTestWebhook(type: string, data: any): WebhookEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Send webhook to local endpoint
 */
async function sendWebhook(webhook: WebhookEvent): Promise<{ status: number; response: any }> {
  const payload = JSON.stringify(webhook);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = generateWebhookSignature(payload, timestamp, WEBHOOK_SECRET);

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TL-Signature': signature,
      'X-TL-Webhook-Timestamp': timestamp,
    },
    body: payload,
  });

  const responseData = await response.json().catch(() => ({}));

  return {
    status: response.status,
    response: responseData,
  };
}

/**
 * Test webhook types (TrueLayer pattern)
 */
async function testWebhookTypes() {
  console.log('🧪 Testing Webhook Types\n');

  const webhookTypes = [
    {
      type: 'payment_authorization_required',
      data: { payment_id: 'pay-123', status: 'authorization_required' },
    },
    {
      type: 'payment_authorized',
      data: { payment_id: 'pay-123', status: 'authorized' },
    },
    {
      type: 'payment_executed',
      data: { payment_id: 'pay-123', status: 'executed', executed_at: new Date().toISOString() },
    },
    {
      type: 'payment_settled',
      data: { payment_id: 'pay-123', status: 'settled', settled_at: new Date().toISOString() },
    },
    {
      type: 'payment_failed',
      data: { payment_id: 'pay-123', status: 'failed', failure_reason: 'Insufficient funds' },
    },
    {
      type: 'payment_creditable',
      data: { payment_id: 'pay-123', creditable: true, settlement_risk: 'low' },
    },
  ];

  for (const webhookType of webhookTypes) {
    console.log(`Testing: ${webhookType.type}...`);
    const webhook = generateTestWebhook(webhookType.type, webhookType.data);
    const result = await sendWebhook(webhook);

    if (result.status === 200) {
      console.log(`  ✅ ${webhookType.type} - Success`);
    } else {
      console.log(`  ❌ ${webhookType.type} - Failed (${result.status})`);
      console.log(`     Response: ${JSON.stringify(result.response)}`);
    }
  }
}

/**
 * Test webhook signature verification
 */
async function testSignatureVerification() {
  console.log('\n🔐 Testing Signature Verification\n');

  const webhook = generateTestWebhook('payment_executed', { payment_id: 'pay-123' });
  const payload = JSON.stringify(webhook);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const validSignature = generateWebhookSignature(payload, timestamp, WEBHOOK_SECRET);
  const invalidSignature = 'invalid-signature';

  console.log('Testing valid signature...');
  const validResult = await sendWebhook(webhook);
  console.log(`  Status: ${validResult.status}`);

  console.log('Testing invalid signature...');
  const invalidResponse = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TL-Signature': invalidSignature,
      'X-TL-Webhook-Timestamp': timestamp,
    },
    body: payload,
  });

  console.log(`  Status: ${invalidResponse.status}`);
  if (invalidResponse.status === 401 || invalidResponse.status === 403) {
    console.log('  ✅ Invalid signature correctly rejected');
  } else {
    console.log('  ⚠️  Invalid signature not rejected');
  }
}

/**
 * Test webhook timestamp validation
 */
async function testTimestampValidation() {
  console.log('\n⏰ Testing Timestamp Validation\n');

  const webhook = generateTestWebhook('payment_executed', { payment_id: 'pay-123' });
  const payload = JSON.stringify(webhook);

  // Test expired timestamp (10 minutes ago)
  const expiredTimestamp = Math.floor(Date.now() / 1000) - 600;
  const expiredSignature = generateWebhookSignature(payload, expiredTimestamp.toString(), WEBHOOK_SECRET);

  console.log('Testing expired timestamp...');
  const expiredResponse = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'TL-Signature': expiredSignature,
      'X-TL-Webhook-Timestamp': expiredTimestamp.toString(),
    },
    body: payload,
  });

  console.log(`  Status: ${expiredResponse.status}`);
  if (expiredResponse.status === 401 || expiredResponse.status === 400) {
    console.log('  ✅ Expired timestamp correctly rejected');
  } else {
    console.log('  ⚠️  Expired timestamp not rejected');
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Local Webhook Testing (TrueLayer Pattern)\n');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log(`Webhook Secret: ${WEBHOOK_SECRET ? '✅ Set' : '❌ Missing'}\n`);

  try {
    await testWebhookTypes();
    await testSignatureVerification();
    await testTimestampValidation();

    console.log('\n✅ Webhook testing complete');
  } catch (error: any) {
    console.error('\n❌ Webhook testing failed:', error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests();
}

export { runTests, generateTestWebhook, sendWebhook, generateWebhookSignature };
