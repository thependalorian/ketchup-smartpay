/**
 * Push Notifications Utility
 * 
 * Location: utils/pushNotifications.ts
 * Purpose: Handle push notification registration, permissions, and sending
 * 
 * Uses expo-notifications for cross-platform push notification support
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiPost } from '@/utils/apiClient';
import logger, { log } from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface PushNotificationToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean | string;
  badge?: number;
  categoryId?: string;
}

export interface NotificationResponse {
  notification: Notifications.Notification;
  actionIdentifier: string;
}

export type NotificationCategory = 
  | 'transaction' 
  | 'security' 
  | 'promotion' 
  | 'reminder' 
  | 'achievement'
  | 'quest'
  | 'learning'
  | 'general';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Notification categories for action buttons
export const NOTIFICATION_CATEGORIES: Notifications.NotificationCategory[] = [
  {
    identifier: 'transaction',
    actions: [
      {
        identifier: 'view',
        buttonTitle: 'View Details',
        options: { opensAppToForeground: true },
      },
    ],
  },
  {
    identifier: 'security',
    actions: [
      {
        identifier: 'verify',
        buttonTitle: 'Verify Now',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'report',
        buttonTitle: 'Report Fraud',
        options: { opensAppToForeground: true, isDestructive: true },
      },
    ],
  },
  {
    identifier: 'achievement',
    actions: [
      {
        identifier: 'view',
        buttonTitle: 'View Achievement',
        options: { opensAppToForeground: true },
      },
    ],
  },
  {
    identifier: 'quest',
    actions: [
      {
        identifier: 'start',
        buttonTitle: 'Start Quest',
        options: { opensAppToForeground: true },
      },
    ],
  },
  {
    identifier: 'learning',
    actions: [
      {
        identifier: 'continue',
        buttonTitle: 'Continue Learning',
        options: { opensAppToForeground: true },
      },
    ],
  },
];

// ============================================================================
// PERMISSION HANDLING
// ============================================================================

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    logger.info('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.info('Notification permission not granted');
    return false;
  }

  return true;
}

/**
 * Check current notification permission status
 */
export async function checkNotificationPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
  return await Notifications.getPermissionsAsync();
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get the Expo push token for this device
 */
