/**
 * Voucher Expiry Warning Service
 * 
 * Location: services/voucherExpiryService.ts
 * Purpose: Proactive voucher expiry warnings to prevent beneficiary loss
 * 
 * Features:
 * - Check vouchers expiring in 7, 3, 1 days
 * - Send SMS and push notifications
 * - Track warning effectiveness
 * - Analytics on redemption rates after warnings
 */

import { query } from '@/utils/db';
import { sendSMS, sendVoucherExpirySMS } from '@/utils/sendSMS';
import { sendPushNotification } from '@/utils/sendPushNotification';
import logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type WarningType = '7_days' | '3_days' | '1_day' | 'expiry_day';

export interface VoucherExpiryWarning {
  id: string;
  voucher_id: string;
  user_id: string;
  warning_type: WarningType;
  days_until_expiry: number;
  sent_at: Date;
  channel: string;
  status: 'sent' | 'failed' | 'delivered';
  redeemed_after_warning: boolean;
}

export interface ExpiringVoucher {
  id: string;
  user_id: string;
  amount: number;
  expiry_date: Date;
  grant_type?: string;
  title: string;
  days_until_expiry: number;
}

// ============================================================================
// VOUCHER EXPIRY SERVICE
// ============================================================================

class VoucherExpiryService {
  /**
   * Check and send expiry warnings for vouchers expiring in X days
   */
  async checkAndSendWarnings(daysUntilExpiry: number): Promise<{
    checked: number;
    warningsSent: number;
    errors: number;
  }> {
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysUntilExpiry);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Find vouchers expiring on target date that haven't been warned yet
      const vouchers = await query<ExpiringVoucher>(
        `SELECT 
          v.id,
          v.user_id,
          v.amount,
          v.expiry_date,
          v.grant_type,
          v.title,
          EXTRACT(DAY FROM (v.expiry_date - CURRENT_DATE))::INTEGER as days_until_expiry
        FROM vouchers v
        WHERE v.status = 'available'
          AND v.expiry_date = $1::DATE
          AND v.expiry_date > CURRENT_DATE
          AND NOT EXISTS (
            SELECT 1 FROM voucher_expiry_warnings vew
            WHERE vew.voucher_id = v.id
              AND vew.warning_type = $2
          )
        ORDER BY v.user_id, v.expiry_date`,
        [targetDateStr, this.getWarningType(daysUntilExpiry)]
      );

      logger.info(`Found ${vouchers.length} vouchers expiring in ${daysUntilExpiry} days`);

      let warningsSent = 0;
      let errors = 0;

      for (const voucher of vouchers) {
        try {
          await this.sendExpiryWarning(voucher, daysUntilExpiry);
          warningsSent++;
        } catch (error: any) {
          logger.error(`Error sending expiry warning for voucher ${voucher.id}:`, error);
          errors++;
        }
      }

