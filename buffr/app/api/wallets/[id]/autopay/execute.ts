/**
 * API Route: /api/wallets/[id]/autopay/execute
 * 
 * - POST: Execute an AutoPay rule
 * 
 * Supports Adumo Online integration for card payments
 */
import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';

import { 
  validateAmount, 
  validateCardNumber, 
  validateCardExpiry, 
  validateCVV,
  validateUUID
} from '@/utils/validators';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { query, getUserIdFromRequest } from '@/utils/db';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import logger, { log } from '@/utils/logger';

async function handleExecuteAutopay(
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

    const { id: walletId } = params;
    
    // Validate wallet ID format
    const walletIdCheck = validateUUID(walletId);
    if (!walletIdCheck.valid) {
      return errorResponse(walletIdCheck.error || 'Invalid wallet ID', HttpStatus.BAD_REQUEST);
    }
    
    const { 
      ruleId,
      amount,
      recipientId,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardHolderFullName,
      token,
      profileUid,
      verificationToken, // 2FA verification token (PSD-12 Compliance)
    } = await req.json();

    // PSD-12 Compliance: Require 2FA verification for autopay execution
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before executing autopay.',
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
    
    // Validate required fields
    if (!ruleId) {
      return errorResponse('ruleId is required', HttpStatus.BAD_REQUEST);
    }

    // Validate rule ID format
    const ruleIdCheck = validateUUID(ruleId);
    if (!ruleIdCheck.valid) {
      return errorResponse(ruleIdCheck.error || 'Invalid rule ID', HttpStatus.BAD_REQUEST);
    }

    // Validate amount if provided
    if (amount !== undefined) {
      const amountCheck = validateAmount(amount, { 
        min: 0.01, 
        max: 1000000, 
        maxDecimals: 2 
      });
      if (!amountCheck.valid) {
        return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
      }
    }

    // Validate card details if card payment
    if (cardNumber || token) {
      // If cardNumber is provided, validate it
      if (cardNumber) {
        const cardCheck = validateCardNumber(cardNumber);
        if (!cardCheck.valid) {
          return errorResponse(cardCheck.error || 'Invalid card number', HttpStatus.BAD_REQUEST);
        }
      }

      // Validate expiry if provided
      if (expiryMonth && expiryYear) {
        const expiryCheck = validateCardExpiry(expiryMonth, expiryYear);
        if (!expiryCheck.valid) {
          return errorResponse(expiryCheck.error || 'Invalid card expiry', HttpStatus.BAD_REQUEST);
        }
      }

      // Validate CVV if provided
      if (cvv) {
        const cvvCheck = validateCVV(cvv);
        if (!cvvCheck.valid) {
          return errorResponse(cvvCheck.error || 'Invalid CVV', HttpStatus.BAD_REQUEST);
        }
      }
    }

    // If card payment details are provided, use Adumo Online
    if (cardNumber || token) {
      try {
        const { completePaymentFlow } = await import('@/services/adumoService');
        
        // Get user agent from request headers (ipAddress already extracted at top)
        const userAgent = req.headers.get('user-agent') || 'Buffr Mobile App';

        const paymentResult = await completePaymentFlow({
          amount: amount || 200.00,
          merchantReference: `autopay-${ruleId}-${Date.now()}`,
          cardNumber,
          expiryMonth,
          expiryYear,
          cvv,
          cardHolderFullName,
          saveCardDetails: false,
          profileUid,
          token,
          ipAddress: ipAddress || '0.0.0.0',
          userAgent,
        });

        if (paymentResult.requires3DSecure) {
          return successResponse({
            requires3DSecure: true,
            transactionId: paymentResult.transactionId,
            threeDSecureFormData: paymentResult.threeDSecureFormData,
          }, '3D Secure authentication required');
        }

        if (!paymentResult.success) {
          // Log failed transaction
          await logTransactionOperation({
            transaction_id: paymentResult.transactionId || `failed_${Date.now()}`,
            transaction_type: 'autopay_execute',
            user_id: userId,
            amount: amount || 200.00,
            currency: 'NAD',
            from_wallet_id: walletId,
            payment_method: 'card',
            status: 'failed',
            error_message: paymentResult.statusMessage || 'AutoPay execution failed',
            two_factor_verified: true,
            ip_address: ipAddress,
          }).catch(err => logger.error('Failed to log transaction', err));

          return errorResponse(
            paymentResult.statusMessage || 'AutoPay execution failed',
            HttpStatus.BAD_REQUEST
          );
        }

        // Payment successful via Adumo
        const transactionId = paymentResult.transactionId;

        // Log successful transaction (audit trail)
        await logTransactionOperation({
          transaction_id: transactionId,
          transaction_type: 'autopay_execute',
          user_id: userId,
          amount: amount || 200.00,
          currency: 'NAD',
          from_wallet_id: walletId,
          recipient_id: recipientId,
          payment_method: 'card',
          payment_reference: transactionId,
          two_factor_verified: true,
          ip_address: ipAddress,
          status: paymentResult.settled ? 'completed' : 'authorised',
        }).catch(err => logger.error('Failed to log transaction', err));

        const transaction = {
          id: transactionId,
          ruleId,
          walletId,
          amount: amount || 200.00,
          status: paymentResult.settled ? 'success' : 'pending',
          executedAt: new Date().toISOString(),
          recipient: {
            id: recipientId || 'recipient-1',
            name: 'AutoPay Recipient',
          },
          ruleDescription: 'AutoPay payment',
          authorisationCode: paymentResult.authorisationCode,
        };

        return createdResponse(transaction, `/api/transactions/${transactionId}`, 'AutoPay executed successfully');
      } catch (adumoError: any) {
        log.error('Adumo AutoPay error:', adumoError);
        
        // Log failed transaction
        await logTransactionOperation({
          transaction_id: `failed_${Date.now()}`,
          transaction_type: 'autopay_execute',
          user_id: userId,
          amount: amount || 200.00,
          currency: 'NAD',
          from_wallet_id: walletId,
          payment_method: 'card',
          status: 'failed',
          error_message: adumoError.message || 'Payment gateway error',
          two_factor_verified: true,
          ip_address: ipAddress,
        }).catch(err => logger.error('Failed to log transaction', err));

        return errorResponse(
          adumoError.message || 'Payment gateway error',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
    
    // For non-card payments (internal transfers), save to database
    // userId already extracted at top
    
    // Save AutoPay transaction to Neon DB
    const transactionResult = await query<{
      id: string;
      rule_id: string | null;
      wallet_id: string;
      user_id: string;
      amount: number;
      status: string;
      executed_at: Date;
      recipient_id: string | null;
      recipient_name: string | null;
      rule_description: string | null;
    }>(
      `INSERT INTO autopay_transactions (
        rule_id, wallet_id, user_id, amount, status,
        recipient_id, recipient_name, rule_description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        ruleId || null,
        walletId,
        userId,
        amount || 200.00,
        'success',
        recipientId || null,
        'AutoPay Recipient',
        'AutoPay payment',
      ]
    );

    if (transactionResult.length === 0) {
      throw new Error('Failed to create AutoPay transaction');
    }

    const tx = transactionResult[0];

    const transactionId = tx.id;

    // Log successful transaction (audit trail)
    await logTransactionOperation({
      transaction_id: transactionId,
      transaction_type: 'autopay_execute',
      user_id: userId,
      amount: parseFloat(tx.amount.toString()),
      currency: 'NAD',
      from_wallet_id: walletId,
      recipient_id: tx.recipient_id,
      payment_method: 'internal_transfer',
      two_factor_verified: true,
      ip_address: ipAddress,
      status: 'completed',
    }).catch(err => logger.error('Failed to log transaction', err));

    const transaction = {
      id: transactionId,
      ruleId: tx.rule_id || '',
      walletId: tx.wallet_id,
      amount: parseFloat(tx.amount.toString()),
      status: tx.status,
      executedAt: tx.executed_at.toISOString(),
      recipient: tx.recipient_id ? {
        id: tx.recipient_id,
        name: tx.recipient_name || 'Unknown',
      } : undefined,
      ruleDescription: tx.rule_description || 'AutoPay payment',
    };

    return createdResponse(transaction, `/api/transactions/${transactionId}`, 'AutoPay executed successfully');
  } catch (error: any) {
    logger.error('Error executing AutoPay', error);
    
    // Log failed transaction
    await logTransactionOperation({
      transaction_id: `failed_${Date.now()}`,
      transaction_type: 'autopay_execute',
      user_id: userId,
      amount: amount || 200.00,
      currency: 'NAD',
      from_wallet_id: walletId,
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Internal server error',
      two_factor_verified: false,
      ip_address: ipAddress,
    }).catch(err => logger.error('Failed to log transaction', err));

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to execute AutoPay',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply standardized security wrapper
export const POST = secureAuthRoute(RATE_LIMITS.payment, handleExecuteAutopay);
