/**
 * Geographic Analytics API
 * 
 * Location: app/api/analytics/geographic/route.ts
 * Purpose: Get geographic transaction analytics
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
    const region = searchParams.get('region');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');
    
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
    
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
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
    
    return successResponse({
      analytics: results,
      regionalTotals: regionalTotals,
      pagination: {
        limit,
        offset,
        hasMore: results.length >= limit,
      },
    });
  } catch (error: any) {
    log.error('Error fetching geographic analytics:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch geographic analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
