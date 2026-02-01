/**
 * Open Banking API: /api/v1/nampost/cash-out
 * 
 * NamPost cash-out (Open Banking format)
 * 
 * Compliance: PSD-12 (2FA required)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { namPostService } from '@/services/namPostService';
import { twoFactorTokens } from '@/utils/redisClient';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

async function handleCashOut(req: ExpoRequest) {
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
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const body = await req.json();
    const { Data, verificationToken } = body;

    // PSD-12 Compliance: Require 2FA
    if (!verificationToken) {
      return helpers.error(
        OpenBankingErrorCode.SCA_REQUIRED,
        '2FA verification required',
        401
      );
    }

    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    if (!tokenData) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Invalid or expired 2FA verification token',
        401
      );
    }

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { BranchId, Amount, VoucherId } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!BranchId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field BranchId is missing',
          'Data.BranchId'
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

    // Process cash-out via NamPost service
    const result = await namPostService.processCashOut({
      userId: actualUserId,
      branchId: BranchId,
      amount: Amount,
      voucherId: VoucherId,
    });

    const transactionId = result.transactionId || randomUUID();

    // Create transaction record
    await query(
      `INSERT INTO transactions (
        id, user_id, transaction_type, amount, currency,
        description, status, payment_method, payment_reference,
        transaction_time, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        transactionId,
        actualUserId,
        'cash_out',
        Amount,
        'NAD',
        'NamPost Cash-Out',
        result.status || 'completed',
        'nampost_cash_out',
        result.nampostReference || transactionId,
        new Date(),
        new Date(),
      ]
    ).catch(err => log.error('Failed to create transaction record:', err));

    const cashOutResponse = {
      Data: {
        TransactionId: transactionId,
        BranchId,
        Amount,
        Currency: 'NAD',
        Status: result.status || 'completed',
        VoucherId: VoucherId || null,
        NamPostReference: result.nampostReference,
        CreatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/transactions/${transactionId}`,
      },
      Meta: {},
    };

    return helpers.created(
      cashOutResponse,
      `/api/v1/transactions/${transactionId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error processing NamPost cash-out:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the cash-out',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleCashOut,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
