/**
 * API Route: /api/wallets/[id]/add-money
 * 
 * - POST: Add money to wallet
 * 
 * Supports:
 * - Card payments via Adumo Online
 * - Bank transfers
 * - Other payment methods
 */
import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import logger, { log } from '@/utils/logger';

import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { prepareTransactionData } from '@/utils/db-adapters';
import { 
  validateAmount, 
  validateCardNumber, 
  validateCardExpiry, 
  validateCVV 
} from '@/utils/validators';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';

async function handleAddMoney(
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
    const {
      amount,
      paymentMethod,
      paymentMethodId,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cardHolderFullName,
      saveCardDetails,
      profileUid,
      token,
      verificationToken, // 2FA verification token (PSD-12 Compliance)
    } = await req.json();

    // PSD-12 Compliance: Require 2FA verification for adding money (especially for large amounts)
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before adding money.',
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

    // Validate amount
    const amountCheck = validateAmount(amount, { 
      min: 0.01, 
      max: 1000000, 
      maxDecimals: 2 
    });
    if (!amountCheck.valid) {
      return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
    }

    // Validate card details if card payment
    if (paymentMethod === 'card' && (cardNumber || token)) {
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

    // If card payment, use Adumo Online
    if (paymentMethod === 'card' && (cardNumber || token)) {
      try {
        const { completePaymentFlow } = await import('@/services/adumoService');

        // Get user agent from request headers (ipAddress already extracted at top)
        const userAgent = req.headers.get('user-agent') || 'Buffr Mobile App';

        const paymentResult = await completePaymentFlow({
          amount,
          merchantReference: `add-money-${walletId}-${Date.now()}`,
          cardNumber,
          expiryMonth,
          expiryYear,
          cvv,
          cardHolderFullName,
          saveCardDetails: saveCardDetails || false,
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
            transaction_type: 'wallet_add_money',
            user_id: userId,
            amount: amount,
            currency: 'NAD',
            to_wallet_id: walletId,
            payment_method: 'card',
            status: 'failed',
            error_message: paymentResult.statusMessage || 'Payment failed',
            two_factor_verified: true,
            ip_address: ipAddress,
          }).catch(err => log.error('Failed to log transaction:', err));

          return errorResponse(
            paymentResult.statusMessage || 'Payment failed',
            HttpStatus.BAD_REQUEST
          );
        }

        // Payment successful via Adumo - update wallet balance in database
        // Find actual user ID (userId already extracted at top)
        const actualUserId = await findUserId(query, userId);
        if (!actualUserId) {
          return errorResponse('User not found', HttpStatus.NOT_FOUND);
        }
        
        // Update wallet balance (use available_balance for existing schema)
        await query(
          'UPDATE wallets SET balance = balance + $1, available_balance = available_balance + $1 WHERE id = $2',
          [amount, walletId]
        );

        // Prepare transaction data using adapter
        const txData = prepareTransactionData({
          walletId,
          type: 'transfer_in',
          amount,
          description: 'Card payment via Adumo',
          status: paymentResult.settled ? 'completed' : 'pending',
          date: new Date(),
        }, actualUserId);

        // Create transaction record (existing schema)
        const txResult = await query<any>(
          `INSERT INTO transactions (
            external_id, user_id, amount, currency, transaction_type, status,
            transaction_time, merchant_name, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *`,
          [
            txData.external_id,
            txData.user_id,
            txData.amount,
            txData.currency,
            txData.transaction_type,
            txData.status,
            txData.transaction_time,
            'Card payment via Adumo',
            txData.metadata ? JSON.stringify(txData.metadata) : null,
          ]
        );

        const transactionId = txResult[0]?.id || paymentResult.transactionId;

        // Log successful transaction (audit trail)
        await logTransactionOperation({
          transaction_id: transactionId,
          transaction_type: 'wallet_add_money',
          user_id: actualUserId,
          amount: amount,
          currency: 'NAD',
          to_wallet_id: walletId,
          payment_method: 'card',
          payment_reference: paymentResult.transactionId,
          two_factor_verified: true,
          ip_address: ipAddress,
          status: paymentResult.settled ? 'completed' : 'authorised',
        }).catch(err => log.error('Failed to log transaction:', err));

        const transaction = {
          id: transactionId,
          walletId,
          amount,
          status: paymentResult.settled ? 'completed' : 'authorised',
          paymentMethod: 'card',
          paymentGateway: 'adumo',
          authorisationCode: paymentResult.authorisationCode,
          createdAt: txResult[0]?.created_at || new Date(),
        };

        // Get updated balance
        const wallet = await query<{ balance: number }>(
          'SELECT balance FROM wallets WHERE id = $1',
          [walletId]
        );
        const newBalance = wallet[0] ? parseFloat(wallet[0].balance.toString()) : amount;

        return createdResponse({
          transaction,
          walletId,
          newBalance,
        }, `/api/transactions/${transactionId}`, 'Money added successfully');
      } catch (adumoError: any) {
        logger.error({ err: adumoError, userId, walletId, amount }, 'Adumo add money error');
        
        // Log failed transaction
        await logTransactionOperation({
          transaction_id: `failed_${Date.now()}`,
          transaction_type: 'wallet_add_money',
          user_id: userId,
          amount: amount,
          currency: 'NAD',
          to_wallet_id: walletId,
          payment_method: 'card',
          status: 'failed',
          error_message: adumoError.message || 'Payment gateway error',
          two_factor_verified: true,
          ip_address: ipAddress,
        }).catch(err => log.error('Failed to log transaction:', err));

        return errorResponse(
          adumoError.message || 'Payment gateway error',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    // For other payment methods (bank transfer, etc.), save to database
    // Find actual user ID (userId already extracted at top)
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }
    
    // Update wallet balance (use available_balance for existing schema)
    await query(
      'UPDATE wallets SET balance = balance + $1, available_balance = available_balance + $1 WHERE id = $2',
      [amount, walletId]
    );

    // Prepare transaction data using adapter
    const txData = prepareTransactionData({
      walletId,
      type: 'transfer_in',
      amount,
      description: `Money added via ${paymentMethod}`,
      status: 'completed',
      date: new Date(),
    }, actualUserId);

    // Create transaction record (existing schema)
    const txResult = await query<any>(
      `INSERT INTO transactions (
        external_id, user_id, amount, currency, transaction_type, status,
        transaction_time, merchant_name, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        txData.external_id,
        txData.user_id,
        txData.amount,
        txData.currency,
        txData.transaction_type,
        txData.status,
        txData.transaction_time,
        `Money added via ${paymentMethod}`,
        txData.metadata ? JSON.stringify(txData.metadata) : null,
      ]
    );

    // Get updated balance
    const wallet = await query<{ balance: number }>(
      'SELECT balance FROM wallets WHERE id = $1',
      [walletId]
    );
    const newBalance = wallet[0] ? parseFloat(wallet[0].balance.toString()) : amount;

    const transaction = {
      id: txResult[0]?.id || `add-money-${Date.now()}`,
      walletId,
      amount,
      status: 'completed',
      paymentMethod,
      paymentMethodId,
      createdAt: txResult[0]?.created_at || new Date(),
    };

    return createdResponse({
      transaction,
      walletId,
      newBalance,
    }, `/api/transactions/${transactionId}`, 'Money added successfully');
  } catch (error: any) {
    const walletId = req.url.split('/').slice(-2, -1)[0];
    logger.error({ err: error, walletId }, 'Add money error');
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply standardized security wrapper
export const POST = secureAuthRoute(RATE_LIMITS.payment, handleAddMoney);
