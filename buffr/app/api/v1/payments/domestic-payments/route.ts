/**
 * Open Banking API: /api/v1/payments/domestic-payments
 * 
 * Open Banking-compliant domestic payments endpoint
 * 
 * Features:
 * - Open Banking payment initiation format
 * - Payment status tracking
 * - Open Banking error responses
 * - API versioning (v1)
 * 
 * Example requests:
 * POST /api/v1/payments/domestic-payments
 * GET /api/v1/payments/domestic-payments/{paymentId}
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateCurrency } from '@/utils/validators';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';
import { randomUUID } from 'crypto';

/**
 * POST /api/v1/payments/domestic-payments
 * Initiate a domestic payment (Open Banking format)
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
 *         "Identification": "user-wallet-id"
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
 *   "Risk": {}
 * }
 */
async function handleCreatePayment(req: ExpoRequest) {
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
    const { Data } = body;

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

    if (!InstructedAmount || !InstructedAmount.Currency) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Currency is missing',
          'Data.Initiation.InstructedAmount.Currency'
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
    const currency = InstructedAmount.Currency;
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

    // Create payment
    const paymentId = randomUUID();
    const endToEndId = Initiation.EndToEndIdentification || paymentId;
    const instructionId = Initiation.InstructionIdentification || paymentId;
    const description = RemittanceInformation?.Unstructured || 'Payment';

    // Process payment via Fineract
    try {
      await fineractService.transferBetweenWallets(
        debtorWalletId,
        creditorWalletId,
        amount,
        currency,
        description
      );

      // Create transaction record
      await query(
        `INSERT INTO transactions (
          id, user_id, wallet_id, transaction_type, amount, currency,
          description, status, transaction_time, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
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
        ]
      );

      // Return Open Banking payment response
      const paymentResponse = {
        Data: {
          DomesticPaymentId: paymentId,
          ConsentId: Data.ConsentId || paymentId,
          Initiation: Initiation,
          CreationDateTime: new Date().toISOString(),
          Status: 'AcceptedSettlementCompleted',
          StatusUpdateDateTime: new Date().toISOString(),
        },
        Links: {
          Self: `/api/v1/payments/domestic-payments/${paymentId}`,
        },
        Meta: {},
      };

      const location = `/api/v1/payments/domestic-payments/${paymentId}`;
      return helpers.created(
        paymentResponse,
        location,
        context?.requestId
      );
    } catch (error) {
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
    log.error('Error creating payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the payment request',
      500
    );
  }
}

/**
 * GET /api/v1/payments/domestic-payments/{paymentId}
 * Get payment status
 */
async function handleGetPayment(
  req: ExpoRequest,
  { params }: { params: { paymentId: string } }
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
    const { paymentId } = params;

    // Fetch payment/transaction
    const transactions = await query<any>(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [paymentId, actualUserId]
    );

    if (transactions.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Payment with ID '${paymentId}' not found`,
        404
      );
    }

    const tx = transactions[0];
    const status = tx.status === 'completed' 
      ? 'AcceptedSettlementCompleted' 
      : tx.status === 'pending'
      ? 'AcceptedSettlementInProcess'
      : 'Rejected';

    const paymentResponse = {
      Data: {
        DomesticPaymentId: paymentId,
        ConsentId: paymentId,
        Initiation: {
          InstructionIdentification: paymentId,
          EndToEndIdentification: paymentId,
          InstructedAmount: {
            Amount: tx.amount.toString(),
            Currency: tx.currency,
          },
        },
        CreationDateTime: tx.created_at,
        Status: status,
        StatusUpdateDateTime: tx.transaction_time || tx.created_at,
      },
      Links: {
        Self: `/api/v1/payments/domestic-payments/${paymentId}`,
      },
      Meta: {},
    };

    return helpers.success(
      paymentResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the payment',
      500
    );
  }
}

// Export handlers with Open Banking middleware
export const POST = openBankingSecureRoute(
  handleCreatePayment,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);

// Note: For GET handler, create separate route file or use Next.js dynamic routing
// app/api/v1/payments/domestic-payments/[paymentId]/route.ts
