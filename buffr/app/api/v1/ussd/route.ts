/**
 * Open Banking API: /api/v1/ussd
 * 
 * USSD gateway endpoint (Open Banking format)
 * 
 * CRITICAL: Feature phone support for 70% unbanked population
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { ussdService } from '@/services/ussdService';
import { log } from '@/utils/logger';

async function handleUSSD(req: ExpoRequest) {
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

    const { SessionId, PhoneNumber, UserInput, ServiceCode } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!SessionId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field SessionId is missing',
          'Data.SessionId'
        )
      );
    }

    if (!PhoneNumber) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field PhoneNumber is missing',
          'Data.PhoneNumber'
        )
      );
    }

    if (!ServiceCode) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field ServiceCode is missing',
          'Data.ServiceCode'
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

    // Process USSD request
    const response = await ussdService.processRequest({
      sessionId: SessionId,
      phoneNumber: PhoneNumber,
      userInput: UserInput || '',
      serviceCode: ServiceCode,
    });

    const ussdResponse = {
      Data: {
        SessionId,
        PhoneNumber,
        Response: response.message,
        Menu: response.menu,
        Continue: response.continue,
      },
      Links: {
        Self: '/api/v1/ussd',
      },
      Meta: {},
    };

    return helpers.success(
      ussdResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error processing USSD request:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the USSD request',
      500
    );
  }
}

// USSD gateway calls this endpoint, so we use secureRoute (not requireAuth)
export const POST = openBankingSecureRoute(
  handleUSSD,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: false, // Gateway authentication handled separately
    trackResponseTime: true,
  }
);
