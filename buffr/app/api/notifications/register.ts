/**
 * Push Notification Token Registration API
 * 
 * Location: app/api/notifications/register.ts
 * Purpose: Register device push notification tokens
 * 
 * POST: Register or update a push token for a user
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { query, getUserIdFromRequest } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import logger, { log } from '@/utils/logger';

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function postHandler(request: ExpoRequest) {
  try {
    const body = await request.json();
    const { userId, token, platform, deviceId, deviceName } = body;

    const finalUserId = userId || await getUserIdFromRequest(request);

    if (!finalUserId) {
      return jsonResponse({ error: 'User ID required' }, 400);
    }

    if (!token) {
      return jsonResponse({ error: 'Push token required' }, 400);
    }

    if (!platform || !['ios', 'android', 'web'].includes(platform)) {
      return jsonResponse({ error: 'Valid platform required (ios, android, web)' }, 400);
    }

    // Check if token already exists for this user
    const existingResult = await query<any>(
      `SELECT id FROM push_tokens WHERE user_id = $1 AND token = $2`,
      [finalUserId, token]
    );

    if (existingResult.length > 0) {
      // Update existing token (refresh timestamp)
      await query(
        `UPDATE push_tokens 
         SET device_id = $3, device_name = $4, platform = $5, is_active = true, updated_at = NOW()
         WHERE user_id = $1 AND token = $2`,
        [finalUserId, token, deviceId || null, deviceName || null, platform]
      );

      logger.info(`Push token refreshed for user ${finalUserId}`);

      return jsonResponse({
        success: true,
        message: 'Push token refreshed',
        isNew: false,
      });
    }

    // Deactivate old tokens for this device (if device_id provided)
    if (deviceId) {
      await query(
        `UPDATE push_tokens SET is_active = false, updated_at = NOW()
         WHERE user_id = $1 AND device_id = $2 AND is_active = true`,
        [finalUserId, deviceId]
      );
    }

    // Insert new token
    const insertResult = await query<any>(
      `INSERT INTO push_tokens (user_id, token, platform, device_id, device_name, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id`,
      [finalUserId, token, platform, deviceId || null, deviceName || null]
    );

    logger.info(`New push token registered for user ${finalUserId}: ${platform}`);

    return jsonResponse({
      success: true,
      message: 'Push token registered',
      tokenId: insertResult[0]?.id,
      isNew: true,
    });

  } catch (error: any) {
    log.error('Error registering push token:', error);
    return jsonResponse(
      { error: error.message || 'Failed to register push token' },
      500
    );
  }
}

async function deleteHandler(request: ExpoRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const userId = url.searchParams.get('userId') || await getUserIdFromRequest(request);

    if (!userId) {
      return jsonResponse({ error: 'User ID required' }, 400);
    }

    if (token) {
      // Deactivate specific token
      await query(
        `UPDATE push_tokens SET is_active = false, updated_at = NOW()
         WHERE user_id = $1 AND token = $2`,
        [userId, token]
      );
    } else {
      // Deactivate all tokens for user
      await query(
        `UPDATE push_tokens SET is_active = false, updated_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );
    }

    return jsonResponse({
      success: true,
      message: token ? 'Push token deactivated' : 'All push tokens deactivated',
    });

  } catch (error: any) {
    log.error('Error deactivating push token:', error);
    return jsonResponse(
      { error: error.message || 'Failed to deactivate push token' },
      500
    );
  }
}

// Apply rate limiting and security headers
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);
