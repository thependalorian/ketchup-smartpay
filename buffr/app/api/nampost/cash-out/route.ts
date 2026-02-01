/**
 * NamPost Cash-Out API Route
 * 
 * Location: app/api/nampost/cash-out/route.ts
 * Purpose: Process cash-out at NamPost branch
 * 
 * Compliance: PSD-12 (2FA required)
 * Integration: NamPost API for cash-out processing
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount, validateUUID } from '@/utils/validators';
import { namPostService } from '@/services/namPostService';
import { twoFactorTokens } from '@/utils/redisClient';
import { logTransactionOperation, generateRequestId, getIpAddress } from '@/utils/auditLogger';
import { sendTransactionNotification } from '@/utils/sendPushNotification';
import logger from '@/utils/logger';

interface NamPostCashOutRequest {
  branchId: string;
  amount: number;
  voucherId?: string;
  verificationToken: string; // 2FA verification token (PSD-12 Compliance)
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
      branchId,
      amount,
      voucherId,
      verificationToken,
    }: NamPostCashOutRequest = await req.json();

    // Validate required fields
    if (!branchId || !amount || !verificationToken) {
      return errorResponse('branchId, amount, and verificationToken are required', HttpStatus.BAD_REQUEST);
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

    // Process cash-out via NamPost service
    const result = await namPostService.processCashOut({
      userId,
      branchId,
      amount,
      voucherId,
    });

    // Log transaction operation (audit trail)
    await logTransactionOperation({
      transaction_id: result.transactionId,
      transaction_type: 'cash_out',
      user_id: userId,
      amount,
      currency: 'NAD',
      payment_method: 'nampost_cash_out',
      payment_reference: result.transactionId,
      two_factor_verified: true,
      ip_address: ipAddress,
      status: result.status,
      metadata: JSON.stringify({
        branchId,
        voucherId: voucherId || null,
        nampostReference: result.nampostReference,
      }),
    }).catch(err => logger.error('Failed to log transaction:', err));

    // Send instant payment notification
    const amountFormatted = `NAD ${amount.toFixed(2)}`;
    await sendTransactionNotification(
      userId,
      'cash_out',
      amountFormatted,
      'NamPost Cash-Out',
      result.transactionId
    ).catch(err => logger.error('Failed to send notification:', err));

    return createdResponse(
      {
        transactionId: result.transactionId,
        branchId,
        amount,
        currency: 'NAD',
        status: result.status,
        voucherId: voucherId || null,
        nampostReference: result.nampostReference,
      },
      `/api/transactions/${result.transactionId}`,
      'Cash-out transaction processed successfully at NamPost'
    );
  } catch (error: any) {
    logger.error('NamPost cash-out error', error, { requestId, ipAddress });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process cash-out',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
