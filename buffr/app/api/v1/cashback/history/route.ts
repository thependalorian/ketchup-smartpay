/**
 * Open Banking API: /api/v1/cashback/history
 * 
 * Get cashback transaction history (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetCashbackHistory(req: ExpoRequest) {
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

    const { page, pageSize } = parsePaginationParams(req);
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM cashback_transactions WHERE user_id = $1`,
      [actualUserId]
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get cashback transactions with merchant details
    const offset = limit ? 0 : (page - 1) * pageSize;
    const limitValue = limit || pageSize;

    const transactions = await query<any>(
      `SELECT 
        ct.id, ct.merchant_id, ct.transaction_id, ct.payment_amount,
        ct.cashback_amount, ct.cashback_rate, ct.status, ct.credited_at,
        ct.created_at, m.name as merchant_name
      FROM cashback_transactions ct
      LEFT JOIN merchants m ON ct.merchant_id = m.id
      WHERE ct.user_id = $1
      ORDER BY ct.created_at DESC
      LIMIT $2 OFFSET $3`,
      [actualUserId, limitValue, offset]
    );

    const formattedTransactions = transactions.map((t: any) => ({
      CashbackTransactionId: t.id,
      MerchantId: t.merchant_id || null,
      MerchantName: t.merchant_name || null,
      TransactionId: t.transaction_id || null,
      PaymentAmount: parseFloat(t.payment_amount.toString()),
      CashbackAmount: parseFloat(t.cashback_amount.toString()),
      CashbackRate: parseFloat(t.cashback_rate.toString()),
      Status: t.status || 'completed',
      CreditedAt: t.credited_at ? t.credited_at.toISOString() : null,
      CreatedDateTime: t.created_at?.toISOString() || null,
    }));

    // Calculate pagination (only if not using limit)
    let paginationLinks = null;
    let meta = {};
    
    if (!limit) {
      const totalPages = Math.ceil(total / pageSize);
      const baseUrl = '/api/v1/cashback/history';

      paginationLinks = {
        Self: `${baseUrl}?page=${page}&page-size=${pageSize}`,
        First: `${baseUrl}?page=1&page-size=${pageSize}`,
        Prev: page > 1 ? `${baseUrl}?page=${page - 1}&page-size=${pageSize}` : null,
        Next: page < totalPages ? `${baseUrl}?page=${page + 1}&page-size=${pageSize}` : null,
        Last: `${baseUrl}?page=${totalPages}&page-size=${pageSize}`,
      };

      meta = {
        TotalPages: totalPages,
      };
    }

    const response = {
      Data: {
        CashbackTransactions: formattedTransactions,
        ...(paginationLinks && { Links: paginationLinks }),
        ...(Object.keys(meta).length > 0 && { Meta: meta }),
      },
      ...(!paginationLinks && {
        Links: {
          Self: '/api/v1/cashback/history',
        },
        Meta: {},
      }),
    };

    return helpers.success(
      response,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching cashback history:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching cashback history',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetCashbackHistory,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
