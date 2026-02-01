/**
 * Open Banking API: /api/v1/merchants/payments
 * 
 * Open Banking-compliant merchant payment endpoint
 * 
 * Features:
 * - Open Banking payment format
 * - QR code payment support (NamQR)
 * - Cashback calculation
 * - Open Banking error responses
 * - API versioning (v1)
 * 
 * Example requests:
 * POST /api/v1/merchants/payments
 * GET /api/v1/merchants/payments/{paymentId}
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount, validateCurrency } from '@/utils/validators';
import { log } from '@/utils/logger';
import { tokenVaultService } from '@/services/tokenVaultService';
import { twoFactorTokens } from '@/utils/redisClient';
import { fineractService } from '@/services/fineractService';
import { cashbackService } from '@/services/cashbackService';
import { randomUUID } from 'crypto';

/**
 * POST /api/v1/merchants/payments
 * Process merchant payment (Open Banking format)
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
 *         "SchemeName": "MerchantAccount",
 *         "Identification": "merchant-id"
 *       },
 *       "RemittanceInformation": {
 *         "Unstructured": "Payment description"
 *       }
 *     },
 *     "QRCode": "NamQR-code-string" (optional)
 *   },
 *   "Risk": {}
 * }
 */
async function handleCreateMerchantPayment(req: ExpoRequest) {
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

    const { Initiation, QRCode } = Data;
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
    const merchantId = CreditorAccount.Identification;

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

    // Validate QR code if provided
    if (QRCode) {
      try {
        const { parseNAMQRCode } = await import('@/utils/namqr/parser');
        const parseResult = parseNAMQRCode(QRCode);
        
        if (parseResult.success && parseResult.data) {
          // Validate token vault if present
          const tokenVaultId = parseResult.data.tokenVaultUniqueId;
          if (tokenVaultId) {
            const vaultValidation = await tokenVaultService.validateToken({
              tokenVaultId,
              merchantId,
              amount,
              currency,
            });

            if (!vaultValidation.isValid) {
              return helpers.error(
                OpenBankingErrorCode.FIELD_INVALID,
                'QR code validation failed',
                400,
                [
                  createErrorDetail(
                    OpenBankingErrorCode.FIELD_INVALID,
                    vaultValidation.error || 'Invalid QR code token',
                    'Data.QRCode'
                  ),
                ]
              );
            }
          }
        }
      } catch (error: any) {
        log.warn('QR code parsing warning:', error);
        // Continue without QR validation if parsing fails
      }
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
    const description = RemittanceInformation?.Unstructured || 'Merchant payment';

    try {
      // Withdraw from wallet
      const transactionDate = new Date().toISOString().split('T')[0];
      await fineractService.withdrawFromWallet(
        debtorWalletId,
        {
          amount,
          transactionDate,
          reference: paymentId,
          description,
          channel: 'pos_terminal',
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
          'merchant_payment',
          amount,
          currency,
          description,
          'completed',
          new Date(),
          new Date(),
          merchantId,
        ]
      );

      // Calculate cashback (if applicable)
      const cashbackCalculation = await cashbackService.calculateCashback({
        user_id: actualUserId,
        transaction_id: paymentId,
        merchant_id: merchantId,
        merchant_category: undefined, // Could be extracted from merchant record if needed
        amount: amount,
        currency: currency,
      });

      let cashbackAmount = 0;
      if (cashbackCalculation.eligible && cashbackCalculation.cashback_amount > 0) {
        // Create cashback transaction (auto-credit enabled)
        const cashbackTx = await cashbackService.createCashbackTransaction({
          user_id: actualUserId,
          transaction_id: paymentId,
          merchant_id: merchantId,
          config_id: cashbackCalculation.config_applied?.id,
          transaction_amount: amount,
          cashback_percentage: cashbackCalculation.cashback_percentage,
          cashback_amount: cashbackCalculation.cashback_amount,
          currency: currency,
          auto_credit: true, // Instantly credit cashback
        });

        if (cashbackTx) {
          cashbackAmount = cashbackTx.cashback_amount;
          log.info(`Cashback awarded: ${cashbackAmount} ${currency} for transaction ${paymentId}`);
        }
      }

      // Return Open Banking payment response
      const paymentResponse = {
        Data: {
          MerchantPaymentId: paymentId,
          ConsentId: Data.ConsentId || paymentId,
          Initiation: Initiation,
          CreationDateTime: new Date().toISOString(),
          Status: 'AcceptedSettlementCompleted',
          StatusUpdateDateTime: new Date().toISOString(),
          Cashback: cashbackAmount > 0 ? {
            Amount: cashbackAmount.toFixed(2),
            Currency: currency,
          } : undefined,
        },
        Links: {
          Self: `/api/v1/merchants/payments/${paymentId}`,
        },
        Meta: {},
      };

      const location = `/api/v1/merchants/payments/${paymentId}`;
      return helpers.created(
        paymentResponse,
        location,
        context?.requestId
      );
    } catch (error: any) {
      log.error('Merchant payment processing error:', error);
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
    log.error('Error creating merchant payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the merchant payment request',
      500
    );
  }
}

/**
 * GET /api/v1/merchants/payments/{paymentId}
 * Get merchant payment status
 */
async function handleGetMerchantPayment(
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
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2 AND transaction_type = $3',
      [paymentId, actualUserId, 'merchant_payment']
    );

    if (transactions.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Merchant payment with ID '${paymentId}' not found`,
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
        MerchantPaymentId: paymentId,
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
        Self: `/api/v1/merchants/payments/${paymentId}`,
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
    log.error('Error fetching merchant payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the merchant payment',
      500
    );
  }
}

// Export handlers with Open Banking middleware
export const POST = openBankingSecureRoute(
  handleCreateMerchantPayment,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);

// Note: For GET handler, create separate route file
// app/api/v1/merchants/payments/[paymentId]/route.ts
