/**
 * Open Banking API: /api/v1/admin/users/{userId}/reactivate
 * 
 * Reactivate user account (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { logAuditEvent, createAuditEntry } from '@/utils/auditLog';
import { log } from '@/utils/logger';

/**
 * POST /api/v1/admin/users/{userId}/reactivate
 * Reactivate a suspended user account
 */
async function handleReactivate(
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

    if (user.status !== 'suspended') {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_INVALID,
        'User is not suspended',
        400
      );
    }

    // Update user status
    await query(
      `UPDATE users 
       SET status = 'active', updated_at = NOW()
       WHERE id = $1 OR external_id = $1`,
      [userId]
    );

    // Log audit event
    await logAuditEvent(
      createAuditEntry(
        adminUserId!,
        'user.reactivate',
        'user',
        req,
        {
          resourceId: userId,
          actionDetails: {
            previous_status: user.status,
            new_status: 'active',
          },
        }
      )
    ).catch(err => log.error('Failed to log audit event:', err));

    const reactivateResponse = {
      Data: {
        UserId: userId,
        Status: 'active',
        ReactivatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/admin/users/${userId}`,
      },
      Meta: {},
    };

    return helpers.success(
      reactivateResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error reactivating user:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while reactivating the user',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleReactivate,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
