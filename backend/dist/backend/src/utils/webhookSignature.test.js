/**
 * Webhook Signature Verification Tests
 *
 * Purpose: Unit tests for webhook signature verification
 * Location: backend/src/utils/webhookSignature.test.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyWebhookSignature, generateWebhookSignature } from './webhookSignature';
describe('Webhook Signature Verification', () => {
    const secret = 'test-secret-key';
    const payload = JSON.stringify({ event: 'voucher.redeemed', data: { voucher_id: '123' } });
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('generateWebhookSignature', () => {
        it('should generate a valid HMAC-SHA256 signature', () => {
            const signature = generateWebhookSignature(payload, secret);
            expect(signature).toBeDefined();
            expect(typeof signature).toBe('string');
            expect(signature.length).toBe(64); // SHA256 hex is 64 chars
        });
        it('should generate consistent signatures for same payload', () => {
            const sig1 = generateWebhookSignature(payload, secret);
            const sig2 = generateWebhookSignature(payload, secret);
            expect(sig1).toBe(sig2);
        });
    });
    describe('verifyWebhookSignature', () => {
        it('should verify a valid signature', () => {
            const signature = generateWebhookSignature(payload, secret);
            const isValid = verifyWebhookSignature(payload, signature, secret);
            expect(isValid).toBe(true);
        });
        it('should reject an invalid signature', () => {
            const invalidSignature = 'invalid-signature';
            const isValid = verifyWebhookSignature(payload, invalidSignature, secret);
            expect(isValid).toBe(false);
        });
        it('should reject when signature is missing', () => {
            const isValid = verifyWebhookSignature(payload, '', secret);
            expect(isValid).toBe(false);
        });
        it('should allow when secret is not configured (development)', () => {
            const isValid = verifyWebhookSignature(payload, '', '');
            expect(isValid).toBe(true); // Allows in development
        });
    });
});
//# sourceMappingURL=webhookSignature.test.js.map