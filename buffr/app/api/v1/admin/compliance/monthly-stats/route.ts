/**
 * Open Banking API: /api/v1/admin/compliance/monthly-stats
 * 
 * Monthly compliance statistics (Open Banking format)
 * 
 * Compliance: PSD-1
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { logStaffAction } from '@/utils/auditLogger';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/compliance/monthly-stats
 * Get monthly compliance statistics
 */
async function handleGetMonthlyStats(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10);

    // Get existing monthly stats if they exist
    const existingStats = await query<{
      id: string;
      report_month: string;
      status: string;
      [key: string]: any;
    }>(
      `SELECT * FROM compliance_monthly_stats 
       WHERE report_year = $1 AND report_month_number = $2`,
      [year, month]
    );

    if (existingStats.length > 0) {
      const statsResponse = {
        Data: {
          Stats: existingStats[0],
        },
        Links: {
          Self: `/api/v1/admin/compliance/monthly-stats?year=${year}&month=${month}`,
        },
        Meta: {},
      };

      return helpers.success(
        statsResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    // Calculate statistics (similar to legacy endpoint)
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Transaction Statistics
    const transactionStats = await query<{
      count: number;
      total_value: number;
    }>(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_value
       FROM transactions
       WHERE created_at >= $1 AND created_at <= $2
       AND status IN ('completed', 'authorised')`,
      [startDate, endDate]
    );

    // Format response
    const statsResponse = {
      Data: {
        Year: year,
        Month: month,
        TotalTransactions: parseInt(transactionStats[0]?.count?.toString() || '0'),
        TotalTransactionValue: parseFloat(transactionStats[0]?.total_value?.toString() || '0'),
        CalculatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/admin/compliance/monthly-stats?year=${year}&month=${month}`,
      },
      Meta: {},
    };

    return helpers.success(
      statsResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error calculating monthly statistics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while calculating monthly statistics',
      500
    );
  }
}

/**
 * POST /api/v1/admin/compliance/monthly-stats
 * Save monthly compliance statistics
 */
async function handlePostMonthlyStats(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Year, Month, ...stats } = Data;

    if (!Year || !Month) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Year and Data.Month are required',
        400
      );
    }

    // Insert or update monthly stats
    const result = await query<{ id: string }>(
      `INSERT INTO compliance_monthly_stats (
        report_month, report_year, report_month_number,
        total_transactions, total_transaction_value, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (report_year, report_month_number)
      DO UPDATE SET
        total_transactions = EXCLUDED.total_transactions,
        total_transaction_value = EXCLUDED.total_transaction_value,
        updated_at = NOW()
      RETURNING id`,
      [
        new Date(Year, Month - 1, 1).toISOString().split('T')[0],
        Year,
        Month,
        stats.total_transactions || 0,
        stats.total_transaction_value || 0,
        stats.status || 'draft',
      ]
    );

    // Log staff action
    await logStaffAction({
      staffId: actualUserId,
      actionType: 'compliance_stats_update',
      entityType: 'compliance_monthly_stats',
      entityId: result[0]?.id,
      details: { year: Year, month: Month, status: stats.status || 'draft' },
    }).catch(err => log.error('Failed to log staff action:', err));

    const statsResponse = {
      Data: {
        StatsId: result[0]?.id,
        Year,
        Month,
        SavedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/admin/compliance/monthly-stats?year=${Year}&month=${Month}`,
      },
      Meta: {},
    };

    return helpers.success(
      statsResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error saving monthly statistics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while saving monthly statistics',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetMonthlyStats,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handlePostMonthlyStats,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
