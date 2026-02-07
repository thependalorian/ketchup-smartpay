/**
 * Buffr API Client
 *
 * Location: backend/src/services/distribution/BuffrAPIClient.ts
 * Purpose: Client for communicating with Buffr API
 */
import { Voucher, Beneficiary } from '../../../../shared/types';
export interface BuffrResponse {
    success: boolean;
    voucherId: string;
    deliveryId?: string;
    message?: string;
    error?: string;
}
export interface BuffrBatchResponse {
    success: boolean;
    total: number;
    successful: number;
    failed: number;
    results: BuffrResponse[];
}
/** Enrichment for Buffr disburse: beneficiary numbers, Buffr wallet ID, and Token Vault token for redemption. */
export interface BuffrDisburseEnrichment {
    /** Beneficiary national ID number (e.g. Namibian 11-digit). */
    beneficiaryIdNumber?: string;
    /** Beneficiary cell phone (+264XXXXXXXXX). */
    beneficiaryPhone?: string;
    /** Buffr wallet/user UUID – voucher is credited to this Buffr account. */
    buffrUserId?: string;
    /** Token Vault token ID (for NAMQR/API resolve). */
    tokenId?: string;
    /** Opaque token for redemption (validate via Token Vault). */
    token?: string;
}
export declare class BuffrAPIClient {
    /**
     * Send voucher to Buffr API.
     * Payload includes beneficiary_id, beneficiary_id_number, beneficiary_phone, and buffr_user_id so Buffr can issue to the right recipient (by beneficiary numbers and Buffr ID/UUID).
     */
    sendVoucher(voucher: Voucher, enrichment?: BuffrDisburseEnrichment): Promise<BuffrResponse>;
    /**
     * Send batch vouchers to Buffr API.
     * getBeneficiary optional: for each voucher, fetches beneficiary to send id_number and phone (and uses voucher.buffrUserId).
     */
    sendBatch(vouchers: Voucher[], getBeneficiary?: (beneficiaryId: string) => Promise<Beneficiary | null>): Promise<BuffrBatchResponse>;
    /**
     * Check voucher status in Buffr
     */
    checkStatus(voucherId: string): Promise<{
        status: string;
        data?: any;
    }>;
}
//# sourceMappingURL=BuffrAPIClient.d.ts.map