/**
 * Transaction Analytics API
 * 
 * Location: app/api/analytics/transactions/route.ts
 * Purpose: Get transaction analytics data
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
    const transactionType = searchParams.get('transaction_type');
    const paymentMethod = searchParams.get('payment_method');
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
    
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
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
      params.slice(0, -2) // Remove limit and offset
    );
    
    // Calculate totals and aggregates
    const totalTransactions = totals[0]?.total_transactions || 0;
    const totalVolume = parseFloat(totals[0]?.total_volume?.toString() || '0');
    const uniqueUsers = totals[0]?.unique_users || 0;
    const averageTransactionAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;

    // Group by transaction type
    const byType = new Map<string, { transactionType: string; count: number; volume: number }>();
    for (const row of results) {
      const type = row.transaction_type;
      if (!byType.has(type)) {
        byType.set(type, { transactionType: type, count: 0, volume: 0 });
      }
      const group = byType.get(type)!;
      group.count += row.total_transactions || 0;
      group.volume += parseFloat(row.total_volume?.toString() || '0');
    }

    // Group by payment method
    const byPaymentMethod = new Map<string, { paymentMethod: string; count: number; volume: number }>();
    for (const row of results) {
      const method = row.payment_method || 'unknown';
      if (!byPaymentMethod.has(method)) {
        byPaymentMethod.set(method, { paymentMethod: method, count: 0, volume: 0 });
      }
      const group = byPaymentMethod.get(method)!;
      group.count += row.total_transactions || 0;
      group.volume += parseFloat(row.total_volume?.toString() || '0');
    }

    // Support both old format (for backward compatibility) and new format
    const days = searchParams.get('days');
    if (days) {
      // New format for dashboard
      return successResponse({
        totalTransactions,
        totalVolume,
        averageTransactionAmount,
        uniqueUsers,
        byType: Array.from(byType.values()).sort((a, b) => b.volume - a.volume),
        byPaymentMethod: Array.from(byPaymentMethod.values()).sort((a, b) => b.volume - a.volume),
      });
    }

    // Old format for API compatibility
    return successResponse({
      analytics: results,
      totals: { total_transactions: totalTransactions, total_volume: totalVolume, unique_users: uniqueUsers },
      pagination: {
        limit,
        offset,
        hasMore: results.length >= limit,
      },
    });
  } catch (error: any) {
    log.error('Error fetching transaction analytics:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch transaction analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
