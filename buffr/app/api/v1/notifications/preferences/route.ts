/**
 * Open Banking API: /api/v1/notifications/preferences
 * 
 * Notification preferences management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

const DEFAULT_PREFERENCES = {
  TransactionsEnabled: true,
  SecurityEnabled: true,
  PromotionsEnabled: true,
  RemindersEnabled: true,
  QuietHoursStart: null,
  QuietHoursEnd: null,
};

/**
 * GET /api/v1/notifications/preferences
 * Get user's notification preferences
 */
async function handleGetPreferences(req: ExpoRequest) {
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

    const result = await queryOne<any>(
      `SELECT 
         transactions_enabled as "transactionsEnabled",
         security_enabled as "securityEnabled",
         promotions_enabled as "promotionsEnabled",
         reminders_enabled as "remindersEnabled",
         quiet_hours_start as "quietHoursStart",
         quiet_hours_end as "quietHoursEnd"
       FROM notification_preferences
       WHERE user_id = $1`,
      [actualUserId]
    );

    const preferences = result || DEFAULT_PREFERENCES;

    const preferencesResponse = {
      Data: {
        UserId: actualUserId,
        TransactionsEnabled: preferences.transactionsEnabled ?? DEFAULT_PREFERENCES.TransactionsEnabled,
        SecurityEnabled: preferences.securityEnabled ?? DEFAULT_PREFERENCES.SecurityEnabled,
        PromotionsEnabled: preferences.promotionsEnabled ?? DEFAULT_PREFERENCES.PromotionsEnabled,
        RemindersEnabled: preferences.remindersEnabled ?? DEFAULT_PREFERENCES.RemindersEnabled,
        QuietHoursStart: preferences.quietHoursStart || null,
        QuietHoursEnd: preferences.quietHoursEnd || null,
        IsDefault: !result,
      },
      Links: {
        Self: '/api/v1/notifications/preferences',
      },
      Meta: {},
    };

    return helpers.success(
      preferencesResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching notification preferences:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching notification preferences',
      500
    );
  }
}

/**
 * PUT /api/v1/notifications/preferences
 * Update notification preferences
 */
async function handleUpdatePreferences(req: ExpoRequest) {
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

    const { TransactionsEnabled, SecurityEnabled, PromotionsEnabled, RemindersEnabled, QuietHoursStart, QuietHoursEnd } = Data;

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
        actualUserId,
        TransactionsEnabled ?? true,
        SecurityEnabled ?? true,
        PromotionsEnabled ?? true,
        RemindersEnabled ?? true,
        QuietHoursStart || null,
        QuietHoursEnd || null,
      ]
    );

    const preferencesResponse = {
      Data: {
        UserId: actualUserId,
        Message: 'Preferences updated successfully',
        UpdatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/notifications/preferences',
      },
      Meta: {},
    };

    return helpers.success(
      preferencesResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error updating notification preferences:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating notification preferences',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetPreferences,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdatePreferences,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
