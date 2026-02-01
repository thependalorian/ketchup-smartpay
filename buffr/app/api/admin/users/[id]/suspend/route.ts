/**
 * Suspend User API
 * 
 * Location: app/api/admin/users/[id]/suspend/route.ts
 * Purpose: Suspend a user account (admin only)
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import logger from '@/utils/logger';

/**
 * POST /api/admin/users/[id]/suspend
 * Suspend a user account
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
      'SELECT id, role FROM users WHERE id = $1 OR external_id = $1',
      [params.id]
    );

    if (!user) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Prevent suspending other admins (unless super-admin)
    const adminUser = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 OR external_id = $1',
      [adminUserId]
    );

    if (user.role && ['support', 'compliance', 'super-admin', 'admin', 'administrator'].includes(user.role)) {
      if (adminUser?.role !== 'super-admin' && adminUser?.role !== 'administrator') {
        return errorResponse('Only super-admins can suspend other admins', HttpStatus.FORBIDDEN);
      }
    }

    // Update user status to suspended
    await query(
      `UPDATE users
       SET status = 'suspended', updated_at = NOW()
       WHERE id = $1 OR external_id = $1`,
      [params.id]
    );

    // Log staff action
    await logStaffActionWithContext(
      request,
      {
        actionType: 'user_suspend',
        targetEntityType: 'user',
        targetEntityId: params.id,
        location: 'system',
        actionDetails: {
          target_user_id: params.id,
          reason: 'Admin action',
        },
        authorizationLevel: adminUser?.role || 'admin',
      },
      true
    ).catch(err => {
      logger.warn('[User Suspend] Staff action logging failed (non-critical)', err);
    });

    return successResponse({ user_id: params.id }, 'User suspended successfully');
  } catch (error: any) {
    logger.error('Error suspending user', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to suspend user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);

