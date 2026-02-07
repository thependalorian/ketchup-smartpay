/**
 * Buffr API Client
 * 
 * Location: backend/src/services/distribution/BuffrAPIClient.ts
 * Purpose: Client for communicating with Buffr API
 */

import { Voucher, Beneficiary } from '../../../../shared/types';
import { log, logError } from '../../utils/logger';

const BUFFR_API_URL = process.env.BUFFR_API_URL || 'https://api.buffr.com';
const BUFFR_API_KEY = process.env.BUFFR_API_KEY || '';

export interface BuffrResponse {
  success: boolean;
  voucherId: string;
  deliveryId?: string;
  message?: string;
  error?: string;
}

export interface BuffrBatchResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: BuffrResponse[];
}

/** Enrichment for Buffr disburse: beneficiary numbers, Buffr wallet ID, and Token Vault token for redemption. */
export interface BuffrDisburseEnrichment {
  /** Beneficiary national ID number (e.g. Namibian 11-digit). */
  beneficiaryIdNumber?: string;
  /** Beneficiary cell phone (+264XXXXXXXXX). */
  beneficiaryPhone?: string;
  /** Buffr wallet/user UUID – voucher is credited to this Buffr account. */
  buffrUserId?: string;
  /** Token Vault token ID (for NAMQR/API resolve). */
  tokenId?: string;
  /** Opaque token for redemption (validate via Token Vault). */
  token?: string;
}

export class BuffrAPIClient {
  /**
   * Send voucher to Buffr API.
   * Payload includes beneficiary_id, beneficiary_id_number, beneficiary_phone, and buffr_user_id so Buffr can issue to the right recipient (by beneficiary numbers and Buffr ID/UUID).
   */
  async sendVoucher(voucher: Voucher, enrichment?: BuffrDisburseEnrichment): Promise<BuffrResponse> {
    try {
      log('Sending voucher to Buffr', { voucherId: voucher.id, buffrUserId: enrichment?.buffrUserId });

      const body: Record<string, unknown> = {
        voucher_id: voucher.id,
        beneficiary_id: voucher.beneficiaryId,
        beneficiary_name: voucher.beneficiaryName,
        amount: voucher.amount,
        grant_type: voucher.grantType,
        expiry_date: voucher.expiryDate,
        voucher_code: voucher.voucherCode,
        qr_code: voucher.qrCode,
      };
      if (enrichment?.beneficiaryIdNumber != null) body.beneficiary_id_number = enrichment.beneficiaryIdNumber;
      if (enrichment?.beneficiaryPhone != null) body.beneficiary_phone = enrichment.beneficiaryPhone;
      if (enrichment?.buffrUserId != null || voucher.buffrUserId != null) {
        body.buffr_user_id = enrichment?.buffrUserId ?? voucher.buffrUserId ?? null;
      }
      if (enrichment?.tokenId != null) body.token_id = enrichment.tokenId;
      if (enrichment?.token != null) body.token = enrichment.token;

      const response = await fetch(`${BUFFR_API_URL}/api/utilities/vouchers/disburse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BUFFR_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Buffr API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      const parsed = (data ?? {}) as { deliveryId?: string; message?: string };
      log('Voucher sent to Buffr successfully', { voucherId: voucher.id, deliveryId: parsed.deliveryId });
      
      return {
        success: true,
        voucherId: voucher.id,
        deliveryId: parsed.deliveryId,
        message: parsed.message,
      };
    } catch (error) {
      logError('Failed to send voucher to Buffr', error, { voucherId: voucher.id });
      return {
        success: false,
        voucherId: voucher.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send batch vouchers to Buffr API.
   * getBeneficiary optional: for each voucher, fetches beneficiary to send id_number and phone (and uses voucher.buffrUserId).
   */
  async sendBatch(
    vouchers: Voucher[],
    getBeneficiary?: (beneficiaryId: string) => Promise<Beneficiary | null>
  ): Promise<BuffrBatchResponse> {
    try {
      log('Sending batch vouchers to Buffr', { count: vouchers.length });

      const results: BuffrResponse[] = [];

      const concurrency = 10;
      for (let i = 0; i < vouchers.length; i += concurrency) {
        const batch = vouchers.slice(i, i + concurrency);
        const batchResults = await Promise.all(
          batch.map(async (voucher) => {
            const beneficiary = getBeneficiary ? await getBeneficiary(voucher.beneficiaryId) : null;
            const enrichment = beneficiary
              ? {
                  beneficiaryIdNumber: beneficiary.idNumber,
                  beneficiaryPhone: beneficiary.phone,
                  buffrUserId: voucher.buffrUserId ?? undefined,
                }
              : { buffrUserId: voucher.buffrUserId ?? undefined };
            return this.sendVoucher(voucher, enrichment);
          })
        );
        results.push(...batchResults);
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      log('Batch voucher sending completed', { total: vouchers.length, successful, failed });

      return {
        success: failed === 0,
        total: vouchers.length,
        successful,
        failed,
        results,
      };
    } catch (error) {
      logError('Failed to send batch vouchers to Buffr', error);
      throw error;
    }
  }

  /**
   * Check voucher status in Buffr
   */
  async checkStatus(voucherId: string): Promise<{ status: string; data?: any }> {
    try {
      const response = await fetch(`${BUFFR_API_URL}/api/v1/vouchers/${voucherId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BUFFR_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Buffr API error: ${response.status}`);
      }

      const data = (await response.json()) as { status?: string } & Record<string, unknown>;
      return { status: data.status ?? 'unknown', data };
    } catch (error) {
      logError('Failed to check voucher status in Buffr', error, { voucherId });
      throw error;
    }
  }
}
