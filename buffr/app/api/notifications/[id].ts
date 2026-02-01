/**
 * Notification API Route (Single)
 * 
 * Location: app/api/notifications/[id].ts
 * Purpose: API endpoints for individual notifications
 * 
 * Endpoints:
 * - GET /api/notifications/[id] - Fetch a single notification
 * - PUT /api/notifications/[id] - Update notification (mark as read, etc.)
 * - DELETE /api/notifications/[id] - Delete a notification
 */

// Expo Router API route handler
import { ExpoRequest } from 'expo-router/server';

import { queryOne, query, getUserIdFromRequest } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, noContentResponse, HttpStatus } from '@/utils/apiResponse';
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

async function getHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { id } = params;

    // Fetch notification from Neon DB
    const notification = await queryOne<NotificationRow>(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!notification) {
      return errorResponse('Notification not found', HttpStatus.NOT_FOUND);
    }

    // Format response
    const formattedNotification = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.is_read,
      date: notification.created_at.toISOString(),
      actionUrl: notification.related_id ? `/${notification.type}/${notification.related_id}` : undefined,
      icon: getIconForType(notification.type),
      priority: getPriorityForType(notification.type),
    };

    return successResponse(formattedNotification);
  } catch (error: any) {
    log.error('Error fetching notification:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch notification',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function putHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { id } = params;
    const body = await req.json();
    const { action, isRead } = body; // 'read', 'unread', or direct isRead boolean

    // Fetch notification
    const notification = await queryOne<NotificationRow>(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!notification) {
      return errorResponse('Notification not found', HttpStatus.NOT_FOUND);
    }

    // Determine new read status
    let newReadStatus: boolean;
    if (typeof isRead === 'boolean') {
      newReadStatus = isRead;
    } else if (action === 'read') {
      newReadStatus = true;
    } else if (action === 'unread') {
      newReadStatus = false;
    } else {
      return errorResponse('Invalid action or isRead value. Use: action="read"/"unread" or isRead boolean', HttpStatus.BAD_REQUEST);
    }

    // Update notification in Neon DB
    const result = await query<NotificationRow>(
      'UPDATE notifications SET is_read = $1, read_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END WHERE id = $2 AND user_id = $3 RETURNING *',
      [newReadStatus, id, userId]
    );

    if (result.length === 0) {
      throw new Error('Failed to update notification');
    }

    const updated = result[0];

    // Format response
    const formattedNotification = {
      id: updated.id,
      type: updated.type,
      title: updated.title,
      message: updated.message,
      read: updated.is_read,
      date: updated.created_at.toISOString(),
      actionUrl: updated.related_id ? `/${updated.type}/${updated.related_id}` : undefined,
      icon: getIconForType(updated.type),
      priority: getPriorityForType(updated.type),
    };

    return successResponse(formattedNotification);
  } catch (error: any) {
    log.error('Error updating notification:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update notification',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function deleteHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { id } = params;

    // Delete notification from Neon DB
    const result = await query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.length === 0) {
      return errorResponse('Notification not found', HttpStatus.NOT_FOUND);
    }

    return noContentResponse();
  } catch (error: any) {
    log.error('Error deleting notification:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to delete notification',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);
