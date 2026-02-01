/**
 * Voucher Service
 * 
 * Location: backend/src/services/voucher/VoucherService.ts
 * Purpose: Business logic for voucher operations (PRD Component: Voucher Generator)
 */

import { VoucherGenerator } from './VoucherGenerator';
import { VoucherRepository } from './VoucherRepository';
import { BeneficiaryRepository } from '../beneficiary/BeneficiaryRepository';
import { 
  Voucher, 
  IssueVoucherDTO, 
  IssueBatchDTO, 
  VoucherFilters 
} from '../../../../shared/types';
import { log, logError } from '../../utils/logger';
import { validateIssueVoucherDTO } from './validateIssueVoucher';

export class VoucherService {
  private generator: VoucherGenerator;
  private repository: VoucherRepository;
  private beneficiaryRepository: BeneficiaryRepository;

  constructor(
    generator?: VoucherGenerator,
    repository?: VoucherRepository,
    beneficiaryRepository?: BeneficiaryRepository
  ) {
    this.generator = generator || new VoucherGenerator();
    this.repository = repository || new VoucherRepository();
    this.beneficiaryRepository = beneficiaryRepository || new BeneficiaryRepository();
  }

  /**
   * Issue a single voucher (guard rails: required beneficiary, amount, grant type; optional scheduled issuance)
   */
  async issueVoucher(data: IssueVoucherDTO): Promise<Voucher> {
    try {
      const validation = validateIssueVoucherDTO(data);
      if (!validation.ok) {
        throw new Error(validation.error);
      }
      const d = validation.data;

      // Validate beneficiary exists
      const beneficiary = await this.beneficiaryRepository.findById(d.beneficiaryId);
      if (!beneficiary) {
        throw new Error(`Beneficiary with ID ${d.beneficiaryId} not found`);
      }
      // Do not issue vouchers to deceased beneficiaries
      if (beneficiary.status === 'deceased') {
        throw new Error('Cannot issue voucher to deceased beneficiary');
      }

      // Generate voucher (uses scheduledIssueAt as issued_at when provided)
      const voucher = this.generator.createVoucher(
        d,
        beneficiary.name,
        beneficiary.region
      );

      // Save to database
      const saved = await this.repository.create(voucher);

      log('Voucher issued successfully', { voucherId: saved.id, beneficiaryId: d.beneficiaryId, scheduledIssueAt: d.scheduledIssueAt });
      return saved;
    } catch (error) {
      logError('Failed to issue voucher', error, { data });
      throw error;
    }
  }

  /**
   * Issue batch vouchers
   */
  async issueBatch(data: IssueBatchDTO): Promise<Voucher[]> {
    try {
      const vouchers: Voucher[] = [];

      for (const voucherData of data.vouchers) {
        try {
          const voucher = await this.issueVoucher(voucherData);
          vouchers.push(voucher);
        } catch (error) {
          logError('Failed to issue voucher in batch', error, { voucherData });
          // Continue with other vouchers
        }
      }

      log(`Batch voucher issuance completed: ${vouchers.length}/${data.vouchers.length} successful`);
      return vouchers;
    } catch (error) {
      logError('Failed to issue batch vouchers', error);
      throw error;
    }
  }

  /**
   * Get voucher by ID
   */
  async getById(id: string): Promise<Voucher | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      logError('Failed to get voucher by ID', error, { id });
      throw error;
    }
  }

  /**
   * Get all vouchers with filters
   */
  async getAll(filters?: VoucherFilters): Promise<Voucher[]> {
    try {
      return await this.repository.findAll(filters);
    } catch (error) {
      logError('Failed to get vouchers', error, { filters });
      throw error;
    }
  }

  /**
   * Get vouchers by beneficiary
   */
  async getByBeneficiary(beneficiaryId: string): Promise<Voucher[]> {
    try {
      return await this.repository.findByBeneficiary(beneficiaryId);
    } catch (error) {
      logError('Failed to get vouchers by beneficiary', error, { beneficiaryId });
      throw error;
    }
  }

  /**
   * Update voucher status
   */
  async updateStatus(
    id: string,
    status: Voucher['status'],
    redemptionMethod?: string
  ): Promise<Voucher> {
    try {
      const redeemedAt = status === 'redeemed' ? new Date().toISOString() : undefined;
      return await this.repository.updateStatus(id, status, redemptionMethod, redeemedAt);
    } catch (error) {
      logError('Failed to update voucher status', error, { id, status });
      throw error;
    }
  }

  /**
   * Extend voucher expiry (Ketchup operation). Only for issued/delivered vouchers.
   */
  async extendExpiry(id: string, newExpiryDate: string): Promise<Voucher> {
    const voucher = await this.repository.findById(id);
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'issued' && voucher.status !== 'delivered') {
      throw new Error(`Cannot extend voucher in status ${voucher.status}; only issued or delivered`);
    }
    const date = new Date(newExpiryDate);
    if (isNaN(date.getTime())) throw new Error('Invalid expiry date');
    return await this.repository.updateExpiry(id, newExpiryDate);
  }

  /**
   * Cancel voucher (Ketchup operation). Only for issued/delivered vouchers.
   */
  async cancel(id: string): Promise<Voucher> {
    const voucher = await this.repository.findById(id);
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'issued' && voucher.status !== 'delivered') {
      throw new Error(`Cannot cancel voucher in status ${voucher.status}; only issued or delivered`);
    }
    return await this.repository.updateStatus(id, 'cancelled');
  }

  /**
   * Reissue: create new voucher for same beneficiary (Ketchup operation). Optionally cancel the old voucher.
   */
  async reissue(oldVoucherId: string, options?: { cancelOld?: boolean }): Promise<Voucher> {
    const oldVoucher = await this.repository.findById(oldVoucherId);
    if (!oldVoucher) throw new Error('Voucher not found');
    if (oldVoucher.status === 'redeemed') {
      throw new Error('Cannot reissue already redeemed voucher');
    }
    const cancelOld = options?.cancelOld !== false;
    const newVoucher = await this.issueVoucher({
      beneficiaryId: oldVoucher.beneficiaryId,
      amount: oldVoucher.amount,
      grantType: oldVoucher.grantType,
    });
    if (cancelOld && oldVoucher.status !== 'expired' && oldVoucher.status !== 'cancelled') {
      await this.repository.updateStatus(oldVoucherId, 'cancelled');
    }
    log('Voucher reissued', { oldVoucherId, newVoucherId: newVoucher.id, cancelOld });
    return newVoucher;
  }

  /**
   * Delete voucher (Ketchup operation). Not allowed for redeemed vouchers (audit trail).
   */
  async delete(id: string): Promise<boolean> {
    const voucher = await this.repository.findById(id);
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status === 'redeemed') {
      throw new Error('Cannot delete redeemed voucher; keep for audit');
    }
    return await this.repository.deleteById(id);
  }
}
