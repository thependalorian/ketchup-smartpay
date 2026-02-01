/**
 * Open Banking API: /api/v1/payments/split-bill
 * 
 * Create split bill (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount, validateCurrency } from '@/utils/validators';
import { log } from '@/utils/logger';
import { twoFactorTokens } from '@/utils/redisClient';
import { randomUUID } from 'crypto';

async function handleCreateSplitBill(req: ExpoRequest) {
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

    const { TotalAmount, Currency, Description, Participants, WalletId } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!TotalAmount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field TotalAmount is missing',
          'Data.TotalAmount'
        )
      );
    }

    if (!Participants || !Array.isArray(Participants) || Participants.length === 0) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Participants is missing or empty',
          'Data.Participants'
        )
      );
    }

    if (!WalletId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field WalletId is missing',
          'Data.WalletId'
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
    const amountCheck = validateAmount(TotalAmount, { min: 0.01, max: 1000000, maxDecimals: 2 });
    if (!amountCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        amountCheck.error || 'Invalid amount',
        400
      );
    }

    // Validate currency
    const currency = Currency || 'NAD';
    if (!validateCurrency(currency)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid currency code',
        400
      );
    }

    // Validate total matches sum of participant amounts
    const participantSum = Participants.reduce((sum: number, p: any) => sum + (p.Amount || 0), 0);
    if (Math.abs(participantSum - TotalAmount) > 0.01) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        `Total amount (${TotalAmount}) must equal sum of participant amounts (${participantSum})`,
        400
      );
    }

    // Verify wallet ownership
    const walletCheck = await query<any>(
      'SELECT id FROM wallets WHERE id = $1 AND user_id = $2',
      [WalletId, actualUserId]
    );

    if (walletCheck.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Wallet not found or access denied',
        400
      );
    }

    // Create split bill
    const splitBillId = randomUUID();
    await query(
      `INSERT INTO split_bills (
        id, creator_id, total_amount, currency, description, status, paid_amount, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        splitBillId,
        actualUserId,
        TotalAmount,
        currency,
        Description || null,
        'pending',
        0,
        new Date(),
      ]
    );

    // Create participants
    for (const participant of Participants) {
      await query(
        `INSERT INTO split_bill_participants (
          id, split_bill_id, user_id, amount, paid_amount, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          randomUUID(),
          splitBillId,
          participant.UserId || participant.PhoneNumber,
          participant.Amount,
          0,
          'pending',
          new Date(),
        ]
      );
    }

    const splitBillResponse = {
      Data: {
        SplitBillId: splitBillId,
        CreatorId: actualUserId,
        TotalAmount,
        Currency: currency,
        Description: Description || null,
        Status: 'pending',
        PaidAmount: 0,
        Participants: Participants.map((p: any) => ({
          UserId: p.UserId,
          Amount: p.Amount,
          Status: 'pending',
        })),
        CreatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/payments/split-bill/${splitBillId}`,
      },
      Meta: {},
    };

    return helpers.created(
      splitBillResponse,
      `/api/v1/payments/split-bill/${splitBillId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating split bill:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the split bill',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleCreateSplitBill,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
