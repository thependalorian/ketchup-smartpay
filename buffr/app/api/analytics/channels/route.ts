/**
 * Channel Analytics API
 * 
 * Location: app/api/analytics/channels/route.ts
 * Purpose: Get channel analytics (mobile app vs USSD)
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
    const channel = searchParams.get('channel') as 'mobile_app' | 'ussd' | null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');
    
    let sql = `
      SELECT 
        channel, date, transaction_count, total_volume,
        unique_users, average_transaction_amount
      FROM channel_analytics
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
    
    if (channel) {
      conditions.push(`channel = $${paramIndex++}`);
      params.push(channel);
    }
    
    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }
    
    sql += ` ORDER BY date DESC, total_volume DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const results = await query<any>(sql, params);
    
    // Calculate channel comparison
    const channelComparison = await query<{
      channel: string;
      total_transactions: number;
      total_volume: number;
      unique_users: number;
    }>(
      `SELECT 
        channel,
        SUM(transaction_count)::INTEGER as total_transactions,
        SUM(total_volume) as total_volume,
        COUNT(DISTINCT unique_users)::INTEGER as unique_users
      FROM channel_analytics
      WHERE 1=1
      ${conditions.length > 0 ? `AND ${conditions.map((c, i) => c.replace(/\$\d+/, `$${i + 1}`)).join(' AND ')}` : ''}
      GROUP BY channel
      ORDER BY total_volume DESC`,
      params.slice(0, -2)
    );
    
    return successResponse({
      analytics: results,
      channelComparison: channelComparison,
      pagination: {
        limit,
        offset,
        hasMore: results.length >= limit,
      },
    });
  } catch (error: any) {
    log.error('Error fetching channel analytics:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch channel analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
