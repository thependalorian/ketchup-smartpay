/**
 * Open Banking API: /api/v1/fineract/wallets/{walletId}/transactions
 * 
 * Get Fineract wallet transaction history (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

async function handleGetWalletTransactions(
  req: ExpoRequest,
  { params }: { params: { walletId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const walletId = parseInt(params.walletId);
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const { page, pageSize } = parsePaginationParams(req);

    // Get wallet transactions
    const transactions = await fineractService.getWalletTransactions(
      walletId,
      {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      },
      {
        userId: searchParams.get('user_id') || undefined,
      }
    );

    // Get wallet details for context
    const wallet = await fineractService.getWallet(walletId, {
      userId: searchParams.get('user_id') || undefined,
    });

    // Format as Open Banking transactions
    const formattedTransactions = transactions.map((t: any) => ({
      TransactionId: t.id,
      TransactionType: t.transactionType.value,
      Amount: parseFloat(t.amount.toString()),
      BalanceAfter: parseFloat(t.balanceAfter.toString()),
      TransactionDate: t.transactionDate,
      Reference: t.reference,
      Description: t.description,
      Channel: t.channel,
      CounterpartyWalletId: t.counterpartyWalletId || null,
      IPSTransactionId: t.ipsTransactionId || null,
    }));

    // For pagination, we need total count (simplified - use transactions length)
    const total = formattedTransactions.length;

    const walletContext = {
      WalletId: wallet.id,
      WalletNumber: wallet.walletNumber,
      CurrentBalance: parseFloat(wallet.balance.toString()),
      AvailableBalance: parseFloat(wallet.availableBalance?.toString() || wallet.balance.toString()),
      CurrencyCode: wallet.currencyCode,
    };

    return helpers.paginated(
      formattedTransactions,
      'Transactions',
      `/api/v1/fineract/wallets/${walletId}/transactions`,
      page,
      pageSize,
      total,
      req,
      fromDate || toDate ? { from: fromDate, to: toDate } : undefined,
      fromDate,
      toDate,
      context?.requestId,
      walletContext
    );
  } catch (error) {
    log.error('Error getting Fineract wallet transactions:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving transactions',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetWalletTransactions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
