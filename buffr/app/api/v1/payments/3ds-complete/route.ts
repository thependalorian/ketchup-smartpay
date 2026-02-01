/**
 * Open Banking API: /api/v1/payments/3ds-complete
 * 
 * Complete 3D Secure payment (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { log } from '@/utils/logger';

async function handle3DSComplete(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Data is missing',
            'Data'
          ),
        ]
      );
    }

    const { TransactionId, Amount, CVV } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!TransactionId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field TransactionId is missing',
          'Data.TransactionId'
        )
      );
    }

    if (!Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Amount'
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

    // Complete 3DS flow
    const { complete3DSecureFlow } = await import('@/services/adumoService');

    const result = await complete3DSecureFlow(TransactionId, Amount, CVV);

    if (!result.success) {
      return helpers.error(
        OpenBankingErrorCode.PAYMENT_FAILED,
        result.statusMessage || '3D Secure authentication failed',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.PAYMENT_FAILED,
            result.statusMessage || '3D Secure authentication failed',
            'Data'
          ),
        ]
      );
    }

    const response = {
      Data: {
        TransactionId: result.transactionId,
        StatusCode: result.statusCode,
        StatusMessage: result.statusMessage,
        AuthorisationCode: result.authorisationCode,
        Settled: result.settled,
      },
      Links: {
        Self: `/api/v1/payments/3ds-complete`,
      },
      Meta: {},
    };

    return helpers.success(
      response,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('3DS complete error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred during 3D Secure completion',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handle3DSComplete,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
