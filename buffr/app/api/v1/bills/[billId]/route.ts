/**
 * Open Banking API: /api/v1/bills/{billId}
 * 
 * Get bill details (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetBill(
  req: ExpoRequest,
  { params }: { params: { billId: string } }
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
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const { billId } = params;

    const bills = await query<any>(
      `SELECT 
        id, name, provider, account_number, category, amount, 
        minimum_amount, due_date, is_paid, paid_at, paid_amount,
        payment_reference, metadata, created_at, updated_at
      FROM bills
      WHERE id = $1 AND user_id = $2`,
      [billId, actualUserId]
    );

    if (bills.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Bill not found',
        404
      );
    }

    const bill = bills[0];

    const response = {
      Data: {
        Bill: {
          BillId: bill.id,
          Name: bill.name,
          Provider: bill.provider,
          AccountNumber: bill.account_number,
          Category: bill.category,
          Amount: parseFloat(bill.amount.toString()),
          MinimumAmount: bill.minimum_amount ? parseFloat(bill.minimum_amount.toString()) : null,
          DueDate: bill.due_date?.toISOString().split('T')[0] || null,
          IsPaid: bill.is_paid || false,
          PaidAt: bill.paid_at ? bill.paid_at.toISOString() : null,
          PaidAmount: bill.paid_amount ? parseFloat(bill.paid_amount.toString()) : null,
          PaymentReference: bill.payment_reference || null,
          Metadata: bill.metadata || {},
          CreatedDateTime: bill.created_at?.toISOString() || null,
          UpdatedDateTime: bill.updated_at?.toISOString() || null,
        },
      },
      Links: {
        Self: `/api/v1/bills/${billId}`,
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
    log.error('Error fetching bill:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching bill',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBill,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
