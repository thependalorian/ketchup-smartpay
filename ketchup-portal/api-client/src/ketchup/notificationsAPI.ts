/**
 * Notifications API Client
 *
 * Purpose: Frontend API client for user-actionable notifications (list, sync, mark read, flag, archive, pin, delete).
 * Location: packages/api-client/src/ketchup/notificationsAPI.ts
 */

import { apiClient } from './api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  source_type: string;
  source_id: string | null;
  link: string | null;
  read_at: string | null;
  is_flagged: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  deleted_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ListFilters {
  read?: boolean;
  flagged?: boolean;
  archived?: boolean;
  pinned?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface ListResult {
  data: Notification[];
  total: number;
}

export const notificationsAPI = {
  /**
   * List notifications with optional filters.
   */
  async list(filters: ListFilters = {}): Promise<ListResult> {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters.read !== undefined) params.read = String(filters.read);
    if (filters.flagged) params.flagged = 'true';
    if (filters.archived) params.archived = 'true';
    if (filters.pinned) params.pinned = 'true';
    if (filters.includeDeleted) params.includeDeleted = 'true';
    if (filters.limit != null) params.limit = filters.limit;
    if (filters.offset != null) params.offset = filters.offset;
    return apiClient.get<ListResult>('/notifications', params);
  },

  /**
   * Get unread count (for header badge).
   */
  async getUnreadCount(): Promise<number> {
    return apiClient.get<number>('/notifications/unread-count');
  },

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    return apiClient.post<{ updated: number }>('/notifications/mark-all-read');
  },

  /**
   * Sync notifications from requires-attention and status events.
   */
  async sync(expiringWithinDays: number = 7, statusEventLimit: number = 100): Promise<{ created: number }> {
    return apiClient.post<{ created: number }>('/notifications/sync', {
      expiringWithinDays,
      statusEventLimit,
    });
  },

  /**
   * Update notification: mark_read, mark_unread, flag, unflag, archive, unarchive, pin, unpin.
   */
  async updateAction(id: string, action: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${id}`, { action });
  },

  markAsRead: (id: string) => apiClient.patch<Notification>(`/notifications/${id}`, { action: 'mark_read' }),
  markUnread: (id: string) => apiClient.patch<Notification>(`/notifications/${id}`, { action: 'mark_unread' }),
  setFlagged: (id: string, value: boolean) =>
    apiClient.patch<Notification>(`/notifications/${id}`, { action: value ? 'flag' : 'unflag' }),
  setArchived: (id: string, value: boolean) =>
    apiClient.patch<Notification>(`/notifications/${id}`, { action: value ? 'archive' : 'unarchive' }),
  setPinned: (id: string, value: boolean) =>
    apiClient.patch<Notification>(`/notifications/${id}`, { action: value ? 'pin' : 'unpin' }),

  /**
   * Soft-delete a notification.
   */
  async delete(id: string): Promise<{ deleted: boolean }> {
    return apiClient.delete<{ deleted: boolean }>(`/notifications/${id}`);
  },
};
