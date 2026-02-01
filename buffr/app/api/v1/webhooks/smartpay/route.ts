/**
 * Open Banking API: /api/v1/webhooks/smartpay
 * 
 * SmartPay webhook endpoint (Open Banking format)
 * 
 * Security: Webhook signature verification (HMAC-SHA256)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import { logVoucherOperation } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import crypto from 'crypto';
import { log } from '@/utils/logger';

interface SmartPayWebhookPayload {
  event_type: 'voucher_status_update' | 'verification_confirmation' | 'account_created' | 'voucher_issued';
  timestamp: string;
  data: {
    voucher_id?: string;
    beneficiary_id?: string;
    status?: string;
    verification_id?: string;
    verification_status?: 'verified' | 'failed';
    account_id?: string;
    amount?: number;
    [key: string]: any;
  };
}

/**
 * Verify webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    log.error('Webhook signature verification failed', error);
    return false;
  }
}

/**
 * POST /api/v1/webhooks/smartpay
 * Receive webhook notifications from SmartPay
 */
async function handleWebhook(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);
  
  try {
    const webhookSecret = process.env.SMARTPAY_WEBHOOK_SECRET || '';
    
    if (!webhookSecret && process.env.NODE_ENV === 'production') {
      return helpers.error(
        OpenBankingErrorCode.SERVER_ERROR,
        'Webhook secret not configured',
        500
      );
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-smartpay-signature') || '';

    // Verify webhook signature (if secret is configured)
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        log.warn('Invalid webhook signature', { requestId, ipAddress });
        
        await logAPISyncOperation({
          requestId,
          direction: 'inbound',
          endpoint: '/api/v1/webhooks/smartpay',
          method: 'POST',
          statusCode: 401,
          success: false,
          errorMessage: 'Invalid webhook signature',
        }).catch(err => log.error('Failed to log webhook attempt:', err));

        return helpers.error(
          OpenBankingErrorCode.UNAUTHORIZED,
          'Invalid webhook signature',
          401
        );
      }
    }

    // Parse webhook payload
    let payload: SmartPayWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid JSON payload',
        400
      );
    }

    // Validate required fields
    if (!payload.event_type || !payload.timestamp || !payload.data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Missing required fields: event_type, timestamp, data',
        400
      );
    }

    // Log webhook receipt
    await logAPISyncOperation({
      requestId,
      direction: 'inbound',
      endpoint: '/api/v1/webhooks/smartpay',
      method: 'POST',
      statusCode: 200,
      success: true,
      requestPayload: payload,
      beneficiaryId: payload.data.beneficiary_id,
      voucherId: payload.data.voucher_id,
    }).catch(err => log.error('Failed to log webhook receipt:', err));

    // Handle different event types
    switch (payload.event_type) {
      case 'voucher_status_update':
        await handleVoucherStatusUpdate(payload.data, requestId);
        break;
      
      case 'verification_confirmation':
        await handleVerificationConfirmation(payload.data, requestId);
        break;
      
      case 'account_created':
        await handleAccountCreated(payload.data, requestId);
        break;
      
      case 'voucher_issued':
        await handleVoucherIssued(payload.data, requestId);
        break;
      
      default:
        log.warn('Unknown webhook event type', { eventType: payload.event_type, requestId });
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          `Unknown event type: ${payload.event_type}`,
          400
        );
    }

    const webhookResponse = {
      Data: {
        Received: true,
        EventType: payload.event_type,
        ProcessedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/webhooks/smartpay',
      },
      Meta: {},
    };

    return helpers.success(
      webhookResponse,
      200,
      undefined,
      undefined,
      context?.requestId || requestId
    );

  } catch (error: any) {
    log.error('SmartPay webhook processing error', { error, requestId, ipAddress });
    
    await logAPISyncOperation({
      requestId,
      direction: 'inbound',
      endpoint: '/api/v1/webhooks/smartpay',
      method: 'POST',
      statusCode: 500,
      success: false,
      errorMessage: error.message || 'Webhook processing failed',
    }).catch(err => log.error('Failed to log webhook error:', err));

    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      error.message || 'An error occurred while processing the webhook',
      500
    );
  }
}

/**
 * Handle voucher status update from SmartPay
 */
async function handleVoucherStatusUpdate(
  data: SmartPayWebhookPayload['data'],
  requestId: string
): Promise<void> {
  if (!data.voucher_id || !data.status) {
    throw new Error('Missing voucher_id or status in voucher_status_update');
  }

  await query(
    `UPDATE vouchers 
     SET status = $1, updated_at = NOW()
     WHERE id = $2 OR smartpay_voucher_id = $2`,
    [data.status, data.voucher_id]
  );

  await logVoucherOperation({
    voucher_id: data.voucher_id,
    operation_type: data.status as any,
    new_status: data.status,
    smartpay_beneficiary_id: data.beneficiary_id || '',
    metadata: {
      source: 'smartpay_webhook',
      requestId,
      timestamp: new Date().toISOString(),
    },
  }).catch(err => log.error('Failed to log voucher operation:', err));
}

/**
 * Handle verification confirmation from SmartPay
 */
async function handleVerificationConfirmation(
  data: SmartPayWebhookPayload['data'],
  requestId: string
): Promise<void> {
  if (!data.verification_id || !data.verification_status) {
    throw new Error('Missing verification_id or verification_status in verification_confirmation');
  }

  if (data.voucher_id) {
    await query(
      `UPDATE vouchers 
       SET verification_status = $1, verified_at = NOW(), updated_at = NOW()
       WHERE id = $2 OR smartpay_voucher_id = $2`,
      [data.verification_status === 'verified' ? 'verified' : 'failed', data.voucher_id]
    );

    await logVoucherOperation({
      voucher_id: data.voucher_id,
      operation_type: 'verified',
      new_status: 'verified',
      smartpay_beneficiary_id: data.beneficiary_id || '',
      biometric_verification_id: data.verification_id,
      metadata: {
        source: 'smartpay_webhook',
        verification_status: data.verification_status,
        requestId,
      },
    }).catch(err => log.error('Failed to log verification:', err));
  }
}

/**
 * Handle account creation notification from SmartPay
 */
async function handleAccountCreated(
  data: SmartPayWebhookPayload['data'],
  requestId: string
): Promise<void> {
  if (!data.account_id || !data.beneficiary_id) {
    throw new Error('Missing account_id or beneficiary_id in account_created');
  }

  await query(
    `UPDATE users 
     SET smartpay_beneficiary_id = $1, updated_at = NOW()
     WHERE id = $2 OR external_id = $2`,
    [data.beneficiary_id, data.account_id]
  );
}

/**
 * Handle voucher issuance confirmation from SmartPay
 */
async function handleVoucherIssued(
  data: SmartPayWebhookPayload['data'],
  requestId: string
): Promise<void> {
  if (!data.voucher_id || !data.beneficiary_id) {
    throw new Error('Missing voucher_id or beneficiary_id in voucher_issued');
  }

  await query(
    `UPDATE vouchers 
     SET smartpay_voucher_id = $1, updated_at = NOW()
     WHERE id = $2 AND smartpay_voucher_id IS NULL`,
    [data.voucher_id, data.voucher_id]
  );
}

// Webhook endpoint - no authentication required (uses signature verification)
export const POST = openBankingSecureRoute(
  handleWebhook,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: false, // Webhook uses signature verification instead
    trackResponseTime: true,
  }
);
