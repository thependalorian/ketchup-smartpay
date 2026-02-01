/**
 * API Route: /api/payments/send
 * 
 * - POST: Send money to a recipient
 * 
 * Supports:
 * - Buffr Account transfers (internal)
 * - Card payments via Adumo Online
 * - Wallet transfers
 */
import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import logger from '@/utils/logger';

import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { prepareTransactionData } from '@/utils/db-adapters';
import { 
  validateAmount, 
  validateCurrency, 
  validateCardNumber, 
  validateCardExpiry, 
  validateCVV,
  validateUUID
} from '@/utils/validators';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { query as queryUsers } from '@/utils/db';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import { sendTransactionNotification } from '@/utils/sendPushNotification';
import { fineractService } from '@/services/fineractService';

async function handleSendPayment(req: ExpoRequest) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { 
      toUserId, 
      toUserName, 
      amount, 
      currency,
      note, 
      paymentSource,
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
    
    // Validate required fields
    if (!toUserId) {
      return errorResponse('Recipient user ID is required', HttpStatus.BAD_REQUEST);
    }

    // PSD-12 Compliance: Require 2FA verification for all payments
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before sending payment.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify user has 2FA enabled
    const user = await queryUsers<{ is_two_factor_enabled: boolean }>(
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

    // Optional: Invalidate token after use for one-time use (security best practice)
    // For now, we allow token reuse within expiry window
    // await twoFactorTokens.invalidate(userId, verificationToken);

    // Validate recipient user ID format (if it's a UUID)
    // Note: user IDs might be VARCHAR(255) in our schema, so we validate format but allow non-UUID strings
    if (toUserId.length > 0 && toUserId.includes('-')) {
      const userIdCheck = validateUUID(toUserId);
      if (!userIdCheck.valid) {
        // Only validate if it looks like a UUID (contains dashes)
        // Allow non-UUID strings for backward compatibility
      }
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

    // Validate currency if provided
    if (currency) {
      const currencyCheck = validateCurrency(currency);
      if (!currencyCheck.valid) {
        return errorResponse(currencyCheck.error || 'Invalid currency', HttpStatus.BAD_REQUEST);
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

    // Determine payment method
    const isCardPayment = paymentSource?.startsWith('card-') || cardNumber;
    const isBuffrAccount = paymentSource === 'buffr-account' || !paymentSource;
    const isWallet = paymentSource?.startsWith('wallet-');

    // For card payments, use Adumo Online
    if (isCardPayment && (cardNumber || token)) {
      try {
        const { completePaymentFlow } = await import('@/services/adumoService');
        
        // Get IP and user agent from request headers
        const ipAddress = req.headers.get('x-forwarded-for') || 
                         req.headers.get('x-real-ip') || 
                         '0.0.0.0';
        const userAgent = req.headers.get('user-agent') || 'Buffr Mobile App';

        const paymentResult = await completePaymentFlow({
          amount,
          merchantReference: `send-${Date.now()}`,
          cardNumber,
          expiryMonth,
          expiryYear,
          cvv,
          cardHolderFullName,
          saveCardDetails: saveCardDetails || false,
          profileUid,
          token,
          ipAddress,
          userAgent: userAgent,
        });

        if (paymentResult.requires3DSecure) {
          // Return 3DS form data for client to handle
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
            transaction_type: 'payment_send',
            user_id: userId,
            amount: amount,
            currency: currency || 'NAD',
            payment_method: 'card',
            status: 'failed',
            error_message: paymentResult.statusMessage || 'Payment failed',
            two_factor_verified: true, // 2FA was verified earlier
            ip_address: ipAddress,
          }).catch(err => logger.error('Failed to log transaction:', err));

          return errorResponse(
            paymentResult.statusMessage || 'Payment failed',
            HttpStatus.BAD_REQUEST
          );
        }

        // Payment successful via Adumo - save to database
        // Find actual user ID (userId already extracted at top of function)
        const actualUserId = await findUserId(query, userId);
        if (!actualUserId) {
          return errorResponse('User not found', HttpStatus.NOT_FOUND);
        }

        // Prepare transaction data using adapter
        const txData = prepareTransactionData({
          walletId: paymentSource?.startsWith('wallet-') ? paymentSource.replace('wallet-', '') : null,
          type: 'sent',
          amount,
          recipientId: toUserId,
          recipientName: toUserName || 'Recipient',
          description: note || null,
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
            toUserName || 'Recipient',
            txData.metadata ? JSON.stringify(txData.metadata) : null,
          ]
        );

        // Update wallet balance if using wallet
        if (paymentSource?.startsWith('wallet-')) {
          const walletId = paymentSource.replace('wallet-', '');
          await query(
            'UPDATE wallets SET balance = balance - $1, available_balance = available_balance - $1 WHERE id = $2',
            [amount, walletId]
          );
        }

        const transactionId = txResult[0]?.id || paymentResult.transactionId;

        // Log successful transaction (audit trail)
        await logTransactionOperation({
          transaction_id: transactionId,
          transaction_type: 'payment_send',
          user_id: actualUserId,
          amount: amount,
          currency: currency || 'NAD',
          recipient_id: toUserId,
          payment_method: 'card',
          payment_reference: paymentResult.transactionId,
          two_factor_verified: true,
          ip_address: ipAddress,
          status: paymentResult.settled ? 'completed' : 'authorised',
        }).catch(err => logger.error('Failed to log transaction:', err));

        const transaction = {
          id: transactionId,
          fromUserId: actualUserId,
          toUserId,
          toUserName: toUserName || 'Recipient',
          amount,
          note: note || undefined,
          paymentSource,
          status: paymentResult.settled ? 'completed' : 'authorised',
          paymentGateway: 'adumo',
          authorisationCode: paymentResult.authorisationCode,
          createdAt: txResult[0]?.created_at || new Date(),
        };

        return createdResponse(transaction, `/api/transactions/${transactionId}`, 'Payment sent successfully');
      } catch (adumoError: any) {
        logger.error({ err: adumoError, userId, toUserId, amount, currency }, 'Adumo payment error');
        
        // Log failed transaction
        await logTransactionOperation({
          transaction_id: `failed_${Date.now()}`,
          transaction_type: 'payment_send',
          user_id: userId,
          amount: amount,
          currency: currency || 'NAD',
          payment_method: 'card',
          status: 'failed',
          error_message: adumoError.message || 'Payment gateway error',
          two_factor_verified: true,
          ip_address: ipAddress,
        }).catch(err => logger.error('Failed to log transaction:', err));

        return errorResponse(
          adumoError.message || 'Payment gateway error',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    // For Buffr Account or Wallet transfers (internal)
    // Find actual user ID
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Handle wallet transfers using Fineract wallets
    if (paymentSource?.startsWith('wallet-') || isWallet) {
      try {
        // Get or create Fineract wallet for sender
        const senderWallet = await fineractService.getOrCreateWalletForUser(actualUserId, { requestId });
        
        // Check wallet balance
        const walletBalance = parseFloat(senderWallet.balance.toString());
        if (walletBalance < amount) {
          return errorResponse('Insufficient wallet balance', HttpStatus.BAD_REQUEST);
        }

        // Check if recipient is Buffr user (internal transfer)
        const recipientUser = await query<{ id: string }>(
          'SELECT id FROM users WHERE id = $1 OR phone_number = $1 OR external_id = $1 LIMIT 1',
          [toUserId]
        );

        if (recipientUser.length > 0) {
          // Internal transfer: Get or create recipient's Fineract wallet
          const recipientWallet = await fineractService.getOrCreateWalletForUser(recipientUser[0].id, { requestId });
          
          // Transfer between Fineract wallets (transaction monitoring happens automatically in Fineract)
          const transactionDate = new Date().toISOString().split('T')[0];
          await fineractService.transferBetweenWallets(
            senderWallet.id,
            {
              toWalletId: recipientWallet.id,
              amount,
              transactionDate,
              reference: `P2P-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              description: note || `P2P transfer to ${toUserName || 'Recipient'}`,
              channel: 'mobile_app',
            },
            { requestId, userId: actualUserId }
          );
        } else {
          // External transfer: Withdraw from sender's wallet
          // Recipient will receive funds via their payment method
          const transactionDate = new Date().toISOString().split('T')[0];
          await fineractService.withdrawFromWallet(
            senderWallet.id,
            {
              amount,
              transactionDate,
              reference: `P2P-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              description: note || `Payment to ${toUserName || 'Recipient'}`,
              channel: 'mobile_app',
            },
            { requestId, userId: actualUserId }
          );
        }
      } catch (error: any) {
        logger.error('Fineract wallet operation failed:', error);
        // Fallback to Buffr DB wallet for backward compatibility
        const walletId = paymentSource?.startsWith('wallet-') ? paymentSource.replace('wallet-', '') : null;
        if (walletId) {
          const wallet = await query<{ balance: number; user_id: string; id: string }>(
            'SELECT balance, user_id, id FROM wallets WHERE id = $1',
            [walletId]
          );

          if (wallet.length === 0) {
            return errorResponse('Wallet not found', HttpStatus.NOT_FOUND);
          }

          if (parseFloat(wallet[0].balance.toString()) < amount) {
            return errorResponse('Insufficient balance', HttpStatus.BAD_REQUEST);
          }

          await query(
            'UPDATE wallets SET balance = balance - $1, available_balance = available_balance - $1 WHERE id = $2',
            [amount, walletId]
          );
        }
      }
    }

    // Prepare transaction data using adapter
    const txData = prepareTransactionData({
      walletId: paymentSource?.startsWith('wallet-') ? paymentSource.replace('wallet-', '') : null,
      type: 'sent',
      amount,
      recipientId: toUserId,
      recipientName: toUserName || 'Recipient',
      description: note || null,
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
        toUserName || 'Recipient',
        txData.metadata ? JSON.stringify(txData.metadata) : null,
      ]
    );

    const transactionId = txResult[0]?.id || `txn_${Date.now()}`;

    // Log successful transaction (audit trail)
    await logTransactionOperation({
      transaction_id: transactionId,
      transaction_type: isWallet ? 'wallet_transfer' : 'p2p_transfer',
      user_id: actualUserId,
      amount: amount,
      currency: currency || 'NAD',
      from_wallet_id: paymentSource?.startsWith('wallet-') ? paymentSource.replace('wallet-', '') : null,
      recipient_id: toUserId,
      payment_method: isWallet ? 'wallet' : 'buffr_account',
      two_factor_verified: true,
      ip_address: ipAddress,
      status: 'completed',
    }).catch(err => logger.error('Failed to log transaction', err));

    // Send instant payment notifications (sender and recipient)
    const amountFormatted = `${currency || 'NAD'} ${amount.toFixed(2)}`;
    
    // Notify sender
    await sendTransactionNotification(
      actualUserId,
      'sent',
      amountFormatted,
      toUserName || 'Recipient',
      transactionId
      ).catch(err => logger.error('Failed to send notification to sender:', err));

    // Notify recipient (if user exists)
    if (toUserId) {
      await sendTransactionNotification(
        toUserId,
        'received',
        amountFormatted,
        'You',
        transactionId
      ).catch(err => logger.error('Failed to send notification to recipient:', err));
    }

    const transaction = {
      id: transactionId,
      fromUserId: actualUserId,
      toUserId,
      toUserName: toUserName || 'Recipient',
      amount,
      note: note || undefined,
      paymentSource,
      status: 'completed',
      createdAt: txResult[0]?.created_at || new Date(),
    };
    
    return createdResponse(transaction, `/api/transactions/${transactionId}`, 'Payment sent successfully');
  } catch (error: any) {
    logger.error({ err: error, userId }, 'Payment send error');
    
    // Log failed transaction
    await logTransactionOperation({
      transaction_id: `failed_${Date.now()}`,
      transaction_type: 'payment_send',
      user_id: userId,
      amount: 0,
      currency: 'NAD',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Internal server error',
      two_factor_verified: false,
      ip_address: ipAddress,
    }).catch(err => logger.error('Failed to log transaction', err));

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply standardized security wrapper
export const POST = secureAuthRoute(RATE_LIMITS.payment, handleSendPayment);