      return {
        checked: vouchers.length,
        warningsSent,
        errors,
      };
    } catch (error: any) {
      logger.error('Error checking expiry warnings:', error);
      throw error;
    }
  }

  /**
   * Send expiry warning for a specific voucher
   */
  async sendExpiryWarning(
    voucher: ExpiringVoucher,
    daysUntilExpiry: number
  ): Promise<void> {
    const warningType = this.getWarningType(daysUntilExpiry);
    
    // Get user phone number
    const users = await query<{ phone: string }>(
      'SELECT phone FROM users WHERE id = $1',
      [voucher.user_id]
    );

    if (users.length === 0) {
      throw new Error(`User ${voucher.user_id} not found`);
    }

    const userPhone = users[0].phone;

    // Send SMS
    try {
      await sendVoucherExpirySMS(userPhone, {
        voucherId: voucher.id,
        amount: voucher.amount,
        grantType: voucher.grant_type,
        expiryDate: voucher.expiry_date,
        daysUntilExpiry,
      });

      // Record SMS warning
      await query(
        `INSERT INTO voucher_expiry_warnings (
          voucher_id, user_id, warning_type, days_until_expiry, channel, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [voucher.id, voucher.user_id, warningType, daysUntilExpiry, 'sms', 'sent']
      );
    } catch (error: any) {
      logger.error(`Failed to send SMS expiry warning:`, error);
      // Record failed warning
      await query(
        `INSERT INTO voucher_expiry_warnings (
          voucher_id, user_id, warning_type, days_until_expiry, channel, status, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [voucher.id, voucher.user_id, warningType, daysUntilExpiry, 'sms', 'failed', error.message]
      );
    }

    // Send push notification (if user has app)
    try {
      await sendPushNotification({
        userIds: [voucher.user_id],
        title: `Voucher Expiring in ${daysUntilExpiry} Day${daysUntilExpiry > 1 ? 's' : ''}`,
        body: `Your N$${voucher.amount} voucher expires ${daysUntilExpiry === 1 ? 'tomorrow' : `in ${daysUntilExpiry} days`}. Redeem now!`,
        data: {
          type: 'voucher_expiry_warning',
          voucherId: voucher.id,
          daysUntilExpiry,
          amount: voucher.amount,
        },
        priority: 'high',
      });

      // Record push warning
      await query(
        `INSERT INTO voucher_expiry_warnings (
          voucher_id, user_id, warning_type, days_until_expiry, channel, status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [voucher.id, voucher.user_id, warningType, daysUntilExpiry, 'push', 'sent']
      );
    } catch (error: any) {
      // Push notification failure is not critical (user might not have app)
      logger.debug(`Push notification not sent (user might not have app):`, error);
    }
  }

  /**
   * Get warning type from days until expiry
   */
  private getWarningType(daysUntilExpiry: number): WarningType {
    if (daysUntilExpiry === 7) return '7_days';
    if (daysUntilExpiry === 3) return '3_days';
    if (daysUntilExpiry === 1) return '1_day';
    if (daysUntilExpiry === 0) return 'expiry_day';
    throw new Error(`Invalid days until expiry: ${daysUntilExpiry}`);
  }

  /**
   * Update redemption status after warning
   * Called when voucher is redeemed to track warning effectiveness
   */
  async markVoucherRedeemedAfterWarning(voucherId: string): Promise<void> {
    await query(
      `UPDATE voucher_expiry_warnings
       SET redeemed_after_warning = TRUE,
           redeemed_at = NOW()
       WHERE voucher_id = $1
         AND redeemed_after_warning = FALSE`,
      [voucherId]
    );
  }

  /**
   * Aggregate daily expiry analytics
   */
  async aggregateDailyExpiryAnalytics(date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];

    // Calculate metrics
    const metrics = await query<{
      total_expiring: number;
      warnings_7_days: number;
      warnings_3_days: number;
      warnings_1_day: number;
      warnings_expiry_day: number;
      redeemed_after_warning: number;
      expired: number;
    }>(
      `WITH expiring_vouchers AS (
        SELECT id FROM vouchers
        WHERE expiry_date = $1::DATE
          AND status = 'available'
      ),
      warnings_sent AS (
        SELECT 
          warning_type,
          COUNT(*) as count
        FROM voucher_expiry_warnings
        WHERE DATE(sent_at) = $1::DATE
          AND status = 'sent'
        GROUP BY warning_type
      ),
      redeemed_after AS (
        SELECT COUNT(DISTINCT voucher_id) as count
        FROM voucher_expiry_warnings
        WHERE DATE(sent_at) = $1::DATE
          AND redeemed_after_warning = TRUE
      ),
      expired_count AS (
        SELECT COUNT(*) as count
        FROM vouchers
        WHERE expiry_date = $1::DATE
          AND status = 'expired'
          AND redeemed_at IS NULL
      )
      SELECT 
        (SELECT COUNT(*) FROM expiring_vouchers) as total_expiring,
        (SELECT count FROM warnings_sent WHERE warning_type = '7_days')::INTEGER as warnings_7_days,
        (SELECT count FROM warnings_sent WHERE warning_type = '3_days')::INTEGER as warnings_3_days,
        (SELECT count FROM warnings_sent WHERE warning_type = '1_day')::INTEGER as warnings_1_day,
        (SELECT count FROM warnings_sent WHERE warning_type = 'expiry_day')::INTEGER as warnings_expiry_day,
        (SELECT count FROM redeemed_after)::INTEGER as redeemed_after_warning,
        (SELECT count FROM expired_count)::INTEGER as expired`,
      [dateStr]
    );

    if (metrics.length === 0) return;

    const m = metrics[0];
    const totalExpiring = m.total_expiring || 0;
    const expired = m.expired || 0;
    const redeemedAfterWarning = m.redeemed_after_warning || 0;

    const expiredRate = totalExpiring > 0 ? (expired / totalExpiring) * 100 : 0;
    const redemptionRate = totalExpiring > 0 ? (redeemedAfterWarning / totalExpiring) * 100 : 0;

    // Insert or update analytics
    await query(
      `INSERT INTO voucher_expiry_analytics (
        date, total_vouchers_expiring, warnings_sent_7_days, warnings_sent_3_days,
        warnings_sent_1_day, warnings_sent_expiry_day, vouchers_redeemed_after_warning,
        vouchers_expired, expired_voucher_rate, redemption_rate_after_warning
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (date) DO UPDATE SET
        total_vouchers_expiring = EXCLUDED.total_vouchers_expiring,
        warnings_sent_7_days = EXCLUDED.warnings_sent_7_days,
        warnings_sent_3_days = EXCLUDED.warnings_sent_3_days,
        warnings_sent_1_day = EXCLUDED.warnings_sent_1_day,
        warnings_sent_expiry_day = EXCLUDED.warnings_sent_expiry_day,
        vouchers_redeemed_after_warning = EXCLUDED.vouchers_redeemed_after_warning,
        vouchers_expired = EXCLUDED.vouchers_expired,
        expired_voucher_rate = EXCLUDED.expired_voucher_rate,
        redemption_rate_after_warning = EXCLUDED.redemption_rate_after_warning,
        updated_at = NOW()`,
      [
        dateStr,
        totalExpiring,
        m.warnings_7_days || 0,
        m.warnings_3_days || 0,
        m.warnings_1_day || 0,
        m.warnings_expiry_day || 0,
        redeemedAfterWarning,
        expired,
        expiredRate,
        redemptionRate,
      ]
    );
  }

  /**
   * Get expiring vouchers for a user
   */
  async getExpiringVouchersForUser(
    userId: string,
    daysUntilExpiry?: number
  ): Promise<ExpiringVoucher[]> {
    let queryStr = `
      SELECT 
        v.id,
        v.user_id,
        v.amount,
        v.expiry_date,
        v.grant_type,
        v.title,
        EXTRACT(DAY FROM (v.expiry_date - CURRENT_DATE))::INTEGER as days_until_expiry
      FROM vouchers v
      WHERE v.user_id = $1
        AND v.status = 'available'
        AND v.expiry_date > CURRENT_DATE
        AND v.expiry_date <= CURRENT_DATE + INTERVAL '7 days'
    `;

    const params: any[] = [userId];

    if (daysUntilExpiry !== undefined) {
      queryStr += ` AND v.expiry_date = CURRENT_DATE + INTERVAL '${daysUntilExpiry} days'`;
    }

    queryStr += ' ORDER BY v.expiry_date ASC';

    return await query<ExpiringVoucher>(queryStr, params);
  }
}

export const voucherExpiryService = new VoucherExpiryService();
