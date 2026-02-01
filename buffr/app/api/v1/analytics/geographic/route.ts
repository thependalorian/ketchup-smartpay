/**
 * Open Banking API: /api/v1/analytics/geographic
 * 
 * Geographic analytics (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/analytics/geographic
 * Get geographic analytics
 */
async function handleGetGeographic(req: ExpoRequest) {
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
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const region = searchParams.get('region');
    const { page, pageSize } = parsePaginationParams(req);

    let sql = `
      SELECT 
        region, date, transaction_count, total_volume,
        unique_users, cash_out_ratio, digital_payment_ratio
      FROM geographic_analytics
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (fromDate) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(toDate);
    }

    if (region) {
      conditions.push(`region = $${paramIndex++}`);
      params.push(region);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      sql.replace('SELECT region, date', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const results = await query<any>(sql, params);

    // Calculate regional totals
    const regionalTotals = await query<{
      region: string;
      total_transactions: number;
      total_volume: number;
      avg_cash_out_ratio: number;
      avg_digital_ratio: number;
    }>(
      `SELECT 
        region,
        SUM(transaction_count)::INTEGER as total_transactions,
        SUM(total_volume) as total_volume,
        AVG(cash_out_ratio) as avg_cash_out_ratio,
        AVG(digital_payment_ratio) as avg_digital_ratio
      FROM geographic_analytics
      WHERE 1=1
      ${conditions.length > 0 ? `AND ${conditions.map((c, i) => c.replace(/\$\d+/, `$${i + 1}`)).join(' AND ')}` : ''}
      AND region IS NOT NULL
      GROUP BY region
      ORDER BY total_volume DESC`,
      params.slice(0, -2)
    );

    // Format as Open Banking
    const formattedAnalytics = results.map((r: any) => ({
      Region: r.region,
      Date: r.date,
      TransactionCount: r.transaction_count || 0,
      TotalVolume: parseFloat(r.total_volume?.toString() || '0'),
      UniqueUsers: r.unique_users || 0,
      CashOutRatio: parseFloat(r.cash_out_ratio?.toString() || '0'),
      DigitalPaymentRatio: parseFloat(r.digital_payment_ratio?.toString() || '0'),
    }));

    const totals = regionalTotals.map((r: any) => ({
      Region: r.region,
      TotalTransactions: r.total_transactions || 0,
      TotalVolume: parseFloat(r.total_volume?.toString() || '0'),
      AverageCashOutRatio: parseFloat(r.avg_cash_out_ratio?.toString() || '0'),
      AverageDigitalPaymentRatio: parseFloat(r.avg_digital_ratio?.toString() || '0'),
    }));

    return helpers.paginated(
      formattedAnalytics,
      'GeographicAnalytics',
      '/api/v1/analytics/geographic',
      page,
      pageSize,
      total,
      req,
      fromDate || toDate || region ? { fromDate, toDate, region } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching geographic analytics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching geographic analytics',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetGeographic,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
