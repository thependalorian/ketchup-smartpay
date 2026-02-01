/**
 * Generate Test Webhooks Script
 * 
 * Location: scripts/generate-test-webhooks.ts
 * Purpose: Generate test webhooks following TrueLayer patterns
 * 
 * Based on TrueLayer: "Develop and test a webhook endpoint locally"
 * 
 * Usage:
 *   npx tsx scripts/generate-test-webhooks.ts
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

import { randomUUID } from 'crypto';

/**
 * TrueLayer Pattern: Generate test webhook
 * Based on: truelayer generate-webhook executed/failed
 */
function generateTestWebhook(type: 'executed' | 'failed' | 'settled' | 'authorized' | 'creditable'): any {
  const baseWebhook = {
    event_id: randomUUID(),
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    payment: {
      id: randomUUID(),
      amount_in_minor: 10000,
      currency: 'NAD',
      created_at: new Date().toISOString(),
    },
  };

  switch (type) {
    case 'executed':
      return {
        ...baseWebhook,
        type: 'payment_executed',
        payment: {
          ...baseWebhook.payment,
          status: 'executed',
        },
      };
    case 'failed':
      return {
        ...baseWebhook,
        type: 'payment_failed',
        payment: {
          ...baseWebhook.payment,
          status: 'failed',
          failure_reason: 'insufficient_funds',
        },
      };
    case 'settled':
      return {
        ...baseWebhook,
        type: 'payment_settled',
        payment: {
          ...baseWebhook.payment,
          status: 'settled',
          settled_at: new Date().toISOString(),
        },
      };
    case 'authorized':
      return {
        ...baseWebhook,
        type: 'payment_authorized',
        payment: {
          ...baseWebhook.payment,
          status: 'authorized',
        },
      };
    case 'creditable':
      return {
        ...baseWebhook,
        type: 'payment_creditable',
        payment: {
          ...baseWebhook.payment,
          status: 'executed',
          creditable: true, // TrueLayer pattern: Settlement risk webhook
        },
      };
  }
}

/**
 * Generate webhook signature (TrueLayer Pattern)
 * In production, use truelayer-signing library
 */
function generateWebhookSignature(payload: string, timestamp: string): string {
  // TrueLayer Pattern: Generate signature using private key
  // For testing, return mock signature
  return `test-signature-${timestamp}`;
}

/**
 * Create webhook with headers (TrueLayer Pattern)
 */
function createWebhookWithHeaders(type: 'executed' | 'failed' | 'settled' | 'authorized' | 'creditable'): {
  payload: any;
  headers: Record<string, string>;
} {
  const payload = generateTestWebhook(type);
  const timestamp = new Date().toISOString();
  const signature = generateWebhookSignature(JSON.stringify(payload), timestamp);

  // TrueLayer Pattern: Webhook headers
  const headers = {
    'Content-Type': 'application/json',
    'X-TL-Webhook-Timestamp': timestamp,
    'TL-Signature': signature,
  };

  return { payload, headers };
}

/**
 * Generate all webhook types
 */
function generateAllWebhooks(): Record<string, { payload: any; headers: Record<string, string> }> {
  const types: Array<'executed' | 'failed' | 'settled' | 'authorized' | 'creditable'> = [
    'executed',
    'failed',
    'settled',
    'authorized',
    'creditable',
  ];

  const webhooks: Record<string, { payload: any; headers: Record<string, string> }> = {};

  types.forEach((type) => {
    webhooks[type] = createWebhookWithHeaders(type);
  });

  return webhooks;
}

/**
 * Main function
 */
function main() {
  console.log('🔔 Generating Test Webhooks (TrueLayer Pattern)\n');

  const webhooks = generateAllWebhooks();

  console.log('Generated Webhooks:\n');
  console.log('─'.repeat(80));

  Object.entries(webhooks).forEach(([type, { payload, headers }]) => {
    console.log(`\n📨 ${type.toUpperCase()} Webhook:`);
    console.log(`   Type: ${payload.type}`);
    console.log(`   Event ID: ${payload.event_id}`);
    console.log(`   Payment ID: ${payload.payment.id}`);
    console.log(`   Status: ${payload.payment.status}`);
    console.log(`   Headers:`);
    console.log(`     X-TL-Webhook-Timestamp: ${headers['X-TL-Webhook-Timestamp']}`);
    console.log(`     TL-Signature: ${headers['TL-Signature']}`);
  });

  console.log('\n─'.repeat(80));
  console.log(`\n📖 TrueLayer Webhook Generation Instructions:`);
  console.log(`   Docker: docker run truelayer/truelayer-cli generate-webhook executed`);
  console.log(`   CLI: truelayer generate-webhook executed`);
  console.log(`   CLI: truelayer generate-webhook failed`);
  console.log(`\n📖 See: docs/TRUELAYER_TESTING_PLAN.md for full guide`);

  return webhooks;
}

// Run if called directly
if (require.main === module) {
  main();
}

export { generateTestWebhook, generateAllWebhooks, createWebhookWithHeaders, generateWebhookSignature };
