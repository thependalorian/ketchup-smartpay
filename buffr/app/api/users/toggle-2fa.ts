/**
 * API Route: /api/users/toggle-2fa
 *
 * - POST: Enables or disables two-factor authentication for the user.
 */
import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { enabled } = await req.json();

    if (typeof enabled !== 'boolean') {
      return errorResponse('Invalid request: enabled must be a boolean', HttpStatus.BAD_REQUEST);
    }

    // Update user's 2FA status in Neon DB
    const result = await query(
      'UPDATE users SET is_two_factor_enabled = $1 WHERE id = $2 RETURNING id, is_two_factor_enabled',
      [enabled, userId]
    );

    if (result.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    return successResponse(
      { isTwoFactorEnabled: enabled },
      `Two-factor authentication has been ${enabled ? 'enabled' : 'disabled'}.`
    );
  } catch (error) {
    log.error('Error toggling 2FA:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update 2FA status',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply security wrappers with API rate limits
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
