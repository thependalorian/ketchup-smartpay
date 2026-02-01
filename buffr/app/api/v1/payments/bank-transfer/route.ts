/**
 * Open Banking API: /api/v1/payments/bank-transfer
 * 
 * Bank transfer via IPS (Open Banking format)
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
 *         "SchemeName": "BankAccount",
 *         "Identification": "account-number",
 *         "Name": "Bank Name",
 *         "SecondaryIdentification": "bank-code"
 *       },
 *       "RemittanceInformation": {
 *         "Unstructured": "Transfer description"
 *       }
 *     }
 *   },
 *   "Risk": {},
 *   "verificationToken": "2FA-token"
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount, validateCurrency } from '@/utils/validators';
import { log } from '@/utils/logger';
import { ipsService } from '@/services/ipsService';
import { fineractService } from '@/services/fineractService';
import { twoFactorTokens } from '@/utils/redisClient';
import { randomUUID } from 'crypto';

async function handleBankTransfer(req: ExpoRequest) {
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
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.SCA_REQUIRED,
            'Strong Customer Authentication (SCA) is required for bank transfers',
            'verificationToken'
          ),
        ]
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

    const amount = parseFloat(InstructedAmount.Amount);
    if (isNaN(amount) || amount <= 0) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        'Invalid amount',
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

    const currency = InstructedAmount.Currency || 'NAD';
    if (!validateCurrency(currency)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid currency code',
        400
      );
    }

    const debtorWalletId = DebtorAccount.Identification;
    const bankAccountNumber = CreditorAccount.Identification;
    const bankName = CreditorAccount.Name || '';
    const bankCode = CreditorAccount.SecondaryIdentification || '';

    // Verify wallet belongs to user
    const walletCheck = await query<any>(
      'SELECT id FROM wallets WHERE id = $1 AND user_id = $2',
      [debtorWalletId, actualUserId]
    );

    if (walletCheck.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Debtor account not found',
        400
      );
    }

    // Check balance
    const wallet = await fineractService.getWallet(debtorWalletId);
    if (!wallet || parseFloat(wallet.balance) < amount) {
      return helpers.error(
        OpenBankingErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient funds',
        400
      );
    }

    // Process bank transfer via IPS
    const paymentId = randomUUID();
    const endToEndId = Initiation.EndToEndIdentification || paymentId;
    const instructionId = Initiation.InstructionIdentification || paymentId;
    const description = RemittanceInformation?.Unstructured || 'Bank transfer';

    try {
      const transactionReference = `BT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Initiate IPS transfer
      const ipsResult = await ipsService.transfer(
        {
          fromAccount: debtorWalletId,
          toAccount: bankAccountNumber,
          amount,
          currency,
          reference: transactionReference,
          description,
          bankName,
          bankCode,
        },
        { requestId: context?.requestId, userId: actualUserId }
      );

      // Create transaction record
      await query(
        `INSERT INTO transactions (
          id, user_id, wallet_id, transaction_type, amount, currency,
          description, status, payment_method, payment_reference,
          transaction_time, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          paymentId,
          actualUserId,
          debtorWalletId,
          'bank_transfer',
          amount,
          currency,
          description,
          ipsResult.status === 'completed' ? 'completed' : 'pending',
          'ips_bank_transfer',
          transactionReference,
          new Date(),
          new Date(),
        ]
      );

      // Return Open Banking response
      const transferResponse = {
        Data: {
          PaymentId: paymentId,
          ConsentId: Data.ConsentId || paymentId,
          Initiation: Initiation,
          CreationDateTime: new Date().toISOString(),
          Status: ipsResult.status === 'completed' 
            ? 'AcceptedSettlementCompleted' 
            : 'AcceptedSettlementInProcess',
          StatusUpdateDateTime: new Date().toISOString(),
          IPSTransactionId: ipsResult.transactionId,
          SettlementTime: ipsResult.settlementTime,
        },
        Links: {
          Self: `/api/v1/payments/bank-transfer/${paymentId}`,
        },
        Meta: {},
      };

      return helpers.created(
        transferResponse,
        `/api/v1/payments/bank-transfer/${paymentId}`,
        context?.requestId
      );
    } catch (error: any) {
      log.error('Bank transfer error:', error);
      return helpers.error(
        OpenBankingErrorCode.PAYMENT_FAILED,
        'Bank transfer failed',
        500,
        [
          createErrorDetail(
            OpenBankingErrorCode.PAYMENT_FAILED,
            error instanceof Error ? error.message : 'An error occurred during bank transfer',
            'Data.Initiation'
          ),
        ]
      );
    }
  } catch (error) {
    log.error('Error processing bank transfer:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the bank transfer',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleBankTransfer,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
