/**
 * Status Events API Client
 *
 * Purpose: Fetch recent voucher status events for activity feed
 * Location: packages/api-client/src/ketchup/statusEventsAPI.ts
 */

import { apiClient } from './api';

export interface StatusEvent {
  id?: string;
  voucherId?: string;
  voucher_id?: string;
  fromStatus?: string;
  toStatus?: string;
  status?: string;
  triggeredBy?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface PaginatedStatusEvents {
  data: StatusEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const statusEventsAPI = {
  /**
   * Get recent status events (for activity feed). No voucher_id = recent across all.
   */
  getRecent: async (limit = 10): Promise<StatusEvent[]> => {
    const result = await apiClient.get<PaginatedStatusEvents>('/status-events', { limit });
    return result?.data ?? [];
  },

  /**
   * Get status history for a specific voucher
   */
  getByVoucherId: async (voucherId: string): Promise<StatusEvent[]> => {
    const result = await apiClient.get<PaginatedStatusEvents | StatusEvent[]>('/status-events', {
      voucher_id: voucherId,
    });
    return Array.isArray(result) ? result : (result?.data ?? []);
  },
};
