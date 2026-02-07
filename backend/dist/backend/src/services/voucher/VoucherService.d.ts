/**
 * Voucher Service
 *
 * Location: backend/src/services/voucher/VoucherService.ts
 * Purpose: Business logic for voucher operations (PRD Component: Voucher Generator)
 */
import { VoucherGenerator } from './VoucherGenerator';
import { VoucherRepository } from './VoucherRepository';
import { BeneficiaryRepository } from '../beneficiary/BeneficiaryRepository';
import { Voucher, IssueVoucherDTO, IssueBatchDTO, VoucherFilters } from '../../../../shared/types';
export declare class VoucherService {
    private generator;
    private repository;
    private beneficiaryRepository;
    constructor(generator?: VoucherGenerator, repository?: VoucherRepository, beneficiaryRepository?: BeneficiaryRepository);
    /**
     * Issue a single voucher (guard rails: required beneficiary, amount, grant type; optional scheduled issuance)
     */
    issueVoucher(data: IssueVoucherDTO): Promise<Voucher>;
    /**
     * Issue batch vouchers
     */
    issueBatch(data: IssueBatchDTO): Promise<Voucher[]>;
    /**
     * Get voucher by ID
     */
    getById(id: string): Promise<Voucher | null>;
    /**
     * Get all vouchers with filters
     */
    getAll(filters?: VoucherFilters): Promise<Voucher[]>;
    /**
     * Get vouchers by beneficiary
     */
    getByBeneficiary(beneficiaryId: string): Promise<Voucher[]>;
    /**
     * Update voucher status
     */
    updateStatus(id: string, status: Voucher['status'], redemptionMethod?: string): Promise<Voucher>;
    /**
     * Extend voucher expiry (Ketchup operation). Only for issued/delivered vouchers.
     */
    extendExpiry(id: string, newExpiryDate: string): Promise<Voucher>;
    /**
     * Cancel voucher (Ketchup operation). Only for issued/delivered vouchers.
     */
    cancel(id: string): Promise<Voucher>;
    /**
     * Reissue: create new voucher for same beneficiary (Ketchup operation). Optionally cancel the old voucher.
     */
    reissue(oldVoucherId: string, options?: {
        cancelOld?: boolean;
    }): Promise<Voucher>;
    /**
     * Delete voucher (Ketchup operation). Not allowed for redeemed vouchers (audit trail).
     */
    delete(id: string): Promise<boolean>;
}
//# sourceMappingURL=VoucherService.d.ts.map