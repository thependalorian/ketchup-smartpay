/**
 * Open Banking API: /api/v1/wallets/{walletId}/autopay/history
 * 
 * Get AutoPay transaction history (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetAutopayHistory(
  req: ExpoRequest,
  { params }: { params: { walletId: string } }
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
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const { walletId } = params;

    // Verify wallet ownership
    const walletCheck = await query<any>(
      'SELECT id FROM wallets WHERE id = $1 AND user_id = $2',
      [walletId, actualUserId]
    );

    if (walletCheck.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Wallet not found or access denied',
        404
      );
    }

    // Parse pagination
    const { page, pageSize } = parsePaginationParams(req);

    // Get total count
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM autopay_transactions WHERE wallet_id = $1',
      [walletId]
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Fetch transactions
    const offset = (page - 1) * pageSize;
    const transactions = await query<any>(
      `SELECT * FROM autopay_transactions 
       WHERE wallet_id = $1 
       ORDER BY executed_at DESC 
       LIMIT $2 OFFSET $3`,
      [walletId, pageSize, offset]
    );

    // Format as Open Banking transactions
    const formattedTransactions = transactions.map((tx: any) => ({
      TransactionId: tx.id,
      RuleId: tx.rule_id || null,
      WalletId: tx.wallet_id,
      Amount: parseFloat(tx.amount.toString()),
      Status: tx.status,
      ExecutedDateTime: tx.executed_at.toISOString(),
      FailureReason: tx.failure_reason || null,
      Recipient: tx.recipient_id ? {
        Id: tx.recipient_id,
        Name: tx.recipient_name || 'Unknown',
      } : null,
      RuleDescription: tx.rule_description || 'AutoPay payment',
      AuthorisationCode: tx.authorisation_code || null,
    }));

    return helpers.paginated(
      formattedTransactions,
      'AutoPayTransactions',
      `/api/v1/wallets/${walletId}/autopay/history`,
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
    log.error('Error fetching AutoPay history:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching AutoPay history',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetAutopayHistory,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
