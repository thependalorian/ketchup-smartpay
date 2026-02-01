/**
 * Open Banking API: /api/v1/admin/audit-logs/retention
 * 
 * Audit log retention management (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
import { archiveOldAuditLogs, getRetentionStats } from '@/services/auditLogRetention';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/audit-logs/retention
 * Get retention statistics
 */
async function handleGetRetention(req: ExpoRequest) {
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

    const stats = await getRetentionStats();

    const retentionResponse = {
      Data: {
        Stats: stats,
      },
      Links: {
        Self: '/api/v1/admin/audit-logs/retention',
      },
      Meta: {},
    };

    return helpers.success(
      retentionResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting retention stats:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while getting retention statistics',
      500
    );
  }
}

/**
 * POST /api/v1/admin/audit-logs/retention
 * Archive old audit logs
 */
async function handlePostRetention(req: ExpoRequest) {
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

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Action } = Data;

    if (Action !== 'archive') {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        'Invalid action. Use "archive"',
        400
      );
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
    ).catch(err => log.warn('Staff action logging failed (non-critical):', err));

    const archiveResponse = {
      Data: {
        Archived: result.archived,
        Errors: result.errors.length > 0 ? result.errors : null,
        ArchivedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/admin/audit-logs/retention',
      },
      Meta: {},
    };

    return helpers.success(
      archiveResponse,
      result.errors.length > 0 ? 202 : 200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error archiving audit logs:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while archiving audit logs',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetRetention,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handlePostRetention,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
