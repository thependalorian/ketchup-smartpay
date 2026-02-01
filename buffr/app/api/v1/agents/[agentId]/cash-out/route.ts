/**
 * Open Banking API: /api/v1/agents/{agentId}/cash-out
 * 
 * Agent cash-out (Open Banking format)
 * 
 * Compliance: PSD-12 (2FA required)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { validateAmount, validateUUID } from '@/utils/validators';
import { agentNetworkService } from '@/services/agentNetworkService';
import { twoFactorTokens } from '@/utils/redisClient';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

async function handleCashOut(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
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

    const { agentId } = params;
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

    const { BeneficiaryId, Amount, VoucherId } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!BeneficiaryId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field BeneficiaryId is missing',
          'Data.BeneficiaryId'
        )
      );
    }

    if (!Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Amount'
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
    const amountCheck = validateAmount(Amount, { min: 0.01, max: 1000000, maxDecimals: 2 });
    if (!amountCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        amountCheck.error || 'Invalid amount',
        400
      );
    }

    // Validate agent ID
    const agentIdCheck = validateUUID(agentId);
    if (!agentIdCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        agentIdCheck.error || 'Invalid agent ID',
        400
      );
    }

    // Process cash-out
    const transaction = await agentNetworkService.processCashOut(
      agentId,
      BeneficiaryId,
      Amount,
      VoucherId
    );

    const transactionId = transaction.id || randomUUID();

    // Create transaction record
    await query(
      `INSERT INTO transactions (
        id, user_id, transaction_type, amount, currency,
        description, status, payment_method, payment_reference,
        transaction_time, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        transactionId,
        BeneficiaryId,
        'cash_out',
        Amount,
        'NAD',
        'Agent Cash-Out',
        transaction.status || 'completed',
        'agent_cash_out',
        transactionId,
        new Date(),
        new Date(),
      ]
    ).catch(err => log.error('Failed to create transaction record:', err));

    const cashOutResponse = {
      Data: {
        TransactionId: transactionId,
        AgentId: agentId,
        BeneficiaryId,
        Amount,
        Currency: 'NAD',
        Status: transaction.status || 'completed',
        VoucherId: VoucherId || null,
        CreatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/agents/${agentId}/transactions/${transactionId}`,
      },
      Meta: {},
    };

    return helpers.created(
      cashOutResponse,
      `/api/v1/transactions/${transactionId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error processing agent cash-out:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the cash-out',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleCashOut,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
