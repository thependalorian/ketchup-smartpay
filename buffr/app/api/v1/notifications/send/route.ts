/**
 * Open Banking API: /api/v1/notifications/send
 * 
 * Send push notifications (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

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

/**
 * POST /api/v1/notifications/send
 * Send a notification to one or more users
 */
async function handleSend(req: ExpoRequest) {
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

    const { UserIds, UserId, Title, Body, Data: NotificationData, Sound, Priority, Badge, ChannelId, CategoryId } = Data;

    // Support both single UserId and array of UserIds
    const targetUserIds = UserIds || (UserId ? [UserId] : []);

    if (targetUserIds.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.UserIds or Data.UserId is required',
        400
      );
    }

    if (!Title || !Body) {
      const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];
      if (!Title) {
        errors.push(
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Title is missing',
            'Data.Title'
          )
        );
      }
      if (!Body) {
        errors.push(
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Body is missing',
            'Data.Body'
          )
        );
      }
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Title and Body are required',
        400,
        errors
      );
    }

    // Get active push tokens for target users
    const placeholders = targetUserIds.map((_: any, i: number) => `$${i + 1}`).join(', ');
    const tokensResult = await query<any>(
      `SELECT user_id, token, platform FROM push_tokens 
       WHERE user_id IN (${placeholders}) AND is_active = true`,
      targetUserIds
    );

    if (tokensResult.length === 0) {
      const sendResponse = {
        Data: {
          Message: 'No active push tokens found for specified users',
          Sent: 0,
          Failed: 0,
        },
        Links: {
          Self: '/api/v1/notifications/send',
        },
        Meta: {},
      };

      return helpers.success(
        sendResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    // Build Expo push messages
    const messages: ExpoPushMessage[] = tokensResult.map((row: any) => ({
      to: row.token,
      sound: Sound === 'default' ? 'default' : null,
      title: Title,
      body: Body,
      data: {
        ...NotificationData,
        userId: row.user_id,
      },
      priority: Priority || 'high',
      badge: Badge,
      channelId: ChannelId || (row.platform === 'android' ? 'default' : undefined),
      categoryId: CategoryId,
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
      [Title, Body, JSON.stringify(NotificationData || {}), JSON.stringify(targetUserIds), sent, failed]
    ).catch(err => log.error('Failed to log notification:', err));

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
        ).catch(err => log.error('Failed to deactivate token:', err));
      }
    }

    const sendResponse = {
      Data: {
        Message: `Sent ${sent} notifications`,
        Sent: sent,
        Failed: failed,
        Errors: errors.length > 0 ? errors.map((e: any) => ({
          Message: e.message,
          Details: e.details,
        })) : null,
      },
      Links: {
        Self: '/api/v1/notifications/send',
      },
      Meta: {},
    };

    return helpers.success(
      sendResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error sending push notification:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while sending the notification',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleSend,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
