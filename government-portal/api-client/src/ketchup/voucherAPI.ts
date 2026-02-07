/**
 * Voucher API Client
 * 
 * Location: src/services/voucherAPI.ts
 * Purpose: API client for voucher operations
 */

import { apiClient } from './api';
import type { Voucher, IssueVoucherDTO, IssueBatchDTO, VoucherFilters } from '../types';

export const voucherAPI = {
  /**
   * Get all vouchers
   */
  getAll: async (filters?: VoucherFilters): Promise<Voucher[]> => {
    return apiClient.get<Voucher[]>('/vouchers', filters);
  },

  /**
   * Get voucher by ID
   */
  getById: async (id: string): Promise<Voucher> => {
    return apiClient.get<Voucher>(`/vouchers/${id}`);
  },

  /**
   * Issue a voucher
   */
  issue: async (data: IssueVoucherDTO): Promise<Voucher> => {
    return apiClient.post<Voucher>('/vouchers', data);
  },

  /**
   * Issue batch vouchers
   */
  issueBatch: async (data: IssueBatchDTO): Promise<Voucher[]> => {
    return apiClient.post<Voucher[]>('/vouchers/batch', data);
  },

  /**
   * Update voucher status
   */
  updateStatus: async (id: string, status: Voucher['status'], redemptionMethod?: string): Promise<Voucher> => {
    return apiClient.put<Voucher>(`/vouchers/${id}/status`, { status, redemptionMethod });
  },

  /**
   * Extend voucher expiry (Ketchup operation). Only for issued/delivered.
   */
  extendExpiry: async (id: string, expiryDate: string): Promise<Voucher> => {
    return apiClient.patch<Voucher>(`/vouchers/${id}/extend`, { expiryDate });
  },

  /**
   * Cancel voucher (Ketchup operation). Only for issued/delivered.
   */
  cancel: async (id: string): Promise<Voucher> => {
    return apiClient.patch<Voucher>(`/vouchers/${id}/cancel`);
  },

  /**
   * Reissue new voucher for same beneficiary (Ketchup operation). Optionally cancel the old voucher.
   */
  reissue: async (id: string, options?: { cancelOld?: boolean }): Promise<Voucher> => {
    return apiClient.post<Voucher>(`/vouchers/${id}/reissue`, options ?? { cancelOld: true });
  },

  /**
   * Delete voucher (Ketchup operation). Not allowed for redeemed vouchers (audit trail).
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vouchers/${id}`);
  },
};
