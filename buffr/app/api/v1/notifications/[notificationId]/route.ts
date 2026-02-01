/**
 * Open Banking API: /api/v1/notifications/{notificationId}
 * 
 * Get single notification (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetNotification(
  req: ExpoRequest,
  { params }: { params: { notificationId: string } }
) {
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
    const { notificationId } = params;

    // Fetch notification
    const notifications = await query<any>(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, actualUserId]
    );

    if (notifications.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Notification with ID '${notificationId}' not found`,
        404
      );
    }

    const notif = notifications[0];

    // Mark as read if not already read
    if (!notif.read_at) {
      await query(
        'UPDATE notifications SET read_at = NOW() WHERE id = $1',
        [notificationId]
      );
    }

    // Format notification as Open Banking format
    const notification = {
      NotificationId: notif.id,
      UserId: notif.user_id,
      Type: notif.type,
      Title: notif.title,
      Body: notif.body,
      Status: 'Read', // Marked as read
      ReadAt: new Date().toISOString(),
      Data: notif.data || {},
      CreatedDateTime: notif.created_at,
      UpdatedDateTime: notif.updated_at,
    };

    return helpers.success(
      { Notification: [notification] },
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching notification:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the notification',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetNotification,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
