/**
 * Open Banking API: /api/v1/wallets/{walletId}
 * 
 * Get single wallet/account (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';

async function handleGetWallet(
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

    // Fetch wallet
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

    // Try to get Fineract wallet for additional details
    let fineractWallet = null;
    try {
      fineractWallet = await fineractService.getWallet(walletId);
    } catch (error) {
      // Fallback to DB wallet
    }

    const balance = fineractWallet 
      ? parseFloat(fineractWallet.balance.toString())
      : parseFloat(wallet.balance.toString());

    const account = {
      AccountId: wallet.id,
      Status: wallet.status === 'active' ? 'Enabled' : 'Disabled',
      StatusUpdateDateTime: wallet.updated_at || wallet.created_at,
      Currency: wallet.currency || 'NAD',
      AccountType: 'Personal',
      AccountSubType: 'CurrentAccount',
      Nickname: wallet.name || 'Buffr Wallet',
      Account: [
        {
          SchemeName: 'BuffrAccount',
          Identification: wallet.id,
          Name: wallet.name || 'Buffr Wallet',
          SecondaryIdentification: wallet.id,
        },
      ],
      Servicer: {
        SchemeName: 'Buffr',
        Identification: 'BUFFR',
      },
      Balance: [
        {
          AccountId: wallet.id,
          Amount: {
            Amount: balance.toFixed(2),
            Currency: wallet.currency || 'NAD',
          },
          CreditDebitIndicator: balance >= 0 ? 'Credit' : 'Debit',
          Type: 'InterimBooked',
          DateTime: wallet.updated_at || wallet.created_at,
        },
      ],
    };

    return helpers.success(
      { Account: [account] },
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching wallet:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the wallet',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetWallet,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
