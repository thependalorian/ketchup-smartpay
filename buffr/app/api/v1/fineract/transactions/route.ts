/**
 * Open Banking API: /api/v1/fineract/transactions
 * 
 * Sync transactions to Fineract (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

async function handleSyncTransaction(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { TransactionId, UserId, TransactionType, Amount, Currency, Reference, Description } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!TransactionId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field TransactionId is missing',
          'Data.TransactionId'
        )
      );
    }

    if (!UserId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field UserId is missing',
          'Data.UserId'
        )
      );
    }

    if (!TransactionType) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field TransactionType is missing',
          'Data.TransactionType'
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
    const amountCheck = validateAmount(Amount, { min: 0.01 });
    if (!amountCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        amountCheck.error || 'Invalid amount',
        400
      );
    }

    // Get Fineract account for user
    const accounts = await query<any>(
      'SELECT fineract_account_id, account_type FROM fineract_accounts WHERE user_id = $1 LIMIT 1',
      [UserId]
    );

    if (accounts.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Fineract account not found for user. Please create account first.',
        404
      );
    }

    const account = accounts[0];

    // Sync transaction to Fineract
    const fineractTransaction = await fineractService.syncTransaction(
      TransactionId,
      account.fineract_account_id,
      {
        transactionType: TransactionType as 'DEBIT' | 'CREDIT',
        amount: Amount,
        currency: Currency || 'NAD',
        reference: Reference || TransactionId,
        description: Description || `Transaction sync: ${TransactionId}`,
      }
    );

    const syncResponse = {
      Data: {
        TransactionId,
        FineractTransactionId: fineractTransaction.id,
        AccountId: account.fineract_account_id,
        TransactionType,
        Amount,
        Currency: Currency || 'NAD',
        Synced: true,
      },
      Links: {
        Self: `/api/v1/fineract/transactions?transaction_id=${TransactionId}`,
      },
      Meta: {},
    };

    return helpers.created(
      syncResponse,
      `/api/v1/fineract/transactions?transaction_id=${TransactionId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error syncing transaction to Fineract:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while syncing the transaction',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleSyncTransaction,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
