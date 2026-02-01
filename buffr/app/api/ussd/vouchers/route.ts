/**
 * USSD Vouchers List API Route
 * 
 * Location: app/api/ussd/vouchers/route.ts
 * Purpose: List vouchers via USSD for feature phone users
 */

import { ExpoRequest } from 'expo-router/server';
import { secureRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

interface USSDVouchersRequest {
  phoneNumber: string;
}

async function postHandler(req: ExpoRequest) {
  try {
    const body: USSDVouchersRequest = await req.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return errorResponse('phoneNumber is required', HttpStatus.BAD_REQUEST);
    }

    // Get user by phone number
    const users = await query<{ id: string }>(
      'SELECT id FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (users.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const userId = users[0].id;

    // Get available vouchers
    const vouchers = await query<{
      id: string;
      amount: number;
      grant_type: string;
      expires_at: Date;
      created_at: Date;
    }>(
      `SELECT id, amount, grant_type, expires_at, created_at
       FROM vouchers
       WHERE user_id = $1 AND status = 'available'
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Format for USSD display
    const formattedVouchers = vouchers.map((v, index) => ({
      number: index + 1,
      id: v.id,
      amount: parseFloat(v.amount.toString()),
      grantType: v.grant_type,
      expiresAt: v.expires_at.toISOString().split('T')[0],
    }));

    return successResponse({
      vouchers: formattedVouchers,
      total: formattedVouchers.length,
      message: formattedVouchers.length > 0
        ? `You have ${formattedVouchers.length} available voucher(s). Select a voucher number to redeem.`
        : 'No available vouchers found.',
    }, 'Vouchers retrieved successfully');
  } catch (error: any) {
    logger.error('Error listing USSD vouchers', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve vouchers',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureRoute(RATE_LIMITS.api, postHandler);
