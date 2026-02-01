/**
 * Notification Preferences API
 * 
 * Location: app/api/notifications/preferences.ts
 * Purpose: Manage user notification preferences
 * 
 * GET: Get user's notification preferences
 * PUT: Update notification preferences
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

interface NotificationPreferences {
  transactionsEnabled: boolean;
  securityEnabled: boolean;
  promotionsEnabled: boolean;
  remindersEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  transactionsEnabled: true,
  securityEnabled: true,
  promotionsEnabled: true,
  remindersEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

async function getHandler(request: ExpoRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || await getUserIdFromRequest(request);

    if (!userId) {
      return jsonResponse({ error: 'User ID required' }, 400);
    }

    const result = await query<any>(
      `SELECT 
         transactions_enabled as "transactionsEnabled",
         security_enabled as "securityEnabled",
         promotions_enabled as "promotionsEnabled",
         reminders_enabled as "remindersEnabled",
         quiet_hours_start as "quietHoursStart",
         quiet_hours_end as "quietHoursEnd"
       FROM notification_preferences
       WHERE user_id = $1`,
      [userId]
    );

    if (result.length === 0) {
      // Return defaults if no preferences exist
      return jsonResponse({
        success: true,
        preferences: DEFAULT_PREFERENCES,
        isDefault: true,
      });
    }

    return jsonResponse({
      success: true,
      preferences: result[0],
      isDefault: false,
    });

  } catch (error: any) {
    log.error('Error fetching notification preferences:', error);
    return jsonResponse(
      { error: error.message || 'Failed to fetch preferences' },
      500
    );
  }
}

async function putHandler(request: ExpoRequest) {
  try {
    const body = await request.json();
    const { userId, ...preferences } = body;

    const finalUserId = userId || await getUserIdFromRequest(request);

    if (!finalUserId) {
      return jsonResponse({ error: 'User ID required' }, 400);
    }

    // Upsert preferences
    await query(
      `INSERT INTO notification_preferences (
         user_id,
         transactions_enabled,
         security_enabled,
         promotions_enabled,
         reminders_enabled,
         quiet_hours_start,
         quiet_hours_end
       ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         transactions_enabled = COALESCE($2, notification_preferences.transactions_enabled),
         security_enabled = COALESCE($3, notification_preferences.security_enabled),
         promotions_enabled = COALESCE($4, notification_preferences.promotions_enabled),
         reminders_enabled = COALESCE($5, notification_preferences.reminders_enabled),
         quiet_hours_start = $6,
         quiet_hours_end = $7,
         updated_at = NOW()`,
      [
        finalUserId,
        preferences.transactionsEnabled ?? true,
        preferences.securityEnabled ?? true,
        preferences.promotionsEnabled ?? true,
        preferences.remindersEnabled ?? true,
        preferences.quietHoursStart || null,
        preferences.quietHoursEnd || null,
      ]
    );

    logger.info(`Notification preferences updated for user ${finalUserId}`);

    return jsonResponse({
      success: true,
      message: 'Preferences updated',
    });

  } catch (error: any) {
    log.error('Error updating notification preferences:', error);
    return jsonResponse(
      { error: error.message || 'Failed to update preferences' },
      500
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
