/**
 * Split Bill Payment API Route
 * 
 * Location: app/api/payments/split-bill/[id]/pay/route.ts
 * Purpose: Pay a participant's share of a split bill
 * 
 * Compliance: PSD-12 (2FA required)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount, validateUUID } from '@/utils/validators';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import { twoFactorTokens } from '@/utils/redisClient';
import { sendTransactionNotification } from '@/utils/sendPushNotification';
import logger from '@/utils/logger';

interface SplitBillPaymentRequest {
  walletId: string;
  verificationToken: string; // 2FA verification token
}

async function postHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { id: splitBillId } = params;
    const { walletId, verificationToken }: SplitBillPaymentRequest = await req.json();

    // Validate required fields
    if (!walletId) {
      return errorResponse('walletId is required', HttpStatus.BAD_REQUEST);
    }

    // PSD-12 Compliance: Require 2FA verification
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before paying.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify 2FA token
    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    if (!tokenData) {
      return errorResponse(
        'Invalid or expired 2FA verification token. Please verify your PIN or biometric again.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify user has 2FA enabled
    const user = await query<{ is_two_factor_enabled: boolean }>(
      'SELECT is_two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (user.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    if (!user[0].is_two_factor_enabled) {
      return errorResponse(
        'Two-factor authentication is not enabled. Please enable 2FA first.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Get split bill
    const splitBill = await query<{
      id: string;
      creator_id: string;
      total_amount: number;
      currency: string;
      status: string;
      paid_amount: number;
    }>(
      'SELECT id, creator_id, total_amount, currency, status, paid_amount FROM split_bills WHERE id = $1',
      [splitBillId]
    );

    if (splitBill.length === 0) {
      return errorResponse('Split bill not found', HttpStatus.NOT_FOUND);
    }

    if (splitBill[0].status === 'settled' || splitBill[0].status === 'cancelled') {
      return errorResponse(`Split bill is already ${splitBill[0].status}`, HttpStatus.BAD_REQUEST);
    }

    // Get participant record
    const participant = await query<{
      id: string;
      user_id: string;
      amount: number;
      paid_amount: number;
      status: string;
    }>(
      'SELECT id, user_id, amount, paid_amount, status FROM split_bill_participants WHERE split_bill_id = $1 AND user_id = $2',
      [splitBillId, userId]
    );

    if (participant.length === 0) {
      return errorResponse('You are not a participant in this split bill', HttpStatus.FORBIDDEN);
    }

    if (participant[0].status === 'paid') {
      return errorResponse('You have already paid your share', HttpStatus.BAD_REQUEST);
    }

    const participantData = participant[0];
    const remainingAmount = participantData.amount - parseFloat(participantData.paid_amount.toString());

    // Validate wallet
    const walletIdCheck = validateUUID(walletId);
    if (!walletIdCheck.valid) {
      return errorResponse(walletIdCheck.error || 'Invalid wallet ID', HttpStatus.BAD_REQUEST);
    }

    // Verify wallet ownership
    const wallet = await query<{ id: string; balance: number; status: string }>(
      'SELECT id, balance, status FROM wallets WHERE id = $1 AND user_id = $2',
      [walletId, userId]
    );

    if (wallet.length === 0) {
      return errorResponse('Wallet not found or access denied', HttpStatus.NOT_FOUND);
    }

    if (wallet[0].status !== 'active') {
      return errorResponse('Wallet is not active', HttpStatus.BAD_REQUEST);
    }

    // Check sufficient balance
    const walletBalance = parseFloat(wallet[0].balance.toString());
    if (walletBalance < remainingAmount) {
      return errorResponse('Insufficient wallet balance', HttpStatus.BAD_REQUEST);
    }

    // Update wallet balance (deduct amount)
    await query(
      'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
      [remainingAmount, walletId]
    );

    // Update participant payment
    await query(
      `UPDATE split_bill_participants 
       SET paid_amount = amount, status = 'paid', paid_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [participantData.id]
    );

    // Update split bill paid amount
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
    const transactionResult = await query<{ id: string; created_at: Date }>(
      `INSERT INTO transactions (
        user_id, type, amount, currency, status,
        from_wallet_id, payment_method, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at`,
      [
        userId,
        'split_bill_payment',
        remainingAmount,
        splitBill[0].currency,
        'completed',
        walletId,
        'split_bill',
        `Split bill payment: ${splitBill[0].currency} ${remainingAmount.toFixed(2)}`,
        JSON.stringify({
          split_bill_id: splitBillId,
          participant_id: participantData.id,
        }),
      ]
    );

    const transactionId = transactionResult[0]?.id;

    // Log transaction operation (audit trail)
    await logTransactionOperation({
      transaction_id: transactionId,
      transaction_type: 'split_bill_payment',
      user_id: userId,
      amount: remainingAmount,
      currency: splitBill[0].currency,
      from_wallet_id: walletId,
      payment_method: 'split_bill',
      two_factor_verified: true,
      ip_address: ipAddress,
      status: 'completed',
      metadata: JSON.stringify({
        split_bill_id: splitBillId,
      }),
    }).catch(err => logger.error('Failed to log transaction:', err));

    // Send instant payment notification
    const amountFormatted = `${splitBill[0].currency} ${remainingAmount.toFixed(2)}`;
    await sendTransactionNotification(
      userId,
      'sent',
      amountFormatted,
      'Split Bill',
      transactionId
    ).catch(err => logger.error('Failed to send notification:', err));

    // Notify bill creator if bill is fully settled
    if (newStatus === 'settled' && splitBill[0].creator_id !== userId) {
      await sendTransactionNotification(
        splitBill[0].creator_id,
        'received',
        amountFormatted,
        'Split Bill Settled',
        transactionId
      ).catch(err => logger.error('Failed to send notification to creator:', err));
    }

    return createdResponse(
      {
        transactionId,
        splitBillId,
        amount: remainingAmount,
        currency: splitBill[0].currency,
        status: newStatus,
        message: newStatus === 'settled'
          ? 'Split bill payment completed. Bill is now fully settled!'
          : 'Split bill payment completed successfully',
      },
      `/api/transactions/${transactionId}`,
      'Split bill payment completed successfully'
    );
  } catch (error: any) {
    logger.error('Split bill payment error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
