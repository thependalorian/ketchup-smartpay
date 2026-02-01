/**
 * Open Banking API: /api/v1/groups/{groupId}/contribute
 * 
 * Contribute money to a group (Open Banking format)
 * 
 * Compliance: PSD-12 (2FA required)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateAmount } from '@/utils/validators';
import { twoFactorTokens } from '@/utils/redisClient';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

async function handleContribute(
  req: ExpoRequest,
  { params }: { params: { groupId: string } }
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

    const { groupId } = params;
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

    const { Amount, WalletId } = Data;

    if (!Amount) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Amount is required',
        400
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

    // Verify user is a member of the group
    const member = await query<any>(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, actualUserId]
    );

    if (member.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        'You are not a member of this group',
        403
      );
    }

    // Update wallet balance if using wallet
    if (WalletId) {
      const wallet = await query<any>(
        'SELECT balance, user_id FROM wallets WHERE id = $1',
        [WalletId]
      );

      if (wallet.length === 0) {
        return helpers.error(
          OpenBankingErrorCode.RESOURCE_NOT_FOUND,
          'Wallet not found',
          404
        );
      }

      if (wallet[0].user_id !== actualUserId) {
        return helpers.error(
          OpenBankingErrorCode.FORBIDDEN,
          'Unauthorized',
          403
        );
      }

      if (parseFloat(wallet[0].balance.toString()) < Amount) {
        return helpers.error(
          OpenBankingErrorCode.INSUFFICIENT_FUNDS,
          'Insufficient balance',
          400
        );
      }

      // Update wallet balance
      await query(
        'UPDATE wallets SET balance = balance - $1 WHERE id = $2',
        [Amount, WalletId]
      );
    }

    // Update group member contribution
    await query(
      'UPDATE group_members SET contribution = contribution + $1 WHERE group_id = $2 AND user_id = $3',
      [Amount, groupId, actualUserId]
    );

    // Update group current amount
    await query(
      'UPDATE groups SET current_amount = current_amount + $1 WHERE id = $2',
      [Amount, groupId]
    );

    // Create transaction record
    const transactionId = randomUUID();
    const txResult = await query<any>(
      `INSERT INTO transactions (
        id, user_id, wallet_id, transaction_type, amount, currency, status, description, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at`,
      [
        transactionId,
        actualUserId,
        WalletId || null,
        'payment',
        Amount,
        'NAD',
        'completed',
        'Group contribution',
        'group',
      ]
    );

    const contributionResponse = {
      Data: {
        TransactionId: transactionId,
        GroupId: groupId,
        UserId: actualUserId,
        Amount,
        Currency: 'NAD',
        WalletId: WalletId || null,
        CreatedDateTime: txResult[0]?.created_at.toISOString() || new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/groups/${groupId}/contribute`,
        Transaction: `/api/v1/transactions/${transactionId}`,
      },
      Meta: {},
    };

    return helpers.created(
      contributionResponse,
      `/api/v1/transactions/${transactionId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error contributing to group:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the contribution',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleContribute,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
