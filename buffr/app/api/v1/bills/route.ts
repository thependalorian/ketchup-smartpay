/**
 * Open Banking API: /api/v1/bills
 * 
 * List bills with filtering (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetBills(req: ExpoRequest) {
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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const { page, pageSize } = parsePaginationParams(req);

    // Build query
    let queryText = `
      SELECT 
        id, name, provider, account_number, category, amount, 
        minimum_amount, due_date, is_paid, paid_at, paid_amount,
        payment_reference, created_at, updated_at
      FROM bills
      WHERE user_id = $1
    `;
    const params: any[] = [actualUserId];
    let paramIndex = 2;

    if (category) {
      queryText += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    // Get total count
    const countQuery = queryText.replace(
      'SELECT id, name, provider, account_number, category, amount, minimum_amount, due_date, is_paid, paid_at, paid_amount, payment_reference, created_at, updated_at',
      'SELECT COUNT(*)'
    );
    const countResult = await query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    queryText += ` ORDER BY due_date ASC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(pageSize, offset);

    const bills = await query<any>(queryText, params);

    // Format as Open Banking
    const formattedBills = bills.map((bill: any) => ({
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
      CreatedDateTime: bill.created_at?.toISOString() || null,
    }));

    // Calculate pagination
    const totalPages = Math.ceil(total / pageSize);
    const baseUrl = `/api/v1/bills${category ? `?category=${category}` : ''}`;

    const response = {
      Data: {
        Bills: formattedBills,
        Links: {
          Self: `${baseUrl}&page=${page}&page-size=${pageSize}`,
          First: `${baseUrl}&page=1&page-size=${pageSize}`,
          Prev: page > 1 ? `${baseUrl}&page=${page - 1}&page-size=${pageSize}` : null,
          Next: page < totalPages ? `${baseUrl}&page=${page + 1}&page-size=${pageSize}` : null,
          Last: `${baseUrl}&page=${totalPages}&page-size=${pageSize}`,
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
    log.error('Error fetching bills:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching bills',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBills,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
