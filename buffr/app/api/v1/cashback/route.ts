/**
 * Open Banking API: /api/v1/cashback
 * 
 * Open Banking-compliant cashback endpoint
 * 
 * Features:
 * - Open Banking cashback format
 * - Cashback history with pagination
 * - Cashback balance retrieval
 * - API versioning (v1)
 * 
 * Note: Cashback functionality is planned for Phase 2 (Q2 2026)
 * This endpoint provides the structure for future cashback implementation
 * 
 * Example requests:
 * GET /api/v1/cashback?page=1&page-size=25
 * GET /api/v1/cashback/balance
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';
import { cashbackService } from '@/services/cashbackService';

/**
 * GET /api/v1/cashback
 * List cashback transactions with Open Banking pagination
 * 
 * Note: Currently returns empty list as cashback is planned for Phase 2
 */
async function handleGetCashback(req: ExpoRequest) {
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

    // Parse Open Banking pagination parameters
    const { page, pageSize } = parsePaginationParams(req);
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const status = searchParams.get('status') as 'pending' | 'credited' | 'expired' | 'cancelled' | null;

    // Get cashback history from database
    const offset = (page - 1) * pageSize;
    const { transactions, total } = await cashbackService.getCashbackHistory({
      user_id: actualUserId,
      limit: pageSize,
      offset,
      from_date: fromDate ? new Date(fromDate) : undefined,
      to_date: toDate ? new Date(toDate) : undefined,
      status: status || undefined,
    });

    // Format for Open Banking response
    const formattedCashback = transactions.map((tx) => ({
      CashbackId: tx.id,
      TransactionId: tx.transaction_id,
      Amount: {
        Amount: tx.cashback_amount.toFixed(2),
        Currency: tx.currency,
      },
      Percentage: tx.cashback_percentage.toFixed(2),
      Status: tx.status === 'credited' 
        ? 'Credited' 
        : tx.status === 'pending' 
        ? 'Pending' 
        : tx.status === 'expired'
        ? 'Expired'
        : 'Cancelled',
      EarnedDateTime: tx.earned_at,
      CreditedDateTime: tx.credited_at || null,
      ExpiresDateTime: tx.expires_at || null,
      MerchantId: tx.merchant_id || null,
    }));

    // Get base URL for pagination links
    const baseUrl = new URL(req.url).origin + '/api/v1/cashback';
    
    // Build query params for pagination links
    const queryParams: Record<string, string> = {};
    if (fromDate) queryParams.from = fromDate;
    if (toDate) queryParams.to = toDate;

    // Return Open Banking paginated response
    return helpers.paginated(
      formattedCashback,
      'Cashback',
      baseUrl,
      page,
      pageSize,
      total,
      req,
      queryParams,
      fromDate || undefined,
      toDate || new Date().toISOString(),
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching cashback:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching cashback',
      500
    );
  }
}

/**
 * GET /api/v1/cashback/balance
 * Get cashback balance
 */
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

    // Get cashback balance from database
    const balance = await cashbackService.getCashbackBalance(actualUserId);
    
    if (!balance) {
      return helpers.error(
        OpenBankingErrorCode.SERVER_ERROR,
        'Unable to fetch cashback balance',
        500
      );
    }

    // Format for Open Banking response
    const balanceResponse = {
      Data: {
        CashbackBalance: {
          TotalEarned: {
            Amount: balance.total_earned.toFixed(2),
            Currency: balance.currency,
          },
          AvailableBalance: {
            Amount: balance.available_balance.toFixed(2),
            Currency: balance.currency,
          },
          PendingBalance: {
            Amount: balance.pending_balance.toFixed(2),
            Currency: balance.currency,
          },
          RedeemedAmount: {
            Amount: balance.redeemed_amount.toFixed(2),
            Currency: balance.currency,
          },
          ExpiredAmount: {
            Amount: balance.expired_amount.toFixed(2),
            Currency: balance.currency,
          },
          TotalTransactions: balance.total_transactions,
          LastEarnedAt: balance.last_earned_at || null,
          LastRedeemedAt: balance.last_redeemed_at || null,
        },
      },
      Links: {
        Self: '/api/v1/cashback/balance',
        History: '/api/v1/cashback',
      },
      Meta: {},
    };

    return helpers.success(
      balanceResponse,
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

// Export handlers with Open Banking middleware
export const GET = openBankingSecureRoute(
  handleGetCashback,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

// Note: For /api/v1/cashback/balance, create separate route file
// app/api/v1/cashback/balance/route.ts
