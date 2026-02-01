/**
 * Open Banking API: /api/v1/users/me
 * 
 * Get current user profile (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetUserProfile(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Fetch user profile
    const users = await query<any>(
      `SELECT 
        id, phone_number, first_name, last_name, email,
        is_two_factor_enabled, created_at, updated_at
       FROM users WHERE id = $1`,
      [actualUserId]
    );

    if (users.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const user = users[0];

    // Format as Open Banking user profile
    const userProfile = {
      Data: {
        UserId: user.id,
        PhoneNumber: user.phone_number,
        Email: user.email,
        FirstName: user.first_name,
        LastName: user.last_name,
        FullName: `${user.first_name} ${user.last_name}`,
        IsTwoFactorEnabled: user.is_two_factor_enabled,
        CreatedDateTime: user.created_at,
        UpdatedDateTime: user.updated_at,
      },
      Links: {
        Self: '/api/v1/users/me',
      },
      Meta: {},
    };

    return helpers.success(
      userProfile,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching user profile:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching user profile',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetUserProfile,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
