/**
 * Open Banking API: /api/v1/admin/audit
 * 
 * Audit logs retrieval (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/audit
 * Get audit logs
 */
async function handleGetAudit(req: ExpoRequest) {
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
    const actionType = searchParams.get('action_type');
    const resourceType = searchParams.get('resource_type');
    const resourceId = searchParams.get('resource_id');
    const adminUserId = searchParams.get('admin_user_id');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const { page, pageSize } = parsePaginationParams(req);

    // Build query
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (actionType) {
      whereConditions.push(`action_type = $${paramIndex++}`);
      queryParams.push(actionType);
    }

    if (resourceType) {
      whereConditions.push(`resource_type = $${paramIndex++}`);
      queryParams.push(resourceType);
    }

    if (resourceId) {
      whereConditions.push(`resource_id = $${paramIndex++}`);
      queryParams.push(resourceId);
    }

    if (adminUserId) {
      whereConditions.push(`admin_user_id = $${paramIndex++}`);
      queryParams.push(adminUserId);
    }

    if (status) {
      whereConditions.push(`status = $${paramIndex++}`);
      queryParams.push(status);
    }

    if (fromDate) {
      whereConditions.push(`created_at >= $${paramIndex++}`);
      queryParams.push(fromDate);
    }

    if (toDate) {
      whereConditions.push(`created_at <= $${paramIndex++}`);
      queryParams.push(toDate);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
      queryParams
    );
    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const logs = await query<any>(
      `SELECT 
        id,
        admin_user_id,
        action_type,
        resource_type,
        resource_id,
        status,
        ip_address,
        user_agent,
        created_at,
        metadata
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, pageSize, offset]
    );

    // Format as Open Banking
    const formattedLogs = logs.map((log: any) => ({
      AuditLogId: log.id,
      AdminUserId: log.admin_user_id,
      ActionType: log.action_type,
      ResourceType: log.resource_type,
      ResourceId: log.resource_id,
      Status: log.status,
      IpAddress: log.ip_address || null,
      UserAgent: log.user_agent || null,
      CreatedDateTime: log.created_at?.toISOString() || null,
      Metadata: typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata || {},
    }));

    return helpers.paginated(
      formattedLogs,
      'AuditLogs',
      '/api/v1/admin/audit',
      page,
      pageSize,
      total,
      req,
      actionType || resourceType || resourceId || adminUserId || status || fromDate || toDate
        ? { actionType, resourceType, resourceId, adminUserId, status, fromDate, toDate }
        : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching audit logs:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching audit logs',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetAudit,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
