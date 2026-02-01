/**
 * Voucher Repository
 * 
 * Location: backend/src/services/voucher/VoucherRepository.ts
 * Purpose: Data access layer for voucher operations
 */

import { sql } from '../../database/connection';
import { Voucher, VoucherFilters } from '../../../../shared/types';
import { log, logError } from '../../utils/logger';

export class VoucherRepository {
  /**
   * Find all vouchers with optional filters
   */
  async findAll(filters?: VoucherFilters): Promise<Voucher[]> {
    try {
      const beneficiaryId = filters?.beneficiaryId ?? null;
      const grantType = filters?.grantType ?? null;
      const status = filters?.status ?? null;
      const search = filters?.search?.trim() ? `%${filters.search.trim()}%` : null;
      const issuedDate = filters?.issuedDate ?? null;

      const result = await sql`
        SELECT 
          v.id,
          v.beneficiary_id     as "beneficiaryId",
          COALESCE(NULLIF(TRIM(v.beneficiary_name), ''), b.name) as "beneficiaryName",
          v.buffr_user_id      as "buffrUserId",
          v.amount,
          v.grant_type         as "grantType",
          v.status,
          v.issued_at          as "issuedAt",
          v.expiry_date        as "expiryDate",
          v.redeemed_at        as "redeemedAt",
          v.redemption_method  as "redemptionMethod",
          v.region,
          v.voucher_code       as "voucherCode",
          v.qr_code            as "qrCode"
        FROM vouchers v
        LEFT JOIN beneficiaries b ON b.id = v.beneficiary_id
        WHERE
          (${beneficiaryId}::text IS NULL OR v.beneficiary_id::text = ${beneficiaryId})
          AND (${grantType}::text IS NULL OR v.grant_type = ${grantType})
          AND (${status}::text IS NULL OR v.status = ${status})
          AND (${issuedDate}::text IS NULL OR (v.issued_at::date) = ${issuedDate}::date)
          AND (
            ${search}::text IS NULL
            OR v.voucher_code ILIKE ${search}
            OR v.beneficiary_name ILIKE ${search}
            OR b.name ILIKE ${search}
          )
        ORDER BY v.issued_at DESC
      `;

      return result as Voucher[];
    } catch (error) {
      logError('Failed to find vouchers', error, { filters });
      throw error;
    }
  }

  /**
   * Find voucher by ID
   */
  async findById(id: string): Promise<Voucher | null> {
    try {
      const result = await sql`
        SELECT 
          v.id,
          v.beneficiary_id     as "beneficiaryId",
          COALESCE(NULLIF(TRIM(v.beneficiary_name), ''), b.name) as "beneficiaryName",
          v.buffr_user_id      as "buffrUserId",
          v.amount,
          v.grant_type         as "grantType",
          v.status,
          v.issued_at          as "issuedAt",
          v.expiry_date        as "expiryDate",
          v.redeemed_at        as "redeemedAt",
          v.redemption_method  as "redemptionMethod",
          v.region,
          v.voucher_code       as "voucherCode",
          v.qr_code            as "qrCode"
        FROM vouchers v
        LEFT JOIN beneficiaries b ON b.id = v.beneficiary_id
        WHERE v.id = ${id}
        LIMIT 1
      `;

      return (result[0] as Voucher) || null;
    } catch (error) {
      logError('Failed to find voucher by ID', error, { id });
      throw error;
    }
  }

