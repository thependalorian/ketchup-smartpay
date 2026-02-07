/**
 * Voucher Generator
 *
 * Location: backend/src/services/voucher/VoucherGenerator.ts
 * Purpose: Generate unique voucher codes and QR codes (PRD Component: Voucher Generator)
 */
import { Voucher, IssueVoucherDTO } from '../../../../shared/types';
export declare class VoucherGenerator {
    /**
     * Generate unique voucher code (consistent format: VC-{prefix}-{suffix})
     */
    generateVoucherCode(voucherId?: string): string;
    /**
     * Generate QR code data (returns base64 encoded QR code)
     * In production, use a QR code library like 'qrcode'
     */
    generateQRCode(voucher: Voucher): string;
    /**
     * Assign expiry date based on grant type
     */
    assignExpiryDate(grantType: string, issuedAt: Date, expiryDays?: number): Date;
    /**
     * Create a new voucher from DTO (consistent VC- code, beneficiary required).
     * Uses scheduledIssueAt as issued_at when provided (scheduled issuance).
     */
    createVoucher(data: IssueVoucherDTO, beneficiaryName: string, region: string): Voucher;
}
//# sourceMappingURL=VoucherGenerator.d.ts.map