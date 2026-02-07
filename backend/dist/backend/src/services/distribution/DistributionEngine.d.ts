/**
 * Distribution Engine
 *
 * Location: backend/src/services/distribution/DistributionEngine.ts
 * Purpose: Core distribution logic for vouchers (PRD Component: Distribution Engine)
 *          Integrates Token Vault: generates token for voucher before sending to Buffr.
 */
import { BuffrAPIClient } from './BuffrAPIClient';
import { Voucher, DistributionResult, BatchResult } from '../../../../shared/types';
import type { Beneficiary } from '../../../../shared/types';
export declare class DistributionEngine {
    private buffrClient;
    constructor(buffrClient?: BuffrAPIClient);
    /**
     * Distribute voucher to Buffr API.
     * Uses beneficiary id_number and phone (and voucher.buffrUserId) so Buffr can issue to the right recipient.
     * Optional product rule: skip distribution when beneficiary status is deceased.
     */
    distributeToBuffr(voucher: Voucher, beneficiary?: Beneficiary | null): Promise<DistributionResult>;
    /**
     * Distribute batch vouchers to Buffr.
     * getBeneficiary is called per voucher to supply id_number and phone for the Buffr payload.
     */
    distributeBatch(vouchers: Voucher[], getBeneficiary?: (beneficiaryId: string) => Promise<Beneficiary | null>): Promise<BatchResult>;
    /**
     * Distribute voucher via SMS.
     * Integration point: wire to SMS provider (e.g. Twilio, Africa's Talking) when available.
     */
    distributeToSMS(voucher: Voucher): Promise<DistributionResult>;
    /**
     * Distribute voucher via USSD.
     * Integration point: wire to USSD gateway when available.
     */
    distributeToUSSD(voucher: Voucher): Promise<DistributionResult>;
    /**
     * Confirm delivery (acknowledge external delivery).
     * Voucher status updates are performed by webhook retry and StatusMonitor when Buffr
     * sends status events; this method is for optional callback/ack use only.
     */
    confirmDelivery(voucherId: string, deliveryId: string): Promise<void>;
}
//# sourceMappingURL=DistributionEngine.d.ts.map