/**
 * Payment Method Analytics API
 * 
 * Location: app/api/analytics/payment-methods/route.ts
 * Purpose: Get payment method adoption and performance analytics
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
    
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const paymentMethod = searchParams.get('payment_method');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');
    
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
    
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
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
    
    return successResponse({
      analytics: results,
      methodTotals: methodTotals,
      pagination: {
        limit,
        offset,
        hasMore: results.length >= limit,
      },
    });
  } catch (error: any) {
    log.error('Error fetching payment method analytics:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch payment method analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
