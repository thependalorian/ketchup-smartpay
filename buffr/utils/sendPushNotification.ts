/**
 * Send Push Notification Helper
 * 
 * Location: utils/sendPushNotification.ts
 * Purpose: Helper function to send push notifications via backend API
 * 
 * This utility sends push notifications through the backend API endpoint
 * which handles Expo Push API integration and notification logging.
 */

import { apiPost } from '@/utils/apiClient';
import { log } from '@/utils/logger';

export interface SendPushNotificationOptions {
  /** User ID(s) to send notification to */
  userIds: string | string[];
  /** Notification title */
  title: string;
  /** Notification body/message */
  body: string;
  /** Additional data to include */
  data?: Record<string, any>;
  /** Sound setting (default: 'default') */
  sound?: 'default' | null;
  /** Priority level (default: 'high') */
  priority?: 'default' | 'normal' | 'high';
  /** Badge count */
  badge?: number;
  /** Android channel ID */
  channelId?: string;
  /** iOS category ID */
  categoryId?: string;
}

export interface SendPushNotificationResponse {
  success: boolean;
  message: string;
  sent: number;
  failed: number;
  errors?: Array<{
    message?: string;
    details?: Record<string, any>;
  }>;
}

/**
 * Send a push notification to one or more users
 */
export async function sendPushNotification(
  options: SendPushNotificationOptions
): Promise<SendPushNotificationResponse> {
  try {
    const userIds = Array.isArray(options.userIds) ? options.userIds : [options.userIds];
    
    const result = await apiPost<SendPushNotificationResponse>(
      '/notifications/send',
      {
        userIds,
        title: options.title,
        body: options.body,
        data: options.data || {},
        sound: options.sound || 'default',
        priority: options.priority || 'high',
        badge: options.badge,
        channelId: options.channelId,
        categoryId: options.categoryId,
      }
    );

    return result;
  } catch (error: any) {
    log.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send a transaction notification
 */
export async function sendTransactionNotification(
  userId: string,
  type: 'received' | 'sent' | 'pending',
  amount: string,
  counterparty: string,
  transactionId: string
): Promise<SendPushNotificationResponse> {
  const titles = {
    received: '💰 Money Received!',
    sent: '✓ Transfer Complete',
    pending: '⏳ Transfer Pending',
  };

  const bodies = {
    received: `You received ${amount} from ${counterparty}`,
    sent: `You sent ${amount} to ${counterparty}`,
    pending: `Your transfer of ${amount} to ${counterparty} is pending`,
  };

  return sendPushNotification({
    userIds: userId,
    title: titles[type],
    body: bodies[type],
    data: {
      type: 'transaction',
      transactionId,
    },
    categoryId: 'transaction',
    channelId: 'transactions',
    priority: type === 'pending' ? 'normal' : 'high',
  });
}

/**
 * Send a security alert notification
 */
export async function sendSecurityNotification(
  userId: string,
  alertType: 'login' | 'suspicious' | 'password_changed',
  details: string
): Promise<SendPushNotificationResponse> {
  const titles = {
    login: '🔐 New Login Detected',
    suspicious: '⚠️ Suspicious Activity',
    password_changed: '🔑 Password Changed',
  };

  return sendPushNotification({
    userIds: userId,
    title: titles[alertType],
    body: details,
    data: {
      type: 'security',
      alertType,
    },
    categoryId: 'security',
    channelId: 'security',
    priority: 'high',
  });
}

/**
 * Send an achievement notification
 */
export async function sendAchievementNotification(
  userId: string,
  achievementName: string,
  pointsEarned: number,
  achievementId: string
): Promise<SendPushNotificationResponse> {
  return sendPushNotification({
    userIds: userId,
    title: '🏆 Achievement Unlocked!',
    body: `${achievementName} - Earned ${pointsEarned} Buffr Points!`,
    data: {
      type: 'achievement',
      achievementId,
    },
    categoryId: 'achievement',
    channelId: 'gamification',
    priority: 'normal',
  });
}

/**
 * Send a quest completion notification
 */
export async function sendQuestNotification(
  userId: string,
  questName: string,
  pointsEarned: number,
  questId: string
): Promise<SendPushNotificationResponse> {
  return sendPushNotification({
    userIds: userId,
    title: '🎯 Quest Complete!',
    body: `${questName} - Claim ${pointsEarned} Buffr Points!`,
    data: {
      type: 'quest',
      questId,
    },
    categoryId: 'quest',
    channelId: 'gamification',
    priority: 'normal',
  });
}
