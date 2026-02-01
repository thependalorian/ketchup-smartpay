/**
 * Open Banking API: /api/v1/cashback/offers
 * 
 * Get available cashback offers (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetCashbackOffers(req: ExpoRequest) {
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
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Get merchants with active cashback offers
    const merchants = await query<any>(
      `SELECT 
        id, name, category, location, cashback_rate, is_active, is_open
      FROM merchants
      WHERE is_active = TRUE AND cashback_rate > 0
      ORDER BY cashback_rate DESC, name ASC
      LIMIT 20`,
      []
    );

    const formattedOffers = merchants.map((m: any) => ({
      OfferId: m.id,
      MerchantId: m.id,
      MerchantName: m.name,
      Category: m.category,
      Location: m.location,
      CashbackRate: parseFloat(m.cashback_rate.toString()),
      ValidUntil: null, // Can be extended to add offer expiry
      Description: `Get ${m.cashback_rate}% cashback when you pay at ${m.name}`,
      IsActive: m.is_active || false,
      IsOpen: m.is_open || false,
    }));

    const response = {
      Data: {
        Offers: formattedOffers,
        Total: formattedOffers.length,
      },
      Links: {
        Self: '/api/v1/cashback/offers',
      },
      Meta: {},
    };

    return helpers.success(
      response,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching cashback offers:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching cashback offers',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetCashbackOffers,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
