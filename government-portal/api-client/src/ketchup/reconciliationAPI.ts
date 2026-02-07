/**
 * Reconciliation API Client
 * 
 * Purpose: API client for voucher reconciliation operations
 * Location: /services/reconciliationAPI.ts
 */

import { apiClient } from './api';
import type { APIResponse, PaginatedResponse } from '../types';

export interface ReconciliationRecord {
  voucherId: string;
  ketchupStatus: string;
  buffrStatus: string;
  match: boolean;
  discrepancy?: string;
  lastVerified: string;
}

export interface ReconciliationFilters {
  date?: string; // YYYY-MM-DD format
  match?: 'all' | 'matched' | 'discrepancy';
  voucherId?: string;
  limit?: number;
  offset?: number;
}

export interface ReconciliationReport {
  date: string;
  totalVouchers: number;
  matched: number;
  discrepancies: number;
  matchRate: number;
  records: ReconciliationRecord[];
}

export const reconciliationAPI = {
  /**
   * Run reconciliation for a specific date
   */
  reconcile: async (date: string): Promise<ReconciliationReport> => {
    return apiClient.post<ReconciliationReport>('/reconciliation/verify', { date });
  },

  /**
   * Get reconciliation records
   */
  getRecords: async (filters?: ReconciliationFilters): Promise<ReconciliationRecord[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.match && filters.match !== 'all') {
      params.append('match', filters.match === 'matched' ? 'true' : 'false');
    }
    if (filters?.voucherId) params.append('voucher_id', filters.voucherId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get<{ data: ReconciliationRecord[] }>(
      `/reconciliation/records?${params.toString()}`
    );
    return response?.data ?? [];
  },

  /**
   * Get reconciliation report for a date range
   */
  getReport: async (dateFrom: string, dateTo: string): Promise<ReconciliationReport[]> => {
    const response = await apiClient.get<APIResponse<ReconciliationReport[]>>(
      `/reconciliation/reports?date_from=${dateFrom}&date_to=${dateTo}`
    );
    return response.data.data;
  },
};
