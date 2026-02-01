/**
 * Open Banking API: /api/v1/accounts/balances
 * 
 * Get account balances (Open Banking format)
 * 
 * Features:
 * - Open Banking account balance format
 * - Multiple account support
 * - Real-time balances
 * - API versioning (v1)
 * 
 * Example requests:
 * GET /api/v1/accounts/balances
 * GET /api/v1/accounts/balances?AccountId=wallet-id
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';

/**
 * GET /api/v1/accounts/balances
 * Get account balances (Open Banking format)
 */
async function handleGetBalances(req: ExpoRequest) {
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

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('AccountId');

    // Get wallets/accounts
    let wallets;
    if (accountId) {
      // Single account
      wallets = await query<any>(
        'SELECT * FROM wallets WHERE id = $1 AND user_id = $2',
        [accountId, actualUserId]
      );
    } else {
      // All accounts
      wallets = await query<any>(
        'SELECT * FROM wallets WHERE user_id = $1 ORDER BY created_at DESC',
        [actualUserId]
      );
    }

    if (wallets.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        accountId ? `Account with ID '${accountId}' not found` : 'No accounts found',
        404
      );
    }

    // Format balances as Open Banking format
    const balances = await Promise.all(
      wallets.map(async (wallet) => {
        let balance = parseFloat(wallet.balance.toString());
        let availableBalance = balance;
        let currency = wallet.currency || 'NAD';

        // Try to get Fineract balance
        try {
          const fineractWallet = await fineractService.getWallet(wallet.id);
          balance = parseFloat(fineractWallet.balance.toString());
          availableBalance = parseFloat(fineractWallet.availableBalance?.toString() || fineractWallet.balance.toString());
          currency = fineractWallet.currencyCode || currency;
        } catch (error) {
          // Fallback to DB balance
        }

        return {
          AccountId: wallet.id,
          Balance: [
            {
              AccountId: wallet.id,
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
        };
      })
    );

    const balancesResponse = {
      Data: {
        Balance: balances,
      },
      Links: {
        Self: `/api/v1/accounts/balances${accountId ? `?AccountId=${accountId}` : ''}`,
      },
      Meta: {},
    };

    return helpers.success(
      balancesResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching account balances:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching account balances',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBalances,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
