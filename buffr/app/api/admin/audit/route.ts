/**
 * Audit Logs API
 * 
 * Location: app/api/admin/audit/route.ts
 * Purpose: Retrieve audit logs for admin portal
 * 
 * Requires: Admin authentication with 'audit.view' permission
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

/**
 * GET /api/admin/audit
 * 
 * Query parameters:
 * - action_type: Filter by action type
 * - resource_type: Filter by resource type
 * - resource_id: Filter by resource ID
 * - admin_user_id: Filter by admin user ID
 * - status: Filter by status (success, failed, error)
 * - from_date: Filter from date (ISO)
 * - to_date: Filter to date (ISO)
 * - limit: Pagination limit (default: 50)
 * - offset: Pagination offset (default: 0)
 */
async function getHandler(request: ExpoRequest) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper

    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get('action_type');
    const resourceType = searchParams.get('resource_type');
    const resourceId = searchParams.get('resource_id');
    const adminUserId = searchParams.get('admin_user_id');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Get audit logs
    const logs = await query<any>(
      `SELECT 
        id,
        admin_user_id,
        action_type,
        resource_type,
        resource_id,
        action_details,
        ip_address,
        user_agent,
        status,
        error_message,
        created_at
      FROM audit_logs 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Format logs
    const formattedLogs = logs.map((log: any) => ({
      id: log.id,
      admin_user_id: log.admin_user_id,
      action_type: log.action_type,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      action_details: typeof log.action_details === 'string' 
        ? JSON.parse(log.action_details) 
        : log.action_details,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      status: log.status,
      error_message: log.error_message,
      created_at: log.created_at?.toISOString() || null,
    }));

    return successResponse({
      logs: formattedLogs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching audit logs', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch audit logs',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);

