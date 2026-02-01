/**
 * Open Banking API: /api/v1/auth/refresh
 * 
 * Refresh access token (Open Banking format)
 * 
 * Request Body (Open Banking format):
 * {
 *   "Data": {
 *     "RefreshToken": "refresh-token-string"
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleRefresh(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data || !Data.RefreshToken) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.RefreshToken is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field RefreshToken is missing',
            'Data.RefreshToken'
          ),
        ]
      );
    }

    const { RefreshToken } = Data;

    // Verify refresh token
    const { verify } = await import('jsonwebtoken');
    let decoded: any;
    
    try {
      decoded = verify(RefreshToken, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
    } catch (error) {
      return helpers.error(
        OpenBankingErrorCode.TOKEN_INVALID,
        'Invalid or expired refresh token',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.TOKEN_INVALID,
            'The refresh token is invalid or has expired',
            'Data.RefreshToken'
          ),
        ]
      );
    }

    // Get user
    const users = await query<{
      id: string;
      phone_number: string;
      first_name: string;
      last_name: string;
    }>(
      'SELECT id, phone_number, first_name, last_name FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (users.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const user = users[0];

    // Generate new tokens
    const { sign } = await import('jsonwebtoken');
    const accessToken = sign(
      { userId: user.id, type: 'access' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    const newRefreshToken = sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );

    // Return Open Banking refresh response
    const refreshResponse = {
      Data: {
        AccessToken: accessToken,
        RefreshToken: newRefreshToken,
        TokenType: 'Bearer',
        ExpiresIn: 900, // 15 minutes
      },
      Links: {
        Self: '/api/v1/auth/refresh',
      },
      Meta: {},
    };

    return helpers.success(
      refreshResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error during token refresh:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred during token refresh',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleRefresh,
  {
    rateLimitConfig: RATE_LIMITS.auth,
    requireAuth: false,
    trackResponseTime: true,
  }
);
