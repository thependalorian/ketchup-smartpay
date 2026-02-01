/**
 * Fineract Wallet Transfer API Route
 * 
 * Location: app/api/fineract/wallets/[id]/transfer/route.ts
 * Purpose: Transfer between wallets (fineract-wallets module)
 * 
 * Methods:
 * - PUT: Transfer between wallets (instant, via IPS)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function putHandler(req: ExpoRequest, { params }: { params: { id: string } }) {
  try {
    const fromWalletId = parseInt(params.id); // Fineract wallet ID (source)
    const body = await req.json();
    const {
      toWalletId, // Fineract wallet ID (destination)
      amount,
      transactionDate, // yyyy-MM-dd (optional, defaults to today)
      reference,
      description,
      channel = 'api', // 'mobile_app' | 'ussd' | 'sms' | 'api'
      ipsTransactionId, // IPS transaction ID for wallet-to-wallet transfers
    } = body;

    if (!toWalletId || !amount || amount <= 0) {
      return errorResponse(
        'toWalletId and amount are required, amount must be greater than 0',
        HttpStatus.BAD_REQUEST
      );
    }

    // Check source wallet balance first
    const fromWallet = await fineractService.getWallet(fromWalletId, {
      userId: body.userId || undefined,
    });

    if (fromWallet.availableBalance < parseFloat(amount.toString())) {
      return errorResponse('Insufficient balance', HttpStatus.BAD_REQUEST);
    }

    // Transfer between wallets (instant, via IPS if ipsTransactionId provided)
    const transaction = await fineractService.transferBetweenWallets(
      fromWalletId,
      {
        toWalletId: parseInt(toWalletId.toString()),
        amount: parseFloat(amount.toString()),
        transactionDate: transactionDate || new Date().toISOString().split('T')[0],
        reference,
        description,
        channel: channel as 'mobile_app' | 'ussd' | 'sms' | 'api',
        ipsTransactionId,
      },
      {
        userId: body.userId || undefined,
      }
    );

    // Get updated wallet balances
    const updatedFromWallet = await fineractService.getWallet(fromWalletId, {
      userId: body.userId || undefined,
    });
    const updatedToWallet = await fineractService.getWallet(parseInt(toWalletId.toString()), {
      userId: body.userId || undefined,
    });

    return successResponse({
      transactionId: transaction.id,
      fromWalletId: updatedFromWallet.id,
      fromWalletNumber: updatedFromWallet.walletNumber,
      toWalletId: updatedToWallet.id,
      toWalletNumber: updatedToWallet.walletNumber,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      transactionDate: transaction.transactionDate,
      reference: transaction.reference,
      channel: transaction.channel,
      ipsTransactionId: transaction.ipsTransactionId,
      fromWalletBalance: updatedFromWallet.balance,
      fromWalletAvailableBalance: updatedFromWallet.availableBalance,
      toWalletBalance: updatedToWallet.balance,
      toWalletAvailableBalance: updatedToWallet.availableBalance,
    }, 'Transfer successful');
  } catch (error: any) {
    logger.error('Error transferring between Fineract wallets', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to transfer between wallets',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const PUT = secureAdminRoute(RATE_LIMITS.admin, putHandler);
