/**
 * Open Banking API: /api/v1/merchants/pay
 * 
 * Pay at merchant with cashback (Open Banking format)
 * 
 * Compliance: PSD-12 (2FA required), Open Banking v1
 * Integration: IPP (Instant Payment Platform) for cashback processing
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';
import { logVoucherOperation, generateRequestId } from '@/utils/auditLogger';

async function handlePayMerchant(req: ExpoRequest) {
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
        '2FA verification required. Please verify your PIN or biometric before paying.',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.SCA_REQUIRED,
            'Strong Customer Authentication (SCA) is required for merchant payments',
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
    const { MerchantId, Amount, WalletId, CashbackRate } = Initiation;

    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!MerchantId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field MerchantId is missing',
          'Data.Initiation.MerchantId'
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
        400
      );
    }

    // Get merchant
    const merchants = await query<any>(
      `SELECT id, name, category, cashback_rate, is_active, is_open
       FROM merchants
       WHERE id = $1 AND is_active = TRUE`,
      [MerchantId]
    );

    if (merchants.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Merchant not found',
        404
      );
    }

    const merchant = merchants[0];

    if (!merchant.is_open) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_CONFLICT,
        'Merchant is currently closed',
        409
      );
    }

    // Use provided cashback rate or merchant's default
    const cashbackRate = CashbackRate 
      ? parseFloat(CashbackRate.toString())
      : parseFloat(merchant.cashback_rate.toString());
    const cashbackAmount = (amount * cashbackRate) / 100;

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
      // Deduct payment amount from wallet
      await query(
        `UPDATE wallets 
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2`,
        [amount, WalletId]
      );

      // Create payment transaction
      const transactionResult = await query<{ id: string }>(
        `INSERT INTO transactions (
          user_id, wallet_id, transaction_type, amount, currency,
          description, category, recipient_name, status, transaction_time,
          merchant_id, merchant_name, merchant_category
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12)
        RETURNING id`,
        [
          actualUserId,
          WalletId,
          'payment',
          amount,
          wallet.currency || 'N$',
          `Payment at ${merchant.name}`,
          'merchant_payment',
          merchant.name,
          'completed',
          MerchantId,
          merchant.name,
          merchant.category,
        ]
      );

      const transactionId = transactionResult[0]?.id;

      // Credit cashback to wallet
      if (cashbackAmount > 0) {
        await query(
          `UPDATE wallets 
           SET balance = balance + $1, updated_at = NOW()
           WHERE id = $2`,
          [cashbackAmount, WalletId]
        );

        // Create cashback credit transaction
        await query(
          `INSERT INTO transactions (
            user_id, wallet_id, transaction_type, amount, currency,
            description, category, status, transaction_time,
            merchant_id, merchant_name, merchant_category
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11)`,
          [
            actualUserId,
            WalletId,
            'credit',
            cashbackAmount,
            wallet.currency || 'N$',
            `Cashback from ${merchant.name}`,
            'cashback',
            'completed',
            MerchantId,
            merchant.name,
            merchant.category,
          ]
        );

        // Create cashback transaction record
        await query(
          `INSERT INTO cashback_transactions (
            user_id, merchant_id, transaction_id, payment_amount,
            cashback_amount, cashback_rate, status, credited_at, wallet_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW(), $7)`,
          [
            actualUserId,
            MerchantId,
            transactionId,
            amount,
            cashbackAmount,
            cashbackRate,
            WalletId,
          ]
        );
      }

      // Create merchant payment record
      await query(
        `INSERT INTO merchant_payments (
          user_id, merchant_id, wallet_id, transaction_id, amount,
          cashback_amount, cashback_rate, payment_method, status, payment_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'qr_code', 'completed', NOW())`,
        [
          actualUserId,
          MerchantId,
          WalletId,
          transactionId,
          amount,
          cashbackAmount,
          cashbackRate,
        ]
      );

      await query('COMMIT');

      // Log operation
      await logVoucherOperation({
        operation: 'merchant_payment',
        userId: actualUserId,
        requestId,
        metadata: {
          merchantId: MerchantId,
          amount,
          cashbackAmount,
          transactionId,
        },
      });

      const response = {
        Data: {
          PaymentId: transactionId,
          MerchantId: MerchantId,
          Amount: amount,
          Cashback: {
            Amount: cashbackAmount,
            Rate: cashbackRate,
          },
          Status: 'Completed',
          PaymentReference: transactionId,
          PaidAt: new Date().toISOString(),
        },
        Links: {
          Self: '/api/v1/merchants/pay',
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
    log.error('Error processing merchant payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      error.message || 'An error occurred while processing merchant payment',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handlePayMerchant,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
