/**
 * USSD Voucher Redemption by ID API Route
 * 
 * Location: app/api/ussd/vouchers/[id]/redeem/route.ts
 * Purpose: Redeem specific voucher via USSD
 * 
 * Compliance: PSD-12 (2FA required)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { ussdService } from '@/services/ussdService';
import { logVoucherOperation, generateRequestId } from '@/utils/auditLogger';
import logger from '@/utils/logger';

interface USSDVoucherRedeemByIdRequest {
  sessionId: string;
  phoneNumber: string;
  pin: string; // 4-digit PIN for 2FA
  redemptionMethod: 'wallet' | 'cash_out' | 'bank_transfer' | 'merchant';
}

async function postHandler(req: ExpoRequest, { id: voucherId }: { id: string }) {
  const requestId = generateRequestId();

  try {
    const body: USSDVoucherRedeemByIdRequest = await req.json();
    const { sessionId, phoneNumber, pin, redemptionMethod } = body;

    // Validate required fields
    if (!sessionId || !phoneNumber || !pin || !redemptionMethod) {
      return errorResponse(
        'sessionId, phoneNumber, pin, and redemptionMethod are required',
        HttpStatus.BAD_REQUEST
      );
    }

    // Get user by phone number
    const users = await query<{ id: string; transaction_pin_hash: string }>(
      'SELECT id, transaction_pin_hash FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (users.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const userId = users[0].id;
    const pinHash = users[0].transaction_pin_hash;

    // Verify PIN (2FA compliance)
    const bcrypt = await import('bcrypt');
    const pinValid = await bcrypt.compare(pin, pinHash);
    if (!pinValid) {
      return errorResponse('Invalid PIN', HttpStatus.UNAUTHORIZED);
    }

    // Get voucher
    const vouchers = await query<{
      id: string;
      amount: number;
      status: string;
      user_id: string;
      smartpay_beneficiary_id: string;
    }>(
      'SELECT id, amount, status, user_id, smartpay_beneficiary_id FROM vouchers WHERE id = $1',
      [voucherId]
    );

    if (vouchers.length === 0) {
      return errorResponse('Voucher not found', HttpStatus.NOT_FOUND);
    }

    const voucher = vouchers[0];

    // Verify voucher ownership
    if (voucher.user_id !== userId) {
      return errorResponse('Voucher access denied', HttpStatus.FORBIDDEN);
    }

    // Check voucher status
    if (voucher.status !== 'available') {
      return errorResponse(`Voucher is ${voucher.status}`, HttpStatus.BAD_REQUEST);
    }

    // Process redemption via USSD service
    const result = await ussdService.handleVoucherRedemption({
      sessionId,
      phoneNumber,
      userId,
      voucherId,
      redemptionMethod,
    });

    // Log voucher redemption (audit trail)
    await logVoucherOperation({
      voucher_id: voucherId,
      operation_type: 'redeemed',
      user_id: userId,
      smartpay_beneficiary_id: voucher.smartpay_beneficiary_id,
      old_status: 'available',
      new_status: 'redeemed',
      amount: parseFloat(voucher.amount.toString()),
      redemption_method: redemptionMethod,
    }).catch(err => logger.error('Failed to log voucher redemption:', err));

    return successResponse({
      voucherId,
      amount: parseFloat(voucher.amount.toString()),
      redemptionMethod,
      message: result.message,
    }, 'Voucher redeemed successfully via USSD');
  } catch (error: any) {
    logger.error('USSD voucher redemption error', error, { voucherId });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to redeem voucher via USSD',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureRoute(RATE_LIMITS.payment, postHandler);
