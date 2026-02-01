/**
 * Admin Transactions API
 * 
 * Location: app/api/admin/transactions/route.ts
 * Purpose: Admin-only endpoints for transaction monitoring and fraud detection
 * 
 * Requires: Admin authentication with 'transactions.view' permission
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne } from '@/utils/db';
import { mapTransactionRow } from '@/utils/db-adapters';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

/**
 * GET /api/admin/transactions
 * 
 * Query parameters:
 * - search: Search term (transaction ID, user ID, description)
 * - status: Filter by status (pending, completed, failed, flagged)
 * - type: Filter by transaction type
 * - from_date: Filter from date (ISO)
 * - to_date: Filter to date (ISO)
 * - min_amount: Minimum transaction amount
 * - max_amount: Maximum transaction amount
 * - user_id: Filter by user ID
 * - limit: Pagination limit (default: 50)
 * - offset: Pagination offset (default: 0)
 */
async function handleGetTransactions(request: ExpoRequest) {
  try {
    // Admin auth is handled by secureAdminRoute wrapper

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const minAmount = searchParams.get('min_amount');
    const maxAmount = searchParams.get('max_amount');
    const userIdFilter = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // User ID filter
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

    // Get transactions
    const transactions = await query<any>(
      `SELECT 
        id,
        user_id,
        wallet_id,
        transaction_type,
        amount,
        currency,
        description,
        category,
        status,
        transaction_time,
        created_at,
        metadata
      FROM transactions 
      ${whereClause}
      ORDER BY transaction_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Format transactions
    const formattedTransactions = transactions.map((tx: any) => {
      const mapped = mapTransactionRow(tx);
      return {
        id: mapped.id,
        user_id: tx.user_id,
        wallet_id: mapped.wallet_id,
        type: mapped.type,
        amount: parseFloat(mapped.amount.toString()),
        currency: mapped.currency || 'N$',
        description: mapped.description,
        category: mapped.category,
        status: mapped.status,
        date: mapped.date,
        created_at: tx.created_at?.toISOString() || null,
        fraud_risk_score: tx.metadata?.fraud_risk_score || null,
        flagged: tx.metadata?.flagged || false,
        flagged_reason: tx.metadata?.flagged_reason || null,
      };
    });

    return successResponse({
      transactions: formattedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching transactions', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch transactions',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.admin, handleGetTransactions);

