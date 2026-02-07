/**
 * Webhook Signature Verification
 *
 * Purpose: Verify HMAC-SHA256 signatures for webhook payloads from Buffr
 * Location: backend/src/utils/webhookSignature.ts
 */
import crypto from 'crypto';
import { log, logError } from './logger';
const WEBHOOK_SECRET = process.env.BUFFR_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';
/**
 * Verify webhook signature using HMAC-SHA256
 */
export function verifyWebhookSignature(payload, signature, secret = WEBHOOK_SECRET) {
    try {
        if (!secret) {
            log('Webhook secret not configured, skipping signature verification');
            return true; // Allow if secret not configured (development)
        }
        if (!signature) {
            log('No signature provided in webhook');
            return false;
        }
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');
        // Use timing-safe comparison to prevent timing attacks
        // Ensure buffers have same length
        if (signature.length !== expectedSignature.length) {
            return false;
        }
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    catch (error) {
        logError('Failed to verify webhook signature', error);
        return false;
    }
}
/**
 * Generate webhook signature (for testing)
 */
export function generateWebhookSignature(payload, secret = WEBHOOK_SECRET) {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}
//# sourceMappingURL=webhookSignature.js.map