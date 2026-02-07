/**
 * Notifications Service
 *
 * Purpose: Manage user-actionable notifications (mark read, flag, archive, pin, delete).
 * Location: backend/src/services/notifications/NotificationsService.ts
 */
export interface NotificationRow {
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
export declare class NotificationsService {
    private dashboardService;
    private statusMonitor;
    /**
     * List notifications with optional filters.
     */
    list(filters?: ListFilters): Promise<{
        data: NotificationRow[];
        total: number;
    }>;
    /**
     * Sync notifications from requires-attention (failed/expired/expiring) and recent status events.
     * Idempotent: uses source_type + source_id to avoid duplicates (upsert by source).
     */
    sync(expiringWithinDays?: number, statusEventLimit?: number): Promise<{
        created: number;
    }>;
    /**
     * Mark all unread notifications as read.
     */
    markAllAsRead(): Promise<{
        updated: number;
    }>;
    markAsRead(id: string): Promise<NotificationRow | null>;
    markUnread(id: string): Promise<NotificationRow | null>;
    setFlagged(id: string, value: boolean): Promise<NotificationRow | null>;
    setArchived(id: string, value: boolean): Promise<NotificationRow | null>;
    setPinned(id: string, value: boolean): Promise<NotificationRow | null>;
    delete(id: string): Promise<boolean>;
    getUnreadCount(): Promise<number>;
    getById(id: string): Promise<NotificationRow | null>;
}
//# sourceMappingURL=NotificationsService.d.ts.map