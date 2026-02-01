/**
 * Open Banking API: /api/v1/ussd/pin-recovery
 * 
 * USSD PIN recovery (Open Banking format)
 * 
 * CRITICAL: Feature phone support for 70% unbanked population
 * Security: PIN recovery requires in-person verification at NamPost branch
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

async function handlePINRecovery(req: ExpoRequest) {
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

    const { PhoneNumber } = Data;

    if (!PhoneNumber) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.PhoneNumber is required',
        400
      );
    }

    // Get user by phone number
    const users = await query<any>(
      'SELECT id FROM users WHERE phone_number = $1',
      [PhoneNumber]
    );

    if (users.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Return instructions for in-person PIN reset
    const pinRecoveryResponse = {
      Data: {
        PhoneNumber,
        Message: 'PIN recovery requires in-person verification',
        Instructions: [
          'Visit your nearest NamPost branch or Ketchup mobile unit',
          'Bring your national ID or passport',
          'Request PIN reset from staff',
          'Staff will verify your identity via biometric verification',
          'You will be able to set a new PIN',
        ],
        Locations: {
          NamPost: '140 branches nationwide',
          MobileUnits: 'Ketchup mobile units for remote areas',
        },
        Note: 'PIN cannot be reset via USSD or SMS for security reasons. In-person verification is required.',
      },
      Links: {
        Self: '/api/v1/ussd/pin-recovery',
        NamPostBranches: '/api/v1/nampost/branches',
      },
      Meta: {},
    };

    return helpers.success(
      pinRecoveryResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error processing USSD PIN recovery:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the PIN recovery request',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handlePINRecovery,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: false, // USSD gateway authentication handled separately
    trackResponseTime: true,
  }
);
