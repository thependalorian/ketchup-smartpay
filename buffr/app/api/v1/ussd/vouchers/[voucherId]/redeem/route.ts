/**
 * Open Banking API: /api/v1/ussd/vouchers/{voucherId}/redeem
 * 
 * Redeem specific voucher via USSD (Open Banking format)
 * 
 * CRITICAL: Feature phone support for 70% unbanked population
 * Compliance: PSD-12 (2FA required)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { ussdService } from '@/services/ussdService';
import { log } from '@/utils/logger';

async function handleRedeemVoucher(
  req: ExpoRequest,
  { params }: { params: { voucherId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { voucherId } = params;
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { SessionId, PhoneNumber, PIN, RedemptionMethod } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!SessionId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field SessionId is missing',
          'Data.SessionId'
        )
      );
    }

    if (!PhoneNumber) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field PhoneNumber is missing',
          'Data.PhoneNumber'
        )
      );
    }

    if (!PIN) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field PIN is missing',
          'Data.PIN'
        )
      );
    }

    if (!RedemptionMethod) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field RedemptionMethod is missing',
          'Data.RedemptionMethod'
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

    // Get user by phone number
    const users = await query<any>(
      'SELECT id, transaction_pin_hash FROM users WHERE phone_number = $1',
      [PhoneNumber]
    );

    if (users.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const userId = users[0].id;
    const pinHash = users[0].transaction_pin_hash;

    // Verify PIN (2FA compliance)
    const bcrypt = await import('bcrypt');
    const pinValid = await bcrypt.compare(PIN, pinHash);
    if (!pinValid) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Invalid PIN',
        401
      );
    }

    // Get voucher
    const vouchers = await query<any>(
      'SELECT id, amount, status, user_id, smartpay_beneficiary_id FROM vouchers WHERE id = $1',
      [voucherId]
    );

    if (vouchers.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Voucher not found',
        404
      );
    }

    const voucher = vouchers[0];

    // Verify voucher ownership
    if (voucher.user_id !== userId) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        'Voucher access denied',
        403
      );
    }

    // Check voucher status
    if (voucher.status !== 'available') {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_INVALID,
        `Voucher is ${voucher.status}`,
        400
      );
    }

    // Process redemption via USSD service
    const result = await ussdService.handleVoucherRedemption({
      sessionId: SessionId,
      phoneNumber: PhoneNumber,
      userId,
      voucherId,
      redemptionMethod: RedemptionMethod,
    });

    const redeemResponse = {
      Data: {
        VoucherId: voucherId,
        Amount: parseFloat(voucher.amount.toString()),
        RedemptionMethod,
        Status: 'redeemed',
        Message: result.message,
      },
      Links: {
        Self: `/api/v1/ussd/vouchers/${voucherId}/redeem`,
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
    log.error('Error processing USSD voucher redemption:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the voucher redemption',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleRedeemVoucher,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: false, // USSD gateway authentication handled separately
    trackResponseTime: true,
  }
);
