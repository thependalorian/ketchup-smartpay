/**
 * Open Banking API: /api/v1/transactions/{transactionId}
 * 
 * Get single transaction (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { mapTransactionRow } from '@/utils/db-adapters';
import { log } from '@/utils/logger';

async function handleGetTransaction(
  req: ExpoRequest,
  { params }: { params: { transactionId: string } }
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

    const { transactionId } = params;

    // Fetch transaction
    const transactions = await query<any>(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, actualUserId]
    );

    if (transactions.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Transaction with ID '${transactionId}' not found`,
        404
      );
    }

    const tx = transactions[0];
    const mapped = mapTransactionRow(tx);

    const transaction = {
      TransactionId: mapped.id,
      AccountId: mapped.wallet_id,
      Amount: {
        Amount: parseFloat(mapped.amount.toString()),
        Currency: mapped.currency,
      },
      CreditDebitIndicator: mapped.type === 'credit' ? 'Credit' : 'Debit',
      Status: mapped.status === 'completed' ? 'Booked' : 'Pending',
      BookingDateTime: mapped.date,
      ValueDateTime: mapped.date,
      TransactionInformation: mapped.description,
      TransactionReference: mapped.id,
      MerchantDetails: mapped.recipient_name ? {
        MerchantName: mapped.recipient_name,
      } : undefined,
      Category: mapped.category,
    };

    return helpers.success(
      { Transaction: [transaction] },
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching transaction:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the transaction',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetTransaction,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
