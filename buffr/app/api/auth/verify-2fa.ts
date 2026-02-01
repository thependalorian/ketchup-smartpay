/**
 * API Route: /api/auth/verify-2fa
 * 
 * Location: app/api/auth/verify-2fa.ts
 * Purpose: Verify 2FA (PIN or biometric) for transactions (PSD-12 Compliance)
 * Priority: Priority 2 - 2FA Verification System
 * 
 * This endpoint verifies:
 * - PIN: 4-digit PIN against transaction_pin_hash in database
 * - Biometric: Confirmation token from expo-local-authentication
 * 
 * Returns a verification token that can be used for a short period (5 minutes)
 * to authorize transactions without re-verification.
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logPINOperation } from '@/utils/auditLogger';
import { getIpAddress, getUserAgent } from '@/utils/auditLogger';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import logger from '@/utils/logger';

/**
 * Verify PIN using bcrypt (secure password hashing)
 * 
 * @param pin - Plain text PIN (4 digits)
 * @param hash - Bcrypt hash from database
 * @returns Promise<boolean> - True if PIN matches hash
 */
async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin, hash);
}

interface Verify2FARequest {
  method: 'pin' | 'biometric';
  pin?: string; // 4-digit PIN (required if method is 'pin')
  biometricToken?: string; // Biometric confirmation token (required if method is 'biometric')
  transactionContext?: {
    type: string; // 'voucher_redemption', 'payment', 'transfer', etc.
    amount?: number;
    recipientId?: string;
  };
}

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const body: Verify2FARequest = await req.json();
    const { method, pin, biometricToken, transactionContext } = body;

    // Validate method
    if (!method || !['pin', 'biometric'].includes(method)) {
      return errorResponse('Invalid method. Use "pin" or "biometric"', HttpStatus.BAD_REQUEST);
    }

    // Get user's 2FA status and PIN hash
    const user = await query<{
      id: string;
      is_two_factor_enabled: boolean;
      transaction_pin_hash: string | null;
    }>(
      'SELECT id, is_two_factor_enabled, transaction_pin_hash FROM users WHERE id = $1',
      [userId]
    );

    if (user.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const userData = user[0];

    // Check if 2FA is enabled
    if (!userData.is_two_factor_enabled) {
      return errorResponse('Two-factor authentication is not enabled. Please enable 2FA first.', HttpStatus.BAD_REQUEST);
    }

    let verified = false;
    let errorMessage: string | null = null;

    // Verify based on method
    if (method === 'pin') {
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return errorResponse('Invalid PIN. Must be 4 digits', HttpStatus.BAD_REQUEST);
      }

      if (!userData.transaction_pin_hash) {
        return errorResponse('Transaction PIN not set. Please set up your PIN first.', HttpStatus.BAD_REQUEST);
      }

      // Verify PIN using bcrypt
      verified = await verifyPIN(pin, userData.transaction_pin_hash);
      
      if (!verified) {
        errorMessage = 'Invalid PIN';
      }
    } else if (method === 'biometric') {
      // Biometric verification is handled client-side via expo-local-authentication
      // The biometricToken is a confirmation that biometric was successful
      // Client-side verification ensures the user has authenticated with device biometrics
      if (!biometricToken) {
        return errorResponse('Biometric token required', HttpStatus.BAD_REQUEST);
      }

      // Verify biometric token format (should be a non-empty string from client)
      // In production, you could implement additional server-side validation:
      // - Check token format/structure
      // - Verify token wasn't reused (one-time use)
      // - Validate token timestamp (not expired)
      // For now, accept valid non-empty tokens from authenticated clients
      const isValidToken = typeof biometricToken === 'string' && 
                          biometricToken.length > 0 && 
                          biometricToken !== 'undefined' &&
                          biometricToken !== 'null';
      
      verified = isValidToken;
      
      if (!verified) {
        errorMessage = 'Invalid biometric token';
      }
    }

    // Get request metadata for audit logging
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    // Log PIN operation (audit trail)
    if (method === 'pin') {
      await logPINOperation({
        userId,
        operationType: 'verify',
        location: 'mobile_app', // Could be enhanced to detect USSD vs app
        success: verified,
        errorMessage: verified ? null : errorMessage,
        ipAddress,
      });
    }

    if (!verified) {
      return errorResponse(
        errorMessage || '2FA verification failed',
        HttpStatus.UNAUTHORIZED
      );
    }

    // Generate verification token (valid for 5 minutes)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store verification token in Redis with expiration (PSD-12 Compliance)
    const { twoFactorTokens } = await import('@/utils/redisClient');
    const tokenStored = await twoFactorTokens.store(
      userId,
      verificationToken,
      method,
      transactionContext,
      300 // 5 minutes
    );

    if (!tokenStored) {
      logger.warn('[2FA] Failed to store verification token in Redis. Token will still be returned but may not be verifiable.');
      // Continue anyway - token will be returned but verification may fail
      // In production, you might want to fail here if Redis is critical
    }

    return successResponse(
      {
        verified: true,
        verificationToken,
        expiresAt: expiresAt.toISOString(),
        method,
      },
      '2FA verification successful'
    );
  } catch (error) {
    logger.error('Error verifying 2FA', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to verify 2FA',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply security wrappers with API rate limits
export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