export async function getExpoPushToken(): Promise<PushNotificationToken | null> {
  if (!Device.isDevice) {
    logger.info('Push notifications require a physical device');
    return null;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    return null;
  }

  try {
    // Get project ID from expo config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    
    if (!projectId) {
      log.error('Project ID not found in expo config');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1A3A5C',
      });

      await Notifications.setNotificationChannelAsync('transactions', {
        name: 'Transactions',
        description: 'Transaction notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });

      await Notifications.setNotificationChannelAsync('security', {
        name: 'Security Alerts',
        description: 'Security and fraud alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#F44336',
      });

      await Notifications.setNotificationChannelAsync('gamification', {
        name: 'Achievements & Rewards',
        description: 'Achievement and reward notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#FFD700',
      });
    }

    return {
      token: tokenData.data,
      platform: Platform.OS as 'ios' | 'android',
      deviceId: Device.deviceName || undefined,
    };
  } catch (error) {
    log.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Register push token with backend
 */
export async function registerPushToken(
  userId: string,
  token: PushNotificationToken
): Promise<boolean> {
  try {
    const result = await apiPost<{ success: boolean; message: string; isNew?: boolean; tokenId?: string }>(
      '/notifications/register',
      {
        userId,
        token: token.token,
        platform: token.platform,
        deviceId: token.deviceId || Device.modelId || undefined,
        deviceName: Device.deviceName || Device.modelName || undefined,
      }
    );

    if (result.success) {
      logger.info('Push token registered:', { status: result.isNew ? 'New token' : 'Token refreshed' });
      return true;
    }

    return false;
  } catch (error: any) {
    log.error('Error registering push token:', error);
    return false;
  }
}

// ============================================================================
// LOCAL NOTIFICATIONS
// ============================================================================

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  payload: NotificationPayload,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const content: Notifications.NotificationContentInput = {
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    sound: payload.sound !== false ? 'default' : undefined,
    badge: payload.badge,
    categoryIdentifier: payload.categoryId,
  };

  return await Notifications.scheduleNotificationAsync({
    content,
    trigger: trigger || null, // null = immediate
  });
}

/**
 * Schedule a notification for a specific time
 */
export async function scheduleNotificationAtTime(
  payload: NotificationPayload,
  date: Date
): Promise<string> {
  return await scheduleLocalNotification(payload, {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
  });
}

/**
 * Schedule a daily notification at a specific time
 */
export async function scheduleDailyNotification(
  payload: NotificationPayload,
  hour: number,
  minute: number
): Promise<string> {
  return await scheduleLocalNotification(payload, {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    hour,
    minute,
    repeats: true,
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// ============================================================================
// BADGE MANAGEMENT
// ============================================================================

/**
 * Set the app badge number
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Get the current badge count
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Clear the badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ============================================================================
// NOTIFICATION LISTENERS
// ============================================================================

/**
 * Add listener for notifications received while app is in foreground
 */
export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(listener);
}

/**
 * Add listener for notification response (user tapped notification)
 */
export function addNotificationResponseListener(
  listener: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

/**
 * Get the last notification response (if app was opened via notification)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return await Notifications.getLastNotificationResponseAsync();
}

// ============================================================================
// NOTIFICATION CATEGORY SETUP
// ============================================================================

/**
 * Set up notification categories with action buttons
 */
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('transaction', [
    {
      identifier: 'view',
      buttonTitle: 'View Details',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('security', [
    {
      identifier: 'verify',
      buttonTitle: 'Verify Now',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'report',
      buttonTitle: 'Report Fraud',
      options: { opensAppToForeground: true, isDestructive: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('achievement', [
    {
      identifier: 'view',
      buttonTitle: 'View Achievement',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('quest', [
    {
      identifier: 'start',
      buttonTitle: 'Start Quest',
      options: { opensAppToForeground: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('learning', [
    {
      identifier: 'continue',
      buttonTitle: 'Continue Learning',
      options: { opensAppToForeground: true },
    },
  ]);
}

// ============================================================================
// PREDEFINED NOTIFICATIONS
// ============================================================================

/**
 * Send a transaction notification
 */
export async function notifyTransaction(
  type: 'received' | 'sent' | 'pending',
  amount: string,
  counterparty: string,
  transactionId: string
): Promise<string> {
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

  return await scheduleLocalNotification({
    title: titles[type],
    body: bodies[type],
    data: { type: 'transaction', transactionId },
    categoryId: 'transaction',
  });
}

/**
 * Send a security alert notification
 */
export async function notifySecurityAlert(
  alertType: 'login' | 'suspicious' | 'password_changed',
  details: string
): Promise<string> {
  const titles = {
    login: '🔐 New Login Detected',
    suspicious: '⚠️ Suspicious Activity',
    password_changed: '🔑 Password Changed',
  };

  return await scheduleLocalNotification({
    title: titles[alertType],
    body: details,
    data: { type: 'security', alertType },
    categoryId: 'security',
  });
}

/**
 * Send an achievement unlocked notification
 */
export async function notifyAchievement(
  achievementName: string,
  pointsEarned: number,
  achievementId: string
): Promise<string> {
  return await scheduleLocalNotification({
    title: '🏆 Achievement Unlocked!',
    body: `${achievementName} - Earned ${pointsEarned} Buffr Points!`,
    data: { type: 'achievement', achievementId },
    categoryId: 'achievement',
  });
}

/**
 * Send a quest completion notification
 */
export async function notifyQuestComplete(
  questName: string,
  pointsEarned: number,
  questId: string
): Promise<string> {
  return await scheduleLocalNotification({
    title: '🎯 Quest Complete!',
    body: `${questName} - Claim ${pointsEarned} Buffr Points!`,
    data: { type: 'quest', questId },
    categoryId: 'quest',
  });
}

/**
 * Send a daily reminder notification
 */
export async function scheduleDailyReminder(
  hour: number = 9,
  minute: number = 0
): Promise<string> {
  return await scheduleDailyNotification(
    {
      title: '📱 Check Your Finances',
      body: 'Complete your daily quest and earn Buffr Points!',
      data: { type: 'reminder' },
    },
    hour,
    minute
  );
}

/**
 * Send a learning reminder notification
 */
export async function notifyLearningReminder(
  moduleName: string,
  progress: number
): Promise<string> {
  return await scheduleLocalNotification({
    title: '📚 Continue Learning',
    body: `You're ${progress}% through "${moduleName}". Keep going!`,
    data: { type: 'learning' },
    categoryId: 'learning',
  });
}

// ============================================================================
// GAMIFICATION NOTIFICATIONS
// ============================================================================

/**
 * Schedule a streak reminder notification
 * Reminds users to maintain their streak at 6 PM if they haven't used the app
 */
export async function scheduleStreakReminder(
  currentStreak: number
): Promise<string> {
  // Cancel any existing streak reminders first
  const scheduled = await getScheduledNotifications();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'streak_reminder') {
      await cancelScheduledNotification(notification.identifier);
    }
  }

  return await scheduleDailyNotification(
    {
      title: '🔥 Keep Your Streak Going!',
      body: `Don't break your ${currentStreak} day streak! Open Buffr now.`,
      data: { type: 'streak_reminder', currentStreak },
    },
    18, // 6 PM
    0
  );
}

/**
 * Cancel streak reminder (call when user opens app)
 */
export async function cancelStreakReminder(): Promise<void> {
  const scheduled = await getScheduledNotifications();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'streak_reminder') {
      await cancelScheduledNotification(notification.identifier);
    }
  }
}

/**
 * Send a level up notification
 */
export async function notifyLevelUp(
  newLevel: number,
  levelName: string
): Promise<string> {
  return await scheduleLocalNotification({
    title: '🎉 Level Up!',
    body: `Congratulations! You reached Level ${newLevel} - ${levelName}!`,
    data: { type: 'level_up', level: newLevel },
    categoryId: 'achievement',
  });
}

/**
 * Send a quest expiring notification
 * Scheduled 2 hours before deadline
 */
export async function scheduleQuestExpiringNotification(
  questName: string,
  questId: string,
  expiresAt: Date
): Promise<string | null> {
  const twoHoursBefore = new Date(expiresAt.getTime() - 2 * 60 * 60 * 1000);

  // Only schedule if expiry is in the future
  if (twoHoursBefore <= new Date()) {
    return null;
  }

  return await scheduleNotificationAtTime(
    {
      title: '⏰ Quest Ending Soon!',
      body: `"${questName}" expires in 2 hours. Complete it now!`,
      data: { type: 'quest_expiring', questId },
      categoryId: 'quest',
    },
    twoHoursBefore
  );
}

/**
 * Send a weekly summary notification (Sunday 10 AM)
 */
export async function scheduleWeeklySummary(): Promise<string> {
  // Cancel any existing weekly summary reminders
  const scheduled = await getScheduledNotifications();
  for (const notification of scheduled) {
    if (notification.content.data?.type === 'weekly_summary') {
      await cancelScheduledNotification(notification.identifier);
    }
  }

  return await scheduleLocalNotification(
    {
      title: '📊 Your Weekly Summary',
      body: 'Check out how many points you earned this week!',
      data: { type: 'weekly_summary' },
    },
    {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday (1-7, where 1 is Sunday)
      hour: 10,
      minute: 0,
      repeats: true,
    }
  );
}

/**
 * Send points earned notification (batched, not every transaction)
 */
export async function notifyPointsEarned(
  points: number,
  source: string
): Promise<string> {
  const sourceLabels: Record<string, string> = {
    transaction: 'payment',
    qr_payment: 'QR payment',
    quest: 'quest completion',
    achievement: 'achievement unlock',
    streak: 'streak bonus',
    referral: 'referral',
  };

  const sourceLabel = sourceLabels[source] || source;

  return await scheduleLocalNotification({
    title: '⭐ Points Earned!',
    body: `You earned ${points.toLocaleString()} Buffr Points from ${sourceLabel}!`,
    data: { type: 'points_earned', points, source },
  });
}

/**
 * Send new reward available notification
 */
export async function notifyNewRewardAvailable(
  rewardName: string,
  pointsCost: number
): Promise<string> {
  return await scheduleLocalNotification({
    title: '🎁 New Reward Available!',
    body: `"${rewardName}" is now available for ${pointsCost.toLocaleString()} BP`,
    data: { type: 'new_reward', rewardName, pointsCost },
  });
}

/**
 * Send milestone reached notification
 */
export async function notifyMilestone(
  milestoneName: string,
  description: string
): Promise<string> {
  return await scheduleLocalNotification({
    title: '🌟 Milestone Reached!',
    body: `${milestoneName}: ${description}`,
    data: { type: 'milestone', milestoneName },
    categoryId: 'achievement',
  });
}
