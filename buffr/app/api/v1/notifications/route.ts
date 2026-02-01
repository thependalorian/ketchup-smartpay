/**
 * Open Banking API: /api/v1/notifications
 * 
 * Open Banking-compliant notifications endpoint
 * 
 * Features:
 * - Open Banking notification format
 * - Open Banking pagination
 * - Notification status management
 * - API versioning (v1)
 * 
 * Example requests:
 * GET /api/v1/notifications?page=1&page-size=25
 * GET /api/v1/notifications/{notificationId}
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/notifications
 * List notifications with Open Banking pagination
 */
async function handleGetNotifications(req: ExpoRequest) {
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

    // Parse Open Banking pagination parameters
    const { page, pageSize } = parsePaginationParams(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'read', 'unread', 'all'
    const type = searchParams.get('type');

    // Build query
    let queryText = `SELECT * FROM notifications WHERE user_id = $1`;
    const params: any[] = [actualUserId];

    if (status === 'read') {
      queryText += ` AND read_at IS NOT NULL`;
    } else if (status === 'unread') {
      queryText += ` AND read_at IS NULL`;
    }

    if (type) {
      queryText += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    // Get total count for pagination
    const countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);

    // Fetch notifications
    const notifications = await query<any>(queryText, params);

    // Format notifications as Open Banking format
    const formattedNotifications = notifications.map((notif: any) => ({
      NotificationId: notif.id,
      UserId: notif.user_id,
      Type: notif.type,
      Title: notif.title,
      Body: notif.body,
      Status: notif.read_at ? 'Read' : 'Unread',
      ReadAt: notif.read_at ? notif.read_at.toISOString() : null,
      Data: notif.data || {},
      CreatedDateTime: notif.created_at,
      UpdatedDateTime: notif.updated_at,
    }));

    // Get base URL for pagination links
    const baseUrl = new URL(req.url).origin + '/api/v1/notifications';
    
    // Build query params for pagination links
    const queryParams: Record<string, string> = {};
    if (status) queryParams.status = status;
    if (type) queryParams.type = type;

    // Return Open Banking paginated response
    return helpers.paginated(
      formattedNotifications,
      'Notification',
      baseUrl,
      page,
      pageSize,
      total,
      req,
      queryParams,
      undefined,
      new Date().toISOString(),
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching notifications:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching notifications',
      500
    );
  }
}

/**
 * GET /api/v1/notifications/{notificationId}
 * Get single notification
 */
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
      Status: notif.read_at ? 'Read' : 'Unread',
      ReadAt: notif.read_at ? notif.read_at.toISOString() : new Date().toISOString(),
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

// Export handlers with Open Banking middleware
export const GET = openBankingSecureRoute(
  handleGetNotifications,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

// Note: For dynamic routes like /api/v1/notifications/[id], create separate file
// app/api/v1/notifications/[notificationId]/route.ts
