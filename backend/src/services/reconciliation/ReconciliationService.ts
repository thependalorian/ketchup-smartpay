/**
 * Reconciliation Service
 * 
 * Purpose: Business logic for voucher reconciliation between Ketchup and Buffr
 * Location: backend/src/services/reconciliation/ReconciliationService.ts
 */

import { VoucherRepository } from '../voucher/VoucherRepository';
import { log, logError } from '../../utils/logger';
import { BuffrAPIClient } from '../distribution/BuffrAPIClient';
import { sql } from '../../database/connection';
import { ReconciliationRecord, ReconciliationReport, ReconciliationFilters } from '../../../../shared/types';

export class ReconciliationService {
  private voucherRepository: VoucherRepository;
  private buffrAPIClient: BuffrAPIClient;

  constructor() {
    this.voucherRepository = new VoucherRepository();
    this.buffrAPIClient = new BuffrAPIClient();
  }

  /**
   * Run reconciliation for a specific date
   */
  async reconcile(date: string): Promise<ReconciliationReport> {
    try {
      log('Starting reconciliation', { date });

      const vouchers = await this.voucherRepository.findAll({
        issuedDate: date,
      });

      const records: ReconciliationRecord[] = [];
      let matched = 0;
      let discrepancies = 0;

      // Compare each voucher status with Buffr
      for (const voucher of vouchers) {
        try {
          // Get status from Buffr
          const buffrStatus = await this.buffrAPIClient.checkStatus(voucher.id);
          
          const ketchupStatus = voucher.status;
          const match = ketchupStatus === buffrStatus.status;

          if (match) {
            matched++;
          } else {
            discrepancies++;
          }

          const record: ReconciliationRecord = {
            voucherId: voucher.id,
            ketchupStatus,
            buffrStatus: buffrStatus.status,
            match,
            discrepancy: match ? undefined : `Ketchup: ${ketchupStatus}, Buffr: ${buffrStatus.status}`,
            lastVerified: new Date().toISOString(),
          };

          records.push(record);

          // Store reconciliation record in database
          await sql`
            INSERT INTO reconciliation_records (
              voucher_id, reconciliation_date, ketchup_status, buffr_status, match, discrepancy
            )
            VALUES (
              ${voucher.id}, ${date}::date, ${ketchupStatus}, ${buffrStatus.status}, ${match}, ${record.discrepancy || null}
            )
            ON CONFLICT DO NOTHING
          `;
        } catch (error) {
          logError('Failed to reconcile voucher', error, { voucherId: voucher.id });
          discrepancies++;
          const record: ReconciliationRecord = {
            voucherId: voucher.id,
            ketchupStatus: voucher.status,
            buffrStatus: 'unknown',
            match: false,
            discrepancy: `Error fetching Buffr status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            lastVerified: new Date().toISOString(),
          };

          records.push(record);

          // Store reconciliation record in database
          await sql`
            INSERT INTO reconciliation_records (
              voucher_id, reconciliation_date, ketchup_status, buffr_status, match, discrepancy
            )
            VALUES (
              ${voucher.id}, ${date}::date, ${voucher.status}, 'unknown', false, ${record.discrepancy}
            )
            ON CONFLICT DO NOTHING
          `;
        }
      }

      const matchRate = records.length > 0 ? (matched / records.length) * 100 : 0;

      const report: ReconciliationReport = {
        date,
        totalVouchers: records.length,
        matched,
        discrepancies,
        matchRate: Math.round(matchRate * 100) / 100,
        records,
      };

      log('Reconciliation completed', { date, matchRate: report.matchRate });

      return report;
    } catch (error) {
      logError('Failed to reconcile', error);
      throw error;
    }
  }

  /**
   * Get reconciliation records with filters (single query; no sql fragment composition).
   */
  async getRecords(filters?: ReconciliationFilters): Promise<ReconciliationRecord[]> {
    try {
      const date = filters?.date ?? null;
      const match = filters?.match ?? null;
      const voucherId = filters?.voucherId ?? null;
      const limit = Math.min(Math.max(1, filters?.limit ?? 100), 500);
      const offset = Math.max(0, filters?.offset ?? 0);

      const rows = await sql`
        SELECT voucher_id, ketchup_status, buffr_status, match, discrepancy, last_verified
        FROM reconciliation_records
        WHERE
          (${date}::text IS NULL OR reconciliation_date = ${date}::date)
          AND (${match}::boolean IS NULL OR match = ${match})
          AND (${voucherId}::text IS NULL OR voucher_id = ${voucherId})
        ORDER BY last_verified DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return (rows as Record<string, unknown>[]).map((row): ReconciliationRecord => ({
        voucherId: String(row.voucher_id ?? ''),
        ketchupStatus: String(row.ketchup_status ?? ''),
        buffrStatus: String(row.buffr_status ?? ''),
        match: Boolean(row.match),
        discrepancy: row.discrepancy != null ? String(row.discrepancy) : undefined,
        lastVerified: row.last_verified instanceof Date ? row.last_verified.toISOString() : String(row.last_verified ?? ''),
      }));
    } catch (error) {
      logError('Failed to get reconciliation records', error);
      throw error;
    }
  }
}
