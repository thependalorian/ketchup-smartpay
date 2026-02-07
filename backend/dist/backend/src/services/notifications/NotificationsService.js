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
export class NotificationsService {
    dashboardService = new DashboardService();
    statusMonitor = new StatusMonitor();
    /**
     * List notifications with optional filters.
     */
    async list(filters = {}) {
        try {
            const { read, flagged, archived, pinned, includeDeleted = false, limit = 50, offset = 0, } = filters;
            const countResult = await sql `
      SELECT COUNT(*)::int AS total FROM notifications
      WHERE (${includeDeleted ? sql `true` : sql `deleted_at IS NULL`})
        AND (${read === undefined ? sql `true` : read ? sql `read_at IS NOT NULL` : sql `read_at IS NULL`})
        AND (${flagged !== true ? sql `true` : sql `is_flagged = true`})
        AND (${archived !== true ? sql `true` : sql `is_archived = true`})
        AND (${pinned !== true ? sql `true` : sql `is_pinned = true`})
    `;
            const total = Number(countResult[0]?.total ?? 0);
            const rows = await sql `
      SELECT id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
      FROM notifications
      WHERE (${includeDeleted ? sql `true` : sql `deleted_at IS NULL`})
        AND (${read === undefined ? sql `true` : read ? sql `read_at IS NOT NULL` : sql `read_at IS NULL`})
        AND (${flagged !== true ? sql `true` : sql `is_flagged = true`})
        AND (${archived !== true ? sql `true` : sql `is_archived = true`})
        AND (${pinned !== true ? sql `true` : sql `is_pinned = true`})
      ORDER BY is_pinned DESC, read_at ASC NULLS FIRST, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
            return { data: rows, total };
        }
        catch (error) {
            logError('Failed to list notifications', error);
            throw error;
        }
    }
    /**
     * Sync notifications from requires-attention (failed/expired/expiring) and recent status events.
     * Idempotent: uses source_type + source_id to avoid duplicates (upsert by source).
     */
    async sync(expiringWithinDays = 7, statusEventLimit = 100) {
        try {
            const att = await this.dashboardService.getRequiresAttention(expiringWithinDays);
            const events = await this.statusMonitor.getRecentEvents(statusEventLimit);
            let created = 0;
            const now = new Date().toISOString();
            for (const s of att.sample_failed ?? []) {
                const sourceId = `voucher-failed-${s.id}`;
                const existing = await sql `
          SELECT id FROM notifications WHERE source_type = 'voucher_alert' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
                if (existing.length > 0)
                    continue;
                await sql `
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('alert', ${`Voucher failed: ${s.voucher_code ?? s.id.slice(0, 8)}`}, ${`Voucher ${s.id} (${s.region}) failed or could not be delivered.`}, 'voucher_alert', ${sourceId}, ${`/vouchers?view=${s.id}`}, ${JSON.stringify({ voucherId: s.id, region: s.region, status: s.status })}, ${now})
        `;
                created++;
            }
            for (const s of att.sample_expiring_soon ?? []) {
                const sourceId = `voucher-expiring-${s.id}`;
                const existing = await sql `
          SELECT id FROM notifications WHERE source_type = 'voucher_alert' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
                if (existing.length > 0)
                    continue;
                await sql `
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('alert', ${`Voucher expiring soon: ${s.voucher_code ?? s.id.slice(0, 8)}`}, ${`Voucher ${s.id} expires ${s.expiry_date ?? 'soon'}.`}, 'voucher_alert', ${sourceId}, ${`/vouchers?view=${s.id}`}, ${JSON.stringify({ voucherId: s.id, region: s.region, expiry_date: s.expiry_date })}, ${now})
        `;
                created++;
            }
            const expiredSample = await sql `
        SELECT id, voucher_code, region FROM vouchers WHERE status = 'expired' ORDER BY updated_at DESC NULLS LAST LIMIT 20
      `;
            for (const s of expiredSample) {
                const sourceId = `voucher-expired-${s.id}`;
                const existing = await sql `
          SELECT id FROM notifications WHERE source_type = 'voucher_alert' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
                if (existing.length > 0)
                    continue;
                await sql `
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('alert', ${`Voucher expired: ${s.voucher_code ?? s.id.slice(0, 8)}`}, ${`Voucher ${s.id} (${s.region}) has expired.`}, 'voucher_alert', ${sourceId}, ${`/vouchers?view=${s.id}`}, ${JSON.stringify({ voucherId: s.id, region: s.region })}, ${now})
        `;
                created++;
            }
            for (const e of (events ?? [])) {
                const vid = e.voucherId ?? e.voucher_id ?? e.id;
                const sourceId = `status_event-${e.id ?? vid}-${e.timestamp ?? e.timestamp ?? ''}`;
                const existing = await sql `
          SELECT id FROM notifications WHERE source_type = 'status_event' AND source_id = ${sourceId} AND deleted_at IS NULL LIMIT 1
        `;
                if (existing.length > 0)
                    continue;
                const toStatus = e.to_status ?? e.status ?? 'updated';
                const title = `Voucher ${typeof vid === 'string' ? vid.slice(0, 8) : '—'} → ${toStatus}`;
                const fromStatus = e.from_status;
                const triggeredBy = e.triggered_by;
                await sql `
          INSERT INTO notifications (type, title, body, source_type, source_id, link, metadata, created_at)
          VALUES ('activity', ${title}, ${`Status change to ${toStatus}`}, 'status_event', ${sourceId}, ${`/vouchers?view=${vid}`}, ${JSON.stringify({ voucherId: vid, fromStatus, toStatus, triggeredBy })}, ${now})
        `;
                created++;
            }
            if (created > 0)
                log('Notifications sync', { created });
            return { created };
        }
        catch (error) {
            logError('Failed to sync notifications', error);
            throw error;
        }
    }
    /**
     * Mark all unread notifications as read.
     */
    async markAllAsRead() {
        const result = await sql `
      UPDATE notifications SET read_at = NOW()
      WHERE read_at IS NULL AND deleted_at IS NULL
      RETURNING id
    `;
        const updated = result.length;
        if (updated > 0)
            log('Notifications markAllAsRead', { updated });
        return { updated };
    }
    async markAsRead(id) {
        const updated = await sql `
      UPDATE notifications SET read_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
        return updated[0] ?? null;
    }
    async markUnread(id) {
        const updated = await sql `
      UPDATE notifications SET read_at = NULL WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
        return updated[0] ?? null;
    }
    async setFlagged(id, value) {
        const updated = await sql `
      UPDATE notifications SET is_flagged = ${value} WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
        return updated[0] ?? null;
    }
    async setArchived(id, value) {
        const updated = await sql `
      UPDATE notifications SET is_archived = ${value} WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
        return updated[0] ?? null;
    }
    async setPinned(id, value) {
        const updated = await sql `
      UPDATE notifications SET is_pinned = ${value} WHERE id = ${id} AND deleted_at IS NULL RETURNING id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
    `;
        return updated[0] ?? null;
    }
    async delete(id) {
        const result = await sql `
      UPDATE notifications SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL RETURNING id
    `;
        return result.length > 0;
    }
    async getUnreadCount() {
        const r = await sql `SELECT COUNT(*)::int AS c FROM notifications WHERE read_at IS NULL AND deleted_at IS NULL`;
        return Number(r[0]?.c ?? 0);
    }
    async getById(id) {
        const rows = await sql `
      SELECT id, type, title, body, source_type, source_id, link, read_at, is_flagged, is_archived, is_pinned, deleted_at, metadata, created_at
      FROM notifications WHERE id = ${id} AND deleted_at IS NULL LIMIT 1
    `;
        return rows[0] ?? null;
    }
}
//# sourceMappingURL=NotificationsService.js.map