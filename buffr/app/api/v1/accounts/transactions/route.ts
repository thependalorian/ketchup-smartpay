/**
 * Open Banking API: /api/v1/accounts/transactions
 * 
 * Get account transactions (Open Banking format)
 * 
 * Features:
 * - Open Banking transaction format
 * - Open Banking pagination
 * - Multi-account support
 * - Filtering by date range and account
 * - API versioning (v1)
 * 
 * Example requests:
 * GET /api/v1/accounts/transactions?page=1&page-size=25
 * GET /api/v1/accounts/transactions?AccountId=wallet-id&from=2026-01-01&to=2026-01-31
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { mapTransactionRow } from '@/utils/db-adapters';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/accounts/transactions
 * Get account transactions (Open Banking format)
 */
async function handleGetAccountTransactions(req: ExpoRequest) {
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

    // Parse Open Banking pagination parameters
    const { page, pageSize } = parsePaginationParams(req);
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('AccountId');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const type = searchParams.get('type');

    // Build query
    let queryText = `SELECT * FROM transactions WHERE user_id = $1`;
    const params: any[] = [actualUserId];

    if (accountId) {
      queryText += ` AND wallet_id = $${params.length + 1}`;
      params.push(accountId);
    }

    if (fromDate) {
      queryText += ` AND transaction_time >= $${params.length + 1}`;
      params.push(fromDate);
    }

    if (toDate) {
      queryText += ` AND transaction_time <= $${params.length + 1}`;
      params.push(toDate);
    }

    if (type) {
      const typeMap: Record<string, string> = {
        'sent': 'debit',
        'received': 'credit',
        'payment': 'payment',
        'transfer_in': 'deposit',
        'transfer_out': 'transfer',
      };
      const dbType = typeMap[type] || type;
      queryText += ` AND transaction_type = $${params.length + 1}`;
      params.push(dbType);
    }

    // Get total count for pagination
    const countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    queryText += ` ORDER BY transaction_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);

    // Fetch transactions
    const transactions = await query<any>(queryText, params);

    // Format transactions as Open Banking format
    const formattedTransactions = transactions.map((tx: any) => {
      const mapped = mapTransactionRow(tx);
      return {
        TransactionId: mapped.id,
        AccountId: mapped.wallet_id,
        Amount: {
          Amount: parseFloat(mapped.amount.toString()),
          Currency: mapped.currency,
        },
        CreditDebitIndicator: mapped.type === 'credit' ? 'Credit' : 'Debit',
        Status: mapped.status === 'completed' ? 'Booked' : 'Pending',
        BookingDateTime: mapped.date,
        ValueDateTime: mapped.date,
        TransactionInformation: mapped.description,
        TransactionReference: mapped.id,
        MerchantDetails: mapped.recipient_name ? {
          MerchantName: mapped.recipient_name,
        } : undefined,
        Category: mapped.category,
      };
    });

    // Get base URL for pagination links
    const baseUrl = new URL(req.url).origin + '/api/v1/accounts/transactions';
    
    // Build query params for pagination links
    const queryParams: Record<string, string> = {};
    if (accountId) queryParams.AccountId = accountId;
    if (fromDate) queryParams.from = fromDate;
    if (toDate) queryParams.to = toDate;
    if (type) queryParams.type = type;

    // Return Open Banking paginated response
    return helpers.paginated(
      formattedTransactions,
      'Transaction',
      baseUrl,
      page,
      pageSize,
      total,
      req,
      queryParams,
      fromDate || undefined,
      toDate || new Date().toISOString(),
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching account transactions:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching account transactions',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetAccountTransactions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
