/**
 * API Route: /api/auth/setup-pin
 * 
 * Location: app/api/auth/setup-pin.ts
 * Purpose: Set up or change transaction PIN for 2FA (PSD-12 Compliance)
 * Priority: Priority 2 - 2FA Verification System
 * 
 * This endpoint allows users to:
 * - Set up their transaction PIN (first time)
 * - Change their existing transaction PIN
 * 
 * PIN Requirements:
 * - 4 digits
 * - Must be numeric
 * - Stored as bcrypt hash (never plaintext)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logPINOperation } from '@/utils/auditLogger';
import { getIpAddress, getUserAgent } from '@/utils/auditLogger';
import bcrypt from 'bcrypt';
import logger from '@/utils/logger';

/**
 * Hash PIN using bcrypt (secure password hashing with salt)
 * 
 * @param pin - Plain text PIN (4 digits)
 * @returns Promise<string> - Bcrypt hash to store in database
 */
async function hashPIN(pin: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(pin, saltRounds);
}

/**
 * Verify PIN using bcrypt
 * 
 * @param pin - Plain text PIN (4 digits)
 * @param hash - Bcrypt hash from database
 * @returns Promise<boolean> - True if PIN matches hash
 */
async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pin, hash);
}

interface SetupPINRequest {
  pin: string; // 4-digit PIN
  currentPin?: string; // Required if changing existing PIN
  operation: 'setup' | 'change'; // 'setup' for first time, 'change' for updating
}

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const body: SetupPINRequest = await req.json();
    const { pin, currentPin, operation } = body;

    // Validate operation
    if (!operation || !['setup', 'change'].includes(operation)) {
      return errorResponse('Invalid operation. Use "setup" or "change"', HttpStatus.BAD_REQUEST);
    }

    // Validate PIN format
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return errorResponse('Invalid PIN. Must be exactly 4 digits', HttpStatus.BAD_REQUEST);
    }

    // Get user's current PIN hash
    const user = await query<{
      id: string;
      transaction_pin_hash: string | null;
    }>(
      'SELECT id, transaction_pin_hash FROM users WHERE id = $1',
      [userId]
    );

    if (user.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const userData = user[0];

    // If changing PIN, verify current PIN first
    if (operation === 'change') {
      if (!currentPin || currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
        return errorResponse('Current PIN is required and must be 4 digits', HttpStatus.BAD_REQUEST);
      }

      if (!userData.transaction_pin_hash) {
        return errorResponse('No existing PIN found. Use "setup" operation instead.', HttpStatus.BAD_REQUEST);
      }

      // Verify current PIN using bcrypt
      const currentPinValid = await verifyPIN(currentPin, userData.transaction_pin_hash);
      
      if (!currentPinValid) {
        // Log failed PIN change attempt
        const ipAddress = getIpAddress(req);
        await logPINOperation({
          userId,
          operationType: 'change',
          location: 'mobile_app',
          success: false,
          errorMessage: 'Invalid current PIN',
          ipAddress,
        });

        return errorResponse('Invalid current PIN', HttpStatus.UNAUTHORIZED);
      }

      // Prevent setting same PIN
      if (pin === currentPin) {
        return errorResponse('New PIN must be different from current PIN', HttpStatus.BAD_REQUEST);
      }
    } else {
      // If setting up PIN for first time, check if PIN already exists
      if (userData.transaction_pin_hash) {
        return errorResponse('PIN already set. Use "change" operation to update your PIN.', HttpStatus.BAD_REQUEST);
      }
    }

    // Hash new PIN using bcrypt
    const pinHash = await hashPIN(pin);

    // Update user's transaction PIN hash
    const result = await query(
      'UPDATE users SET transaction_pin_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
      [pinHash, userId]
    );

    if (result.length === 0) {
      return errorResponse('Failed to update PIN', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Enable 2FA if not already enabled
    await query(
      'UPDATE users SET is_two_factor_enabled = TRUE WHERE id = $1 AND is_two_factor_enabled = FALSE',
      [userId]
    );

    // Get request metadata for audit logging
    const ipAddress = getIpAddress(req);
    const userAgent = getUserAgent(req);

    // Log PIN operation (audit trail)
    await logPINOperation({
      userId,
      operationType: operation === 'setup' ? 'setup' : 'change',
      location: 'mobile_app',
      success: true,
      errorMessage: null,
      ipAddress,
    });

    return successResponse(
      {
        operation,
        pinSet: true,
        twoFactorEnabled: true,
      },
      operation === 'setup' 
        ? 'Transaction PIN set up successfully. 2FA has been enabled.'
        : 'Transaction PIN changed successfully.'
    );
  } catch (error) {
    logger.error('Error setting up PIN', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to set up PIN',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply security wrappers with API rate limits
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
