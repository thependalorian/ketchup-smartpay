/**
 * Push Notification Send API
 *
 * Location: app/api/notifications/send.ts
 * Purpose: Send push notifications to users
 *
 * POST: Send a notification to one or more users
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import logger from '@/utils/logger';

function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), { 
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Expo Push Notification API endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface ExpoPushMessage {
  to: string;
  sound?: 'default' | null;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  ttl?: number;
  expiration?: number;
  priority?: 'default' | 'normal' | 'high';
  badge?: number;
  channelId?: string;
  categoryId?: string;
}

interface ExpoPushTicket {
  id?: string;
  status: 'ok' | 'error';
  message?: string;
  details?: Record<string, any>;
}

async function postHandler(request: ExpoRequest) {
  try {
    const body = await request.json();
    const { 
      userIds, 
      userId,
      title, 
      body: notificationBody, 
      data,
      sound = 'default',
      priority = 'high',
      badge,
      channelId,
      categoryId,
    } = body;

    // Support both single userId and array of userIds
    const targetUserIds = userIds || (userId ? [userId] : []);

    if (!targetUserIds.length) {
      return jsonResponse({ error: 'User ID(s) required' }, 400);
    }

    if (!title || !notificationBody) {
      return jsonResponse({ error: 'Title and body required' }, 400);
    }

    // Get active push tokens for target users
    const placeholders = targetUserIds.map((_: any, i: number) => `$${i + 1}`).join(', ');
    const tokensResult = await query<any>(
      `SELECT user_id, token, platform FROM push_tokens 
       WHERE user_id IN (${placeholders}) AND is_active = true`,
      targetUserIds
    );

    if (tokensResult.length === 0) {
      return jsonResponse({
        success: false,
        message: 'No active push tokens found for specified users',
        sent: 0,
        failed: 0,
      });
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokensResult.map((row: any) => ({
      to: row.token,
      sound: sound === 'default' ? 'default' : null,
      title,
      body: notificationBody,
      data: {
        ...data,
        userId: row.user_id,
      },
      priority,
      badge,
      channelId: channelId || (row.platform === 'android' ? 'default' : undefined),
      categoryId,
    }));

    // Send to Expo Push API (batch up to 100 at a time)
    const results: ExpoPushTicket[] = [];
    const batchSize = 100;

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`Expo Push API error: ${response.status}`);
      }

      const responseData = await response.json();
      results.push(...responseData.data);
    }

    // Process results
    const sent = results.filter(r => r.status === 'ok').length;
    const failed = results.filter(r => r.status === 'error').length;

    // Log notification
    await query(
      `INSERT INTO notification_logs (title, body, data, target_users, sent_count, failed_count)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, notificationBody, JSON.stringify(data || {}), JSON.stringify(targetUserIds), sent, failed]
    );

    // Handle errors (deactivate invalid tokens)
    const errors = results
      .map((r, i) => ({ ...r, token: messages[i].to }))
      .filter(r => r.status === 'error');

    for (const error of errors) {
      if (error.details?.error === 'DeviceNotRegistered') {
        await query(
          `UPDATE push_tokens SET is_active = false, updated_at = NOW()
           WHERE token = $1`,
          [error.token]
        );
        logger.info(`Deactivated invalid token: ${error.token}`);
      }
    }

    logger.info(`Push notifications sent: ${sent} success, ${failed} failed`);

    return jsonResponse({
      success: true,
      message: `Sent ${sent} notifications`,
      sent,
      failed,
      errors: errors.length > 0 ? errors.map(e => ({
        message: e.message,
        details: e.details,
      })) : undefined,
    });

  } catch (error: any) {
    logger.error('Error sending push notification', error);
    return jsonResponse(
      { error: error.message || 'Failed to send push notification' },
      500
    );
  }
}

// Get notification history for a user
async function getHandler(request: ExpoRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!userId) {
      return jsonResponse({ error: 'User ID required' }, 400);
    }

    const result = await query<any>(
      `SELECT id, title, body, data, created_at as "createdAt"
       FROM notification_logs
       WHERE $1 = ANY(target_users::text[])
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return jsonResponse({
      success: true,
      notifications: result,
      pagination: { limit, offset },
    });

  } catch (error: any) {
    logger.error('Error fetching notification history', error);
    return jsonResponse(
      { error: error.message || 'Failed to fetch notifications' },
      500
    );
  }
}

// Apply security wrappers with API rate limits
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
