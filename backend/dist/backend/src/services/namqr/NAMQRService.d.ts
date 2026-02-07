/**
 * NAMQR Service – End-to-end NAMQR code generation, validation, and redemption
 *
 * Location: backend/src/services/namqr/NAMQRService.ts
 * Purpose: Namibia QR standard for merchant payments (PRD FR2.3, FR2.8; UPI-style QR interoperability).
 * References: CONSOLIDATED_PRD, NAMQR specification. Interoperable: POS, ATM, USSD, app.
 */
export interface NAMQRGenerateRequest {
    merchantId: string;
    amount: string;
    currency?: string;
    reference?: string;
    expiryMinutes?: number;
    /** Offline-capable QR: validate locally and queue; sync when online (payload flag + DB column). */
    offline?: boolean;
}
export interface NAMQRCode {
    qrId: string;
    payload: string;
    merchantId: string;
    amount: string;
    currency: string;
    reference?: string;
    expiresAt: string;
    offline: boolean;
}
export interface NAMQRValidateResult {
    valid: boolean;
    qrId?: string;
    merchantId?: string;
    amount?: string;
    reason?: string;
    offline?: boolean;
}
/** Channel for redemption – interoperability: same QR can be scanned on POS, ATM, USSD, app */
export type NAMQRChannel = 'POS' | 'ATM' | 'USSD' | 'app';
export interface NAMQRRedemptionRequest {
    qrId: string;
    payerBeneficiaryId: string;
    payerWalletId: string;
    pinHash?: string;
    /** Optional device ID for POS/ATM – device attestation (reject if device killed/suspended) */
    deviceId?: string;
    /** Channel used for anti-fraud and analytics */
    channel?: NAMQRChannel;
    /** Offline mode: validate locally and queue; sync when online (stub: still requires DB for redeem) */
    offline?: boolean;
}
export interface NAMQRRedemptionResult {
    success: boolean;
    transactionId?: string;
    reason?: string;
}
export declare class NAMQRService {
    /**
     * Generate a NAMQR code for merchant payment.
     * Supports offline flag in payload and DB (migration 013: namqr_codes.offline).
     */
    generate(req: NAMQRGenerateRequest): Promise<NAMQRCode>;
    /**
     * Validate a scanned NAMQR payload (decode, signature check, expiry, DB existence).
     */
    validate(payload: string): Promise<NAMQRValidateResult>;
    /**
     * Redeem a NAMQR payment (payer wallet → merchant). Call after validate(payload) with returned qrId.
     * Anti-replay: mark redeemed_at and redeemed_by_beneficiary_id before processing (UPDATE first, then business logic).
     * Device attestation for POS/ATM (deviceId) applied before redemption.
     */
    redeem(req: NAMQRRedemptionRequest): Promise<NAMQRRedemptionResult>;
    /**
     * Check if a NAMQR payload is redeemable from the given channel (POS, ATM, USSD, app).
     * All channels supported for interoperability; device attestation applied at redeem when deviceId present.
     */
    isRedeemableFromChannel(_channel: NAMQRChannel): boolean;
}
export declare const namqrService: NAMQRService;
//# sourceMappingURL=NAMQRService.d.ts.map