/**
 * API Route: /api/payments/3ds-complete
 * 
 * - POST: Complete 3D Secure payment flow after authentication
 */
import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function postHandler(req: ExpoRequest) {
  try {
    const { transactionId, amount, cvv } = await req.json();

    if (!transactionId || !amount) {
      return errorResponse('transactionId and amount are required', HttpStatus.BAD_REQUEST);
    }

    const { complete3DSecureFlow } = await import('@/services/adumoService');

    const result = await complete3DSecureFlow(transactionId, amount, cvv);

    if (!result.success) {
      return errorResponse(
        result.statusMessage || '3D Secure authentication failed',
        HttpStatus.BAD_REQUEST,
        {
          transactionId: result.transactionId,
          statusCode: result.statusCode,
        }
      );
    }

    return successResponse({
      transactionId: result.transactionId,
      statusCode: result.statusCode,
      statusMessage: result.statusMessage,
      authorisationCode: result.authorisationCode,
      settled: result.settled,
    }, 'Payment completed successfully');
  } catch (error: any) {
    log.error('3DS complete error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.payment, postHandler);
