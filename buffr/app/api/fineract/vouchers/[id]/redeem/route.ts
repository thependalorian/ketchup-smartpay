/**
 * Fineract Voucher Redemption API Route
 * 
 * Location: app/api/fineract/vouchers/[id]/redeem/route.ts
 * Purpose: Redeem voucher in Fineract (fineract-voucher module)
 * 
 * Methods:
 * - PUT: Redeem voucher (debits trust account automatically)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function putHandler(req: ExpoRequest, { params }: { params: { id: string } }) {
  try {
    const voucherId = params.id; // Fineract voucher ID
    const body = await req.json();
    const {
      redemptionMethod, // 1=QR, 2=Bank Transfer, 3=Merchant Payment, 4=Cash Out
      redemptionDate, // yyyy-MM-dd
      bankAccountEncrypted, // For bank transfer
      merchantId, // For merchant payment
      description,
      buffrVoucherId, // Buffr voucher ID (for mapping update)
    } = body;

    if (!redemptionMethod || !redemptionDate) {
      return errorResponse(
        'redemptionMethod and redemptionDate are required',
        HttpStatus.BAD_REQUEST
      );
    }

    // Redeem voucher in Fineract (automatically debits trust account)
    const voucher = await fineractService.redeemVoucher(
      parseInt(voucherId),
      {
        redemptionMethod: parseInt(redemptionMethod.toString()),
        redemptionDate,
        bankAccountEncrypted,
        merchantId: merchantId ? parseInt(merchantId.toString()) : undefined,
        description,
      },
      {
        userId: body.userId || undefined,
      }
    );

    // Update mapping status if Buffr voucher ID provided
    if (buffrVoucherId) {
      await query(
        `UPDATE fineract_vouchers 
         SET status = $1, synced_at = NOW()
         WHERE voucher_id = $2`,
        ['REDEEMED', buffrVoucherId]
      ).catch(err => logger.error('Failed to update voucher mapping:', err));
    }

    return successResponse({
      fineractVoucherId: voucher.id,
      voucherCode: voucher.voucherCode,
      status: voucher.status.value,
      amount: voucher.amount,
      redemptionDate,
      redemptionMethod,
      trustAccountDebited: true, // Always true - redemption automatically debits trust account
    }, 'Voucher redeemed successfully in Fineract');
  } catch (error: any) {
    logger.error('Error redeeming Fineract voucher', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to redeem voucher',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const PUT = secureAdminRoute(RATE_LIMITS.admin, putHandler);
