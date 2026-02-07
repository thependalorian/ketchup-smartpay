/**
 * Voucher issuance validation – guard rails to prevent unassigned vouchers and invalid data.
 * Location: backend/src/services/voucher/validateIssueVoucher.ts
 */
import { VOUCHER_GRANT_TYPES } from '../../../../shared/types';
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 1_000_000;
const MIN_EXPIRY_DAYS = 1;
const MAX_EXPIRY_DAYS = 365;
export function validateIssueVoucherDTO(data) {
    if (!data || typeof data !== 'object') {
        return { ok: false, error: 'Request body is required.' };
    }
    const d = data;
    // Beneficiary required – every voucher is assigned by Ketchup
    const beneficiaryId = d.beneficiaryId;
    if (beneficiaryId == null || typeof beneficiaryId !== 'string') {
        return { ok: false, error: 'Beneficiary is required. Ketchup assigns every voucher to a beneficiary.' };
    }
    const beneficiaryIdTrimmed = String(beneficiaryId).trim();
    if (!beneficiaryIdTrimmed) {
        return { ok: false, error: 'Beneficiary is required. Ketchup assigns every voucher to a beneficiary.' };
    }
    // Amount required and valid
    const amount = d.amount;
    if (amount == null) {
        return { ok: false, error: 'Amount is required.' };
    }
    const amountNum = typeof amount === 'number' ? amount : Number(amount);
    if (Number.isNaN(amountNum)) {
        return { ok: false, error: 'Amount must be a number.' };
    }
    if (amountNum < MIN_AMOUNT) {
        return { ok: false, error: `Amount must be at least ${MIN_AMOUNT} NAD.` };
    }
    if (amountNum > MAX_AMOUNT) {
        return { ok: false, error: `Amount must not exceed ${MAX_AMOUNT} NAD.` };
    }
    // Grant type required and allowed
    const grantType = d.grantType;
    if (grantType == null || typeof grantType !== 'string') {
        return { ok: false, error: 'Grant type is required.' };
    }
    const grantTypeTrimmed = String(grantType).trim();
    if (!VOUCHER_GRANT_TYPES.includes(grantTypeTrimmed)) {
        return { ok: false, error: `Grant type must be one of: ${VOUCHER_GRANT_TYPES.join(', ')}.` };
    }
    // Expiry days optional but validated if present
    let expiryDays;
    if (d.expiryDays != null) {
        const ed = typeof d.expiryDays === 'number' ? d.expiryDays : Number(d.expiryDays);
        if (Number.isNaN(ed) || ed < MIN_EXPIRY_DAYS || ed > MAX_EXPIRY_DAYS) {
            return { ok: false, error: `Expiry days must be between ${MIN_EXPIRY_DAYS} and ${MAX_EXPIRY_DAYS} when provided.` };
        }
        expiryDays = Math.floor(ed);
    }
    // Scheduled issuance date optional; must not be in the past
    let scheduledIssueAt;
    if (d.scheduledIssueAt != null && d.scheduledIssueAt !== '') {
        const raw = String(d.scheduledIssueAt).trim();
        if (!raw) {
            scheduledIssueAt = undefined;
        }
        else {
            const scheduled = new Date(raw);
            if (Number.isNaN(scheduled.getTime())) {
                return { ok: false, error: 'Scheduled issue date must be a valid ISO date or datetime.' };
            }
            if (scheduled.getTime() < Date.now()) {
                return { ok: false, error: 'Scheduled issue date must not be in the past.' };
            }
            scheduledIssueAt = scheduled.toISOString();
        }
    }
    // buffrUserId optional – Buffr wallet/user UUID for distribution
    let buffrUserId;
    if (d.buffrUserId != null && typeof d.buffrUserId === 'string' && String(d.buffrUserId).trim() !== '') {
        buffrUserId = String(d.buffrUserId).trim();
    }
    return {
        ok: true,
        data: {
            beneficiaryId: beneficiaryIdTrimmed,
            amount: amountNum,
            grantType: grantTypeTrimmed,
            ...(expiryDays !== undefined && { expiryDays }),
            ...(scheduledIssueAt !== undefined && { scheduledIssueAt }),
            ...(buffrUserId !== undefined && { buffrUserId }),
        },
    };
}
//# sourceMappingURL=validateIssueVoucher.js.map