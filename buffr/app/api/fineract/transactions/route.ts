/**
 * Fineract Transactions API Route
 * 
 * Location: app/api/fineract/transactions/route.ts
 * Purpose: Sync transactions to Fineract
 * 
 * Methods:
 * - POST: Sync transaction to Fineract
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount } from '@/utils/validators';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

interface FineractTransactionSyncRequest {
  transactionId: string; // Buffr transaction ID
  userId: string;
  transactionType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency?: string;
  reference?: string;
  description?: string;
}

async function postHandler(req: ExpoRequest) {
  try {
    const body: FineractTransactionSyncRequest = await req.json();
    const {
      transactionId,
      userId,
      transactionType,
      amount,
      currency = 'NAD',
      reference,
      description,
    } = body;

    if (!transactionId || !userId || !transactionType || !amount) {
      return errorResponse(
        'transactionId, userId, transactionType, and amount are required',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate amount
    const amountCheck = validateAmount(amount, { min: 0.01 });
    if (!amountCheck.valid) {
      return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
    }

    // Get Fineract account for user
    const accounts = await query<{
      fineract_account_id: number;
      account_type: string;
    }>(
      'SELECT fineract_account_id, account_type FROM fineract_accounts WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (accounts.length === 0) {
      return errorResponse(
        'Fineract account not found for user. Please create account first.',
        HttpStatus.NOT_FOUND
      );
    }

    const account = accounts[0];

    // Sync transaction to Fineract
    const fineractTransaction = await fineractService.syncTransaction(
      transactionId,
      account.fineract_account_id,
      {
        transactionType,
        amount,
        currency,
        reference: reference || transactionId,
        description: description || `Transaction sync: ${transactionId}`,
      }
    );

    return createdResponse(
      {
        transactionId,
        fineractTransactionId: fineractTransaction.id,
        accountId: account.fineract_account_id,
        transactionType,
        amount,
        currency,
        synced: true,
      },
      `/api/fineract/transactions?transaction_id=${transactionId}`,
      'Transaction synced successfully to Fineract'
    );
  } catch (error: any) {
    logger.error('Error syncing transaction to Fineract', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to sync transaction',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
