/**
 * Open Banking API: /api/v1/nampost/pin-reset
 * 
 * NamPost PIN reset (Open Banking format)
 * 
 * Security: Requires in-person verification with biometric validation
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { validatePIN } from '@/utils/validators';
import { log } from '@/utils/logger';

async function handlePINReset(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { UserId, BranchId, StaffId, NewPIN, BiometricVerificationId, IDVerificationStatus } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!UserId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field UserId is missing',
          'Data.UserId'
        )
      );
    }

    if (!BranchId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field BranchId is missing',
          'Data.BranchId'
        )
      );
    }

    if (!StaffId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field StaffId is missing',
          'Data.StaffId'
        )
      );
    }

    if (!NewPIN) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field NewPIN is missing',
          'Data.NewPIN'
        )
      );
    }

    if (!BiometricVerificationId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field BiometricVerificationId is missing',
          'Data.BiometricVerificationId'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    // Validate ID verification status
    if (!IDVerificationStatus) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        'ID verification is required for PIN reset',
        400
      );
    }

    // Validate PIN format
    const pinCheck = validatePIN(NewPIN);
    if (!pinCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        pinCheck.error || 'Invalid PIN format',
        400
      );
    }

    // Verify user exists
    const users = await query<any>(
      'SELECT id, phone_number FROM users WHERE id = $1',
      [UserId]
    );

    if (users.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Hash new PIN
    const bcrypt = await import('bcrypt');
    const pinHash = await bcrypt.hash(NewPIN, 10);

    // Update user PIN
    await query(
      'UPDATE users SET transaction_pin_hash = $1, updated_at = NOW() WHERE id = $2',
      [pinHash, UserId]
    );

    const pinResetResponse = {
      Data: {
        UserId,
        Message: 'PIN reset successfully',
        Note: 'User must use new PIN for all transactions',
        ResetDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/nampost/pin-reset',
      },
      Meta: {},
    };

    return helpers.success(
      pinResetResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error resetting PIN:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while resetting the PIN',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handlePINReset,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
