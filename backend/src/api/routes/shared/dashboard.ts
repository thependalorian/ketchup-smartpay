/**
 * Dashboard API Routes
 * 
 * Purpose: REST API endpoints for dashboard metrics and analytics
 * Location: backend/src/api/routes/dashboard.ts
 */

import { Router, Request, Response } from 'express';
import { APIResponse } from '../../../../../shared/types';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../../utils/asyncHandler';
import { DashboardService } from '../../../services/dashboard/DashboardService';

const router: Router = Router();
const dashboardService = new DashboardService();

/**
 * GET /api/v1/dashboard/metrics
 * Get dashboard metrics
 */
router.get('/metrics', authenticate, asyncHandler(async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const metrics = await dashboardService.getMetrics();
    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logError('Failed to get dashboard metrics', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch metrics',
    });
  }
}));

/**
 * GET /api/v1/dashboard/monthly-trend
 * Get monthly trend data
 */
router.get('/monthly-trend', authenticate, asyncHandler(async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const months = req.query.months ? parseInt(req.query.months as string, 10) : 12;
    const trend = await dashboardService.getMonthlyTrend(months);
    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    logError('Failed to get monthly trend', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch monthly trend',
    });
  }
}));

/**
 * GET /api/v1/dashboard/redemption-channels
 * Get redemption channels data: only post_office, mobile_unit, pos, mobile, atm. Bank/unknown allocated into these.
 */
router.get('/redemption-channels', authenticate, asyncHandler(async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const channels = await dashboardService.getRedemptionChannels();
    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    logError('Failed to get redemption channels', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch redemption channels',
    });
  }
}));

/**
 * GET /api/v1/dashboard/regional-stats
 * Get regional statistics
 */
router.get('/regional-stats', authenticate, asyncHandler(async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const stats = await dashboardService.getRegionalStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logError('Failed to get regional stats', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch regional stats',
    });
  }
}));

/**
 * GET /api/v1/dashboard/requires-attention
 * Alerts for Ketchup: failed, expired, expiring soon. Query: expiringWithinDays=7
 */
router.get('/requires-attention', authenticate, asyncHandler(async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const days = req.query.expiringWithinDays ? parseInt(req.query.expiringWithinDays as string, 10) : 7;
    const data = await dashboardService.getRequiresAttention(days);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logError('Failed to get requires attention', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch requires attention',
    });
  }
}));

export default router;
