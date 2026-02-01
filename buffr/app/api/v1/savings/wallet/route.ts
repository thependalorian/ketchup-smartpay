/**
 * Savings Wallet API
 * 
 * Location: app/api/v1/savings/wallet/route.ts
 * Purpose: Manage savings wallets
 * 
 * Endpoints:
 * - GET /api/v1/savings/wallet - Get user's savings wallet
 * - POST /api/v1/savings/wallet - Create savings wallet
 */

import { ExpoRequest } from 'expo-router/server';
import { savingsWalletService } from '@/services/savingsWalletService';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { getUserIdFromRequest } from '@/utils/db';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const savingsWallet = await savingsWalletService.getSavingsWallet(userId);

    if (!savingsWallet) {
      return successResponse(
        {
          savingsWallet: null,
          message: 'No savings wallet found',
        },
        'No savings wallet found'
      );
    }

    return successResponse(
      {
        savingsWallet: {
          id: savingsWallet.id,
          userId: savingsWallet.user_id,
          name: savingsWallet.name,
          balance: parseFloat(savingsWallet.balance.toString()),
          availableBalance: parseFloat(savingsWallet.available_balance.toString()),
          lockedBalance: parseFloat(savingsWallet.locked_balance.toString()),
          interestRate: parseFloat(savingsWallet.interest_rate.toString()),
          interestEarned: parseFloat(savingsWallet.interest_earned.toString()),
          lockPeriodDays: savingsWallet.lock_period_days,
          lockUntilDate: savingsWallet.lock_until_date,
          status: savingsWallet.status,
        },
      },
      'Savings wallet retrieved successfully'
    );
  } catch (error: any) {
    log.error('Error getting savings wallet:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get savings wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const { name, interestRate, lockPeriodDays } = body;

    const savingsWallet = await savingsWalletService.createSavingsWallet(userId, {
      name,
      interestRate,
      lockPeriodDays,
    });

    return successResponse(
      {
        savingsWallet: {
          id: savingsWallet.id,
          userId: savingsWallet.user_id,
          name: savingsWallet.name,
          balance: parseFloat(savingsWallet.balance.toString()),
          interestRate: parseFloat(savingsWallet.interest_rate.toString()),
          status: savingsWallet.status,
        },
        message: 'Savings wallet created successfully',
      },
      'Savings wallet created successfully',
      HttpStatus.CREATED
    );
  } catch (error: any) {
    log.error('Error creating savings wallet:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create savings wallet',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.standard, getHandler);
export const POST = secureAuthRoute(RATE_LIMITS.standard, postHandler);
