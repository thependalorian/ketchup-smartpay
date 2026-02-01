/**
 * User Behavior Analytics API
 * 
 * Location: app/api/analytics/users/route.ts
 * Purpose: Get user behavior analytics data
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { query } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const fromDate = searchParams.get('from_date') || searchParams.get('fromDate');
    const toDate = searchParams.get('to_date') || searchParams.get('toDate');
    const days = searchParams.get('days');
    const userId = searchParams.get('user_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Calculate date range from days parameter if provided
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
    
    sql += ` ORDER BY date DESC, transaction_count DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
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
      ${conditions.length > 0 ? `AND ${conditions.map((c, i) => c.replace(/\$\d+/, `$${i + 1}`)).join(' AND ')}` : ''}`,
      params.slice(0, -2)
    );
    
    const aggregate = aggregates[0] || {
      avg_transaction_count: 0,
      avg_total_spent: 0,
      avg_total_received: 0,
      total_users: 0,
    };

    // Calculate totals
    const totalSpent = results.reduce((sum, r) => sum + parseFloat(r.total_spent?.toString() || '0'), 0);
    const totalReceived = results.reduce((sum, r) => sum + parseFloat(r.total_received?.toString() || '0'), 0);
    const totalCashOut = results.reduce((sum, r) => sum + parseFloat(r.cash_out_amount?.toString() || '0'), 0);
    const totalDigital = results.reduce(
      (sum, r) =>
        sum +
        parseFloat(r.merchant_payment_amount?.toString() || '0') +
        parseFloat(r.p2p_transfer_amount?.toString() || '0') +
        parseFloat(r.bill_payment_amount?.toString() || '0'),
      0
    );
    const totalTransactions = totalSpent + totalReceived;
    const cashOutRatio = totalTransactions > 0 ? totalCashOut / totalTransactions : 0;
    const digitalPaymentRatio = totalTransactions > 0 ? totalDigital / totalTransactions : 0;
    const averageBalance = results.length > 0
      ? results.reduce((sum, r) => sum + parseFloat(r.average_balance?.toString() || '0'), 0) / results.length
      : 0;

    // Group by preferred payment method
    const paymentMethodCounts = new Map<string, number>();
    for (const row of results) {
      const method = row.preferred_payment_method || 'unknown';
      paymentMethodCounts.set(method, (paymentMethodCounts.get(method) || 0) + 1);
    }
    const totalUsers = paymentMethodCounts.size > 0
      ? Array.from(paymentMethodCounts.values()).reduce((sum, count) => sum + count, 0)
      : aggregate.total_users;

    const preferredPaymentMethods = Array.from(paymentMethodCounts.entries())
      .map(([method, count]) => ({
        method,
        count,
        percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Support both old format (for backward compatibility) and new format
    const days = searchParams.get('days');
    if (days) {
      // New format for dashboard
      return successResponse({
        totalUsers: aggregate.total_users || totalUsers,
        averageBalance,
        totalSpent,
        totalReceived,
        cashOutRatio,
        digitalPaymentRatio,
        preferredPaymentMethods,
      });
    }

    // Old format for API compatibility
    return successResponse({
      analytics: results,
      aggregates: aggregate,
      pagination: {
        limit,
        offset,
        hasMore: results.length >= limit,
      },
    });
  } catch (error: any) {
    log.error('Error fetching user behavior analytics:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch user behavior analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
