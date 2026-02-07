/**
 * Notifications Service
 *
 * Purpose: Manage user-actionable notifications (mark read, flag, archive, pin, delete).
 * Location: backend/src/services/notifications/NotificationsService.ts
 */

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
import { DashboardService } from '../dashboard/DashboardService';
import { StatusMonitor } from '../status/StatusMonitor';
import type { StatusEvent } from '../../../../shared/types';

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
  read?: boolean; // true = only read, false = only unread, undefined = all
  flagged?: boolean;
  archived?: boolean;
  pinned?: boolean;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export class NotificationsService {
  private dashboardService = new DashboardService();
  private statusMonitor = new StatusMonitor();

  /**
   * List notifications with optional filters.
   */
  async list(filters: ListFilters = {}): Promise<{ data: NotificationRow[]; total: number }> {
    try {
      const {
        read,
        flagged,
        archived,
        pinned,
        includeDeleted = false,
        limit = 50,
        offset = 0,
      } = filters;

      const countResult = await sql`
      SELECT COUNT(*)::int AS total FROM notifications
      WHERE (${includeDeleted ? sql`true` : sql`deleted_at IS NULL`})
        AND (${read === undefined ? sql`true` : read ? sql`read_at IS NOT NULL` : sql`read_at IS NULL`})
        AND (${flagged !== true ? sql`true` : sql`is_flagged = true`})
        AND (${archived !== true ? sql`true` : sql`is_archived = true`})
        AND (${pinned !== true ? sql`true` : sql`is_pinned = true`})
    `;
    const total = Number((countResult as { total: number }[])[0]?.total ?? 0);

    const rows = await sql`
      SELECT id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
      FROM notifications
      WHERE (${includeDeleted ? sql`true` : sql`deleted_at IS NULL`})
        AND (${read === undefined ? sql`true` : read ? sql`read_at IS NOT NULL` : sql`read_at IS NULL`})
        AND (${flagged !== true ? sql`true` : sql`is_flagged = true`})
        AND (${archived !== true ? sql`true` : sql`is_archived = true`})
        AND (${pinned !== true ? sql`true` : sql`is_pinned = true`})
      ORDER BY is_pinned DESC, read_at ASC NULLS FIRST, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
      return { data: rows as NotificationRow[], total };
    } catch (error) {
      logError('Failed to list notifications', error);
      throw error;
    }
  }

  /**
   * Sync notifications from requires-attention (failed/expired/expiring) and recent status events.
   * Idempotent: uses source_type + source_id to avoid duplicates (upsert by source).
   */
  async sync(expiringWithinDays: number = 7, statusEventLimit: number = 100): Promise<{ created: number }> {
    try {
      const att = await this.dashboardService.getRequiresAttention(expiringWithinDays);
      const events = await this.statusMonitor.getRecentEvents(statusEventLimit);
      let created = 0;

      const now = new Date().toISOString();

      for (const s of att.sample_failed ?? []) {
        const sourceId = `voucher-failed-${s.id}`;
        const existing = await sql`
          SELECT id FROM notifications WHERE source_type = 'voucher_alert' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
        if ((existing as any[]).length > 0) continue;
        await sql`
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('alert', ${`Voucher failed: ${s.voucher_code ?? s.id.slice(0, 8)}`}, ${`Voucher ${s.id} (${s.region}) failed or could not be delivered.`}, 'voucher_alert', ${sourceId}, ${`/vouchers?view=${s.id}`}, ${JSON.stringify({ voucherId: s.id, region: s.region, status: s.status })}, ${now})
        `;
        created++;
      }
      for (const s of att.sample_expiring_soon ?? []) {
        const sourceId = `voucher-expiring-${s.id}`;
        const existing = await sql`
          SELECT id FROM notifications WHERE source_type = 'voucher_alert' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
        if ((existing as any[]).length > 0) continue;
        await sql`
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('alert', ${`Voucher expiring soon: ${s.voucher_code ?? s.id.slice(0, 8)}`}, ${`Voucher ${s.id} expires ${s.expiry_date ?? 'soon'}.`}, 'voucher_alert', ${sourceId}, ${`/vouchers?view=${s.id}`}, ${JSON.stringify({ voucherId: s.id, region: s.region, expiry_date: s.expiry_date })}, ${now})
        `;
        created++;
      }
      const expiredSample = await sql`
        SELECT id, voucher_code, region FROM vouchers WHERE status = 'expired' ORDER BY updated_at DESC NULLS LAST LIMIT 20
      `;
      for (const s of expiredSample as { id: string; voucher_code: string | null; region: string }[]) {
        const sourceId = `voucher-expired-${s.id}`;
        const existing = await sql`
          SELECT id FROM notifications WHERE source_type = 'voucher_alert' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
        if ((existing as any[]).length > 0) continue;
        await sql`
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('alert', ${`Voucher expired: ${s.voucher_code ?? s.id.slice(0, 8)}`}, ${`Voucher ${s.id} (${s.region}) has expired.`}, 'voucher_alert', ${sourceId}, ${`/vouchers?view=${s.id}`}, ${JSON.stringify({ voucherId: s.id, region: s.region })}, ${now})
        `;
        created++;
      }
      type StatusEventRow = StatusEvent & { id?: string; voucher_id?: string; to_status?: string; from_status?: string; triggered_by?: string; timestamp?: string };
      for (const e of (events ?? []) as StatusEventRow[]) {
        const vid = e.voucherId ?? e.voucher_id ?? (e as StatusEventRow).id;
        const sourceId = `status_event-${(e as StatusEventRow).id ?? vid}-${(e as StatusEventRow).timestamp ?? e.timestamp ?? ''}`;
        const existing = await sql`
          SELECT id FROM notifications WHERE source_type = 'status_event' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
        if ((existing as any[]).length > 0) continue;
        const toStatus = (e as StatusEventRow).to_status ?? e.status ?? 'updated';
        const title = `Voucher ${typeof vid === 'string' ? vid.slice(0, 8) : '—'} → ${toStatus}`;
        const fromStatus = (e as StatusEventRow).from_status;
        const triggeredBy = (e as StatusEventRow).triggered_by;
        await sql`
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('activity', ${title}, ${`Status change to ${toStatus}`}, 'status_event', ${sourceId}, ${`/vouchers?view=${vid}`}, ${JSON.stringify({ voucherId: vid, fromStatus, toStatus, triggeredBy })}, ${now})
        `;
        created++;
      }

      if (created > 0) log('Notifications sync', { created });
      return { created };
    } catch (error) {
      logError('Failed to sync notifications', error);
      throw error;
    }
  }

  /**
   * Mark all unread notifications as read.
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    const result = await sql`
      UPDATE notifications SET read_at = NOW()
      WHERE read_at IS NULL AND deleted_at IS NULL
      RETURNING id
    `;
    const updated = (result as { id: string }[]).length;
    if (updated > 0) log('Notifications markAllAsRead', { updated });
    return { updated };
  }

  async markAsRead(id: string): Promise<NotificationRow | null> {
    const updated = await sql`
      UPDATE notifications SET read_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
    return (updated as NotificationRow[])[0] ?? null;
  }

  async markUnread(id: string): Promise<NotificationRow | null> {
    const updated = await sql`
      UPDATE notifications SET read_at = NULL WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
    return (updated as NotificationRow[])[0] ?? null;
  }

  async setFlagged(id: string, value: boolean): Promise<NotificationRow | null> {
    const updated = await sql`
      UPDATE notifications SET is_flagged = ${value} WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
    return (updated as NotificationRow[])[0] ?? null;
  }

  async setArchived(id: string, value: boolean): Promise<NotificationRow | null> {
    const updated = await sql`
      UPDATE notifications SET is_archived = ${value} WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
    return (updated as NotificationRow[])[0] ?? null;
  }

  async setPinned(id: string, value: boolean): Promise<NotificationRow | null> {
    const updated = await sql`
      UPDATE notifications SET is_pinned = ${value} WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
    return (updated as NotificationRow[])[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await sql`
      UPDATE notifications SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING id
    `;
    return (result as { id: string }[]).length > 0;
  }

  async getUnreadCount(): Promise<number> {
    const r = await sql`SELECT COUNT(*)::int AS c FROM notifications WHERE read_at IS NULL AND deleted_at IS NULL`;
    return Number((r as { c: number }[])[0]?.c ?? 0);
  }

  async getById(id: string): Promise<NotificationRow | null> {
    const rows = await sql`
      SELECT id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
      FROM notifications WHERE id = ${id} AND deleted_at IS NULL LIMIT 1
    `;
    return (rows as NotificationRow[])[0] ?? null;
  }
}
