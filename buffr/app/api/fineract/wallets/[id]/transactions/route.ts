/**
 * Fineract Wallet Transactions API Route
 * 
 * Location: app/api/fineract/wallets/[id]/transactions/route.ts
 * Purpose: Get wallet transaction history (fineract-wallets module)
 * 
 * Methods:
 * - GET: Get wallet transaction history
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest, { params }: { params: { id: string } }) {
  try {
    const walletId = parseInt(params.id); // Fineract wallet ID
    const { searchParams } = new URL(req.url);
    
    const fromDate = searchParams.get('from_date'); // yyyy-MM-dd
    const toDate = searchParams.get('to_date'); // yyyy-MM-dd
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    // Get wallet transactions
    const transactions = await fineractService.getWalletTransactions(
      walletId,
      {
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        limit,
        offset,
      },
      {
        userId: searchParams.get('user_id') || undefined,
      }
    );

    // Get wallet details for context
    const wallet = await fineractService.getWallet(walletId, {
      userId: searchParams.get('user_id') || undefined,
    });

    return successResponse({
      walletId: wallet.id,
      walletNumber: wallet.walletNumber,
      currentBalance: wallet.balance,
      availableBalance: wallet.availableBalance,
      currencyCode: wallet.currencyCode,
      transactions: transactions.map(t => ({
        id: t.id,
        transactionType: t.transactionType.value,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        transactionDate: t.transactionDate,
        reference: t.reference,
        description: t.description,
        channel: t.channel,
        counterpartyWalletId: t.counterpartyWalletId,
        ipsTransactionId: t.ipsTransactionId,
      })),
      total: transactions.length,
    }, 'Transactions retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting Fineract wallet transactions', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve transactions',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.api, getHandler);
