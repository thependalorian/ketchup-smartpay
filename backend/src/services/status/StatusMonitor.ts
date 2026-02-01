/**
 * Status Monitor
 * 
 * Location: backend/src/services/status/StatusMonitor.ts
 * Purpose: Track voucher lifecycle states (PRD Component: Status Monitor)
 */

import { VoucherRepository } from '../voucher/VoucherRepository';
import { VoucherStatus, StatusEvent } from '../../../../shared/types';
import { log, logError } from '../../utils/logger';
import { sql } from '../../database/connection';

export class StatusMonitor {
  private voucherRepository: VoucherRepository;

  constructor(voucherRepository?: VoucherRepository) {
    this.voucherRepository = voucherRepository || new VoucherRepository();
  }

  /**
   * Track voucher status change
   */
  async trackStatus(voucherId: string, status: VoucherStatus, metadata?: Record<string, any>, triggeredBy: 'system' | 'webhook' | 'manual' = 'system'): Promise<void> {
    try {
      log('Tracking voucher status', { voucherId, status, triggeredBy });

      // Get current status before update
      const currentVoucher = await this.voucherRepository.findById(voucherId);
      const fromStatus = currentVoucher?.status || null;

      // Update voucher status in database
      await this.voucherRepository.updateStatus(voucherId, status);

      // Store status event in database
      await sql`
        INSERT INTO status_events (voucher_id, from_status, to_status, triggered_by, metadata)
        VALUES (${voucherId}, ${fromStatus}, ${status}, ${triggeredBy}, ${JSON.stringify(metadata || {})})
      `;

      log('Status tracked and stored', { voucherId, fromStatus, toStatus: status, triggeredBy });
    } catch (error) {
      logError('Failed to track status', error, { voucherId, status });
      throw error;
    }
  }

  /**
   * Monitor expiring vouchers and send warnings
   */
  async monitorExpiry(): Promise<void> {
    try {
      log('Monitoring expiring vouchers');

      // Get vouchers expiring in next 7 days
      const expiringVouchers = await this.voucherRepository.findAll({
        status: 'delivered',
      });

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const vouchersToWarn = expiringVouchers.filter(v => {
        const expiryDate = new Date(v.expiryDate);
        return expiryDate <= sevenDaysFromNow && expiryDate > now;
      });

      log(`Found ${vouchersToWarn.length} vouchers expiring soon`);

      for (const voucher of vouchersToWarn) {
        log('Voucher expiring soon', { voucherId: voucher.id, expiryDate: voucher.expiryDate });
        // Integration point: call SMS/push provider here (e.g. env NOTIFICATION_WEBHOOK_URL or Twilio)
      }
    } catch (error) {
      logError('Failed to monitor expiry', error);
      throw error;
    }
  }

  /**
   * Send expiry warnings for vouchers expiring soon
   */
  async sendExpiryWarnings(): Promise<void> {
    await this.monitorExpiry();
  }

  /**
   * Get recent status events across all vouchers (for activity feed)
   */
  async getRecentEvents(limit: number = 20): Promise<Array<StatusEvent & { voucher_id?: string }>> {
    try {
      const rows = await sql`
        SELECT id, voucher_id, from_status, to_status, triggered_by, metadata, created_at
        FROM status_events
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return rows.map((row: any) => ({
        id: row.id,
        voucherId: row.voucher_id,
        voucher_id: row.voucher_id,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        status: row.to_status,
        triggeredBy: row.triggered_by,
        metadata: row.metadata || {},
        timestamp: row.created_at,
      }));
    } catch (error) {
      logError('Failed to get recent status events', error);
      throw error;
    }
  }

  /**
   * Record beneficiary.deceased event (status_events). Used when a beneficiary is marked deceased.
   * voucher_id is stored as 'beneficiary-{id}' for queryability; government/audit can filter by to_status = 'deceased'.
   */
  async recordBeneficiaryDeceased(beneficiaryId: string, fromStatus: string, triggeredBy: 'system' | 'webhook' | 'manual' = 'manual'): Promise<void> {
    try {
      const voucherId = `beneficiary-${beneficiaryId}`;
      await sql`
        INSERT INTO status_events (voucher_id, from_status, to_status, triggered_by, metadata)
        VALUES (${voucherId}, ${fromStatus}, 'deceased', ${triggeredBy}, ${JSON.stringify({ beneficiaryId })})
      `;
      log('Beneficiary deceased event recorded', { beneficiaryId, fromStatus });
    } catch (error) {
      logError('Failed to record beneficiary.deceased', error, { beneficiaryId });
      throw error;
    }
  }

  /**
   * Get status history for a voucher
   */
  async getStatusHistory(voucherId: string): Promise<StatusEvent[]> {
    try {
      const rows = await sql`
        SELECT * FROM status_events
        WHERE voucher_id = ${voucherId}
        ORDER BY created_at DESC
      `;

      return rows.map((row: any) => ({
        voucherId: row.voucher_id,
        status: row.to_status,
        timestamp: row.created_at,
        metadata: row.metadata || {},
      }));
    } catch (error) {
      logError('Failed to get status history', error, { voucherId });
      throw error;
    }
  }
}
