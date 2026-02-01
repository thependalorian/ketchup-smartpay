/**
 * Open Banking API: /api/v1/fineract/wallets/{walletId}/withdraw
 * 
 * Withdraw from Fineract wallet (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { fineractService } from '@/services/fineractService';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';

async function handleWithdraw(
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

    // Check wallet balance first
    const wallet = await fineractService.getWallet(walletId, {
      userId: Data.UserId || undefined,
    });

    if (wallet.availableBalance < Amount) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient balance',
        400
      );
    }

    // Withdraw from wallet
    const transaction = await fineractService.withdrawFromWallet(
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
    const updatedWallet = await fineractService.getWallet(walletId, {
      userId: Data.UserId || undefined,
    });

    const withdrawResponse = {
      Data: {
        TransactionId: transaction.id,
        WalletId: updatedWallet.id,
        WalletNumber: updatedWallet.walletNumber,
        Amount: transaction.amount,
        BalanceAfter: transaction.balanceAfter,
        TransactionDate: transaction.transactionDate,
        Reference: transaction.reference,
        Channel: transaction.channel,
        NewBalance: parseFloat(updatedWallet.balance.toString()),
        AvailableBalance: parseFloat(updatedWallet.availableBalance?.toString() || updatedWallet.balance.toString()),
      },
      Links: {
        Self: `/api/v1/fineract/wallets/${walletId}/withdraw`,
      },
      Meta: {},
    };

    return helpers.success(
      withdrawResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error withdrawing from Fineract wallet:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the withdrawal',
      500
    );
  }
}

export const PUT = openBankingSecureRoute(
  handleWithdraw,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
