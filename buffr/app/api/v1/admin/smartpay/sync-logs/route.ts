/**
 * Open Banking API: /api/v1/admin/smartpay/sync-logs
 * 
 * SmartPay sync logs (Open Banking format)
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
 * GET /api/v1/admin/smartpay/sync-logs
 * Get SmartPay sync logs
 */
async function handleGetSyncLogs(req: ExpoRequest) {
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
    const direction = searchParams.get('direction');
    const successParam = searchParams.get('success');
    const { page, pageSize } = parsePaginationParams(req);

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

    // Get total count
    const countResult = await query<{ count: string }>(
      queryStr.replace('SELECT id, direction', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    queryStr += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const logs = await query(queryStr, params);

    // Format as Open Banking
    const formattedLogs = logs.map((log: any) => ({
      LogId: log.id,
      Direction: log.direction,
      Endpoint: log.endpoint,
      Method: log.method,
      StatusCode: log.statusCode,
      ResponseTimeMs: log.responseTime,
      Success: log.success,
      ErrorMessage: log.errorMessage || null,
      Timestamp: log.timestamp?.toISOString() || null,
      BeneficiaryId: log.beneficiaryId || null,
      VoucherId: log.voucherId || null,
    }));

    return helpers.paginated(
      formattedLogs,
      'SyncLogs',
      '/api/v1/admin/smartpay/sync-logs',
      page,
      pageSize,
      total,
      req,
      direction || successParam ? { direction, success: successParam } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching SmartPay sync logs:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching sync logs',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetSyncLogs,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
