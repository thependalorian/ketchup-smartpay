/**
 * Open Banking API: /api/v1/vouchers/{voucherId}
 * 
 * Get single voucher (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetVoucher(
  req: ExpoRequest,
  { params }: { params: { voucherId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    const { voucherId } = params;

    // Fetch voucher
    const vouchers = await query<any>(
      'SELECT * FROM vouchers WHERE id = $1 AND user_id = $2',
      [voucherId, actualUserId]
    );

    if (vouchers.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Voucher with ID '${voucherId}' not found`,
        404
      );
    }

    const v = vouchers[0];

    // Format voucher as Open Banking format
    const voucher = {
      VoucherId: v.id,
      UserId: v.user_id,
      Type: v.type,
      Title: v.title,
      Description: v.description,
      Amount: {
        Amount: parseFloat(v.amount.toString()),
        Currency: v.currency || 'NAD',
      },
      Status: v.status === 'available' ? 'Available' : 
              v.status === 'redeemed' ? 'Redeemed' :
              v.status === 'expired' ? 'Expired' : v.status,
      ExpiryDate: v.expiry_date ? v.expiry_date.toISOString().split('T')[0] : null,
      RedeemedAt: v.redeemed_at ? v.redeemed_at.toISOString() : null,
      Issuer: v.issuer || 'Buffr',
      VoucherCode: v.voucher_code,
      NamQRCode: v.namqr_code,
      Metadata: v.metadata,
      CreatedDateTime: v.created_at,
      UpdatedDateTime: v.updated_at,
    };

    return helpers.success(
      { Voucher: [voucher] },
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching voucher:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the voucher',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetVoucher,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
