/**
 * Open Banking API: /api/v1/admin/transactions
 * 
 * Admin transaction management (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { mapTransactionRow } from '@/utils/db-adapters';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/transactions
 * Get all transactions (admin only)
 */
async function handleGetTransactions(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const userIdFilter = searchParams.get('user_id');
    const { page, pageSize } = parsePaginationParams(req);

    // Build query
    const whereConditions: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      whereConditions.push(
        `(id::text ILIKE $${paramIndex} OR user_id::text ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Type filter
    if (type) {
      whereConditions.push(`transaction_type = $${paramIndex}`);
      queryParams.push(type);
      paramIndex++;
    }

    // Date filters
    if (fromDate) {
      whereConditions.push(`transaction_time >= $${paramIndex}`);
      queryParams.push(fromDate);
      paramIndex++;
    }

    if (toDate) {
      whereConditions.push(`transaction_time <= $${paramIndex}`);
      queryParams.push(toDate);
      paramIndex++;
    }

    // Amount filters
    if (minAmount) {
      whereConditions.push(`amount >= $${paramIndex}`);
      queryParams.push(parseFloat(minAmount));
      paramIndex++;
    }

    if (maxAmount) {
      whereConditions.push(`amount <= $${paramIndex}`);
      queryParams.push(parseFloat(maxAmount));
      paramIndex++;
    }

    // User filter
    if (userIdFilter) {
      whereConditions.push(`user_id = $${paramIndex}`);
      queryParams.push(userIdFilter);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM transactions ${whereClause}`,
      queryParams
    );
    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const transactions = await query<any>(
      `SELECT * FROM transactions
       ${whereClause}
       ORDER BY transaction_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, pageSize, offset]
    );

    // Format as Open Banking
    const formattedTransactions = transactions.map((tx: any) => {
      const mapped = mapTransactionRow(tx);
      return {
        TransactionId: mapped.id,
        UserId: mapped.userId,
        WalletId: mapped.walletId || null,
        Type: mapped.type,
        Amount: mapped.amount,
        Currency: mapped.currency || 'NAD',
        Status: mapped.status,
        Description: mapped.description || null,
        CreatedDateTime: mapped.createdAt?.toISOString() || null,
      };
    });

    return helpers.paginated(
      formattedTransactions,
      'Transactions',
      '/api/v1/admin/transactions',
      page,
      pageSize,
      total,
      req,
      search || status || type || fromDate || toDate || userIdFilter
        ? { search, status, type, fromDate, toDate, userIdFilter }
        : undefined,
      undefined,
      undefined,
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

export const GET = openBankingSecureRoute(
  handleGetTransactions,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
