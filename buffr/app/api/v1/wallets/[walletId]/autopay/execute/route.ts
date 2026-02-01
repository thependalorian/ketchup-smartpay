/**
 * Open Banking API: /api/v1/wallets/{walletId}/autopay/execute
 * 
 * Execute AutoPay (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount, validateUUID } from '@/utils/validators';
import { log } from '@/utils/logger';
import { twoFactorTokens } from '@/utils/redisClient';
import { fineractService } from '@/services/fineractService';
import { randomUUID } from 'crypto';

async function handleExecuteAutopay(
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

    const { RuleId, Amount, RecipientId, CardDetails } = Data;

    if (!RuleId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.RuleId is required',
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

    // Check balance if amount specified
    const amount = Amount || 200.00;
    const wallet = await fineractService.getWallet(walletId);
    if (!wallet || parseFloat(wallet.balance) < amount) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds',
        400
      );
    }

    // Process payment
    const transactionId = randomUUID();
    const transactionDate = new Date().toISOString().split('T')[0];

    try {
      // For card payments, use Adumo
      if (CardDetails) {
        const { completePaymentFlow } = await import('@/services/adumoService');
        
        const paymentResult = await completePaymentFlow({
          amount,
          merchantReference: `autopay-${RuleId}-${Date.now()}`,
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
            paymentResult.statusMessage || 'AutoPay execution failed',
            400
          );
        }

        // Create transaction record
        await query(
          `INSERT INTO autopay_transactions (
            rule_id, wallet_id, user_id, amount, status,
            recipient_id, recipient_name, rule_description, authorisation_code
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            RuleId,
            walletId,
            actualUserId,
            amount,
            'success',
            RecipientId || null,
            'AutoPay Recipient',
            'AutoPay payment',
            paymentResult.authorisationCode || null,
          ]
        );

        const response = {
          Data: {
            TransactionId: paymentResult.transactionId,
            RuleId,
            WalletId: walletId,
            Amount: amount,
            Status: paymentResult.settled ? 'completed' : 'authorised',
            ExecutedDateTime: new Date().toISOString(),
            AuthorisationCode: paymentResult.authorisationCode,
          },
          Links: {
            Self: `/api/v1/transactions/${paymentResult.transactionId}`,
          },
          Meta: {},
        };

        return helpers.created(
          response,
          `/api/v1/transactions/${paymentResult.transactionId}`,
          context?.requestId
        );
      } else {
        // Internal transfer
        await fineractService.withdrawFromWallet(
          walletId,
          {
            amount,
            transactionDate,
            reference: transactionId,
            description: 'AutoPay payment',
            channel: 'mobile_app',
          },
          { requestId: context?.requestId, userId: actualUserId }
        );

        // Create transaction record
        await query(
          `INSERT INTO autopay_transactions (
            rule_id, wallet_id, user_id, amount, status,
            recipient_id, recipient_name, rule_description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            RuleId,
            walletId,
            actualUserId,
            amount,
            'success',
            RecipientId || null,
            'AutoPay Recipient',
            'AutoPay payment',
          ]
        );

        const response = {
          Data: {
            TransactionId: transactionId,
            RuleId,
            WalletId: walletId,
            Amount: amount,
            Status: 'completed',
            ExecutedDateTime: new Date().toISOString(),
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
      }
    } catch (error: any) {
      log.error('AutoPay execution error:', error);
      return helpers.error(
        OpenBankingErrorCode.PAYMENT_FAILED,
        'AutoPay execution failed',
        500
      );
    }
  } catch (error) {
    log.error('Error executing AutoPay:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while executing AutoPay',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleExecuteAutopay,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
