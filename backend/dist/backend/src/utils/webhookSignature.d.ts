/**
 * Webhook Signature Verification
 *
 * Purpose: Verify HMAC-SHA256 signatures for webhook payloads from Buffr
 * Location: backend/src/utils/webhookSignature.ts
 */
/**
 * Verify webhook signature using HMAC-SHA256
 */
export declare function verifyWebhookSignature(payload: string | Buffer, signature: string, secret?: string): boolean;
/**
 * Generate webhook signature (for testing)
 */
export declare function generateWebhookSignature(payload: string | Buffer, secret?: string): string;
//# sourceMappingURL=webhookSignature.d.ts.map