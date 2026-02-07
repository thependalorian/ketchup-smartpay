/**
 * Distribution Engine
 *
 * Location: backend/src/services/distribution/DistributionEngine.ts
 * Purpose: Core distribution logic for vouchers (PRD Component: Distribution Engine)
 *          Integrates Token Vault: generates token for voucher before sending to Buffr.
 */
import { BuffrAPIClient } from './BuffrAPIClient';
import { tokenVaultService } from '../tokenVault/TokenVaultService';
import { log, logError } from '../../utils/logger';
export class DistributionEngine {
    buffrClient;
    constructor(buffrClient) {
        this.buffrClient = buffrClient || new BuffrAPIClient();
    }
    /**
     * Distribute voucher to Buffr API.
     * Uses beneficiary id_number and phone (and voucher.buffrUserId) so Buffr can issue to the right recipient.
     * Optional product rule: skip distribution when beneficiary status is deceased.
     */
    async distributeToBuffr(voucher, beneficiary) {
        try {
            if (beneficiary?.status === 'deceased') {
                log('Skipping distribution: beneficiary is deceased', { voucherId: voucher.id, beneficiaryId: beneficiary.id });
                return {
                    success: false,
                    voucherId: voucher.id,
                    channel: 'buffr_api',
                    error: 'Beneficiary is deceased; distribution skipped.',
                    timestamp: new Date().toISOString(),
                };
            }
            log('Distributing voucher to Buffr', { voucherId: voucher.id, buffrUserId: voucher.buffrUserId });
            // Token Vault: generate token for voucher so Buffr can validate redemption (G2P/NAMQR)
            let tokenId;
            let token;
            try {
                const tokenResult = await tokenVaultService.generateToken({
                    voucherId: voucher.id,
                    purpose: 'g2p',
                    expiresAt: new Date(voucher.expiryDate),
                });
                tokenId = tokenResult.tokenId;
                token = tokenResult.token;
            }
            catch (tokenErr) {
                logError('Token Vault generate failed; distributing without token', tokenErr, { voucherId: voucher.id });
            }
            const enrichment = beneficiary
                ? {
                    beneficiaryIdNumber: beneficiary.idNumber,
                    beneficiaryPhone: beneficiary.phone,
                    buffrUserId: voucher.buffrUserId ?? undefined,
                    tokenId,
                    token,
                }
                : { buffrUserId: voucher.buffrUserId ?? undefined, tokenId, token };
            const result = await this.buffrClient.sendVoucher(voucher, enrichment);
            return {
                success: result.success,
                voucherId: voucher.id,
                channel: 'buffr_api',
                deliveryId: result.deliveryId,
                error: result.error,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            logError('Failed to distribute voucher to Buffr', error, { voucherId: voucher.id });
            return {
                success: false,
                voucherId: voucher.id,
                channel: 'buffr_api',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            };
        }
    }
    /**
     * Distribute batch vouchers to Buffr.
     * getBeneficiary is called per voucher to supply id_number and phone for the Buffr payload.
     */
    async distributeBatch(vouchers, getBeneficiary) {
        try {
            log('Distributing batch vouchers', { count: vouchers.length });
            const result = await this.buffrClient.sendBatch(vouchers, getBeneficiary);
            return {
                total: result.total,
                successful: result.successful,
                failed: result.failed,
                results: result.results.map(r => ({
                    success: r.success,
                    voucherId: r.voucherId,
                    channel: 'buffr_api',
                    deliveryId: r.deliveryId,
                    error: r.error,
                    timestamp: new Date().toISOString(),
                })),
            };
        }
        catch (error) {
            logError('Failed to distribute batch vouchers', error);
            throw error;
        }
    }
    /**
     * Distribute voucher via SMS.
     * Integration point: wire to SMS provider (e.g. Twilio, Africa's Talking) when available.
     */
    async distributeToSMS(voucher) {
        log('SMS distribution not yet implemented', { voucherId: voucher.id });
        return {
            success: false,
            voucherId: voucher.id,
            channel: 'sms',
            error: 'SMS distribution not yet implemented; integrate SMS provider when required.',
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Distribute voucher via USSD.
     * Integration point: wire to USSD gateway when available.
     */
    async distributeToUSSD(voucher) {
        log('USSD distribution not yet implemented', { voucherId: voucher.id });
        return {
            success: false,
            voucherId: voucher.id,
            channel: 'ussd',
            error: 'USSD distribution not yet implemented; integrate USSD gateway when required.',
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Confirm delivery (acknowledge external delivery).
     * Voucher status updates are performed by webhook retry and StatusMonitor when Buffr
     * sends status events; this method is for optional callback/ack use only.
     */
    async confirmDelivery(voucherId, deliveryId) {
        log('Delivery confirmed (status updates handled by webhook/StatusMonitor)', { voucherId, deliveryId });
    }
}
//# sourceMappingURL=DistributionEngine.js.map