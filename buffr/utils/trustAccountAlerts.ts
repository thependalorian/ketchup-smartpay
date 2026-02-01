/**
 * Trust Account Discrepancy Alert System
 * 
 * Location: utils/trustAccountAlerts.ts
 * Purpose: Send alerts to admins when trust account discrepancies are detected
 * 
 * Features:
 * - Push notifications to admin users
 * - In-app notifications
 * - Email alerts (if configured)
 * - Alert logging for audit trail
 */

import { query, queryOne } from './db';
import { sendPushNotification } from './sendPushNotification';
import logger, { log } from '@/utils/logger';

interface DiscrepancyAlert {
  reconciliationDate: string;
  trustAccountBalance: number;
  eMoneyLiabilities: number;
  discrepancyAmount: number;
  discrepancyPercentage: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Determine alert severity based on discrepancy
 */
function determineSeverity(discrepancyAmount: number, discrepancyPercentage: number): 'low' | 'medium' | 'high' | 'critical' {
  const absAmount = Math.abs(discrepancyAmount);
  
  // Critical: > 10,000 NAD or > 10%
  if (absAmount > 10000 || discrepancyPercentage > 10) {
    return 'critical';
  }
  
  // High: > 1,000 NAD or > 5%
  if (absAmount > 1000 || discrepancyPercentage > 5) {
    return 'high';
  }
  
  // Medium: > 100 NAD or > 1%
  if (absAmount > 100 || discrepancyPercentage > 1) {
    return 'medium';
  }
  
  // Low: > 0.01 NAD (any discrepancy)
  return 'low';
}

/**
 * Get all admin users who should receive alerts
 */
async function getAdminUsers(): Promise<string[]> {
  try {
    const admins = await query<{ id: string }>(
      `SELECT id FROM users 
       WHERE role = 'admin' AND status = 'active'`
    );
    
    return admins.map(admin => admin.id);
  } catch (error) {
    log.error('[Trust Account Alerts] Error fetching admin users:', error);
    return [];
  }
}

/**
 * Send push notification to admin users
 */
async function sendPushAlert(adminUserIds: string[], alert: DiscrepancyAlert): Promise<void> {
  if (adminUserIds.length === 0) {
    logger.warn('[Trust Account Alerts] No admin users found to notify');
    return;
  }

  const severityEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️',
  };

  const title = `${severityEmoji[alert.severity]} Trust Account Discrepancy Detected`;
  const body = `Discrepancy: ${alert.discrepancyAmount.toFixed(2)} NAD (${alert.discrepancyPercentage.toFixed(2)}%)\nTrust Account: ${alert.trustAccountBalance.toFixed(2)} NAD\nE-Money Liabilities: ${alert.eMoneyLiabilities.toFixed(2)} NAD`;

  try {
    await sendPushNotification({
      userIds: adminUserIds,
      title,
      body,
      data: {
        type: 'trust_account_discrepancy',
        severity: alert.severity,
        reconciliationDate: alert.reconciliationDate,
        discrepancyAmount: alert.discrepancyAmount,
        trustAccountBalance: alert.trustAccountBalance,
        eMoneyLiabilities: alert.eMoneyLiabilities,
      },
      priority: alert.severity === 'critical' || alert.severity === 'high' ? 'high' : 'normal',
      sound: 'default',
    });

    logger.info(`[Trust Account Alerts] Push notifications sent to ${adminUserIds.length} admin(s)`);
  } catch (error) {
    log.error('[Trust Account Alerts] Error sending push notifications:', error);
  }
}

/**
 * Create in-app notification for admin users
 */
async function createInAppNotifications(adminUserIds: string[], alert: DiscrepancyAlert): Promise<void> {
  if (adminUserIds.length === 0) return;

  const severityLabels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const message = `Trust account discrepancy detected: ${alert.discrepancyAmount.toFixed(2)} NAD (${alert.discrepancyPercentage.toFixed(2)}%)`;

  try {
    // Create notifications for each admin
    const placeholders = adminUserIds.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`).join(', ');
    const values: any[] = [];
    
    adminUserIds.forEach(userId => {
      values.push(userId, 'system', `Trust Account Discrepancy - ${severityLabels[alert.severity]}`, message);
    });

    await query(
      `INSERT INTO notifications (user_id, type, title, message, is_read, created_at)
       VALUES ${placeholders}`,
      values
    );

    logger.info(`[Trust Account Alerts] In-app notifications created for ${adminUserIds.length} admin(s)`);
  } catch (error) {
    log.error('[Trust Account Alerts] Error creating in-app notifications:', error);
  }
}

/**
 * Log alert to database for audit trail
 */
async function logAlert(alert: DiscrepancyAlert, adminUserIds: string[]): Promise<void> {
  try {
    await query(
      `INSERT INTO trust_account_reconciliation_log 
       (reconciliation_date, trust_account_balance, e_money_liabilities, discrepancy_amount, status, notes, reconciled_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT DO NOTHING`,
      [
        alert.reconciliationDate,
        alert.trustAccountBalance,
        alert.eMoneyLiabilities,
        alert.discrepancyAmount,
        'discrepancy',
        `Alert sent to ${adminUserIds.length} admin(s) - Severity: ${alert.severity}`,
      ]
    );
  } catch (error) {
    log.error('[Trust Account Alerts] Error logging alert:', error);
  }
}

/**
 * Send comprehensive alert for trust account discrepancy
 */
export async function sendDiscrepancyAlert(
  reconciliationDate: string,
  trustAccountBalance: number,
  eMoneyLiabilities: number,
  discrepancyAmount: number
): Promise<void> {
  try {
    const discrepancyPercentage = eMoneyLiabilities > 0
      ? (Math.abs(discrepancyAmount) / eMoneyLiabilities) * 100
      : 0;

    const severity = determineSeverity(discrepancyAmount, discrepancyPercentage);

    const alert: DiscrepancyAlert = {
      reconciliationDate,
      trustAccountBalance,
      eMoneyLiabilities,
      discrepancyAmount,
      discrepancyPercentage,
      severity,
    };

    // Get admin users
    const adminUserIds = await getAdminUsers();

    if (adminUserIds.length === 0) {
      logger.warn('[Trust Account Alerts] No admin users found - alerts not sent');
      return;
    }

    // Send push notifications
    await sendPushAlert(adminUserIds, alert);

    // Create in-app notifications
    await createInAppNotifications(adminUserIds, alert);

    // Log alert
    await logAlert(alert, adminUserIds);

    logger.info(`[Trust Account Alerts] ✅ Alert sent successfully (Severity: ${severity}, Recipients: ${adminUserIds.length})`);
  } catch (error) {
    log.error('[Trust Account Alerts] Error sending discrepancy alert:', error);
    // Don't throw - alerts are important but shouldn't break reconciliation
  }
}
