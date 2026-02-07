/**
 * Voucher Generator
 *
 * Location: backend/src/services/voucher/VoucherGenerator.ts
 * Purpose: Generate unique voucher codes and QR codes (PRD Component: Voucher Generator)
 */
import { log } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
export class VoucherGenerator {
    /**
     * Generate unique voucher code (consistent format: VC-{prefix}-{suffix})
     */
    generateVoucherCode(voucherId) {
        const id = voucherId ?? uuidv4();
        const prefix = id.replace(/-/g, '').slice(0, 8);
        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
        let suffix = '';
        for (let i = 0; i < 8; i++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `VC-${prefix}-${suffix}`;
    }
    /**
     * Generate QR code data (returns base64 encoded QR code)
     * In production, use a QR code library like 'qrcode'
     */
    generateQRCode(voucher) {
        // QR code data format: voucher_id|voucher_code|amount|expiry_date
        const qrData = `${voucher.id}|${voucher.voucherCode}|${voucher.amount}|${voucher.expiryDate}`;
        // In production, encode this as QR code image
        // For now, return the data string
        return Buffer.from(qrData).toString('base64');
    }
    /**
     * Assign expiry date based on grant type
     */
    assignExpiryDate(grantType, issuedAt, expiryDays) {
        const expiry = new Date(issuedAt);
        if (expiryDays) {
            expiry.setDate(expiry.getDate() + expiryDays);
            return expiry;
        }
        // Default expiry based on grant type
        const defaultExpiryDays = {
            social_grant: 30,
            subsidy: 60,
            pension: 30,
            disability: 30,
        };
        const days = defaultExpiryDays[grantType] || 30;
        expiry.setDate(expiry.getDate() + days);
        return expiry;
    }
    /**
     * Create a new voucher from DTO (consistent VC- code, beneficiary required).
     * Uses scheduledIssueAt as issued_at when provided (scheduled issuance).
     */
    createVoucher(data, beneficiaryName, region) {
        const issuedAt = data.scheduledIssueAt
            ? new Date(data.scheduledIssueAt)
            : new Date();
        const voucherId = uuidv4();
        const voucherCode = this.generateVoucherCode(voucherId);
        const expiryDate = this.assignExpiryDate(data.grantType, issuedAt, data.expiryDays);
        const voucher = {
            id: voucherId,
            beneficiaryId: data.beneficiaryId,
            beneficiaryName,
            amount: data.amount,
            grantType: data.grantType,
            status: 'issued',
            issuedAt: issuedAt.toISOString(),
            expiryDate: expiryDate.toISOString(),
            region: region,
            voucherCode,
            qrCode: undefined, // Will be generated when needed
            ...(data.buffrUserId && { buffrUserId: data.buffrUserId }),
        };
        // Generate QR code
        voucher.qrCode = this.generateQRCode(voucher);
        log('Voucher created', { voucherId, beneficiaryId: data.beneficiaryId });
        return voucher;
    }
}
//# sourceMappingURL=VoucherGenerator.js.map