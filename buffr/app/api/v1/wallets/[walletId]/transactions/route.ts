/**
 * Open Banking API: /api/v1/wallets/{walletId}/transactions
 * 
 * Get wallet transactions (Open Banking format)
 * 
 * Features:
 * - Open Banking transaction format
 * - Open Banking pagination
 * - Filtering by date range
 * - API versioning (v1)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { mapTransactionRow } from '@/utils/db-adapters';
import { log } from '@/utils/logger';
import { fineractService } from '@/services/fineractService';

async function handleGetWalletTransactions(
  req: ExpoRequest,
  { params }: { params: { walletId: string } }
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
    const { walletId } = params;

    // Verify wallet belongs to user
    const wallets = await query<any>(
      'SELECT * FROM wallets WHERE id = $1 AND user_id = $2',
      [walletId, actualUserId]
    );

    if (wallets.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        `Wallet with ID '${walletId}' not found`,
        404
      );
    }

    // Parse Open Banking pagination parameters
    const { page, pageSize } = parsePaginationParams(req);
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const type = searchParams.get('type');

    // Build query
    let queryText = `SELECT * FROM transactions WHERE wallet_id = $1 AND user_id = $2`;
    const params: any[] = [walletId, actualUserId];

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
        AccountId: walletId,
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
    const baseUrl = new URL(req.url).origin + `/api/v1/wallets/${walletId}/transactions`;
    
    // Build query params for pagination links
    const queryParams: Record<string, string> = {};
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
    log.error('Error fetching wallet transactions:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching wallet transactions',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetWalletTransactions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
