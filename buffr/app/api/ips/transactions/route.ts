/**
 * IPS Transactions Monitoring API
 * 
 * Location: app/api/ips/transactions/route.ts
 * Purpose: Monitor IPS transactions and settlements
 * 
 * Compliance: PSDIR-11 (IPS integration monitoring)
 * Integration: IPS (Instant Payment Switch) transaction tracking
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'pending', 'completed', 'failed'
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        t.id as transaction_id,
        t.user_id,
        t.amount,
        t.currency,
        t.status,
        t.payment_reference,
        t.metadata,
        t.created_at,
        t.updated_at,
        it.ips_transaction_id,
        it.settlement_status,
        it.niss_reference,
        it.settled_at
      FROM transactions t
      LEFT JOIN ips_transactions it ON t.payment_reference = it.transaction_reference
      WHERE t.payment_method = 'ips_wallet_to_wallet' OR t.payment_method = 'bank_transfer'
    `;

    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (status) {
      conditions.push(`t.status = $${paramIndex++}`);
      params.push(status);
    }

    if (fromDate) {
      conditions.push(`t.created_at >= $${paramIndex++}`);
      params.push(fromDate);
    }

    if (toDate) {
      conditions.push(`t.created_at <= $${paramIndex++}`);
      params.push(toDate);
    }

    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const transactions = await query<any>(sql, params);

    // Get total count
    let countSql = `
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE t.payment_method = 'ips_wallet_to_wallet' OR t.payment_method = 'bank_transfer'
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;
    const countConditions: string[] = [];

    if (status) {
      countConditions.push(`t.status = $${countParamIndex++}`);
      countParams.push(status);
    }

    if (fromDate) {
      countConditions.push(`t.created_at >= $${countParamIndex++}`);
      countParams.push(fromDate);
    }

    if (toDate) {
      countConditions.push(`t.created_at <= $${countParamIndex++}`);
      countParams.push(toDate);
    }

    if (countConditions.length > 0) {
      countSql += ` AND ${countConditions.join(' AND ')}`;
    }

    const countResult = await query<{ total: number }>(countSql, countParams);
    const total = countResult[0]?.total || 0;

    // Format results
    const formattedTransactions = transactions.map((tx: any) => {
      const formatted: any = {
        transactionId: tx.transaction_id,
        userId: tx.user_id,
        amount: parseFloat(tx.amount.toString()),
        currency: tx.currency,
        status: tx.status,
        paymentReference: tx.payment_reference,
        createdAt: tx.created_at.toISOString(),
        updatedAt: tx.updated_at?.toISOString(),
      };

      // Parse metadata
      if (tx.metadata && typeof tx.metadata === 'string') {
        try {
          formatted.metadata = JSON.parse(tx.metadata);
        } catch {
          formatted.metadata = {};
        }
      }

      // Add IPS-specific data
      if (tx.ips_transaction_id) {
        formatted.ips = {
          transactionId: tx.ips_transaction_id,
          settlementStatus: tx.settlement_status,
          nissReference: tx.niss_reference,
          settledAt: tx.settled_at?.toISOString(),
        };
      }

      return formatted;
    });

    return successResponse({
      transactions: formattedTransactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }, 'IPS transactions retrieved successfully');
  } catch (error: any) {
    logger.error('IPS transactions monitoring error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve IPS transactions',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.api, getHandler);
