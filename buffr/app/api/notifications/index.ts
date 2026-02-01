/**
 * Notifications API Route
 *
 * Location: app/api/notifications/index.ts
 * Purpose: API endpoints for notifications
 *
 * Endpoints:
 * - GET /api/notifications - Fetch all notifications (with optional filters)
 * - POST /api/notifications - Create a new notification (admin/system)
 */

// Expo Router API route handler
import { ExpoRequest } from 'expo-router/server';
import { query, getUserIdFromRequest } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_id: string | null;
  created_at: Date;
}

async function handleGetNotifications(req: ExpoRequest) {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Build query
    let queryText = 'SELECT * FROM notifications WHERE user_id = $1';
    const params: any[] = [userId];

    if (type && type !== 'all') {
      queryText += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    if (unreadOnly) {
      queryText += ` AND is_read = false`;
    }

    queryText += ' ORDER BY created_at DESC LIMIT 100';

    // Fetch notifications from Neon DB
    const notifications = await query<NotificationRow>(queryText, params);

    // Format response
    const formattedNotifications = notifications.map(notif => ({
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.is_read,
      date: notif.created_at.toISOString(),
      actionUrl: notif.related_id ? `/${notif.type}/${notif.related_id}` : undefined,
      icon: getIconForType(notif.type),
      priority: getPriorityForType(notif.type),
    }));

    return successResponse(formattedNotifications);
  } catch (error: any) {
    log.error('Error fetching notifications:', error);
    return errorResponse(error.message || 'Failed to fetch notifications', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

async function handleCreateNotification(req: ExpoRequest) {
  try {
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const { type, title, message, relatedId, priority } = body;

    if (!title || !message) {
      return errorResponse('Title and message are required', HttpStatus.BAD_REQUEST);
    }

    // Create notification in Neon DB
    const result = await query<NotificationRow>(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        type || 'system',
        title,
        message,
        relatedId || null,
      ]
    );

    if (result.length === 0) {
      throw new Error('Failed to create notification');
    }

    const notif = result[0];

    const newNotification = {
      id: notif.id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.is_read,
      date: notif.created_at.toISOString(),
      actionUrl: notif.related_id ? `/${notif.type}/${notif.related_id}` : undefined,
      icon: getIconForType(notif.type),
      priority: priority || getPriorityForType(notif.type),
    };

    return successResponse(newNotification);
  } catch (error: any) {
    log.error('Error creating notification:', error);
    return errorResponse(error.message || 'Failed to create notification', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Helper functions
function getIconForType(type: string): string {
  const iconMap: Record<string, string> = {
    transaction: 'check-circle',
    request: 'hand-paper-o',
    group: 'users',
    system: 'info-circle',
    security: 'shield',
    loan: 'money',
    payment: 'credit-card',
  };
  return iconMap[type] || 'bell';
}

function getPriorityForType(type: string): string {
  const priorityMap: Record<string, string> = {
    transaction: 'normal',
    request: 'high',
    group: 'normal',
    system: 'low',
    security: 'high',
    loan: 'high',
    payment: 'high',
  };
  return priorityMap[type] || 'normal';
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, handleGetNotifications);
export const POST = secureAuthRoute(RATE_LIMITS.api, handleCreateNotification);
