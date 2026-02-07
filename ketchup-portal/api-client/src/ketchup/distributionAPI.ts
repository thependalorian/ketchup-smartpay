/**
 * Distribution API Client
 * 
 * Location: src/services/distributionAPI.ts
 * Purpose: API client for voucher distribution
 */

import { apiClient } from './api';

export interface DistributionResult {
  success: boolean;
  voucherId: string;
  channel: 'buffr_api' | 'sms' | 'ussd';
  deliveryId?: string;
  error?: string;
  timestamp: string;
}

export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: DistributionResult[];
}

export const distributionAPI = {
  /**
   * Distribute voucher to Buffr
   */
  disburse: async (voucherId: string): Promise<DistributionResult> => {
    return apiClient.post<DistributionResult>('/distribution/disburse', { voucherId });
  },

  /**
   * Batch distribution
   */
  batch: async (voucherIds: string[]): Promise<BatchResult> => {
    return apiClient.post<BatchResult>('/distribution/batch', { voucherIds });
  },
};
