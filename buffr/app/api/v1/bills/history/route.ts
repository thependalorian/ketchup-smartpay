/**
 * Open Banking API: /api/v1/bills/history
 * 
 * Get bill payment history (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetBillHistory(req: ExpoRequest) {
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

    const { page, pageSize } = parsePaginationParams(req);

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM bill_payments WHERE user_id = $1`,
      [actualUserId]
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Get payments with bill details
    const offset = (page - 1) * pageSize;
    const payments = await query<any>(
      `SELECT 
        bp.id, bp.bill_id, bp.amount, bp.payment_date, bp.status, bp.payment_reference,
        bp.receipt_url, b.name as bill_name, b.provider
      FROM bill_payments bp
      INNER JOIN bills b ON bp.bill_id = b.id
      WHERE bp.user_id = $1
      ORDER BY bp.payment_date DESC
      LIMIT $2 OFFSET $3`,
      [actualUserId, pageSize, offset]
    );

    const formattedPayments = payments.map((p: any) => ({
      PaymentId: p.id,
      BillId: p.bill_id,
      BillName: p.bill_name,
      Provider: p.provider,
      Amount: parseFloat(p.amount.toString()),
      PaymentDate: p.payment_date?.toISOString() || null,
      Status: p.status || 'completed',
      PaymentReference: p.payment_reference || null,
      ReceiptUrl: p.receipt_url || null,
    }));

    const totalPages = Math.ceil(total / pageSize);
    const baseUrl = '/api/v1/bills/history';

    const response = {
      Data: {
        Payments: formattedPayments,
        Links: {
          Self: `${baseUrl}?page=${page}&page-size=${pageSize}`,
          First: `${baseUrl}?page=1&page-size=${pageSize}`,
          Prev: page > 1 ? `${baseUrl}?page=${page - 1}&page-size=${pageSize}` : null,
          Next: page < totalPages ? `${baseUrl}?page=${page + 1}&page-size=${pageSize}` : null,
          Last: `${baseUrl}?page=${totalPages}&page-size=${pageSize}`,
        },
        Meta: {
          TotalPages: totalPages,
        },
      },
    };

    return helpers.success(
      response,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching bill payment history:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching bill payment history',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBillHistory,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
