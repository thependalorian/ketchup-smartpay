/**
 * USSD PIN Recovery API
 * 
 * Location: app/api/ussd/pin-recovery/route.ts
 * Purpose: Handle PIN recovery requests via USSD (redirects to NamPost)
 * 
 * Security: PIN recovery requires in-person verification at NamPost branch
 */

import { ExpoRequest } from 'expo-router/server';
import { secureRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { query } from '@/utils/db';
import logger from '@/utils/logger';

interface USSDPINRecoveryRequest {
  phoneNumber: string;
}

async function postHandler(req: ExpoRequest) {
  try {
    const body: USSDPINRecoveryRequest = await req.json();
    const { phoneNumber } = body;

    // Validate required fields
    if (!phoneNumber) {
      return errorResponse('phoneNumber is required', HttpStatus.BAD_REQUEST);
    }

    // Get user by phone number
    const users = await query<{ id: string }>(
      'SELECT id FROM users WHERE phone_number = $1',
      [phoneNumber]
    );

    if (users.length === 0) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Return instructions for in-person PIN reset
    return successResponse({
      message: 'PIN recovery requires in-person verification',
      instructions: [
        'Visit your nearest NamPost branch or Ketchup mobile unit',
        'Bring your national ID or passport',
        'Request PIN reset from staff',
        'Staff will verify your identity via biometric verification',
        'You will be able to set a new PIN',
      ],
      locations: {
        nampost: '140 branches nationwide',
        mobileUnits: 'Ketchup mobile units for remote areas',
      },
      note: 'PIN cannot be reset via USSD or SMS for security reasons. In-person verification is required.',
    }, 'PIN recovery instructions');
  } catch (error: any) {
    logger.error('USSD PIN recovery error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process PIN recovery request',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureRoute(RATE_LIMITS.api, postHandler);
