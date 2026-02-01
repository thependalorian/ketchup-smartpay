/**
 * Open Banking API: /api/v1/wallets/{walletId}/balance
 * 
 * Get wallet balance (Open Banking format)
 * 
 * Features:
 * - Open Banking account balance format
 * - Real-time balance from Fineract
 * - API versioning (v1)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';

async function handleGetBalance(
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
    const { walletId } = params;

    // Verify wallet belongs to user
    const wallets = await query<any>(
      'SELECT * FROM wallets WHERE id = $1 AND user_id = $2',
      [walletId, actualUserId]
    );

    if (wallets.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Wallet with ID '${walletId}' not found`,
        404
      );
    }

    const wallet = wallets[0];

    // Get balance from Fineract if available
    let balance = parseFloat(wallet.balance.toString());
    let availableBalance = balance;
    let currency = wallet.currency || 'NAD';

    try {
      const fineractWallet = await fineractService.getWallet(walletId);
      balance = parseFloat(fineractWallet.balance.toString());
      availableBalance = parseFloat(fineractWallet.availableBalance?.toString() || fineractWallet.balance.toString());
      currency = fineractWallet.currencyCode || currency;
    } catch (error) {
      // Fallback to DB wallet balance
      log.warn('Fineract wallet not found, using DB balance:', error);
    }

    // Format as Open Banking balance
    const balanceResponse = {
      Data: {
        AccountId: walletId,
        Balance: [
          {
            AccountId: walletId,
            Amount: {
              Amount: balance.toFixed(2),
              Currency: currency,
            },
            CreditDebitIndicator: balance >= 0 ? 'Credit' : 'Debit',
            Type: 'InterimBooked',
            DateTime: wallet.updated_at || wallet.created_at,
            CreditLine: availableBalance !== balance ? [
              {
                Included: true,
                Amount: {
                  Amount: (availableBalance - balance).toFixed(2),
                  Currency: currency,
                },
                Type: 'PreAgreed',
              },
            ] : undefined,
          },
        ],
      },
      Links: {
        Self: `/api/v1/wallets/${walletId}/balance`,
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
    log.error('Error fetching wallet balance:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the wallet balance',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBalance,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
