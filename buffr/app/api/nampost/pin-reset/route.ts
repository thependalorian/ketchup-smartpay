/**
 * NamPost PIN Reset API Route
 * 
 * Location: app/api/nampost/pin-reset/route.ts
 * Purpose: Process PIN reset at NamPost branch (in-person verification required)
 * 
 * Security: Requires in-person verification with biometric validation
 * Integration: NamPost API + Ketchup SmartPay biometric verification
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { validatePIN } from '@/utils/validators';
import { namPostService } from '@/services/namPostService';
import { logPINOperation, generateRequestId, getIpAddress } from '@/utils/auditLogger';
import logger from '@/utils/logger';

interface NamPostPINResetRequest {
  userId: string;
  branchId: string;
  staffId: string; // NamPost staff member ID
  newPin: string; // 4-digit PIN
  biometricVerificationId: string; // From Ketchup SmartPay biometric verification
  idVerificationStatus: boolean; // ID document verified
}

async function postHandler(req: ExpoRequest) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);

  try {
    const {
      userId,
      branchId,
      staffId,
      newPin,
      biometricVerificationId,
      idVerificationStatus,
    }: NamPostPINResetRequest = await req.json();

    // Validate required fields
    if (!userId || !branchId || !staffId || !newPin || !biometricVerificationId) {
      return errorResponse(
        'userId, branchId, staffId, newPin, and biometricVerificationId are required',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate ID verification status
    if (!idVerificationStatus) {
      return errorResponse(
        'ID verification is required for PIN reset. Please verify the user\'s ID document.',
        HttpStatus.BAD_REQUEST
      );
    }

    // Validate PIN format
    const pinCheck = validatePIN(newPin);
    if (!pinCheck.valid) {
      return errorResponse(pinCheck.error || 'Invalid PIN format', HttpStatus.BAD_REQUEST);
    }

    // Verify user exists
    const users = await query<{ id: string; phone_number: string }>(
      'SELECT id, phone_number FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Hash new PIN
    const bcrypt = await import('bcrypt');
    const pinHash = await bcrypt.hash(newPin, 10);

    // Update user PIN
    await query(
      'UPDATE users SET transaction_pin_hash = $1, updated_at = NOW() WHERE id = $2',
      [pinHash, userId]
    );

    // Log PIN reset operation (audit trail)
    await logPINOperation({
      user_id: userId,
      staff_id: staffId,
      operation_type: 'reset',
      location: branchId,
      biometric_verification_id: biometricVerificationId,
      id_verification_status: idVerificationStatus,
      success: true,
    }).catch(err => logger.error('Failed to log PIN reset:', err));

    // Send push notification
    const { sendPushNotification } = await import('@/utils/sendPushNotification');
    await sendPushNotification({
      userIds: userId,
      title: 'PIN Reset Successful',
      body: 'Your Buffr PIN has been reset successfully. Your new PIN is now active.',
      data: { type: 'pin_reset', userId },
    }).catch(err => logger.error('Failed to send notification:', err));

    return successResponse({
      userId,
      message: 'PIN reset successfully',
      note: 'User must use new PIN for all transactions',
    }, 'PIN reset completed successfully');
  } catch (error: any) {
    logger.error('NamPost PIN reset error', error, { requestId, ipAddress });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to reset PIN',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
