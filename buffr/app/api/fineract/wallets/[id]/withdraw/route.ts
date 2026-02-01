/**
 * Fineract Wallet Withdrawal API Route
 * 
 * Location: app/api/fineract/wallets/[id]/withdraw/route.ts
 * Purpose: Withdraw funds from wallet (fineract-wallets module)
 * 
 * Methods:
 * - PUT: Withdraw from wallet (instant debit)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function putHandler(req: ExpoRequest, { params }: { params: { id: string } }) {
  try {
    const walletId = parseInt(params.id); // Fineract wallet ID
    const body = await req.json();
    const {
      amount,
      transactionDate, // yyyy-MM-dd (optional, defaults to today)
      reference,
      description,
      channel = 'api', // 'mobile_app' | 'ussd' | 'sms' | 'api'
    } = body;

    if (!amount || amount <= 0) {
      return errorResponse('amount is required and must be greater than 0', HttpStatus.BAD_REQUEST);
    }

    // Check wallet balance first
    const wallet = await fineractService.getWallet(walletId, {
      userId: body.userId || undefined,
    });

    if (wallet.availableBalance < parseFloat(amount.toString())) {
      return errorResponse('Insufficient balance', HttpStatus.BAD_REQUEST);
    }

    // Withdraw from wallet (instant debit)
    const transaction = await fineractService.withdrawFromWallet(
      walletId,
      {
        amount: parseFloat(amount.toString()),
        transactionDate: transactionDate || new Date().toISOString().split('T')[0],
        reference,
        description,
        channel: channel as 'mobile_app' | 'ussd' | 'sms' | 'api',
      },
      {
        userId: body.userId || undefined,
      }
    );

    // Get updated wallet balance
    const updatedWallet = await fineractService.getWallet(walletId, {
      userId: body.userId || undefined,
    });

    return successResponse({
      transactionId: transaction.id,
      walletId: updatedWallet.id,
      walletNumber: updatedWallet.walletNumber,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      transactionDate: transaction.transactionDate,
      reference: transaction.reference,
      channel: transaction.channel,
      newBalance: updatedWallet.balance,
      availableBalance: updatedWallet.availableBalance,
    }, 'Withdrawal successful');
  } catch (error: any) {
    logger.error('Error withdrawing from Fineract wallet', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to withdraw from wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const PUT = secureAdminRoute(RATE_LIMITS.admin, putHandler);
