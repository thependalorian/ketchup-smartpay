/**
 * Open Banking API: /api/v1/fineract/wallets/{walletId}/transfer
 * 
 * Transfer between Fineract wallets (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { fineractService } from '@/services/fineractService';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';

async function handleTransfer(
  req: ExpoRequest,
  { params }: { params: { walletId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const fromWalletId = parseInt(params.walletId);
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { ToWalletId, Amount, TransactionDate, Reference, Description, Channel, IPSTransactionId } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!ToWalletId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field ToWalletId is missing',
          'Data.ToWalletId'
        )
      );
    }

    if (!Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Amount'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
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

    // Check source wallet balance
    const fromWallet = await fineractService.getWallet(fromWalletId, {
      userId: Data.UserId || undefined,
    });

    if (fromWallet.availableBalance < Amount) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient balance',
        400
      );
    }

    // Transfer between wallets
    const transaction = await fineractService.transferBetweenWallets(
      fromWalletId,
      {
        toWalletId: parseInt(ToWalletId.toString()),
        amount: Amount,
        transactionDate: TransactionDate || new Date().toISOString().split('T')[0],
        reference: Reference,
        description: Description,
        channel: (Channel || 'api') as 'mobile_app' | 'ussd' | 'sms' | 'api',
        ipsTransactionId: IPSTransactionId,
      },
      {
        userId: Data.UserId || undefined,
        requestId: context?.requestId,
      }
    );

    // Get updated wallet balances
    const updatedFromWallet = await fineractService.getWallet(fromWalletId, {
      userId: Data.UserId || undefined,
    });
    const updatedToWallet = await fineractService.getWallet(parseInt(ToWalletId.toString()), {
      userId: Data.UserId || undefined,
    });

    const transferResponse = {
      Data: {
        TransactionId: transaction.id,
        FromWalletId: updatedFromWallet.id,
        FromWalletNumber: updatedFromWallet.walletNumber,
        ToWalletId: updatedToWallet.id,
        ToWalletNumber: updatedToWallet.walletNumber,
        Amount: transaction.amount,
        BalanceAfter: transaction.balanceAfter,
        TransactionDate: transaction.transactionDate,
        Reference: transaction.reference,
        Channel: transaction.channel,
        IPSTransactionId: transaction.ipsTransactionId,
        FromWalletBalance: parseFloat(updatedFromWallet.balance.toString()),
        FromWalletAvailableBalance: parseFloat(updatedFromWallet.availableBalance?.toString() || updatedFromWallet.balance.toString()),
        ToWalletBalance: parseFloat(updatedToWallet.balance.toString()),
        ToWalletAvailableBalance: parseFloat(updatedToWallet.availableBalance?.toString() || updatedToWallet.balance.toString()),
      },
      Links: {
        Self: `/api/v1/fineract/wallets/${fromWalletId}/transfer`,
      },
      Meta: {},
    };

    return helpers.success(
      transferResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error transferring between Fineract wallets:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the transfer',
      500
    );
  }
}

export const PUT = openBankingSecureRoute(
  handleTransfer,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
