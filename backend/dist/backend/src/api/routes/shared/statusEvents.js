/**
 * Status Events API Routes
 *
 * Location: backend/src/api/routes/statusEvents.ts
 * Purpose: REST API endpoints for voucher status event tracking
 */
import { Router } from 'express';
import { StatusMonitor } from '../../../services/status/StatusMonitor';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
const router = Router();
const statusMonitor = new StatusMonitor();
/**
 * GET /api/v1/status-events
 * Get status events with optional filters
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const voucherId = req.query.voucher_id;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        let events = voucherId
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
    }
    catch (error) {
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
router.get('/:voucherId', authenticate, async (req, res) => {
    try {
        const events = await statusMonitor.getStatusHistory(req.params.voucherId);
        res.json({
            success: true,
            data: events,
        });
    }
    catch (error) {
        logError('Failed to get status history', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch status history',
        });
    }
});
export default router;
//# sourceMappingURL=statusEvents.js.map