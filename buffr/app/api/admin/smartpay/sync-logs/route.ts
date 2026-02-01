/**
 * SmartPay Sync Logs API
 * 
 * Location: app/api/admin/smartpay/sync-logs/route.ts
 * Purpose: Get recent API sync logs for SmartPay integration
 * 
 * Query Parameters:
 * - limit: Number of logs to return (default: 20, max: 100)
 * - direction: Filter by direction ('inbound' | 'outbound')
 * - success: Filter by success status (true/false)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const direction = url.searchParams.get('direction');
    const successParam = url.searchParams.get('success');

    let queryStr = `
      SELECT 
        id,
        direction,
        endpoint,
        method,
        status_code as "statusCode",
        response_time_ms as "responseTime",
        success,
        error_message as "errorMessage",
        created_at as "timestamp",
        beneficiary_id as "beneficiaryId",
        voucher_id as "voucherId"
      FROM api_sync_audit_logs
      WHERE endpoint LIKE '%smartpay%' OR endpoint LIKE '%ketchup%'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (direction) {
      queryStr += ` AND direction = $${paramIndex}`;
      params.push(direction);
      paramIndex++;
    }

    if (successParam !== null) {
      queryStr += ` AND success = $${paramIndex}`;
      params.push(successParam === 'true');
      paramIndex++;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const logs = await query(queryStr, params);

    return successResponse(logs);
  } catch (error: any) {
    logger.error('Error fetching SmartPay sync logs', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch sync logs',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
