/**
 * Wallet-to-Wallet Transfer via IPS
 * 
 * Location: app/api/payments/wallet-to-wallet/route.ts
 * Purpose: Transfer funds between wallets via Instant Payment Switch (IPS)
 * 
 * Compliance: PSDIR-11 (IPS integration), PSD-12 (2FA required)
 * Integration: IPS (Instant Payment Switch) for wallet-to-wallet transfers
 * 
 * This enables interoperability between different e-money providers
 * through the NamClear IPS network.
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount, validateCurrency, validateUUID } from '@/utils/validators';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import { ipsService } from '@/services/ipsService';
import { fineractService } from '@/services/fineractService';
import { twoFactorTokens } from '@/utils/redisClient';
import logger from '@/utils/logger';

interface WalletToWalletRequest {
  fromWalletId: string;
  toAccount: string; // Recipient wallet ID, VPA (Virtual Payment Address), or Buffr ID
  amount: number;
  currency?: string;
  description?: string;
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
      fromWalletId,
      toAccount,
      amount,
      currency = 'NAD',
      description,
      verificationToken,
    }: WalletToWalletRequest = await req.json();

    // Validate required fields
    if (!fromWalletId || !toAccount || !amount) {
      return errorResponse('fromWalletId, toAccount, and amount are required', HttpStatus.BAD_REQUEST);
    }

    // PSD-12 Compliance: Require 2FA verification
    if (!verificationToken) {
      return errorResponse(
        '2FA verification required. Please verify your PIN or biometric before transferring.',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Verify 2FA token
    const tokenData = await twoFactorTokens.verify(userId, verificationToken);
    if (!tokenData) {
      return errorResponse(
        'Invalid or expired 2FA verification token. Please verify your PIN or biometric again.',
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

    // Validate amount
    const amountCheck = validateAmount(amount, {
      min: 0.01,
      max: 1000000,
      maxDecimals: 2,
    });
    if (!amountCheck.valid) {
      return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
    }

    // Validate currency
    const currencyCheck = validateCurrency(currency);
    if (!currencyCheck.valid) {
      return errorResponse(currencyCheck.error || 'Invalid currency', HttpStatus.BAD_REQUEST);
    }

    // Get or create Fineract wallet for sender (transaction monitoring happens automatically in Fineract)
    let fineractWallet;
    try {
      fineractWallet = await fineractService.getOrCreateWalletForUser(userId, { requestId });
      
      // Check wallet balance
      const walletBalance = parseFloat(fineractWallet.balance.toString());
      if (walletBalance < amount) {
        return errorResponse('Insufficient wallet balance', HttpStatus.BAD_REQUEST);
      }

      // Check wallet status
      if (fineractWallet.status?.value !== 'ACTIVE') {
        return errorResponse('Wallet is not active', HttpStatus.BAD_REQUEST);
      }
    } catch (error: any) {
      logger.error('Failed to get Fineract wallet:', error);
      // Fallback to Buffr DB wallet for backward compatibility
      const walletIdCheck = validateUUID(fromWalletId);
      if (!walletIdCheck.valid) {
        return errorResponse(walletIdCheck.error || 'Invalid wallet ID', HttpStatus.BAD_REQUEST);
      }

      const wallet = await query<{ id: string; balance: number; status: string }>(
        'SELECT id, balance, status FROM wallets WHERE id = $1 AND user_id = $2',
        [fromWalletId, userId]
      );

      if (wallet.length === 0) {
        return errorResponse('Wallet not found or access denied', HttpStatus.NOT_FOUND);
      }

      if (wallet[0].status !== 'active') {
        return errorResponse('Wallet is not active', HttpStatus.BAD_REQUEST);
      }

      const walletBalance = parseFloat(wallet[0].balance.toString());
      if (walletBalance < amount) {
        return errorResponse('Insufficient wallet balance', HttpStatus.BAD_REQUEST);
      }
    }

    // Generate transaction reference
    const transactionReference = `W2W-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Resolve recipient wallet (if Buffr user)
    let recipientFineractWallet: any = null;
    const recipientUser = await query<{ id: string }>(
      'SELECT id FROM users WHERE id = $1 OR phone_number = $1 OR external_id = $1 LIMIT 1',
      [toAccount]
    );

    if (recipientUser.length > 0) {
      // Internal transfer: Get or create recipient's Fineract wallet
      try {
        recipientFineractWallet = await fineractService.getOrCreateWalletForUser(recipientUser[0].id, { requestId });
      } catch (error: any) {
        logger.error('Failed to get recipient Fineract wallet:', error);
      }
    }

    // Create transaction record (pending status)
    const transactionResult = await query<{ id: string; created_at: Date }>(
      `INSERT INTO transactions (
        user_id, type, amount, currency, status,
        from_wallet_id, payment_method, payment_reference, description, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, created_at`,
      [
        userId,
        'transfer',
        amount,
        currency,
        'pending', // Will be updated after IPS confirmation
        fineractWallet ? fineractWallet.id.toString() : fromWalletId,
        'ips_wallet_to_wallet',
        transactionReference,
        description || `Wallet-to-wallet transfer via IPS`,
        JSON.stringify({
          toAccount,
          ipsTransfer: true,
          fineractWalletId: fineractWallet?.id,
          recipientFineractWalletId: recipientFineractWallet?.id,
        }),
      ]
    );

    const transactionId = transactionResult[0]?.id;

    // Initiate IPS transfer
    try {
      const ipsResult = await ipsService.transfer(
        {
          fromAccount: fineractWallet ? fineractWallet.walletNumber : fromWalletId, // Use wallet number for IPS
          toAccount,
          amount,
          currency,
          reference: transactionReference,
          description: description || 'Wallet-to-wallet transfer',
        },
        { requestId, userId }
      );

      // Update transaction status based on IPS result
      const transactionStatus = ipsResult.status === 'completed' ? 'completed' : 'pending';
      
      await query(
        `UPDATE transactions 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        [transactionStatus, transactionId]
      );

      // Transfer between Fineract wallets if both are Buffr users (transaction monitoring happens automatically)
      if (ipsResult.status === 'completed' && fineractWallet && recipientFineractWallet) {
        try {
          const transactionDate = new Date().toISOString().split('T')[0];
          await fineractService.transferBetweenWallets(
            fineractWallet.id,
            {
              toWalletId: recipientFineractWallet.id,
              amount,
              transactionDate,
              reference: transactionReference,
              description: description || 'Wallet-to-wallet transfer via IPS',
              channel: 'mobile_app',
              ipsTransactionId: ipsResult.transactionId,
            },
            { requestId, userId }
          );
        } catch (error: any) {
          logger.error('Failed to transfer between Fineract wallets:', error);
          // Fallback: Update Buffr DB wallets
          await query(
            'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
            [amount, fromWalletId]
          );
        }
      } else if (ipsResult.status === 'completed' && fineractWallet) {
        // External transfer: Withdraw from sender's Fineract wallet
        try {
          const transactionDate = new Date().toISOString().split('T')[0];
          await fineractService.withdrawFromWallet(
            fineractWallet.id,
            {
              amount,
              transactionDate,
              reference: transactionReference,
              description: description || 'Wallet-to-wallet transfer via IPS',
              channel: 'mobile_app',
            },
            { requestId, userId }
          );
        } catch (error: any) {
          logger.error('Failed to withdraw from Fineract wallet:', error);
          // Fallback: Update Buffr DB wallet
          await query(
            'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
            [amount, fromWalletId]
          );
        }
      } else if (ipsResult.status === 'completed') {
        // Fallback: Update Buffr DB wallet
        await query(
          'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
          [amount, fromWalletId]
        );
      }

      // Log transaction operation (audit trail)
      await logTransactionOperation({
        transaction_id: transactionId,
        transaction_type: 'transfer',
        user_id: userId,
        amount,
        currency,
        from_wallet_id: fromWalletId,
        payment_method: 'ips_wallet_to_wallet',
        payment_reference: transactionReference,
        two_factor_verified: true,
        ip_address: ipAddress,
        status: transactionStatus,
        metadata: JSON.stringify({
          toAccount,
          ipsTransactionId: ipsResult.transactionId,
          settlementTime: ipsResult.settlementTime,
        }),
      }).catch(err => logger.error('Failed to log transaction:', err));

      // Send instant payment notification
      const { sendTransactionNotification } = await import('@/utils/sendPushNotification');
      const amountFormatted = `${currency} ${amount.toFixed(2)}`;
      await sendTransactionNotification(
        userId,
        transactionStatus === 'completed' ? 'sent' : 'pending',
        amountFormatted,
        'IPS Transfer',
        transactionId
      ).catch(err => logger.error('Failed to send notification:', err));

      return createdResponse(
        {
          transactionId,
          status: transactionStatus,
          amount,
          currency,
          toAccount,
          reference: transactionReference,
          ipsTransactionId: ipsResult.transactionId,
          settlementTime: ipsResult.settlementTime,
          message: transactionStatus === 'completed'
            ? 'Wallet-to-wallet transfer completed successfully via IPS'
            : 'Wallet-to-wallet transfer initiated. Settlement pending.',
        },
        `/api/transactions/${transactionId}`,
        'Wallet-to-wallet transfer initiated successfully'
      );

    } catch (ipsError: any) {
      logger.error('IPS transfer error', ipsError, { requestId, transactionId });

      // Update transaction status to failed
      await query(
        `UPDATE transactions 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        ['failed', transactionId]
      );

      // Log failed transaction
      await logTransactionOperation({
        transaction_id: transactionId,
        transaction_type: 'transfer',
        user_id: userId,
        amount,
        currency,
        from_wallet_id: fromWalletId,
        payment_method: 'ips_wallet_to_wallet',
        payment_reference: transactionReference,
        two_factor_verified: true,
        ip_address: ipAddress,
        status: 'failed',
        error_message: ipsError.message || 'IPS transfer failed',
      }).catch(err => logger.error('Failed to log failed transaction:', err));

      return errorResponse(
        `Wallet-to-wallet transfer failed: ${ipsError.message || 'IPS service error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

  } catch (error: any) {
    logger.error('Wallet-to-wallet transfer error', error, { requestId, ipAddress });
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
