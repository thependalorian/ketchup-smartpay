/**
 * Open Banking API: /api/v1/analytics/users
 * 
 * User behavior analytics (Open Banking format)
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
 * GET /api/v1/analytics/users
 * Get user behavior analytics
 */
async function handleGetUsers(req: ExpoRequest) {
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
    const userId = searchParams.get('user_id');
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
        user_id, date, wallet_balance, average_balance, transaction_count,
        total_spent, total_received, preferred_payment_method,
        cash_out_count, cash_out_amount, merchant_payment_count, merchant_payment_amount,
        p2p_transfer_count, p2p_transfer_amount, bill_payment_count, bill_payment_amount,
        spending_velocity
      FROM user_behavior_analytics
      WHERE 1=1
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

    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      sql.replace('SELECT user_id, date', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY date DESC, transaction_count DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const results = await query<any>(sql, params);

    // Calculate aggregate statistics
    const aggregates = await query<{
      avg_transaction_count: number;
      avg_total_spent: number;
      avg_total_received: number;
      total_users: number;
    }>(
      `SELECT 
        AVG(transaction_count) as avg_transaction_count,
        AVG(total_spent) as avg_total_spent,
        AVG(total_received) as avg_total_received,
        COUNT(DISTINCT user_id)::INTEGER as total_users
      FROM user_behavior_analytics
      WHERE 1=1
      ${conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''}`,
      params.slice(0, -2)
    );

    const aggregate = aggregates[0] || {
      avg_transaction_count: 0,
      avg_total_spent: 0,
      avg_total_received: 0,
      total_users: 0,
    };

    // Format as Open Banking
    const formattedAnalytics = results.map((r: any) => ({
      UserId: r.user_id,
      Date: r.date,
      WalletBalance: parseFloat(r.wallet_balance?.toString() || '0'),
      AverageBalance: parseFloat(r.average_balance?.toString() || '0'),
      TransactionCount: r.transaction_count || 0,
      TotalSpent: parseFloat(r.total_spent?.toString() || '0'),
      TotalReceived: parseFloat(r.total_received?.toString() || '0'),
      PreferredPaymentMethod: r.preferred_payment_method || null,
      CashOutCount: r.cash_out_count || 0,
      CashOutAmount: parseFloat(r.cash_out_amount?.toString() || '0'),
      MerchantPaymentCount: r.merchant_payment_count || 0,
      MerchantPaymentAmount: parseFloat(r.merchant_payment_amount?.toString() || '0'),
      P2PTransferCount: r.p2p_transfer_count || 0,
      P2PTransferAmount: parseFloat(r.p2p_transfer_amount?.toString() || '0'),
      BillPaymentCount: r.bill_payment_count || 0,
      BillPaymentAmount: parseFloat(r.bill_payment_amount?.toString() || '0'),
      SpendingVelocity: parseFloat(r.spending_velocity?.toString() || '0'),
    }));

    const analyticsResponse = {
      Data: {
        Analytics: formattedAnalytics,
        Aggregates: {
          AverageTransactionCount: parseFloat(aggregate.avg_transaction_count?.toString() || '0'),
          AverageTotalSpent: parseFloat(aggregate.avg_total_spent?.toString() || '0'),
          AverageTotalReceived: parseFloat(aggregate.avg_total_received?.toString() || '0'),
          TotalUsers: aggregate.total_users || 0,
        },
      },
      Links: {
        Self: '/api/v1/analytics/users',
      },
      Meta: {
        TotalRecords: total,
        Page: page,
        PageSize: pageSize,
      },
    };

    return helpers.paginated(
      formattedAnalytics,
      'UserAnalytics',
      '/api/v1/analytics/users',
      page,
      pageSize,
      total,
      req,
      fromDate || toDate || userId ? { fromDate, toDate, userId } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching user behavior analytics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching user behavior analytics',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetUsers,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
