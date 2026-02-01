/**
 * API Route: /api/groups/[id]/contribute
 * 
 * - POST: Contribute money to a group
 */
import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest } from '@/utils/db';
import logger, { log } from '@/utils/logger';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';

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

    const { id: groupId } = params;
    const { amount, paymentSource, walletId, verificationToken } = await req.json();
  
    if (!amount || amount <= 0) {
      return errorResponse('Valid amount is required (must be greater than 0)', HttpStatus.BAD_REQUEST);
    }

    // PSD-12 Compliance: Require 2FA verification for group contributions
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before contributing.',
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

    // Verify the verificationToken against Redis cache (PSD-12 Compliance)
    const { twoFactorTokens } = await import('@/utils/redisClient');
    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    
    if (!tokenData) {
      return errorResponse(
        'Invalid or expired 2FA verification token. Please verify your PIN or biometric again.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify user is a member of the group
    const member = await query<{ id: string }>(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (member.length === 0) {
      return errorResponse('You are not a member of this group', HttpStatus.FORBIDDEN);
    }

    // Update wallet balance if using wallet
    if (walletId) {
      const wallet = await query<{ balance: number; user_id: string }>(
        'SELECT balance, user_id FROM wallets WHERE id = $1',
        [walletId]
      );

      if (wallet.length === 0) {
        return errorResponse('Wallet not found', HttpStatus.NOT_FOUND);
      }

      if (wallet[0].user_id !== userId) {
        return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
      }

      if (parseFloat(wallet[0].balance.toString()) < amount) {
        return errorResponse('Insufficient balance', HttpStatus.BAD_REQUEST);
      }

      // Update wallet balance
      await query(
        'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
        [amount, walletId]
      );
    }

    // Update group member contribution
    await query(
      'UPDATE group_members SET contribution = contribution + $1 WHERE group_id = $2 AND user_id = $3',
      [amount, groupId, userId]
    );

    // Update group current amount
    await query(
      'UPDATE groups SET current_amount = current_amount + $1 WHERE id = $2',
      [amount, groupId]
    );

    // Create transaction record
    const txResult = await query<{
      id: string;
      created_at: Date;
    }>(
      `INSERT INTO transactions (
        user_id, wallet_id, type, amount, status, description, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at`,
      [
        userId,
        walletId || null,
        'payment',
        amount,
        'completed',
        `Group contribution`,
        'group',
      ]
    );
  
    const contribution = {
      id: txResult[0]?.id || `contrib_${Date.now()}`,
      groupId,
      userId,
      amount,
      paymentSource,
      createdAt: txResult[0]?.created_at || new Date(),
    };
  
    const transactionId = txResult[0]?.id || `group_contribute_${Date.now()}`;

    // Log successful transaction (audit trail)
    await logTransactionOperation({
      transaction_id: transactionId,
      transaction_type: 'group_contribution',
      user_id: userId,
      amount: amount,
      currency: 'NAD',
      from_wallet_id: walletId || null,
      recipient_id: groupId,
      payment_method: walletId ? 'wallet' : 'other',
      two_factor_verified: true,
      ip_address: ipAddress,
      status: 'completed',
    }).catch(err => log.error('Failed to log transaction:', err));

    const contribution = {
      id: transactionId,
      groupId,
      userId,
      amount,
      paymentSource,
      createdAt: txResult[0]?.created_at || new Date(),
    };

    return createdResponse(contribution, `/api/transactions/${transactionId}`, 'Contribution successful');
  } catch (error) {
    logger.error({ err: error }, 'Error contributing to group');
    
    // Log failed transaction
    await logTransactionOperation({
      transaction_id: `failed_${Date.now()}`,
      transaction_type: 'group_contribution',
      user_id: userId,
      amount: 0,
      currency: 'NAD',
      recipient_id: groupId,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Internal server error',
      two_factor_verified: false,
      ip_address: ipAddress,
    }).catch(err => log.error('Failed to log transaction:', err));

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to contribute',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