  /**
   * Create a new voucher
   */
  async create(data: Voucher): Promise<Voucher> {
    try {
      const result = await sql`
        INSERT INTO vouchers (
          id,
          beneficiary_id,
          beneficiary_name,
          buffr_user_id,
          amount,
          grant_type,
          type,
          status,
          expiry_date,
          issued_at,
          redeemed_at,
          redemption_method,
          region,
          voucher_code,
          qr_code
        ) VALUES (
          ${data.id},
          ${data.beneficiaryId},
          ${data.beneficiaryName},
          ${data.buffrUserId ?? null},
          ${data.amount},
          ${data.grantType},
          ${(data as { type?: string }).type ?? data.grantType ?? 'social_grant'},
          ${data.status},
          ${data.expiryDate},
          ${data.issuedAt},
          ${data.redeemedAt || null},
          ${data.redemptionMethod || null},
          ${data.region ?? 'Khomas'},
          ${data.voucherCode || null},
          ${data.qrCode || null}
        )
        RETURNING 
          id,
          beneficiary_id     as "beneficiaryId",
          beneficiary_name   as "beneficiaryName",
          buffr_user_id      as "buffrUserId",
          amount,
          grant_type         as "grantType",
          status,
          issued_at          as "issuedAt",
          expiry_date        as "expiryDate",
          redeemed_at        as "redeemedAt",
          redemption_method  as "redemptionMethod",
          region,
          voucher_code       as "voucherCode",
          qr_code            as "qrCode"
      `;

      return result[0] as Voucher;
    } catch (error) {
      logError('Failed to create voucher', error, { data });
      throw error;
    }
  }

  /**
   * Update voucher expiry date (for extend operation).
   */
  async updateExpiry(id: string, newExpiryDate: string): Promise<Voucher> {
    try {
      const result = await sql`
        UPDATE vouchers
        SET expiry_date = ${newExpiryDate}::timestamptz, updated_at = NOW()
        WHERE id = ${id}
        RETURNING
          id,
          beneficiary_id     as "beneficiaryId",
          beneficiary_name   as "beneficiaryName",
          buffr_user_id      as "buffrUserId",
          amount,
          grant_type         as "grantType",
          status,
          issued_at          as "issuedAt",
          expiry_date        as "expiryDate",
          redeemed_at        as "redeemedAt",
          redemption_method  as "redemptionMethod",
          region,
          voucher_code       as "voucherCode",
          qr_code            as "qrCode"
      `;
      return result[0] as Voucher;
    } catch (error) {
      logError('Failed to update voucher expiry', error, { id });
      throw error;
    }
  }

  /**
   * Update voucher status
   */
  async updateStatus(id: string, status: Voucher['status'], redemptionMethod?: string, redeemedAt?: string): Promise<Voucher> {
    try {
      const result = await sql`
        UPDATE vouchers
        SET 
          status = ${status},
          redemption_method = ${redemptionMethod || null},
          redeemed_at = ${redeemedAt || null},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING 
          id,
          beneficiary_id     as "beneficiaryId",
          beneficiary_name   as "beneficiaryName",
          buffr_user_id      as "buffrUserId",
          amount,
          grant_type         as "grantType",
          status,
          issued_at          as "issuedAt",
          expiry_date        as "expiryDate",
          redeemed_at        as "redeemedAt",
          redemption_method  as "redemptionMethod",
          region,
          voucher_code       as "voucherCode",
          qr_code            as "qrCode"
      `;

      return result[0] as Voucher;
    } catch (error) {
      logError('Failed to update voucher status', error, { id, status });
      throw error;
    }
  }

  /**
   * Get vouchers by beneficiary ID
   */
  async findByBeneficiary(beneficiaryId: string): Promise<Voucher[]> {
    return this.findAll({ beneficiaryId });
  }

  /**
   * Delete voucher by ID (Ketchup operation). Caller must ensure status is not redeemed for audit.
   * Deletes related status_events, webhook_events, reconciliation_records first.
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      await sql`DELETE FROM reconciliation_records WHERE voucher_id = ${id}`;
      await sql`DELETE FROM webhook_events WHERE voucher_id = ${id}`;
      await sql`DELETE FROM status_events WHERE voucher_id = ${id}`;
      const result = await sql`DELETE FROM vouchers WHERE id = ${id} RETURNING id`;
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      logError('Failed to delete voucher', error, { id });
      throw error;
    }
  }
}
