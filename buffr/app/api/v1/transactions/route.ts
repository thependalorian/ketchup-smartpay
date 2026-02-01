/**
 * Open Banking API: /api/v1/transactions
 * 
 * Open Banking-compliant transactions endpoint
 * 
 * Features:
 * - Open Banking error response format
 * - Open Banking pagination
 * - API versioning (v1)
 * - Standardized response headers
 * 
 * Example requests:
 * GET /api/v1/transactions?page=1&page-size=25
 * GET /api/v1/transactions/{transactionId}
 */

import { ExpoRequest } from 'expo-router/server';
import { RATE_LIMITS } from '@/utils/secureApi';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { mapTransactionRow } from '@/utils/db-adapters';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/transactions
 * List transactions with Open Banking pagination
 */
async function handleGetTransactions(req: ExpoRequest) {
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

    // Find actual user ID
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
    const type = searchParams.get('type');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    // Build query
    let queryText = `SELECT * FROM transactions WHERE user_id = $1`;
    const params: any[] = [actualUserId];

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

    if (fromDate) {
      queryText += ` AND transaction_time >= $${params.length + 1}`;
      params.push(fromDate);
    }

    if (toDate) {
      queryText += ` AND transaction_time <= $${params.length + 1}`;
      params.push(toDate);
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

    // Format transactions
    const formattedTransactions = transactions.map(tx => {
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
    const baseUrl = new URL(req.url).origin + '/api/v1/transactions';
    
    // Get date range for meta
    const firstAvailableDateTime = fromDate || undefined;
    const lastAvailableDateTime = toDate || new Date().toISOString();

    // Return Open Banking paginated response
    return helpers.paginated(
      formattedTransactions,
      'Transaction',
      baseUrl,
      page,
      pageSize,
      total,
      req,
      type ? { type } : {},
      firstAvailableDateTime,
      lastAvailableDateTime,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching transactions:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching transactions',
      500
    );
  }
}

/**
 * GET /api/v1/transactions/{transactionId}
 * Get single transaction
 */
async function handleGetTransaction(req: ExpoRequest, { params }: { params: { transactionId: string } }) {
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

    const { transactionId } = params;

    // Fetch transaction
    const transactions = await query<any>(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, actualUserId]
    );

    if (transactions.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Transaction with ID '${transactionId}' not found`,
        404
      );
    }

    const tx = transactions[0];
    const mapped = mapTransactionRow(tx);

    const transaction = {
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

    return helpers.success(
      { Transaction: [transaction] },
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching transaction:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the transaction',
      500
    );
  }
}

// Export handlers with Open Banking middleware
export const GET = openBankingSecureRoute(
  handleGetTransactions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

// Note: For dynamic routes like /api/v1/transactions/[id], create separate file
// app/api/v1/transactions/[transactionId]/route.ts
