/**
 * Reactivate User API
 * 
 * Location: app/api/admin/users/[id]/reactivate/route.ts
 * Purpose: Reactivate a suspended user account (admin only)
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import logger from '@/utils/logger';

/**
 * POST /api/admin/users/[id]/reactivate
 * Reactivate a suspended user account
 */
async function postHandler(
  request: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper
    const adminUserId = await getUserIdFromRequest(request);

    // Check if user exists
    const user = await queryOne<any>(
      'SELECT id FROM users WHERE id = $1 OR external_id = $1',
      [params.id]
    );

    if (!user) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Update user status to active
    await query(
      `UPDATE users
       SET status = 'active', updated_at = NOW()
       WHERE id = $1 OR external_id = $1`,
      [params.id]
    );

    // Get admin user role for authorization level
    const adminUser = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 OR external_id = $1',
      [adminUserId]
    );

    // Log staff action
    await logStaffActionWithContext(
      request,
      {
        actionType: 'user_reactivate',
        targetEntityType: 'user',
        targetEntityId: params.id,
        location: 'system',
        actionDetails: {
          target_user_id: params.id,
        },
        authorizationLevel: adminUser?.role || 'admin',
      },
      true
    ).catch(err => {
      logger.warn('[User Reactivate] Staff action logging failed (non-critical)', err);
    });

    return successResponse({ user_id: params.id }, 'User reactivated successfully');
  } catch (error: any) {
    logger.error('Error reactivating user', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to reactivate user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);

