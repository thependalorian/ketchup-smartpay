/**
 * Open Banking API: /api/v1/analytics/merchants
 * 
 * Merchant analytics (Open Banking format)
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
 * GET /api/v1/analytics/merchants
 * Get merchant analytics
 */
async function handleGetMerchants(req: ExpoRequest) {
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
    const merchantId = searchParams.get('merchant_id');
    const { page, pageSize } = parsePaginationParams(req);

    let sql = `
      SELECT 
        merchant_id, merchant_name, date, transaction_count, total_volume,
        average_transaction_amount, unique_customers, payment_method_breakdown, peak_hours
      FROM merchant_analytics
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

    if (merchantId) {
      conditions.push(`merchant_id = $${paramIndex++}`);
      params.push(merchantId);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      sql.replace('SELECT merchant_id, merchant_name, date', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const results = await query<any>(sql, params);

    // Format as Open Banking
    const formattedAnalytics = results.map((r: any) => ({
      MerchantId: r.merchant_id,
      MerchantName: r.merchant_name,
      Date: r.date,
      TransactionCount: r.transaction_count || 0,
      TotalVolume: parseFloat(r.total_volume?.toString() || '0'),
      AverageTransactionAmount: parseFloat(r.average_transaction_amount?.toString() || '0'),
      UniqueCustomers: r.unique_customers || 0,
      PaymentMethodBreakdown: typeof r.payment_method_breakdown === 'string'
        ? JSON.parse(r.payment_method_breakdown)
        : r.payment_method_breakdown || {},
      PeakHours: typeof r.peak_hours === 'string'
        ? JSON.parse(r.peak_hours)
        : r.peak_hours || {},
    }));

    return helpers.paginated(
      formattedAnalytics,
      'MerchantAnalytics',
      '/api/v1/analytics/merchants',
      page,
      pageSize,
      total,
      req,
      fromDate || toDate || merchantId ? { fromDate, toDate, merchantId } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching merchant analytics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching merchant analytics',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetMerchants,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
