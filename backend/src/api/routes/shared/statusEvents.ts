/**
 * Status Events API Routes
 * 
 * Location: backend/src/api/routes/statusEvents.ts
 * Purpose: REST API endpoints for voucher status event tracking
 */

import { Router, Request, Response } from 'express';
import { StatusMonitor } from '../../../services/status/StatusMonitor';
import { APIResponse, PaginatedResponse } from '../../../../../shared/types';
import { log, logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';

const router: Router = Router();
const statusMonitor = new StatusMonitor();

/**
 * GET /api/v1/status-events
 * Get status events with optional filters
 */
router.get('/', authenticate, async (req: Request, res: Response<APIResponse<PaginatedResponse<any>>>) => {
  try {
    const voucherId = req.query.voucher_id as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    let events: any[] = voucherId
      ? await statusMonitor.getStatusHistory(voucherId)
      : await statusMonitor.getRecentEvents(limit);

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(events.length / limit);
    const paginatedEvents = events.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        data: paginatedEvents,
        total: events.length,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    logError('Failed to get status events', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch status events',
    });
  }
});

/**
 * GET /api/v1/status-events/:voucherId
 * Get status history for a specific voucher
 */
router.get('/:voucherId', authenticate, async (req: Request, res: Response<APIResponse<any[]>>) => {
  try {
    const events = await statusMonitor.getStatusHistory(req.params.voucherId);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    logError('Failed to get status history', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch status history',
    });
  }
});

export default router;
