/**
 * Open Banking API: /api/v1/admin/users/{userId}/suspend
 * 
 * Suspend user account (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { logAuditEvent, createAuditEntry } from '@/utils/auditLog';
import { log } from '@/utils/logger';

/**
 * POST /api/v1/admin/users/{userId}/suspend
 * Suspend a user account
 */
async function handleSuspend(
  req: ExpoRequest,
  { params }: { params: { userId: string } }
) {
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

    const adminUserId = await getUserIdFromRequest(req);
    const { userId } = params;
    const body = await req.json();
    const { Data } = body;

    // Check if user exists
    const user = await queryOne<any>(
      'SELECT id, status FROM users WHERE id = $1 OR external_id = $1',
      [userId]
    );

    if (!user) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    if (user.status === 'suspended') {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_INVALID,
        'User is already suspended',
        400
      );
    }

    const reason = Data?.Reason || 'Suspended by admin';

    // Update user status
    await query(
      `UPDATE users 
       SET status = 'suspended', updated_at = NOW()
       WHERE id = $1 OR external_id = $1`,
      [userId]
    );

    // Log audit event
    await logAuditEvent(
      createAuditEntry(
        adminUserId!,
        'user.suspend',
        'user',
        req,
        {
          resourceId: userId,
          actionDetails: {
            reason,
            previous_status: user.status,
            new_status: 'suspended',
          },
        }
      )
    ).catch(err => log.error('Failed to log audit event:', err));

    const suspendResponse = {
      Data: {
        UserId: userId,
        Status: 'suspended',
        Reason: reason,
        SuspendedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/admin/users/${userId}`,
      },
      Meta: {},
    };

    return helpers.success(
      suspendResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error suspending user:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while suspending the user',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleSuspend,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
