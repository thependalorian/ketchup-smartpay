/**
 * Transfer to Savings API
 * 
 * Location: app/api/v1/savings/transfer/route.ts
 * Purpose: Transfer funds from main wallet to savings wallet
 * 
 * Endpoint: POST /api/v1/savings/transfer
 */

import { ExpoRequest } from 'expo-router/server';
import { savingsWalletService } from '@/services/savingsWalletService';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { getUserIdFromRequest } from '@/utils/db';
import { log } from '@/utils/logger';

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const { amount, goalId } = body;

    if (!amount || amount <= 0) {
      return errorResponse('amount is required and must be greater than 0', HttpStatus.BAD_REQUEST);
    }

    await savingsWalletService.transferToSavings(userId, amount, goalId);

    return successResponse(
      {
        message: `N$${amount} transferred to savings wallet${goalId ? ' goal' : ''}`,
        amount,
        goalId: goalId || null,
      },
      'Transfer to savings completed successfully'
    );
  } catch (error: any) {
    log.error('Error transferring to savings:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to transfer to savings',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.standard, postHandler);
