/**
 * Open Banking API: /api/v1/notifications/register
 * 
 * Push notification token registration (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * POST /api/v1/notifications/register
 * Register or update a push token
 */
async function handleRegister(req: ExpoRequest) {
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

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Token, Platform, DeviceId, DeviceName } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!Token) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Token is missing',
          'Data.Token'
        )
      );
    }

    if (!Platform) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Platform is missing',
          'Data.Platform'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    if (!['ios', 'android', 'web'].includes(Platform)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        'Valid platform required (ios, android, web)',
        400
      );
    }

    // Check if token already exists for this user
    const existingResult = await query<any>(
      `SELECT id FROM push_tokens WHERE user_id = $1 AND token = $2`,
      [actualUserId, Token]
    );

    if (existingResult.length > 0) {
      // Update existing token (refresh timestamp)
      await query(
        `UPDATE push_tokens 
         SET device_id = $3, device_name = $4, platform = $5, is_active = true, updated_at = NOW()
         WHERE user_id = $1 AND token = $2`,
        [actualUserId, Token, DeviceId || null, DeviceName || null, Platform]
      );

      const registerResponse = {
        Data: {
          UserId: actualUserId,
          Platform,
          Message: 'Push token refreshed',
          IsNew: false,
          UpdatedDateTime: new Date().toISOString(),
        },
        Links: {
          Self: '/api/v1/notifications/register',
        },
        Meta: {},
      };

      return helpers.success(
        registerResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    // Deactivate old tokens for this device (if device_id provided)
    if (DeviceId) {
      await query(
        `UPDATE push_tokens SET is_active = false, updated_at = NOW()
         WHERE user_id = $1 AND device_id = $2 AND is_active = true`,
        [actualUserId, DeviceId]
      );
    }

    // Insert new token
    const insertResult = await query<any>(
      `INSERT INTO push_tokens (id, user_id, token, platform, device_id, device_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id`,
      [randomUUID(), actualUserId, Token, Platform, DeviceId || null, DeviceName || null]
    );

    const registerResponse = {
      Data: {
        TokenId: insertResult[0]?.id,
        UserId: actualUserId,
        Platform,
        Message: 'Push token registered',
        IsNew: true,
        CreatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/notifications/register',
      },
      Meta: {},
    };

    return helpers.created(
      registerResponse,
      '/api/v1/notifications/register',
      context?.requestId
    );
  } catch (error) {
    log.error('Error registering push token:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while registering the push token',
      500
    );
  }
}

/**
 * DELETE /api/v1/notifications/register
 * Deactivate push token(s)
 */
async function handleUnregister(req: ExpoRequest) {
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

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (token) {
      // Deactivate specific token
      await query(
        `UPDATE push_tokens SET is_active = false, updated_at = NOW()
         WHERE user_id = $1 AND token = $2`,
        [actualUserId, token]
      );
    } else {
      // Deactivate all tokens for user
      await query(
        `UPDATE push_tokens SET is_active = false, updated_at = NOW()
         WHERE user_id = $1`,
        [actualUserId]
      );
    }

    return helpers.noContent(context?.requestId);
  } catch (error) {
    log.error('Error deactivating push token:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while deactivating the push token',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleRegister,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const DELETE = openBankingSecureRoute(
  handleUnregister,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
