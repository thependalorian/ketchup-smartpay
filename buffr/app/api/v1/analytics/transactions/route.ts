/**
 * Open Banking API: /api/v1/analytics/transactions
 * 
 * Transaction analytics (Open Banking format)
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
 * GET /api/v1/analytics/transactions
 * Get transaction analytics
 */
async function handleGetTransactions(req: ExpoRequest) {
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
    const fromDate = searchParams.get('from_date') || searchParams.get('fromDate');
    const toDate = searchParams.get('to_date') || searchParams.get('toDate');
    const days = searchParams.get('days');
    const transactionType = searchParams.get('transaction_type');
    const paymentMethod = searchParams.get('payment_method');
    const { page, pageSize } = parsePaginationParams(req);

    // Calculate date range
    let dateFrom = fromDate;
    let dateTo = toDate;
    if (days && !fromDate && !toDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - parseInt(days));
      dateFrom = start.toISOString().split('T')[0];
      dateTo = end.toISOString().split('T')[0];
    }

    let sql = `
      SELECT 
        date, transaction_type, payment_method, merchant_category,
        total_transactions, total_volume, average_transaction_amount,
        median_transaction_amount, min_transaction_amount, max_transaction_amount,
        unique_users, unique_merchants, day_of_week
      FROM transaction_analytics
      WHERE hour_of_day IS NULL
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (dateFrom) {
      conditions.push(`date >= $${paramIndex++}`);
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push(`date <= $${paramIndex++}`);
      params.push(dateTo);
    }

    if (transactionType) {
      conditions.push(`transaction_type = $${paramIndex++}`);
      params.push(transactionType);
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
      sql.replace('SELECT date, transaction_type', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const results = await query<any>(sql, params);

    // Calculate totals
    const totals = await query<{
      total_transactions: number;
      total_volume: number;
      unique_users: number;
    }>(
      `SELECT 
        SUM(total_transactions)::INTEGER as total_transactions,
        SUM(total_volume) as total_volume,
        COUNT(DISTINCT unique_users)::INTEGER as unique_users
      FROM transaction_analytics
      WHERE hour_of_day IS NULL
      ${conditions.length > 0 ? `AND ${conditions.map((c, i) => c.replace(/\$\d+/, `$${i + 1}`)).join(' AND ')}` : ''}`,
      params.slice(0, -2)
    );

    const totalTransactions = totals[0]?.total_transactions || 0;
    const totalVolume = parseFloat(totals[0]?.total_volume?.toString() || '0');
    const uniqueUsers = totals[0]?.unique_users || 0;
    const averageTransactionAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    // Format as Open Banking
    const formattedAnalytics = results.map((r: any) => ({
      Date: r.date,
      TransactionType: r.transaction_type,
      PaymentMethod: r.payment_method || null,
      MerchantCategory: r.merchant_category || null,
      TotalTransactions: r.total_transactions || 0,
      TotalVolume: parseFloat(r.total_volume?.toString() || '0'),
      AverageTransactionAmount: parseFloat(r.average_transaction_amount?.toString() || '0'),
      MedianTransactionAmount: parseFloat(r.median_transaction_amount?.toString() || '0'),
      MinTransactionAmount: parseFloat(r.min_transaction_amount?.toString() || '0'),
      MaxTransactionAmount: parseFloat(r.max_transaction_amount?.toString() || '0'),
      UniqueUsers: r.unique_users || 0,
      UniqueMerchants: r.unique_merchants || 0,
      DayOfWeek: r.day_of_week || null,
    }));

    return helpers.paginated(
      formattedAnalytics,
      'TransactionAnalytics',
      '/api/v1/analytics/transactions',
      page,
      pageSize,
      total,
      req,
      fromDate || toDate || transactionType || paymentMethod
        ? { fromDate, toDate, transactionType, paymentMethod }
        : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching transaction analytics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching transaction analytics',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetTransactions,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
