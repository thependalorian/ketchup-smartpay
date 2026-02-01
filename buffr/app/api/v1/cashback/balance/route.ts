/**
 * Open Banking API: /api/v1/cashback/balance
 * 
 * Get cashback balance (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetCashbackBalance(req: ExpoRequest) {
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

    // Get total cashback earned (sum of all completed cashback transactions)
    const cashbackResult = await query<{ total: string }>(
      `SELECT COALESCE(SUM(cashback_amount), 0) as total
       FROM cashback_transactions
       WHERE user_id = $1 AND status = 'completed'`,
      [actualUserId]
    );

    const balance = parseFloat(cashbackResult[0]?.total || '0');

    const response = {
      Data: {
        Balance: {
          Amount: balance,
          Currency: 'NAD',
        },
      },
      Links: {
        Self: '/api/v1/cashback/balance',
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
    log.error('Error fetching cashback balance:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching cashback balance',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetCashbackBalance,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
