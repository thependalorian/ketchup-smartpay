/**
 * Merchant Analytics API
 * 
 * Location: app/api/analytics/merchants/route.ts
 * Purpose: Get merchant transaction analytics
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
    const merchantId = searchParams.get('merchant_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');
    
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
    
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const results = await query<any>(sql, params);
    
    // Parse JSONB fields
    const formattedResults = results.map((row: any) => ({
      ...row,
      payment_method_breakdown: typeof row.payment_method_breakdown === 'string'
        ? JSON.parse(row.payment_method_breakdown)
        : row.payment_method_breakdown,
      peak_hours: typeof row.peak_hours === 'string'
        ? JSON.parse(row.peak_hours)
        : row.peak_hours,
    }));
    
    return successResponse({
      analytics: formattedResults,
      pagination: {
        limit,
        offset,
        hasMore: results.length >= limit,
      },
    });
  } catch (error: any) {
    log.error('Error fetching merchant analytics:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch merchant analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
