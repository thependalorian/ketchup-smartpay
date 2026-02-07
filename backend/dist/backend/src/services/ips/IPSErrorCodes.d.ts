/**
 * IPS Error Codes – Standardized responses per ISO 20022 and Namibian Open Banking
 *
 * Location: backend/src/services/ips/IPSErrorCodes.ts
 * Purpose: Map internal errors to ISO 20022 / PSDIR-11 status and reason codes.
 */
export type IPSStatus = 'ACCP' | 'RJCT' | 'PDNG';
export interface IPSErrorResponse {
    status: IPSStatus;
    statusReasonCode: string;
    statusReason: string;
    additionalInformation?: string;
}
/** ISO 20022 / Namibian Open Banking standard rejection reason codes */
export declare const IPS_REJECTION_REASONS: Record<string, IPSErrorResponse>;
export declare function toIPSError(code: keyof typeof IPS_REJECTION_REASONS, additionalInfo?: string): IPSErrorResponse;
//# sourceMappingURL=IPSErrorCodes.d.ts.map