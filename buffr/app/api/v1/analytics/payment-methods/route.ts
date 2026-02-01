/**
 * Open Banking API: /api/v1/analytics/payment-methods
 * 
 * Payment method analytics (Open Banking format)
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
 * GET /api/v1/analytics/payment-methods
 * Get payment method analytics
 */
async function handleGetPaymentMethods(req: ExpoRequest) {
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
    const paymentMethod = searchParams.get('payment_method');
    const { page, pageSize } = parsePaginationParams(req);

    let sql = `
      SELECT 
        payment_method, date, transaction_count, total_volume,
        average_transaction_amount, unique_users, success_rate, average_processing_time_ms
      FROM payment_method_analytics
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

    if (paymentMethod) {
      conditions.push(`payment_method = $${paramIndex++}`);
      params.push(paymentMethod);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      sql.replace('SELECT payment_method, date', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const results = await query<any>(sql, params);

    // Calculate totals by payment method
    const methodTotals = await query<{
      payment_method: string;
      total_transactions: number;
      total_volume: number;
      avg_success_rate: number;
    }>(
      `SELECT 
        payment_method,
        SUM(transaction_count)::INTEGER as total_transactions,
        SUM(total_volume) as total_volume,
        AVG(success_rate) as avg_success_rate
      FROM payment_method_analytics
      WHERE 1=1
      ${conditions.length > 0 ? `AND ${conditions.map((c, i) => c.replace(/\$\d+/, `$${i + 1}`)).join(' AND ')}` : ''}
      GROUP BY payment_method
      ORDER BY total_volume DESC`,
      params.slice(0, -2)
    );

    // Format as Open Banking
    const formattedAnalytics = results.map((r: any) => ({
      PaymentMethod: r.payment_method,
      Date: r.date,
      TransactionCount: r.transaction_count || 0,
      TotalVolume: parseFloat(r.total_volume?.toString() || '0'),
      AverageTransactionAmount: parseFloat(r.average_transaction_amount?.toString() || '0'),
      UniqueUsers: r.unique_users || 0,
      SuccessRate: parseFloat(r.success_rate?.toString() || '0'),
      AverageProcessingTimeMs: r.average_processing_time_ms || 0,
    }));

    const totals = methodTotals.map((m: any) => ({
      PaymentMethod: m.payment_method,
      TotalTransactions: m.total_transactions || 0,
      TotalVolume: parseFloat(m.total_volume?.toString() || '0'),
      AverageSuccessRate: parseFloat(m.avg_success_rate?.toString() || '0'),
    }));

    return helpers.paginated(
      formattedAnalytics,
      'PaymentMethodAnalytics',
      '/api/v1/analytics/payment-methods',
      page,
      pageSize,
      total,
      req,
      fromDate || toDate || paymentMethod ? { fromDate, toDate, paymentMethod } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching payment method analytics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching payment method analytics',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetPaymentMethods,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
