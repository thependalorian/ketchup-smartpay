/**
 * Open Banking API: /api/v1/bills/pay
 * 
 * Pay a bill (Open Banking format)
 * 
 * Compliance: PSD-12 (2FA required), Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';
import { logVoucherOperation, generateRequestId } from '@/utils/auditLogger';

async function handlePayBill(req: ExpoRequest) {
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

    // Parse Open Banking request body
    const body = await req.json();
    const { Data, verificationToken } = body;

    // PSD-12 Compliance: Require 2FA verification
    if (!verificationToken) {
      return helpers.error(
        OpenBankingErrorCode.SCA_REQUIRED,
        '2FA verification required. Please verify your PIN or biometric before paying bill.',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.SCA_REQUIRED,
            'Strong Customer Authentication (SCA) is required for bill payments',
            'verificationToken'
          ),
        ]
      );
    }

    // Verify 2FA token
    const { twoFactorTokens } = await import('@/utils/redisClient');
    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    if (!tokenData) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Invalid or expired 2FA verification token. Please verify your PIN or biometric again.',
        401
      );
    }

    if (!Data || !Data.Initiation) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Initiation is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Data.Initiation is missing',
            'Data.Initiation'
          ),
        ]
      );
    }

    const { Initiation } = Data;
    const { BillId, Amount, WalletId } = Initiation;

    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!BillId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field BillId is missing',
          'Data.Initiation.BillId'
        )
      );
    }

    if (!Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Initiation.Amount'
        )
      );
    }

    if (!WalletId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field WalletId is missing',
          'Data.Initiation.WalletId'
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
    const amount = parseFloat(Amount.toString());
    if (isNaN(amount) || amount <= 0) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        'Amount must be greater than 0',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.AMOUNT_INVALID,
            'Amount must be a positive number',
            'Data.Initiation.Amount'
          ),
        ]
      );
    }

    // Get bill
    const bills = await query<any>(
      `SELECT id, name, provider, amount, minimum_amount, due_date, is_paid, user_id
       FROM bills
       WHERE id = $1 AND user_id = $2`,
      [BillId, actualUserId]
    );

    if (bills.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Bill not found',
        404
      );
    }

    const bill = bills[0];

    if (bill.is_paid) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_CONFLICT,
        'Bill has already been paid',
        409
      );
    }

    // Validate amount against bill
    if (amount > parseFloat(bill.amount.toString())) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        `Payment amount cannot exceed bill amount (${bill.amount})`,
        400
      );
    }

    if (bill.minimum_amount && amount < parseFloat(bill.minimum_amount.toString())) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        `Payment amount must be at least ${bill.minimum_amount}`,
        400
      );
    }

    // Get wallet
    const wallets = await query<any>(
      `SELECT id, balance, currency, user_id
       FROM wallets
       WHERE id = $1 AND user_id = $2`,
      [WalletId, actualUserId]
    );

    if (wallets.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Wallet not found',
        404
      );
    }

    const wallet = wallets[0];

    // Check balance
    if (parseFloat(wallet.balance.toString()) < amount) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds in wallet',
        400
      );
    }

    const requestId = generateRequestId();

    // Start transaction
    await query('BEGIN');

    try {
      // Deduct from wallet
      await query(
        `UPDATE wallets 
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2`,
        [amount, WalletId]
      );

      // Create transaction record
      const transactionResult = await query<{ id: string }>(
        `INSERT INTO transactions (
          user_id, wallet_id, transaction_type, amount, currency,
          description, category, recipient_name, status, transaction_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING id`,
        [
          actualUserId,
          WalletId,
          'payment',
          amount,
          wallet.currency || 'N$',
          `Bill payment: ${bill.name}`,
          'bill_payment',
          bill.provider,
          'completed',
        ]
      );

      const transactionId = transactionResult[0]?.id;

      // Update bill
      const isFullyPaid = amount >= parseFloat(bill.amount.toString());
      await query(
        `UPDATE bills
         SET is_paid = $1,
             paid_at = CASE WHEN $1 THEN NOW() ELSE paid_at END,
             paid_amount = COALESCE(paid_amount, 0) + $2,
             payment_reference = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [isFullyPaid, amount, transactionId, BillId]
      );

      // Create bill payment record
      await query(
        `INSERT INTO bill_payments (
          bill_id, user_id, wallet_id, transaction_id, amount,
          payment_date, status, payment_reference
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), 'completed', $6)`,
        [BillId, actualUserId, WalletId, transactionId, amount, transactionId]
      );

      await query('COMMIT');

      // Log operation
      await logVoucherOperation({
        operation: 'bill_payment',
        userId: actualUserId,
        requestId,
        metadata: {
          billId: BillId,
          amount,
          transactionId,
        },
      });

      const response = {
        Data: {
          PaymentId: transactionId,
          BillId: BillId,
          Amount: amount,
          Status: 'Completed',
          PaymentReference: transactionId,
          PaidAt: new Date().toISOString(),
        },
        Links: {
          Self: `/api/v1/bills/pay`,
        },
        Meta: {},
      };

      return helpers.created(
        response,
        undefined,
        context?.requestId
      );
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    log.error('Error paying bill:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      error.message || 'An error occurred while processing bill payment',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handlePayBill,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
