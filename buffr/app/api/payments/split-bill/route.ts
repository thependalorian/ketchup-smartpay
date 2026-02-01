/**
 * Split Bill API Route
 * 
 * Location: app/api/payments/split-bill/route.ts
 * Purpose: Split a bill among multiple users (like India's UPI split bill feature)
 * 
 * Compliance: PSD-12 (2FA required)
 * 
 * Flow:
 * 1. User creates split bill request with total amount and participants
 * 2. Each participant receives notification
 * 3. Participants pay their share
 * 4. Once all paid, bill is marked as settled
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount, validateCurrency, validateUUID } from '@/utils/validators';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import { twoFactorTokens } from '@/utils/redisClient';
import { log } from '@/utils/logger';

interface SplitBillRequest {
  totalAmount: number;
  currency?: string;
  description?: string;
  participants: Array<{
    userId: string;
    amount: number; // Each participant's share
    phoneNumber?: string; // For lookup if userId not available
  }>;
  walletId: string; // Payer's wallet
  verificationToken: string; // 2FA verification token (PSD-12 Compliance)
}

interface SplitBillPaymentRequest {
  splitBillId: string;
  walletId: string;
  verificationToken: string; // 2FA verification token
}

async function postHandler(req: ExpoRequest) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const {
      totalAmount,
      currency = 'NAD',
      description,
      participants,
      walletId,
      verificationToken,
    }: SplitBillRequest = await req.json();

    // Validate required fields
    if (!totalAmount || totalAmount <= 0) {
      return errorResponse('totalAmount must be greater than 0', HttpStatus.BAD_REQUEST);
    }

    if (!participants || participants.length === 0) {
      return errorResponse('At least one participant is required', HttpStatus.BAD_REQUEST);
    }

    // Validate total matches sum of participant amounts
    const participantSum = participants.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(participantSum - totalAmount) > 0.01) {
      return errorResponse(
        `Total amount (${totalAmount}) must equal sum of participant amounts (${participantSum})`,
        HttpStatus.BAD_REQUEST
      );
    }

    // PSD-12 Compliance: Require 2FA verification
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before creating split bill.',
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

    // Validate amount
    const amountCheck = validateAmount(totalAmount, {
      min: 0.01,
      max: 1000000,
      maxDecimals: 2,
    });
    if (!amountCheck.valid) {
      return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
    }

    // Validate currency
    const currencyCheck = validateCurrency(currency);
    if (!currencyCheck.valid) {
      return errorResponse(currencyCheck.error || 'Invalid currency', HttpStatus.BAD_REQUEST);
    }

    // Validate wallet ID
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

    // Verify and resolve participant user IDs
    const resolvedParticipants: Array<{ userId: string; amount: number }> = [];
    for (const participant of participants) {
      if (participant.userId) {
        // Verify user exists
        const userExists = await query<{ id: string }>(
          'SELECT id FROM users WHERE id = $1',
          [participant.userId]
        );
        if (userExists.length === 0) {
          return errorResponse(`Participant user not found: ${participant.userId}`, HttpStatus.BAD_REQUEST);
        }
        resolvedParticipants.push({ userId: participant.userId, amount: participant.amount });
      } else if (participant.phoneNumber) {
        // Look up user by phone number
        const userByPhone = await query<{ id: string }>(
          'SELECT id FROM users WHERE phone_number = $1',
          [participant.phoneNumber]
        );
        if (userByPhone.length === 0) {
          return errorResponse(`User not found for phone number: ${participant.phoneNumber}`, HttpStatus.BAD_REQUEST);
        }
        resolvedParticipants.push({ userId: userByPhone[0].id, amount: participant.amount });
      } else {
        return errorResponse('Each participant must have either userId or phoneNumber', HttpStatus.BAD_REQUEST);
      }
    }

    // Create split bill record
    const splitBillResult = await query<{ id: string; created_at: Date }>(
      `INSERT INTO split_bills (
        creator_id, total_amount, currency, description, status, wallet_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at`,
      [
        userId,
        totalAmount,
        currency,
        description || 'Split bill',
        'pending', // pending, partial, settled, cancelled
        walletId,
      ]
    );

    const splitBillId = splitBillResult[0]?.id;

    // Create split bill participants
    for (const participant of resolvedParticipants) {
      await query(
        `INSERT INTO split_bill_participants (
          split_bill_id, user_id, amount, paid_amount, status
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          splitBillId,
          participant.userId,
          participant.amount,
          0,
          'pending', // pending, paid
        ]
      );
    }

    // Log transaction operation (audit trail)
    await logTransactionOperation({
      transaction_id: splitBillId,
      transaction_type: 'split_bill',
      user_id: userId,
      amount: totalAmount,
      currency,
      from_wallet_id: walletId,
      payment_method: 'split_bill',
      two_factor_verified: true,
      ip_address: ipAddress,
      status: 'pending',
      metadata: JSON.stringify({
        participant_count: resolvedParticipants.length,
        description,
      }),
    }).catch(err => log.error('Failed to log transaction:', err));

    return createdResponse(
      {
        splitBillId,
        totalAmount,
        currency,
        participantCount: resolvedParticipants.length,
        status: 'pending',
        message: 'Split bill created successfully. Participants will be notified.',
      },
      `/api/payments/split-bill/${splitBillId}`,
      'Split bill created successfully'
    );
  } catch (error: any) {
    log.error('Split bill creation error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
