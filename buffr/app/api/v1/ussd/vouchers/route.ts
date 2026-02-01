/**
 * Open Banking API: /api/v1/ussd/vouchers
 * 
 * List vouchers via USSD (Open Banking format)
 * 
 * CRITICAL: Feature phone support for 70% unbanked population
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetVouchers(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { PhoneNumber } = Data;

    if (!PhoneNumber) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.PhoneNumber is required',
        400
      );
    }

    // Get user by phone number
    const users = await query<any>(
      'SELECT id FROM users WHERE phone_number = $1',
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

    // Get available vouchers
    const vouchers = await query<any>(
      `SELECT id, amount, grant_type, expires_at, created_at
       FROM vouchers
       WHERE user_id = $1 AND status = 'available'
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    // Format for Open Banking
    const formattedVouchers = vouchers.map((v: any, index: number) => ({
      Number: index + 1,
      VoucherId: v.id,
      Amount: parseFloat(v.amount.toString()),
      GrantType: v.grant_type,
      ExpiresAt: v.expires_at.toISOString().split('T')[0],
      CreatedDateTime: v.created_at.toISOString(),
    }));

    const { page, pageSize } = parsePaginationParams(req);
    const total = formattedVouchers.length;
    const offset = (page - 1) * pageSize;
    const paginatedVouchers = formattedVouchers.slice(offset, offset + pageSize);

    const vouchersResponse = {
      Data: {
        Vouchers: paginatedVouchers,
        Total: total,
        Message: total > 0
          ? `You have ${total} available voucher(s). Select a voucher number to redeem.`
          : 'No available vouchers found.',
      },
      Links: {
        Self: '/api/v1/ussd/vouchers',
      },
      Meta: {},
    };

    return helpers.paginated(
      paginatedVouchers,
      'Vouchers',
      '/api/v1/ussd/vouchers',
      page,
      pageSize,
      total,
      req,
      undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error listing USSD vouchers:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving vouchers',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleGetVouchers,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: false, // USSD gateway authentication handled separately
    trackResponseTime: true,
  }
);
