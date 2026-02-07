/**
 * Notifications API Routes
 *
 * Purpose: REST endpoints for user-actionable notifications (list, sync, mark read, flag, archive, pin, delete).
 * Location: backend/src/api/routes/ketchup/notifications.ts
 */

import { Router, Request, Response } from 'express';
import { APIResponse } from '../../../../../shared/types';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { NotificationsService } from '../../../services/notifications/NotificationsService';

const router: Router = Router();
const notificationsService = new NotificationsService();

/**
 * GET /api/v1/notifications
 * List notifications with optional filters: read, flagged, archived, pinned, limit, offset.
 */
router.get('/', authenticate, async (req: Request, res: Response<APIResponse<{ data: any[]; total: number }>>) => {
  try {
    const read = req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined;
    const flagged = req.query.flagged === 'true';
    const archived = req.query.archived === 'true';
    const pinned = req.query.pinned === 'true';
    const includeDeleted = req.query.includeDeleted === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const result = await notificationsService.list({
      read,
      flagged: flagged || undefined,
      archived: archived || undefined,
      pinned: pinned || undefined,
      includeDeleted,
      limit: Math.min(limit, 100),
      offset,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logError('Failed to list notifications', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list notifications',
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get count of unread notifications (for header badge).
 */
router.get('/unread-count', authenticate, async (req: Request, res: Response<APIResponse<number>>) => {
  try {
    const count = await notificationsService.getUnreadCount();
    res.json({ success: true, data: count });
  } catch (error) {
    logError('Failed to get unread count', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get unread count',
    });
  }
});

/**
 * POST /api/v1/notifications/sync
 * Sync notifications from requires-attention and status events. Idempotent.
 */
router.post('/sync', authenticate, async (req: Request, res: Response<APIResponse<{ created: number }>>) => {
  try {
    const expiringWithinDays = req.body?.expiringWithinDays ?? 7;
    const statusEventLimit = req.body?.statusEventLimit ?? 100;
    const result = await notificationsService.sync(expiringWithinDays, statusEventLimit);
    res.json({ success: true, data: result });
  } catch (error) {
    logError('Failed to sync notifications', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync notifications',
    });
  }
});

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all unread notifications as read.
 */
router.post('/mark-all-read', authenticate, async (req: Request, res: Response<APIResponse<{ updated: number }>>) => {
  try {
    const result = await notificationsService.markAllAsRead();
    res.json({ success: true, data: result });
  } catch (error) {
    logError('Failed to mark all as read', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all as read',
    });
  }
});

/**
 * PATCH /api/v1/notifications/:id
 * Update notification: markAsRead, markUnread, setFlagged, setArchived, setPinned.
 * Body: { action: 'mark_read' | 'mark_unread' | 'flag' | 'unflag' | 'archive' | 'unarchive' | 'pin' | 'unpin' }
 */
router.patch('/:id', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const action = (req.body?.action as string)?.toLowerCase();
    let updated: any = null;
    switch (action) {
      case 'mark_read':
        updated = await notificationsService.markAsRead(id);
        break;
      case 'mark_unread':
        updated = await notificationsService.markUnread(id);
        break;
      case 'flag':
        updated = await notificationsService.setFlagged(id, true);
        break;
      case 'unflag':
        updated = await notificationsService.setFlagged(id, false);
        break;
      case 'archive':
        updated = await notificationsService.setArchived(id, true);
        break;
      case 'unarchive':
        updated = await notificationsService.setArchived(id, false);
        break;
      case 'pin':
        updated = await notificationsService.setPinned(id, true);
        break;
      case 'unpin':
        updated = await notificationsService.setPinned(id, false);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Use one of: mark_read, mark_unread, flag, unflag, archive, unarchive, pin, unpin',
        });
    }
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    logError('Failed to update notification', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notification',
    });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Soft-delete a notification.
 */
router.delete('/:id', authenticate, async (req: Request, res: Response<APIResponse<{ deleted: boolean }>>) => {
  try {
    const deleted = await notificationsService.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    logError('Failed to delete notification', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete notification',
    });
  }
});

export default router;
