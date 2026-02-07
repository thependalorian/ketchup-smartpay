/**
 * Webhook API Client
 * 
 * Purpose: API client for webhook monitoring and management
 * Location: /services/webhookAPI.ts
 */

import { apiClient } from './api';
import type { APIResponse, PaginatedResponse } from '../types';

export interface WebhookEvent {
  id: string;
  eventType: 'voucher.redeemed' | 'voucher.expired' | 'voucher.delivered' | 'voucher.cancelled' | 'voucher.failed_delivery';
  voucherId: string;
  status: 'pending' | 'delivered' | 'failed';
  deliveryAttempts: number;
  lastAttemptAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  signatureValid: boolean;
  timestamp: string;
}

export interface WebhookFilters {
  status?: 'pending' | 'delivered' | 'failed';
  eventType?: WebhookEvent['eventType'];
  voucherId?: string;
  limit?: number;
  offset?: number;
}

export const webhookAPI = {
  /**
   * Get all webhook events
   */
  getAll: async (filters?: WebhookFilters): Promise<WebhookEvent[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.eventType) params.append('event_type', filters.eventType);
    if (filters?.voucherId) params.append('voucher_id', filters.voucherId);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const response = await apiClient.get<APIResponse<PaginatedResponse<WebhookEvent>>>(
      `/webhooks?${params.toString()}`
    );
    return response.data.data.data;
  },

  /**
   * Get a specific webhook event by ID
   */
  getById: async (id: string): Promise<WebhookEvent> => {
    const response = await apiClient.get<APIResponse<WebhookEvent>>(`/webhooks/${id}`);
    return response.data.data;
  },

  /**
   * Retry a failed webhook delivery
   */
  retry: async (id: string): Promise<void> => {
    await apiClient.post<APIResponse<void>>(`/webhooks/${id}/retry`);
  },
};
