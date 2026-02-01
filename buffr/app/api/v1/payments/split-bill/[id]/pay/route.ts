/**
 * Open Banking API: /api/v1/payments/split-bill/{id}/pay
 * 
 * Pay split bill share (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';
import { twoFactorTokens } from '@/utils/redisClient';
import { fineractService } from '@/services/fineractService';

async function handlePaySplitBill(
  req: ExpoRequest,
  { params }: { params: { id: string } }
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

    const { id: splitBillId } = params;
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

    if (!Data || !Data.WalletId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.WalletId is required',
        400
      );
    }

    const { WalletId } = Data;

    // Get split bill
    const splitBill = await query<any>(
      'SELECT id, creator_id, total_amount, currency, status, paid_amount FROM split_bills WHERE id = $1',
      [splitBillId]
    );

    if (splitBill.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Split bill not found',
        404
      );
    }

    if (splitBill[0].status === 'settled' || splitBill[0].status === 'cancelled') {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_INVALID,
        `Split bill is already ${splitBill[0].status}`,
        400
      );
    }

    // Get participant
    const participant = await query<any>(
      'SELECT id, user_id, amount, paid_amount, status FROM split_bill_participants WHERE split_bill_id = $1 AND user_id = $2',
      [splitBillId, actualUserId]
    );

    if (participant.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'You are not a participant in this split bill',
        403
      );
    }

    if (participant[0].status === 'paid') {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_INVALID,
        'You have already paid your share',
        400
      );
    }

    const remainingAmount = participant[0].amount - parseFloat(participant[0].paid_amount.toString());

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

    // Check balance
    const wallet = await fineractService.getWallet(WalletId);
    if (!wallet || parseFloat(wallet.balance) < remainingAmount) {
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
      // Withdraw from wallet
      await fineractService.withdrawFromWallet(
        WalletId,
        {
          amount: remainingAmount,
          transactionDate,
          reference: transactionId,
          description: `Split bill payment`,
          channel: 'mobile_app',
        },
        { requestId: context?.requestId, userId: actualUserId }
      );

      // Update participant
      await query(
        `UPDATE split_bill_participants 
         SET paid_amount = amount, status = 'paid', paid_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [participant[0].id]
      );

      // Update split bill
      const newPaidAmount = parseFloat(splitBill[0].paid_amount.toString()) + remainingAmount;
      const totalAmount = parseFloat(splitBill[0].total_amount.toString());
      
      let newStatus = splitBill[0].status;
      if (newPaidAmount >= totalAmount) {
        newStatus = 'settled';
        await query(
          'UPDATE split_bills SET paid_amount = $1, status = $2, settled_at = NOW(), updated_at = NOW() WHERE id = $3',
          [newPaidAmount, newStatus, splitBillId]
        );
      } else if (newPaidAmount > 0) {
        newStatus = 'partial';
        await query(
          'UPDATE split_bills SET paid_amount = $1, status = $2, updated_at = NOW() WHERE id = $3',
          [newPaidAmount, newStatus, splitBillId]
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
          WalletId,
          'split_bill_payment',
          remainingAmount,
          splitBill[0].currency,
          `Split bill payment`,
          'completed',
          'split_bill',
          transactionId,
          new Date(),
          new Date(),
        ]
      );

      const paymentResponse = {
        Data: {
          TransactionId: transactionId,
          SplitBillId: splitBillId,
          Amount: remainingAmount,
          Currency: splitBill[0].currency,
          Status: newStatus,
          Message: newStatus === 'settled'
            ? 'Split bill payment completed. Bill is now fully settled!'
            : 'Split bill payment completed successfully',
        },
        Links: {
          Self: `/api/v1/payments/split-bill/${splitBillId}`,
        },
        Meta: {},
      };

      return helpers.created(
        paymentResponse,
        `/api/v1/transactions/${transactionId}`,
        context?.requestId
      );
    } catch (error: any) {
      log.error('Split bill payment error:', error);
      return helpers.error(
        OpenBankingErrorCode.PAYMENT_FAILED,
        'Payment processing failed',
        500
      );
    }
  } catch (error) {
    log.error('Error processing split bill payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the payment',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handlePaySplitBill,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
