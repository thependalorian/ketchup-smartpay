/**
 * Open Banking API: /api/v1/payments/send
 * 
 * Send payment (Open Banking format)
 * 
 * This endpoint provides Open Banking format for the legacy /api/payments/send endpoint
 * Uses the same underlying logic but returns Open Banking-compliant responses
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount, validateCurrency, validateUUID } from '@/utils/validators';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';
import { twoFactorTokens } from '@/utils/redisClient';
import { randomUUID } from 'crypto';

/**
 * POST /api/v1/payments/send
 * Send payment (Open Banking format)
 * 
 * Request Body (Open Banking format):
 * {
 *   "Data": {
 *     "ConsentId": "string",
 *     "Initiation": {
 *       "InstructionIdentification": "string",
 *       "EndToEndIdentification": "string",
 *       "InstructedAmount": {
 *         "Amount": "100.00",
 *         "Currency": "NAD"
 *       },
 *       "DebtorAccount": {
 *         "SchemeName": "BuffrAccount",
 *         "Identification": "wallet-id"
 *       },
 *       "CreditorAccount": {
 *         "SchemeName": "BuffrAccount",
 *         "Identification": "recipient-wallet-id"
 *       },
 *       "RemittanceInformation": {
 *         "Unstructured": "Payment description"
 *       }
 *     }
 *   },
 *   "Risk": {},
 *   "verificationToken": "2FA-token"
 * }
 */
async function handleSendPayment(req: ExpoRequest) {
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
        '2FA verification required. Please verify your PIN or biometric before sending payment.',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.SCA_REQUIRED,
            'Strong Customer Authentication (SCA) is required for payments',
            'verificationToken'
          ),
        ]
      );
    }

    // Verify 2FA token
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
    const { InstructedAmount, DebtorAccount, CreditorAccount, RemittanceInformation } = Initiation;

    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!InstructedAmount || !InstructedAmount.Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Initiation.InstructedAmount.Amount'
        )
      );
    }

    if (!DebtorAccount || !DebtorAccount.Identification) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field DebtorAccount.Identification is missing',
          'Data.Initiation.DebtorAccount.Identification'
        )
      );
    }

    if (!CreditorAccount || !CreditorAccount.Identification) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field CreditorAccount.Identification is missing',
          'Data.Initiation.CreditorAccount.Identification'
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
    const amount = parseFloat(InstructedAmount.Amount);
    if (isNaN(amount) || amount <= 0) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        'Invalid amount. Amount must be greater than 0',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.AMOUNT_INVALID,
            'Amount must be a positive number',
            'Data.Initiation.InstructedAmount.Amount'
          ),
        ]
      );
    }

    // Validate currency
    const currency = InstructedAmount.Currency || 'NAD';
    if (!validateCurrency(currency)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid currency code',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_INVALID_FORMAT,
            'Currency must be a valid ISO 4217 code',
            'Data.Initiation.InstructedAmount.Currency'
          ),
        ]
      );
    }

    // Get wallet IDs
    const debtorWalletId = DebtorAccount.Identification;
    const creditorWalletId = CreditorAccount.Identification;

    // Verify debtor wallet belongs to user
    const walletCheck = await query<any>(
      'SELECT id FROM wallets WHERE id = $1 AND user_id = $2',
      [debtorWalletId, actualUserId]
    );

    if (walletCheck.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.ACCOUNT_INVALID,
        'Debtor account not found or does not belong to user',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.ACCOUNT_NOT_FOUND,
            'The specified debtor account was not found',
            'Data.Initiation.DebtorAccount.Identification'
          ),
        ]
      );
    }

    // Check balance
    const wallet = await fineractService.getWallet(debtorWalletId);
    if (!wallet || parseFloat(wallet.balance) < amount) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds in debtor account',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.INSUFFICIENT_FUNDS,
            'The debtor account does not have sufficient funds',
            'Data.Initiation.InstructedAmount.Amount'
          ),
        ]
      );
    }

    // Process payment
    const paymentId = randomUUID();
    const endToEndId = Initiation.EndToEndIdentification || paymentId;
    const instructionId = Initiation.InstructionIdentification || paymentId;
    const description = RemittanceInformation?.Unstructured || 'Payment';

    try {
      // Transfer via Fineract
      const transactionDate = new Date().toISOString().split('T')[0];
      
      // Withdraw from debtor wallet
      await fineractService.withdrawFromWallet(
        debtorWalletId,
        {
          amount,
          transactionDate,
          reference: paymentId,
          description,
          channel: 'mobile_app',
        },
        { requestId: context?.requestId, userId: actualUserId }
      );

      // Deposit to creditor wallet
      await fineractService.depositToWallet(
        creditorWalletId,
        {
          amount,
          transactionDate,
          reference: paymentId,
          description: `Received: ${description}`,
          channel: 'mobile_app',
        },
        { requestId: context?.requestId, userId: actualUserId }
      );

      // Create transaction record
      await query(
        `INSERT INTO transactions (
          id, user_id, wallet_id, transaction_type, amount, currency,
          description, status, transaction_time, created_at, recipient_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          paymentId,
          actualUserId,
          debtorWalletId,
          'transfer',
          amount,
          currency,
          description,
          'completed',
          new Date(),
          new Date(),
          creditorWalletId,
        ]
      );

      // Return Open Banking payment response
      const paymentResponse = {
        Data: {
          PaymentId: paymentId,
          ConsentId: Data.ConsentId || paymentId,
          Initiation: Initiation,
          CreationDateTime: new Date().toISOString(),
          Status: 'AcceptedSettlementCompleted',
          StatusUpdateDateTime: new Date().toISOString(),
        },
        Links: {
          Self: `/api/v1/payments/send/${paymentId}`,
        },
        Meta: {},
      };

      const location = `/api/v1/payments/send/${paymentId}`;
      return helpers.created(
        paymentResponse,
        location,
        context?.requestId
      );
    } catch (error: any) {
      log.error('Payment processing error:', error);
      return helpers.error(
        OpenBankingErrorCode.PAYMENT_FAILED,
        'Payment processing failed',
        500,
        [
          createErrorDetail(
            OpenBankingErrorCode.PAYMENT_FAILED,
            error instanceof Error ? error.message : 'An error occurred during payment processing',
            'Data.Initiation'
          ),
        ]
      );
    }
  } catch (error) {
    log.error('Error sending payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the payment request',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleSendPayment,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
