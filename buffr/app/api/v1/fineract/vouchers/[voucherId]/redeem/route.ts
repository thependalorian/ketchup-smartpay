/**
 * Open Banking API: /api/v1/fineract/vouchers/{voucherId}/redeem
 * 
 * Redeem Fineract voucher (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

async function handleRedeemVoucher(
  req: ExpoRequest,
  { params }: { params: { voucherId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const fineractVoucherId = parseInt(params.voucherId);
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { RedemptionMethod, RedemptionDate, BankAccountEncrypted, MerchantId, Description, BuffrVoucherId } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!RedemptionMethod) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field RedemptionMethod is missing',
          'Data.RedemptionMethod'
        )
      );
    }

    if (!RedemptionDate) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field RedemptionDate is missing',
          'Data.RedemptionDate'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    // Redeem voucher in Fineract
    const voucher = await fineractService.redeemVoucher(
      fineractVoucherId,
      {
        redemptionMethod: parseInt(RedemptionMethod.toString()),
        redemptionDate: RedemptionDate,
        bankAccountEncrypted: BankAccountEncrypted,
        merchantId: MerchantId ? parseInt(MerchantId.toString()) : undefined,
        description: Description,
      },
      {
        userId: Data.UserId || undefined,
        requestId: context?.requestId,
      }
    );

    // Update mapping status if Buffr voucher ID provided
    if (BuffrVoucherId) {
      await query(
        `UPDATE fineract_vouchers 
         SET status = $1, synced_at = NOW()
         WHERE voucher_id = $2`,
        ['REDEEMED', BuffrVoucherId]
      ).catch(err => log.error('Failed to update voucher mapping:', err));
    }

    const redeemResponse = {
      Data: {
        FineractVoucherId: voucher.id,
        VoucherCode: voucher.voucherCode,
        Status: voucher.status.value,
        Amount: parseFloat(voucher.amount.toString()),
        RedemptionDate,
        RedemptionMethod: parseInt(RedemptionMethod.toString()),
        TrustAccountDebited: true, // Always true - redemption automatically debits trust account
      },
      Links: {
        Self: `/api/v1/fineract/vouchers/${fineractVoucherId}/redeem`,
      },
      Meta: {},
    };

    return helpers.success(
      redeemResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error redeeming Fineract voucher:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while redeeming the voucher',
      500
    );
  }
}

export const PUT = openBankingSecureRoute(
  handleRedeemVoucher,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
