/**
 * Open Banking API: /api/v1/fineract/wallets/{walletId}/deposit
 * 
 * Deposit to Fineract wallet (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { fineractService } from '@/services/fineractService';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';

async function handleDeposit(
  req: ExpoRequest,
  { params }: { params: { walletId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const walletId = parseInt(params.walletId);
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Amount, TransactionDate, Reference, Description, Channel } = Data;

    if (!Amount) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Amount is required',
        400
      );
    }

    // Validate amount
    const amountCheck = validateAmount(Amount, { min: 0.01, max: 1000000, maxDecimals: 2 });
    if (!amountCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        amountCheck.error || 'Invalid amount',
        400
      );
    }

    // Deposit to wallet
    const transaction = await fineractService.depositToWallet(
      walletId,
      {
        amount: Amount,
        transactionDate: TransactionDate || new Date().toISOString().split('T')[0],
        reference: Reference,
        description: Description,
        channel: (Channel || 'api') as 'mobile_app' | 'ussd' | 'sms' | 'api',
      },
      {
        userId: Data.UserId || undefined,
        requestId: context?.requestId,
      }
    );

    // Get updated wallet balance
    const wallet = await fineractService.getWallet(walletId, {
      userId: Data.UserId || undefined,
    });

    const depositResponse = {
      Data: {
        TransactionId: transaction.id,
        WalletId: wallet.id,
        WalletNumber: wallet.walletNumber,
        Amount: transaction.amount,
        BalanceAfter: transaction.balanceAfter,
        TransactionDate: transaction.transactionDate,
        Reference: transaction.reference,
        Channel: transaction.channel,
        NewBalance: parseFloat(wallet.balance.toString()),
        AvailableBalance: parseFloat(wallet.availableBalance?.toString() || wallet.balance.toString()),
      },
      Links: {
        Self: `/api/v1/fineract/wallets/${walletId}/deposit`,
      },
      Meta: {},
    };

    return helpers.success(
      depositResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error depositing to Fineract wallet:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the deposit',
      500
    );
  }
}

export const PUT = openBankingSecureRoute(
  handleDeposit,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
