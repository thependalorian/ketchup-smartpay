/**
 * Agent Cash-Out API Route
 * 
 * Location: app/api/agents/[id]/cash-out/route.ts
 * Purpose: Process cash-out transaction at agent location
 * 
 * Compliance: PSD-12 (2FA required)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount, validateUUID } from '@/utils/validators';
import { agentNetworkService } from '@/services/agentNetworkService';
import { twoFactorTokens } from '@/utils/redisClient';
import { logTransactionOperation, generateRequestId, getIpAddress } from '@/utils/auditLogger';
import { sendTransactionNotification } from '@/utils/sendPushNotification';
import logger from '@/utils/logger';

interface AgentCashOutRequest {
  beneficiaryId: string;
  amount: number;
  voucherId?: string;
  verificationToken: string; // 2FA verification token (PSD-12 Compliance)
}

async function postHandler(req: ExpoRequest, { id: agentId }: { id: string }) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const {
      beneficiaryId,
      amount,
      voucherId,
      verificationToken,
    }: AgentCashOutRequest = await req.json();

    // Validate required fields
    if (!beneficiaryId || !amount || !verificationToken) {
      return errorResponse('beneficiaryId, amount, and verificationToken are required', HttpStatus.BAD_REQUEST);
    }

    // PSD-12 Compliance: Require 2FA verification
    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    if (!tokenData) {
      return errorResponse(
        'Invalid or expired 2FA verification token. Please verify your PIN or biometric again.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Validate amount
    const amountCheck = validateAmount(amount, {
      min: 0.01,
      max: 1000000,
      maxDecimals: 2,
    });
    if (!amountCheck.valid) {
      return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
    }

    // Validate beneficiary ID
    const beneficiaryIdCheck = validateUUID(beneficiaryId);
    if (!beneficiaryIdCheck.valid) {
      return errorResponse(beneficiaryIdCheck.error || 'Invalid beneficiary ID', HttpStatus.BAD_REQUEST);
    }

    // Validate agent ID
    const agentIdCheck = validateUUID(agentId);
    if (!agentIdCheck.valid) {
      return errorResponse(agentIdCheck.error || 'Invalid agent ID', HttpStatus.BAD_REQUEST);
    }

    // Process cash-out
    const transaction = await agentNetworkService.processCashOut(
      agentId,
      beneficiaryId,
      amount,
      voucherId
    );

    // Log transaction operation (audit trail)
    await logTransactionOperation({
      transaction_id: transaction.id,
      transaction_type: 'cash_out',
      user_id: beneficiaryId,
      amount,
      currency: 'NAD',
      payment_method: 'agent_cash_out',
      payment_reference: transaction.id,
      two_factor_verified: true,
      ip_address: ipAddress,
      status: transaction.status,
      metadata: JSON.stringify({
        agentId,
        voucherId: voucherId || null,
      }),
    }).catch(err => logger.error('Failed to log transaction:', err));

    // Send instant payment notification
    const amountFormatted = `NAD ${amount.toFixed(2)}`;
    await sendTransactionNotification(
      beneficiaryId,
      'cash_out',
      amountFormatted,
      'Agent Cash-Out',
      transaction.id
    ).catch(err => logger.error('Failed to send notification:', err));

    return createdResponse(
      {
        transactionId: transaction.id,
        agentId,
        beneficiaryId,
        amount,
        currency: 'NAD',
        status: transaction.status,
        voucherId: voucherId || null,
      },
      `/api/agents/${agentId}/transactions/${transaction.id}`,
      'Cash-out transaction processed successfully'
    );
  } catch (error: any) {
    logger.error('Agent cash-out error', error, { requestId, agentId, ipAddress });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process cash-out',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
