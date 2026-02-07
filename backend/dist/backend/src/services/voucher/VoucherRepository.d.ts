/**
 * Voucher Repository
 *
 * Location: backend/src/services/voucher/VoucherRepository.ts
 * Purpose: Data access layer for voucher operations
 */
import { Voucher, VoucherFilters } from '../../../../shared/types';
export declare class VoucherRepository {
    /**
     * Find all vouchers with optional filters
     */
    findAll(filters?: VoucherFilters): Promise<Voucher[]>;
    /**
     * Find voucher by ID
     */
    findById(id: string): Promise<Voucher | null>;
    /**
     * Create a new voucher
     */
    create(data: Voucher): Promise<Voucher>;
    /**
     * Update voucher expiry date (for extend operation).
     */
    updateExpiry(id: string, newExpiryDate: string): Promise<Voucher>;
    /**
     * Update voucher status
     */
    updateStatus(id: string, status: Voucher['status'], redemptionMethod?: string, redeemedAt?: string): Promise<Voucher>;
    /**
     * Get vouchers by beneficiary ID
     */
    findByBeneficiary(beneficiaryId: string): Promise<Voucher[]>;
    /**
     * Delete voucher by ID (Ketchup operation). Caller must ensure status is not redeemed for audit.
     * Deletes related status_events, webhook_events, reconciliation_records first.
     */
    deleteById(id: string): Promise<boolean>;
}
//# sourceMappingURL=VoucherRepository.d.ts.map