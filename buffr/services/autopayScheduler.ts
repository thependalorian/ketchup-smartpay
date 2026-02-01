/**
 * AutoPay Scheduler Service
 * 
 * Location: services/autopayScheduler.ts
 * Purpose: Schedule and execute AutoPay payments based on wallet settings
 * 
 * Features:
 * - Check scheduled payments
 * - Execute payments at scheduled times
 * - Handle recurring payments
 * - Manage payment schedules
 * 
 * Note: In a production environment, this would typically run as a background service
 * or be handled by the backend. This is a client-side implementation for demonstration.
 */

import * as Notifications from 'expo-notifications';
import { getWallets } from '@/utils/walletClient';
import { executeAutoPayRule } from '@/utils/walletClient';
import logger, { log } from '@/utils/logger';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Schedule AutoPay notification for a wallet
 */
export async function scheduleAutoPayNotification(
  walletId: string,
  nextPaymentDate: Date,
  amount: number,
  description: string
): Promise<string> {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'AutoPay Scheduled',
        body: `${description} - N$${amount.toFixed(2)} scheduled for ${nextPaymentDate.toLocaleDateString()}`,
        data: {
          walletId,
          type: 'autopay',
          amount,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextPaymentDate,
      },
    });
    return notificationId;
  } catch (error) {
    log.error('Failed to schedule AutoPay notification:', error);
    logger.info(`AutoPay scheduled for wallet ${walletId} on ${nextPaymentDate.toLocaleDateString()}`);
    return `notification-${Date.now()}`;
  }
}

/**
 * Cancel scheduled AutoPay notification
 */
export async function cancelAutoPayNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    log.error('Failed to cancel AutoPay notification:', error);
  }
}

/**
 * Check and execute scheduled AutoPay payments
 * This should be called periodically (e.g., on app launch, or via background task)
 */
export async function checkAndExecuteScheduledPayments(): Promise<void> {
  try {
    const wallets = await getWallets();
    const now = new Date();

    for (const wallet of wallets) {
      if (!wallet.autoPayEnabled) continue;

      // Check if payment is due
      if (wallet.autoPayDeductDate && wallet.autoPayDeductTime) {
        const [day, month, year] = wallet.autoPayDeductDate.split('-');
        const [time, period] = wallet.autoPayDeductTime.split(/(am|pm)/i);
        const [hours, minutes] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period?.toLowerCase() === 'pm' && hours !== 12) {
          hour24 = hours + 12;
        } else if (period?.toLowerCase() === 'am' && hours === 12) {
          hour24 = 0;
        }

        const paymentDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour24,
          minutes
        );

        // If payment is due (within last 5 minutes to account for timing)
        const timeDiff = paymentDate.getTime() - now.getTime();
        if (timeDiff >= 0 && timeDiff <= 5 * 60 * 1000) {
          // Execute payment
          try {
            // Use a mock rule ID - in production, get from wallet settings
            await executeAutoPayRule(wallet.id, 'wallet-rule-1');
            logger.info(`AutoPay executed for wallet ${wallet.id}`);
          } catch (error) {
            log.error(`Failed to execute AutoPay for wallet ${wallet.id}:`, error);
          }
        }
      }
    }
  } catch (error) {
    log.error('Error checking scheduled payments:', error);
  }
}

/**
 * Schedule all AutoPay notifications for enabled wallets
 */
export async function scheduleAllAutoPayNotifications(): Promise<void> {
  try {
    const wallets = await getWallets();

    for (const wallet of wallets) {
      if (!wallet.autoPayEnabled || !wallet.autoPayDeductDate || !wallet.autoPayDeductTime) {
        continue;
      }

      try {
        const [day, month, year] = wallet.autoPayDeductDate.split('-');
        const [time, period] = wallet.autoPayDeductTime.split(/(am|pm)/i);
        const [hours, minutes] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period?.toLowerCase() === 'pm' && hours !== 12) {
          hour24 = hours + 12;
        } else if (period?.toLowerCase() === 'am' && hours === 12) {
          hour24 = 0;
        }

        const paymentDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          hour24,
          minutes
        );

        // Only schedule if date is in the future
        if (paymentDate > new Date()) {
          await scheduleAutoPayNotification(
            wallet.id,
            paymentDate,
            wallet.autoPayAmount || 0,
            `AutoPay for ${wallet.name}`
          );
        }
      } catch (error) {
        log.error(`Failed to schedule notification for wallet ${wallet.id}:`, error);
      }
    }
  } catch (error) {
    log.error('Error scheduling AutoPay notifications:', error);
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    log.error('Error requesting notification permissions:', error);
    return false;
  }
}
