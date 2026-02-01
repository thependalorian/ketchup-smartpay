/**
 * Open Banking API: /api/v1/ips/transactions
 * 
 * IPS transactions monitoring (Open Banking format)
 * 
 * CRITICAL: PSDIR-11 compliance - IPS transaction tracking
 * Deadline: February 26, 2026
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/ips/transactions
 * List IPS transactions (Open Banking format)
 */
async function handleGetIPSTransactions(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'pending', 'completed', 'failed'
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const { page, pageSize } = parsePaginationParams(req);

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
      WHERE t.payment_method = 'ips_wallet_to_wallet' OR t.payment_method = 'ips_bank_transfer'
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

    // Get total count
    const countSql = sql.replace(
      'SELECT \n        t.id as transaction_id,\n        t.user_id,\n        t.amount,\n        t.currency,\n        t.status,\n        t.payment_reference,\n        t.metadata,\n        t.created_at,\n        t.updated_at,\n        it.ips_transaction_id,\n        it.settlement_status,\n        it.niss_reference,\n        it.settled_at',
      'SELECT COUNT(*) as count'
    ).replace('ORDER BY t.created_at DESC LIMIT', '').replace(/OFFSET.*$/, '');
    
    const countResult = await query<{ count: string }>(countSql, params);
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    sql += ` ORDER BY t.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(pageSize, offset);

    const transactions = await query<any>(sql, params);

    // Format as Open Banking transactions
    const formattedTransactions = transactions.map((tx: any) => {
      const formatted: any = {
        TransactionId: tx.transaction_id,
        UserId: tx.user_id,
        Amount: parseFloat(tx.amount.toString()),
        Currency: tx.currency,
        Status: tx.status,
        PaymentReference: tx.payment_reference,
        CreatedDateTime: tx.created_at.toISOString(),
        UpdatedDateTime: tx.updated_at?.toISOString(),
      };

      // Parse metadata
      if (tx.metadata && typeof tx.metadata === 'string') {
        try {
          formatted.Metadata = JSON.parse(tx.metadata);
        } catch {
          formatted.Metadata = {};
        }
      }

      // Add IPS-specific data
      if (tx.ips_transaction_id) {
        formatted.IPS = {
          TransactionId: tx.ips_transaction_id,
          SettlementStatus: tx.settlement_status,
          NISSReference: tx.niss_reference,
          SettledDateTime: tx.settled_at?.toISOString(),
        };
      }

      return formatted;
    });

    return helpers.paginated(
      formattedTransactions,
      'IPSTransactions',
      '/api/v1/ips/transactions',
      page,
      pageSize,
      total,
      req,
      status ? { status } : undefined,
      fromDate,
      toDate,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching IPS transactions:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching IPS transactions',
      500
    );
  }
}

/**
 * POST /api/v1/ips/transactions
 * Create IPS transaction (Open Banking format)
 */
async function handleCreateIPSTransaction(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { FromAccount, ToAccount, Amount, Currency, Reference, Description } = Data;

    if (!FromAccount || !ToAccount || !Amount) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'FromAccount, ToAccount, and Amount are required',
        400
      );
    }

    // Use IPS service to create transaction
    const { ipsService } = await import('@/services/ipsService');
    const { getUserIdFromRequest, findUserId } = await import('@/utils/db');
    
    const userId = await getUserIdFromRequest(req);
    const actualUserId = userId ? await findUserId(query, userId) : null;

    const ipsResult = await ipsService.transfer(
      {
        fromAccount: FromAccount,
        toAccount: ToAccount,
        amount: Amount,
        currency: Currency || 'NAD',
        reference: Reference || `IPS-${Date.now()}`,
        description: Description || 'IPS transfer',
      },
      { requestId: context?.requestId, userId: actualUserId }
    );

    const response = {
      Data: {
        TransactionId: ipsResult.transactionId,
        FromAccount,
        ToAccount,
        Amount,
        Currency: Currency || 'NAD',
        Status: ipsResult.status === 'completed' ? 'AcceptedSettlementCompleted' : 'AcceptedSettlementInProcess',
        IPSTransactionId: ipsResult.transactionId,
        SettlementTime: ipsResult.settlementTime,
        CreatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/ips/transactions/${ipsResult.transactionId}`,
      },
      Meta: {},
    };

    return helpers.created(
      response,
      `/api/v1/ips/transactions/${ipsResult.transactionId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating IPS transaction:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the IPS transaction',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetIPSTransactions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateIPSTransaction,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
