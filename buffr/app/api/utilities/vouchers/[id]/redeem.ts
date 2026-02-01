/**
 * Redeem Voucher API Route
 * 
 * Location: app/api/utilities/vouchers/[id]/redeem.ts
 * Purpose: Redeem a voucher for cash or account credit
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function postHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { redeemAsCash, walletId } = body;

    if (redeemAsCash === undefined || !walletId) {
      return errorResponse('Invalid redemption data: redeemAsCash and walletId are required', HttpStatus.BAD_REQUEST);
    }

    // In production: Process voucher redemption, update wallet balance or process cash payout
    return successResponse(null, redeemAsCash
      ? 'Voucher redeemed for cash payout successfully'
      : 'Voucher credited to account successfully');
  } catch (error: any) {
    log.error('Error redeeming voucher:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to redeem voucher',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
