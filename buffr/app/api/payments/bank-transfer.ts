/**
 * Bank Transfer API Route
 * 
 * Location: app/api/payments/bank-transfer.ts
 * Purpose: Transfer funds from Buffr wallet to bank account via IPS
 * 
 * Compliance: PSD-12 (2FA required), PSDIR-11 (IPS integration)
 * Integration: IPS (Instant Payment Switch) for bank transfers
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount, validateCurrency, validateUUID } from '@/utils/validators';
import { logTransactionOperation, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import { ipsService } from '@/services/ipsService';
import { twoFactorTokens } from '@/utils/redisClient';
import { sendTransactionNotification } from '@/utils/sendPushNotification';
import logger from '@/utils/logger';

interface BankTransferRequest {
  walletId: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode?: string; // Bank routing code
  amount: number;
  currency?: string;
  reference?: string;
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
      walletId,
      bankAccountNumber,
      bankName,
      bankCode,
      amount,
      currency = 'NAD',
      reference,
      description,
      verificationToken,
    }: BankTransferRequest = await req.json();

    // Validate required fields
    if (!walletId || !bankAccountNumber || !bankName || !amount) {
      return errorResponse('walletId, bankAccountNumber, bankName, and amount are required', HttpStatus.BAD_REQUEST);
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

    // Get or create Fineract wallet for user (transaction monitoring happens automatically in Fineract)
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
      const walletIdCheck = validateUUID(walletId);
      if (!walletIdCheck.valid) {
        return errorResponse(walletIdCheck.error || 'Invalid wallet ID', HttpStatus.BAD_REQUEST);
      }

      const wallet = await query<{ id: string; balance: number; status: string }>(
        'SELECT id, balance, status FROM wallets WHERE id = $1 AND user_id = $2',
        [walletId, userId]
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
    const transactionReference = reference || `BT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Transfer via IPS
    try {
      const ipsResult = await ipsService.transferWithRetry(
        {
          fromAccount: fineractWallet ? fineractWallet.walletNumber : walletId, // Use Fineract wallet number for IPS
          toAccount: `${bankAccountNumber}@${bankName.toLowerCase().replace(/\s+/g, '')}`, // Bank account identifier
          amount,
          currency,
          reference: transactionReference,
          description: description || `Bank transfer to ${bankName}`,
        },
        { requestId, userId, maxRetries: 3 }
      );

      // Create transaction record
      const transactionResult = await query<{ id: string; created_at: Date }>(
        `INSERT INTO transactions (
          user_id, type, amount, currency, status,
          from_wallet_id, payment_method, payment_reference,
          description, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, created_at`,
        [
          userId,
          'bank_transfer',
          amount,
          currency,
          ipsResult.status === 'completed' ? 'completed' : 'pending',
          fineractWallet ? fineractWallet.id.toString() : walletId,
          'bank_transfer',
          transactionReference,
          description || `Bank transfer to ${bankName}`,
          JSON.stringify({
            bankAccountNumber,
            bankName,
            bankCode,
            ipsTransactionId: ipsResult.transactionId,
            ipsStatus: ipsResult.status,
          }),
        ]
      );

      const transactionId = transactionResult[0]?.id;

      // Update wallet balance (deduct amount)
      await query(
        'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
        [amount, walletId]
      );

      // Log transaction operation (audit trail)
      await logTransactionOperation({
        transaction_id: transactionId,
        transaction_type: 'bank_transfer',
        user_id: userId,
        amount,
        currency,
        from_wallet_id: fineractWallet ? fineractWallet.id.toString() : walletId,
        payment_method: 'bank_transfer',
        payment_reference: transactionReference,
        two_factor_verified: true,
        ip_address: ipAddress,
        status: ipsResult.status === 'completed' ? 'completed' : 'pending',
      }).catch(err => logger.error('Failed to log transaction:', err));

      // Send instant payment notification
      const amountFormatted = `${currency} ${amount.toFixed(2)}`;
      const notificationType = ipsResult.status === 'completed' ? 'sent' : 'pending';
      await sendTransactionNotification(
        userId,
        notificationType,
        amountFormatted,
        bankName,
        transactionId
      ).catch(err => logger.error('Failed to send notification:', err));

      return createdResponse(
        {
          transactionId,
          status: ipsResult.status,
          amount,
          currency,
          bankName,
          bankAccountNumber: bankAccountNumber.replace(/\d(?=\d{4})/g, '*'), // Mask account number
          reference: transactionReference,
          message: ipsResult.message || 'Bank transfer initiated',
        },
        `/api/transactions/${transactionId}`,
        'Bank transfer initiated successfully'
      );

    } catch (ipsError: any) {
      logger.error('IPS transfer error', ipsError);

      // Log failed transaction
      await logTransactionOperation({
        transaction_id: `failed_${Date.now()}`,
        transaction_type: 'bank_transfer',
        user_id: userId,
        amount,
        currency,
        from_wallet_id: fineractWallet ? fineractWallet.id.toString() : walletId,
        payment_method: 'bank_transfer',
        two_factor_verified: true,
        ip_address: ipAddress,
        status: 'failed',
        error_message: ipsError.message || 'IPS transfer failed',
      }).catch(err => logger.error('Failed to log transaction:', err));

      return errorResponse(
        `Bank transfer failed: ${ipsError.message || 'IPS service error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

  } catch (error: any) {
    logger.error('Bank transfer error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
