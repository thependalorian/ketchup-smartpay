/**
 * Push Notification Initializer Component
 * 
 * Location: components/notifications/PushNotificationInitializer.tsx
 * Purpose: Initialize push notifications when app starts
 * 
 * This component should be placed in the root layout to ensure
 * push notifications are set up as soon as the app loads.
 */

import { useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import logger from '@/utils/logger';

export function PushNotificationInitializer() {
  const { user } = useUser();
  const { 
    hasPermission, 
    requestPermissions, 
    pushToken,
    isLoading,
    error 
  } = usePushNotifications();

  // Request permissions on mount if not granted
  useEffect(() => {
    if (!isLoading && !hasPermission && !error) {
      // Auto-request permissions when user is logged in
      if (user?.id) {
        requestPermissions();
      }
    }
  }, [isLoading, hasPermission, user?.id, requestPermissions, error]);

  // Log token registration status
  useEffect(() => {
    if (pushToken && user?.id) {
      console.log('✅ Push notifications initialized:', {
        hasToken: !!pushToken,
        hasPermission,
        userId: user.id,
      });
    }
  }, [pushToken, user?.id, hasPermission]);

  // This component doesn't render anything
  return null;
}
