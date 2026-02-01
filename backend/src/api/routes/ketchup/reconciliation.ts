/**
 * Reconciliation API Routes
 * 
 * Location: backend/src/api/routes/reconciliation.ts
 * Purpose: REST API endpoints for voucher reconciliation
 */

import { Router, Request, Response } from 'express';
import { ReconciliationService } from '../../../services/reconciliation/ReconciliationService';
import { APIResponse, PaginatedResponse } from '../../../../../shared/types';
import { log, logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';

const router = Router();
const reconciliationService = new ReconciliationService();

/**
 * POST /api/v1/reconciliation/verify
 * Run reconciliation for a specific date
 */
router.post('/verify', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required (YYYY-MM-DD format)',
      });
    }

    const report = await reconciliationService.reconcile(date);

    res.json({
      success: true,
      data: report,
      message: 'Reconciliation completed successfully',
    });
  } catch (error) {
    logError('Failed to reconcile', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reconcile',
    });
  }
});

/**
 * GET /api/v1/reconciliation/records
 * Get reconciliation records with filters
 */
router.get('/records', authenticate, async (req: Request, res: Response<APIResponse<PaginatedResponse<any>>>) => {
  try {
    const matchParam = req.query.match as string | undefined;
    const match =
      matchParam === 'true' || matchParam === 'matched' ? true
      : matchParam === 'false' || matchParam === 'discrepancy' ? false
      : undefined;

    const dateParam = (req.query.date as string | undefined)?.trim();
    const filters = {
      date: dateParam && dateParam.length > 0 ? dateParam : undefined,
      match,
      voucherId: req.query.voucher_id as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const records = await reconciliationService.getRecords(filters);

    const page = filters.offset ? Math.floor(filters.offset / filters.limit) + 1 : 1;
    const totalPages = Math.ceil(records.length / filters.limit);

    res.json({
      success: true,
      data: {
        data: records,
        total: records.length,
        page,
        limit: filters.limit,
        totalPages,
      },
    });
  } catch (error) {
    logError('Failed to get reconciliation records', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reconciliation records',
    });
  }
});

/**
 * GET /api/v1/reconciliation/reports
 * Get reconciliation reports for a date range
 */
router.get('/reports', authenticate, async (req: Request, res: Response<APIResponse<any[]>>) => {
  try {
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;

    if (!dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        error: 'date_from and date_to are required (YYYY-MM-DD format)',
      });
    }

    const allRecords: any[] = [];
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    if (from > to) {
      return res.status(400).json({
        success: false,
        error: 'date_from must be before or equal to date_to',
      });
    }
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const records = await reconciliationService.getRecords({ date: dateStr, limit: 500 });
      allRecords.push(...records.map((r) => ({ ...r, date: dateStr })));
    }

    res.json({
      success: true,
      data: allRecords,
    });
  } catch (error) {
    logError('Failed to get reconciliation reports', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reconciliation reports',
    });
  }
});

export default router;
