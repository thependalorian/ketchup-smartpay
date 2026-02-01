/**
 * Open Banking API: /api/v1/payments/domestic-payments/{paymentId}
 * 
 * Get payment status (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetPayment(
  req: ExpoRequest,
  { params }: { params: { paymentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    const { paymentId } = params;

    // Fetch payment/transaction
    const transactions = await query<any>(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [paymentId, actualUserId]
    );

    if (transactions.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Payment with ID '${paymentId}' not found`,
        404
      );
    }

    const tx = transactions[0];
    const status = tx.status === 'completed' 
      ? 'AcceptedSettlementCompleted' 
      : tx.status === 'pending'
      ? 'AcceptedSettlementInProcess'
      : 'Rejected';

    const paymentResponse = {
      Data: {
        DomesticPaymentId: paymentId,
        ConsentId: paymentId,
        Initiation: {
          InstructionIdentification: paymentId,
          EndToEndIdentification: paymentId,
          InstructedAmount: {
            Amount: tx.amount.toString(),
            Currency: tx.currency,
          },
        },
        CreationDateTime: tx.created_at,
        Status: status,
        StatusUpdateDateTime: tx.transaction_time || tx.created_at,
      },
      Links: {
        Self: `/api/v1/payments/domestic-payments/${paymentId}`,
      },
      Meta: {},
    };

    return helpers.success(
      paymentResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching payment:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the payment',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetPayment,
  {
    rateLimitConfig: RATE_LIMITS.payment,
    requireAuth: true,
    trackResponseTime: true,
  }
);
