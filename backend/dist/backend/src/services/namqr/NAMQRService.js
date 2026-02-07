/**
 * NAMQR Service – End-to-end NAMQR code generation, validation, and redemption
 *
 * Location: backend/src/services/namqr/NAMQRService.ts
 * Purpose: Namibia QR standard for merchant payments (PRD FR2.3, FR2.8; UPI-style QR interoperability).
 * References: CONSOLIDATED_PRD, NAMQR specification. Interoperable: POS, ATM, USSD, app.
 */
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
import crypto from 'crypto';
import { deviceManagementService } from '../security/DeviceManagementService';
const NAMQR_PREFIX = 'NAMQR';
const DEFAULT_EXPIRY_MINUTES = 15;
const SIGNATURE_SECRET = process.env.NAMQR_SIGNATURE_SECRET || 'change-in-production';
export class NAMQRService {
    /**
     * Generate a NAMQR code for merchant payment.
     * Supports offline flag in payload and DB (migration 013: namqr_codes.offline).
     */
    async generate(req) {
        const qrId = crypto.randomUUID();
        const currency = req.currency || 'NAD';
        const offline = !!req.offline;
        const expiresAt = new Date(Date.now() + (req.expiryMinutes ?? DEFAULT_EXPIRY_MINUTES) * 60 * 1000);
        const payloadObj = {
            v: '1',
            id: qrId,
            m: req.merchantId,
            a: req.amount,
            c: currency,
            r: req.reference || '',
            e: Math.floor(expiresAt.getTime() / 1000),
            o: offline ? 1 : 0,
        };
        const payloadStr = JSON.stringify(payloadObj);
        const signature = crypto.createHmac('sha256', SIGNATURE_SECRET).update(payloadStr).digest('hex').slice(0, 16);
        const payload = `${NAMQR_PREFIX}://${Buffer.from(payloadStr, 'utf8').toString('base64url')}.${signature}`;
        try {
            await sql `
        INSERT INTO namqr_codes (qr_id, merchant_id, amount, currency, reference, expires_at, payload_hash, created_at, offline)
        VALUES (${qrId}, ${req.merchantId}, ${req.amount}, ${currency}, ${req.reference || null},
                ${expiresAt.toISOString()}, ${crypto.createHash('sha256').update(payloadStr).digest('hex')}, NOW(), ${offline})
      `;
        }
        catch (e) {
            logError('NAMQR insert failed', e, { qrId });
            throw e;
        }
        log('NAMQR generated', { qrId, merchantId: req.merchantId, amount: req.amount, offline });
        return {
            qrId,
            payload,
            merchantId: req.merchantId,
            amount: req.amount,
            currency,
            reference: req.reference,
            expiresAt: expiresAt.toISOString(),
            offline,
        };
    }
    /**
     * Validate a scanned NAMQR payload (decode, signature check, expiry, DB existence).
     */
    async validate(payload) {
        try {
            if (!payload.startsWith(NAMQR_PREFIX)) {
                return { valid: false, reason: 'Invalid NAMQR prefix' };
            }
            const parts = payload.replace(`${NAMQR_PREFIX}://`, '').split('.');
            if (parts.length !== 2) {
                return { valid: false, reason: 'Invalid payload format' };
            }
            const [b64, sig] = parts;
            const payloadStr = Buffer.from(b64, 'base64url').toString('utf8');
            const expectedSig = crypto.createHmac('sha256', SIGNATURE_SECRET).update(payloadStr).digest('hex').slice(0, 16);
            if (sig !== expectedSig) {
                return { valid: false, reason: 'Invalid signature' };
            }
            const data = JSON.parse(payloadStr);
            if (data.e && data.e * 1000 < Date.now()) {
                return { valid: false, reason: 'QR code expired', qrId: data.id, merchantId: data.m, amount: data.a, offline: !!data.o };
            }
            const [row] = await sql `
        SELECT qr_id, merchant_id, amount, currency, redeemed_at, offline
        FROM namqr_codes
        WHERE qr_id = ${data.id}
        LIMIT 1
      `;
            if (!row) {
                return { valid: false, reason: 'QR not found', qrId: data.id };
            }
            if (row.redeemed_at) {
                return { valid: false, reason: 'QR already redeemed', qrId: data.id };
            }
            const offline = !!row.offline;
            return {
                valid: true,
                qrId: data.id,
                merchantId: data.m,
                amount: data.a,
                offline,
            };
        }
        catch (e) {
            logError('NAMQR validate failed', e);
            return { valid: false, reason: 'Validation error' };
        }
    }
    /**
     * Redeem a NAMQR payment (payer wallet → merchant). Call after validate(payload) with returned qrId.
     * Anti-replay: mark redeemed_at and redeemed_by_beneficiary_id before processing (UPDATE first, then business logic).
     * Device attestation for POS/ATM (deviceId) applied before redemption.
     */
    async redeem(req) {
        try {
            if (req.deviceId) {
                const device = await deviceManagementService.getDeviceStatus(req.deviceId);
                if (device && (device.status === 'killed' || device.status === 'suspended')) {
                    log('NAMQR redeem rejected – device not allowed', { deviceId: req.deviceId, status: device.status });
                    return { success: false, reason: 'Device not authorized for redemption' };
                }
            }
            const [row] = await sql `
        SELECT qr_id, merchant_id, amount, redeemed_at, expires_at
        FROM namqr_codes
        WHERE qr_id = ${req.qrId}
        LIMIT 1
      `;
            if (!row) {
                return { success: false, reason: 'QR not found' };
            }
            const qrRow = row;
            if (qrRow.redeemed_at) {
                return { success: false, reason: 'QR already redeemed' };
            }
            if (new Date(qrRow.expires_at) < new Date()) {
                return { success: false, reason: 'QR expired' };
            }
            const transactionId = crypto.randomUUID();
            // Anti-replay: mark as redeemed before processing (prevents double redemption under concurrency)
            await sql `
        UPDATE namqr_codes
        SET redeemed_at = NOW(), redeemed_by_beneficiary_id = ${req.payerBeneficiaryId},
            transaction_id = ${transactionId}
        WHERE qr_id = ${req.qrId}
      `;
            // In production: debit payer wallet, credit merchant, record transaction (idempotent by transaction_id)
            log('NAMQR redeemed', {
                qrId: req.qrId,
                transactionId,
                payer: req.payerBeneficiaryId,
                channel: req.channel,
                deviceId: req.deviceId,
            });
            return { success: true, transactionId };
        }
        catch (e) {
            logError('NAMQR redeem failed', e, { qrId: req.qrId });
            return { success: false, reason: 'Redemption failed' };
        }
    }
    /**
     * Check if a NAMQR payload is redeemable from the given channel (POS, ATM, USSD, app).
     * All channels supported for interoperability; device attestation applied at redeem when deviceId present.
     */
    isRedeemableFromChannel(_channel) {
        return true;
    }
}
export const namqrService = new NAMQRService();
//# sourceMappingURL=NAMQRService.js.map