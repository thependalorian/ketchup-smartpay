/**
 * Namibian Open Banking API: /bon/v1/banking/payments/{paymentId}
 * 
 * Payment Initiation Service (PIS) - Get Payment Status
 * 
 * Purpose: Get status of a payment that was previously initiated
 * 
 * GET /bon/v1/banking/payments/payment-123
 * 
 * Headers:
 * - ParticipantId: API123456 (TPP Participant ID)
 * - x-v: 1 (API version)
 * - Authorization: Bearer {access_token}
 * 
 * Response:
 * {
 *   "Data": {
 *     "PaymentId": "payment-123",
 *     "Status": "Accepted",
 *     "InitiationDateTime": "2026-01-26T10:00:00Z",
 *     "Amount": "50.00",
 *     "Currency": "NAD"
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { NamibianOpenBankingErrorCode } from '@/utils/namibianOpenBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibianOpenBankingHeaders } from '@/utils/namibianOpenBanking';
import { verifyAccessToken } from '@/utils/oauth2Consent';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';
import { recordServiceLevelMetric } from '@/utils/namibianOpenBankingMiddleware';

/**
 * GET /bon/v1/banking/payments/{paymentId}
 * Get payment status (PIS)
 */
async function handleGetPaymentStatus(
  req: ExpoRequest,
  { params }: { params: { paymentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const startTime = Date.now();
  
  try {
    // Validate Namibian Open Banking headers
    const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
    if (!headerValidation.valid) {
      const responseTime = Date.now() - startTime;
      if (headerValidation.participantId) {
        await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', headerValidation.participantId, false, responseTime);
      }
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_REQUEST,
        'Invalid request headers',
        400,
        headerValidation.errors.map(err => ({
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_INVALID,
          Message: err,
          Path: 'Headers',
        }))
      );
    }
    
    const tppId = headerValidation.participantId!;
    
    // Verify access token
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    if (!accessToken) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Authorization header with Bearer token is required',
        401
      );
    }
    
    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Invalid or expired access token',
        401
      );
    }
    
    // Verify consent has required scope
    const scopes = tokenPayload.scope.split(' ').filter(Boolean);
    if (!scopes.includes('banking:payments.read')) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_SCOPE,
        'Consent does not include required scope: banking:payments.read',
        403
      );
    }
    
    const { paymentId } = params;
    
    // Query payment
    const payments = await query<{
      id: string;
      payer_account_id: string;
      beneficiary_account_id: string;
      amount: number;
      currency: string;
      payment_type: string;
      status: string;
      reference: string;
      created_at: Date;
      tpp_id: string;
    }>(
      `SELECT * FROM payments WHERE id = $1`,
      [paymentId]
    );
    
    if (payments.length === 0) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Payment not found',
        404
      );
    }
    
    const payment = payments[0];
    
    // Verify TPP has access to this payment
    if (payment.tpp_id !== tokenPayload.aud) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
        'Access denied to this payment',
        403
      );
    }
    
    const responseTime = Date.now() - startTime;
    await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', tppId, true, responseTime);
    
    log.info('Payment status retrieved', {
      payment_id: paymentId,
      tpp_id: tokenPayload.aud,
      response_time_ms: responseTime,
    });
    
    return helpers.success(
      {
        PaymentId: payment.id,
        Status: payment.status,
        InitiationDateTime: payment.created_at.toISOString(),
        Amount: (payment.amount / 100).toFixed(2),
        Currency: payment.currency || 'NAD',
        PaymentType: payment.payment_type,
        Reference: payment.reference,
        PayerAccountId: payment.payer_account_id,
        BeneficiaryAccountId: payment.beneficiary_account_id,
      },
      200,
      {
        Self: `/bon/v1/banking/payments/${paymentId}`,
      },
      {
        request_time_ms: responseTime,
      }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const tppId = validateNamibianOpenBankingHeaders(req.headers).participantId;
    if (tppId) {
      await recordServiceLevelMetric('/bon/v1/banking/payments/{paymentId}', tppId, false, responseTime);
    }
    log.error('Get payment status error', {
      error: error.message,
      response_time_ms: responseTime,
    });
    
    return helpers.error(
      NamibianOpenBankingErrorCode.SERVER_ERROR,
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

export const GET = openBankingSecureRoute(handleGetPaymentStatus, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false,
  forceOpenBanking: true,
});
