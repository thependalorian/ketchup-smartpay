/**
 * Open Banking API: /api/v1/wallets/{walletId}/add-money
 * 
 * Add money to wallet (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount, validateCurrency } from '@/utils/validators';
import { log } from '@/utils/logger';
import { twoFactorTokens } from '@/utils/redisClient';
import { fineractService } from '@/services/fineractService';
import { randomUUID } from 'crypto';

async function handleAddMoney(
  req: ExpoRequest,
  { params }: { params: { walletId: string } }
) {
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

    const { walletId } = params;
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

    const { Amount, Currency, PaymentMethod, PaymentMethodId, CardDetails } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Amount'
        )
      );
    }

    if (!PaymentMethod) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field PaymentMethod is missing',
          'Data.PaymentMethod'
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

    // Validate currency
    const currency = Currency || 'NAD';
    if (!validateCurrency(currency)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid currency code',
        400
      );
    }

    // Verify wallet ownership
    const walletCheck = await query<any>(
      'SELECT id FROM wallets WHERE id = $1 AND user_id = $2',
      [walletId, actualUserId]
    );

    if (walletCheck.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Wallet not found or access denied',
        400
      );
    }

    // Process payment based on method
    const transactionId = randomUUID();
    const transactionDate = new Date().toISOString().split('T')[0];

    try {
      // For card payments, use Adumo service
      if (PaymentMethod === 'card' && CardDetails) {
        const { completePaymentFlow } = await import('@/services/adumoService');
        
        const paymentResult = await completePaymentFlow({
          amount: Amount,
          merchantReference: `add-money-${transactionId}`,
          cardNumber: CardDetails.CardNumber,
          expiryMonth: CardDetails.ExpiryMonth,
          expiryYear: CardDetails.ExpiryYear,
          cvv: CardDetails.CVV,
          cardHolderFullName: CardDetails.CardHolderFullName,
          saveCardDetails: false,
          ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
          userAgent: req.headers.get('user-agent') || 'Buffr Mobile App',
        });

        if (paymentResult.requires3DSecure) {
          return helpers.success(
            {
              Data: {
                TransactionId: paymentResult.transactionId,
                Requires3DSecure: true,
                ThreeDSecureFormData: paymentResult.threeDSecureFormData,
              },
            },
            200,
            undefined,
            undefined,
            context?.requestId
          );
        }

        if (!paymentResult.success) {
          return helpers.error(
            OpenBankingErrorCode.PAYMENT_FAILED,
            paymentResult.statusMessage || 'Payment failed',
            400
          );
        }

        // Deposit to wallet
        await fineractService.depositToWallet(
          walletId,
          {
            amount: Amount,
            transactionDate,
            reference: transactionId,
            description: 'Add money via card',
            channel: 'mobile_app',
          },
          { requestId: context?.requestId, userId: actualUserId }
        );
      } else {
        // For other methods (bank transfer, etc.), just deposit
        await fineractService.depositToWallet(
          walletId,
          {
            amount: Amount,
            transactionDate,
            reference: transactionId,
            description: `Add money via ${PaymentMethod}`,
            channel: 'mobile_app',
          },
          { requestId: context?.requestId, userId: actualUserId }
        );
      }

      // Create transaction record
      await query(
        `INSERT INTO transactions (
          id, user_id, wallet_id, transaction_type, amount, currency,
          description, status, payment_method, payment_reference,
          transaction_time, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          transactionId,
          actualUserId,
          walletId,
          'deposit',
          Amount,
          currency,
          `Add money via ${PaymentMethod}`,
          'completed',
          PaymentMethod,
          transactionId,
          new Date(),
          new Date(),
        ]
      );

      const response = {
        Data: {
          TransactionId: transactionId,
          WalletId: walletId,
          Amount,
          Currency: currency,
          PaymentMethod,
          Status: 'completed',
          CreatedDateTime: new Date().toISOString(),
        },
        Links: {
          Self: `/api/v1/transactions/${transactionId}`,
        },
        Meta: {},
      };

      return helpers.created(
        response,
        `/api/v1/transactions/${transactionId}`,
        context?.requestId
      );
    } catch (error: any) {
      log.error('Add money error:', error);
      return helpers.error(
        OpenBankingErrorCode.PAYMENT_FAILED,
        'Payment processing failed',
        500
      );
    }
  } catch (error) {
    log.error('Error adding money:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the request',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleAddMoney,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
