/**
 * Audit Log Retention Management API
 * 
 * Location: app/api/admin/audit-logs/retention/route.ts
 * Purpose: Manage audit log retention policies (5-year requirement)
 * 
 * Endpoints:
 * - GET: Get retention statistics
 * - POST: Archive old logs (action=archive)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, jsonResponse, HttpStatus } from '@/utils/apiResponse';
import { archiveOldAuditLogs, getRetentionStats } from '@/services/auditLogRetention';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import { log } from '@/utils/logger';

/**
 * GET /api/admin/audit-logs/retention
 * Get retention statistics
 */
async function getHandler(req: ExpoRequest) {
  try {
    const stats = await getRetentionStats();
    return successResponse(stats, 'Retention statistics retrieved successfully');
  } catch (error) {
    log.error('Error getting retention stats', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get retention statistics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/admin/audit-logs/retention
 * Archive old audit logs
 * 
 * Body:
 * - action: 'archive' (required)
 */
async function postHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action !== 'archive') {
      return errorResponse('Invalid action. Use "archive"', HttpStatus.BAD_REQUEST);
    }

    const result = await archiveOldAuditLogs();

    // Log staff action
    await logStaffActionWithContext(
      req,
      {
        actionType: 'audit_log_archive',
        targetEntityType: 'audit_log',
        targetEntityId: 'system',
        location: 'system',
        actionDetails: {
          archived: result.archived,
          errors: result.errors.length,
        },
        authorizationLevel: 'admin',
      },
      result.errors.length === 0,
      result.errors.length > 0 ? result.errors.join('; ') : undefined
    ).catch(err => {
      log.warn('[Audit Retention] Staff action logging failed (non-critical)', err);
    });

    if (result.errors.length > 0) {
      return jsonResponse(
        {
          success: true,
          data: {
            archived: result.archived,
            errors: result.errors,
            warning: 'Some errors occurred during archival',
          },
          message: `Archived ${result.archived} log entries with ${result.errors.length} errors`,
        },
        HttpStatus.ACCEPTED
      );
    }

    return successResponse(
      {
        archived: result.archived,
        errors: [],
      },
      `Successfully archived ${result.archived} audit log entries`
    );
  } catch (error) {
    log.error('Error archiving audit logs', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to archive audit logs',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
