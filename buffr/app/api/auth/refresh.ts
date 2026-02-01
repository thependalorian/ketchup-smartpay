/**
 * Token Refresh API Route
 * 
 * Location: app/api/auth/refresh.ts
 * Purpose: Refresh access token using JWT refresh token
 * 
 * POST /api/auth/refresh
 * Request body: { refresh_token: string }
 */

import { ExpoRequest } from 'expo-router/server';
import { verifyRefreshToken, generateAccessToken } from '@/utils/authServer';
import { query } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import logger from '@/utils/logger';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';

async function handleRefresh(request: ExpoRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return errorResponse('Refresh token is required', HttpStatus.BAD_REQUEST);
    }

    // Verify JWT refresh token
    const payload = verifyRefreshToken(refresh_token);
    
    if (!payload) {
      return errorResponse('Invalid or expired refresh token', HttpStatus.UNAUTHORIZED);
    }

    // Get user info for additional payload
    const users = await query<{ buffr_id?: string; phone_number?: string }>(
      `SELECT buffr_id, phone_number FROM users WHERE id = $1`,
      [payload.sub]
    );

    const user = users.length > 0 ? users[0] : null;

    // Generate new access token
    const newAccessToken = generateAccessToken(payload.sub, {
      buffrId: payload.buffrId || user?.buffr_id,
      phoneNumber: payload.phoneNumber || user?.phone_number,
    });
    
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    return successResponse({
      access_token: newAccessToken,
      expires_at: newExpiresAt.toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Token refresh error');
    return errorResponse(
      error instanceof Error ? error.message : 'Token refresh failed',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply security wrappers with auth rate limits
export const POST = secureAuthRoute(RATE_LIMITS.auth, handleRefresh);
