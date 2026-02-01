/**
 * Push Notifications Hook
 * 
 * Location: hooks/usePushNotifications.ts
 * Purpose: React hook for managing push notifications
 * 
 * Features:
 * - Automatic permission request
 * - Token registration
 * - Notification listeners
 * - Deep linking handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useUser } from '@/contexts/UserContext';
import logger, { log } from '@/utils/logger';
import {
  getExpoPushToken,
  registerPushToken,
  requestNotificationPermissions,
  checkNotificationPermissions,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
  setupNotificationCategories,
  scheduleLocalNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  clearBadge,
  PushNotificationToken,
  NotificationPayload,
} from '@/utils/pushNotifications';

// ============================================================================
// TYPES
// ============================================================================

export interface UsePushNotificationsResult {
  /** Current push token */
  pushToken: string | null;
  /** Whether permission is granted */
  hasPermission: boolean;
  /** Whether the hook is initializing */
  isLoading: boolean;
  /** Any error that occurred */
  error: string | null;
  /** Last received notification */
  lastNotification: Notifications.Notification | null;
  /** Request notification permissions */
  requestPermissions: () => Promise<boolean>;
  /** Schedule a local notification */
  scheduleNotification: (payload: NotificationPayload, trigger?: Notifications.NotificationTriggerInput) => Promise<string>;
  /** Cancel a scheduled notification */
  cancelNotification: (id: string) => Promise<void>;
  /** Cancel all notifications */
  cancelAllNotifications: () => Promise<void>;
  /** Clear badge count */
  clearBadgeCount: () => Promise<void>;
}

// ============================================================================
// DEEP LINK ROUTING
// ============================================================================

/**
 * Get the route to navigate to based on notification data
 */
function getRouteFromNotification(data: Record<string, any>): string | null {
  const type = data?.type;
  
  switch (type) {
    case 'transaction':
      return data.transactionId 
        ? `/transactions/${data.transactionId}` 
        : '/transactions';
    
    case 'security':
      return '/settings/security';
    
    
    case 'promotion':
      return data.promotionId 
        ? `/promotions/${data.promotionId}` 
        : '/utilities';
    
    case 'reminder':
      return '/';
    
    default:
      return null;
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function usePushNotifications(): UsePushNotificationsResult {
  const router = useRouter();
  const { user } = useUser();
  
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  // Initialize notifications
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Setup notification categories (for action buttons)
        await setupNotificationCategories();

        // Check existing permissions
        const permissionStatus = await checkNotificationPermissions();
        const granted = permissionStatus.status === 'granted';
        setHasPermission(granted);

        if (granted) {
          // Get push token
          const tokenData = await getExpoPushToken();
          if (tokenData) {
            setPushToken(tokenData.token);
            
            // Register with backend if user is logged in
            if (user?.id) {
              await registerPushToken(user.id, tokenData);
            }
          }
        }

        // Check if app was opened via notification
        const lastResponse = await getLastNotificationResponse();
        if (lastResponse) {
          handleNotificationResponse(lastResponse);
        }
      } catch (err: any) {
        log.error('Error initializing notifications:', err);
        setError(err.message || 'Failed to initialize notifications');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [user?.id]);

  // Handle notification response (user tapped notification)
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    const route = getRouteFromNotification(data);
    
    if (route) {
      // Navigate to the appropriate screen
      router.push(route as any);
    }

    // Handle action buttons
    const actionId = response.actionIdentifier;
    if (actionId && actionId !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
      logger.info('Notification action:', { actionId, data });
      // Handle specific actions
      switch (actionId) {
        case 'verify':
          router.push('/settings/security' as any);
          break;
        case 'report':
          router.push('/support' as any);
          break;
        case 'view':
          // Already handled by getRouteFromNotification
          break;
        case 'start':
        case 'continue':
          // Already handled by getRouteFromNotification
          break;
      }
    }
  }, [router]);

  // Set up notification listeners
  useEffect(() => {
    // Foreground notification listener
    notificationListener.current = addNotificationReceivedListener((notification) => {
      logger.info('Notification received:', { notification });
      setLastNotification(notification);
    });

    // Response listener (user tapped notification)
    responseListener.current = addNotificationResponseListener(handleNotificationResponse);

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationResponse]);

  // Re-register token when user changes
  useEffect(() => {
    const registerToken = async () => {
      if (user?.id && pushToken) {
        await registerPushToken(user.id, {
          token: pushToken,
          platform: 'ios', // Will be determined by getExpoPushToken
        });
      }
    };

    registerToken();
  }, [user?.id, pushToken]);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestNotificationPermissions();
      setHasPermission(granted);

      if (granted) {
        const tokenData = await getExpoPushToken();
        if (tokenData) {
          setPushToken(tokenData.token);
          
          if (user?.id) {
            await registerPushToken(user.id, tokenData);
          }
        }
      }

      return granted;
    } catch (err: any) {
      log.error('Error requesting permissions:', err);
      setError(err.message || 'Failed to request permissions');
      return false;
    }
  }, [user?.id]);

  // Schedule notification wrapper
  const scheduleNotification = useCallback(async (
    payload: NotificationPayload,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    return await scheduleLocalNotification(payload, trigger);
  }, []);

  // Cancel notification wrapper
  const cancelNotification = useCallback(async (id: string): Promise<void> => {
    await cancelScheduledNotification(id);
  }, []);

  // Cancel all notifications wrapper
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    await cancelAllScheduledNotifications();
  }, []);

  // Clear badge wrapper
  const clearBadgeCount = useCallback(async (): Promise<void> => {
    await clearBadge();
  }, []);

  return {
    pushToken,
    hasPermission,
    isLoading,
    error,
    lastNotification,
    requestPermissions,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    clearBadgeCount,
  };
}

export default usePushNotifications;
