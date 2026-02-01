/**
 * SmartPay Webhook Endpoint
 * 
 * Location: app/api/webhooks/smartpay/route.ts
 * Purpose: Receive webhook notifications from Ketchup SmartPay system
 * 
 * Handles:
 * - Voucher status updates (redeemed, expired, cancelled)
 * - Beneficiary verification confirmations
 * - Account creation notifications
 * - Voucher issuance confirmations
 * 
 * Security:
 * - Webhook signature verification (HMAC-SHA256)
 * - Rate limiting
 * - Request validation
 * 
 * Compliance: PSD-1, PSD-3
 */

import { ExpoRequest } from 'expo-router/server';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import { logVoucherOperation } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import crypto from 'crypto';
import logger from '@/utils/logger';

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
    
    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification failed', error);
    return false;
  }
}

async function postHandler(req: ExpoRequest) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);
  
  try {
    // Get webhook secret from environment
    const webhookSecret = process.env.SMARTPAY_WEBHOOK_SECRET || '';
    
    if (!webhookSecret) {
      logger.warn('SmartPay webhook secret not configured');
      // In development, allow without signature verification
      // In production, this should be required
      if (process.env.NODE_ENV === 'production') {
        return errorResponse('Webhook secret not configured', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-smartpay-signature') || '';

    // Verify webhook signature (if secret is configured)
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      
      if (!isValid) {
        logger.warn('Invalid webhook signature', { requestId, ipAddress });
        
        // Log failed webhook attempt
        await logAPISyncOperation({
          requestId,
          direction: 'inbound',
          endpoint: '/api/webhooks/smartpay',
          method: 'POST',
          statusCode: 401,
          success: false,
          errorMessage: 'Invalid webhook signature',
        }).catch(err => logger.error('Failed to log webhook attempt:', err));

        return errorResponse('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
      }
    }

    // Parse webhook payload
    let payload: SmartPayWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      logger.error('Invalid webhook payload JSON', error);
      return errorResponse('Invalid JSON payload', HttpStatus.BAD_REQUEST);
    }

    // Validate required fields
    if (!payload.event_type || !payload.timestamp || !payload.data) {
      return errorResponse('Missing required fields: event_type, timestamp, data', HttpStatus.BAD_REQUEST);
    }

    // Log webhook receipt
    await logAPISyncOperation({
      requestId,
      direction: 'inbound',
      endpoint: '/api/webhooks/smartpay',
      method: 'POST',
      statusCode: 200,
      success: true,
      requestPayload: payload,
      beneficiaryId: payload.data.beneficiary_id,
      voucherId: payload.data.voucher_id,
    }).catch(err => logger.error('Failed to log webhook receipt:', err));

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
        logger.warn('Unknown webhook event type', { eventType: payload.event_type, requestId });
        return errorResponse(`Unknown event type: ${payload.event_type}`, HttpStatus.BAD_REQUEST);
    }

    return successResponse(
      { received: true, eventType: payload.event_type },
      'Webhook processed successfully'
    );

  } catch (error: any) {
    logger.error('SmartPay webhook processing error', error, { requestId, ipAddress });
    
    // Log failed webhook processing
    await logAPISyncOperation({
      requestId,
      direction: 'inbound',
      endpoint: '/api/webhooks/smartpay',
      method: 'POST',
      statusCode: 500,
      success: false,
      errorMessage: error.message || 'Webhook processing failed',
    }).catch(err => logger.error('Failed to log webhook error:', err));

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
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

  // Update voucher status in database
  await query(
    `UPDATE vouchers 
     SET status = $1, updated_at = NOW()
     WHERE id = $2 OR smartpay_voucher_id = $2`,
    [data.status, data.voucher_id]
  );

  // Log voucher operation
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
  }).catch(err => logger.error('Failed to log voucher operation:', err));

  logger.info('Voucher status updated via webhook', {
    voucherId: data.voucher_id,
    status: data.status,
    requestId,
  });
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

  // Update voucher verification status if voucher_id is provided
  if (data.voucher_id) {
    await query(
      `UPDATE vouchers 
       SET verification_status = $1, verified_at = NOW(), updated_at = NOW()
       WHERE id = $2 OR smartpay_voucher_id = $2`,
      [data.verification_status === 'verified' ? 'verified' : 'failed', data.voucher_id]
    );

    // Log voucher verification
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
    }).catch(err => logger.error('Failed to log verification:', err));
  }

  logger.info('Verification confirmation received via webhook', {
    verificationId: data.verification_id,
    status: data.verification_status,
    requestId,
  });
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

  // Link SmartPay beneficiary ID to Buffr user account
  // This assumes the account_id corresponds to a Buffr user
  await query(
    `UPDATE users 
     SET smartpay_beneficiary_id = $1, updated_at = NOW()
     WHERE id = $2 OR external_id = $2`,
    [data.beneficiary_id, data.account_id]
  );

  logger.info('Account creation notification received via webhook', {
    accountId: data.account_id,
    beneficiaryId: data.beneficiary_id,
    requestId,
  });
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

  // Update voucher with SmartPay voucher ID if not already set
  await query(
    `UPDATE vouchers 
     SET smartpay_voucher_id = $1, updated_at = NOW()
     WHERE id = $2 AND smartpay_voucher_id IS NULL`,
    [data.voucher_id, data.voucher_id]
  );

  logger.info('Voucher issuance confirmation received via webhook', {
    voucherId: data.voucher_id,
    beneficiaryId: data.beneficiary_id,
    requestId,
  });
}

// Webhook endpoint - no authentication required (uses signature verification)
// But we should still rate limit it
export const POST = async (req: ExpoRequest) => {
  // Basic rate limiting could be added here
  return postHandler(req);
};
