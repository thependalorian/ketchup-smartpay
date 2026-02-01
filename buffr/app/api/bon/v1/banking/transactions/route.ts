/**
 * Namibian Open Banking API: /bon/v1/banking/transactions
 * 
 * Account Information Service (AIS) - List Transactions
 * 
 * Purpose: Get transactions for a specific account
 * 
 * GET /bon/v1/banking/transactions?AccountId=wallet-123&page=1&page-size=25
 * 
 * Headers:
 * - ParticipantId: API123456 (TPP Participant ID)
 * - x-v: 1 (API version)
 * - Authorization: Bearer {access_token}
 * 
 * Response:
 * {
 *   "Data": {
 *     "Transactions": [
 *       {
 *         "TransactionId": "txn-123",
 *         "AccountId": "wallet-123",
 *         "Amount": "50.00",
 *         "Currency": "NAD",
 *         "TransactionType": "Credit",
 *         "Status": "Completed",
 *         "BookingDateTime": "2026-01-26T10:00:00Z",
 *         "Description": "Payment received"
 *       }
 *     ],
 *     "Links": {...},
 *     "Meta": {...}
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { NamibianOpenBankingErrorCode } from '@/utils/namibianOpenBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import {
  validateNamibianOpenBankingHeaders,
  parseNamibianPaginationParams,
  createNamibianPaginationLinks,
  createNamibianPaginationMeta,
} from '@/utils/namibianOpenBanking';
import { verifyAccessToken } from '@/utils/oauth2Consent';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';
import { recordServiceLevelMetric } from '@/utils/namibianOpenBankingMiddleware';

/**
 * GET /bon/v1/banking/transactions
 * List transactions (AIS)
 */
async function handleListTransactions(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const startTime = Date.now();
  
  try {
    // Validate Namibian Open Banking headers
    const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
    if (!headerValidation.valid) {
      const responseTime = Date.now() - startTime;
      if (headerValidation.participantId) {
        await recordServiceLevelMetric('/bon/v1/banking/transactions', headerValidation.participantId, false, responseTime);
      }
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_REQUEST,
        'Invalid request headers',
        400,
        headerValidation.errors.map(err => ({
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_INVALID,
          Message: err,
          Path: 'Headers',
        }))
      );
    }
    
    const tppId = headerValidation.participantId!;
    
    // Verify access token
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    if (!accessToken) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/transactions', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Authorization header with Bearer token is required',
        401
      );
    }
    
    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/transactions', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Invalid or expired access token',
        401
      );
    }
    
    // Verify consent has required scope
    const scopes = tokenPayload.scope.split(' ').filter(Boolean);
    if (!scopes.includes('banking:accounts.basic.read')) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/transactions', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_SCOPE,
        'Consent does not include required scope: banking:accounts.basic.read',
        403
      );
    }
    
    // Get account ID from query parameters
    const url = new URL(req.url);
    const accountId = url.searchParams.get('AccountId');
    
    if (!accountId) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/transactions', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.FIELD_MISSING,
        'AccountId query parameter is required',
        400,
        [{
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
          Message: 'The field AccountId is missing',
          Path: 'Query.AccountId',
        }]
      );
    }
    
    // Get account holder ID from token
    const accountHolderId = tokenPayload.sub;
    
    // Verify account belongs to account holder
    const wallets = await query<{ id: string }>(
      `SELECT id FROM wallets WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [accountId, accountHolderId]
    );
    
    if (wallets.length === 0) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/transactions', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Account not found or access denied',
        404
      );
    }
    
    // Parse pagination parameters
    const { page, pageSize } = parseNamibianPaginationParams(req);
    const offset = (page - 1) * pageSize;
    
    // Query transactions
    const transactions = await query<{
      id: string;
      wallet_id: string;
      amount: number;
      currency: string;
      type: string;
      status: string;
      description: string;
      created_at: Date;
    }>(
      `SELECT id, wallet_id, amount, currency, type, status, description, created_at
       FROM transactions
       WHERE wallet_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [accountId, pageSize, offset]
    );
    
    // Get total count
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM transactions WHERE wallet_id = $1`,
      [accountId]
    );
    const totalRecords = parseInt(totalResult[0]?.count || '0', 10);
    
    // Transform to Namibian Open Banking format
    const formattedTransactions = transactions.map(txn => ({
      TransactionId: txn.id,
      AccountId: accountId,
      Amount: (Math.abs(txn.amount) / 100).toFixed(2),
      Currency: txn.currency || 'NAD',
      TransactionType: txn.amount >= 0 ? 'Credit' : 'Debit',
      Status: txn.status === 'completed' ? 'Completed' : txn.status,
      BookingDateTime: txn.created_at.toISOString(),
      Description: txn.description || '',
    }));
    
    // Create pagination links
    const baseUrl = `/bon/v1/banking/transactions?AccountId=${accountId}`;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const links = createNamibianPaginationLinks(baseUrl, page, pageSize, totalPages);
    const meta = createNamibianPaginationMeta(totalRecords, pageSize);
    
    const responseTime = Date.now() - startTime;
    await recordServiceLevelMetric('/bon/v1/banking/transactions', tppId, true, responseTime);
    
    log.info('Transactions listed', {
      account_id: accountId,
      account_holder_id: accountHolderId,
      tpp_id: tokenPayload.aud,
      transaction_count: formattedTransactions.length,
      response_time_ms: responseTime,
    });
    
    return helpers.success(
      {
        Transactions: formattedTransactions,
        Links: links,
        Meta: meta,
      },
      200,
      {
        Self: `${baseUrl}&page=${page}&page-size=${pageSize}`,
      },
      {
        request_time_ms: responseTime,
      }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const tppId = validateNamibianOpenBankingHeaders(req.headers).participantId;
    if (tppId) {
      await recordServiceLevelMetric('/bon/v1/banking/transactions', tppId, false, responseTime);
    }
    log.error('List transactions error', {
      error: error.message,
      response_time_ms: responseTime,
    });
    
    return helpers.error(
      NamibianOpenBankingErrorCode.SERVER_ERROR,
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

export const GET = openBankingSecureRoute(handleListTransactions, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false,
  forceOpenBanking: true,
});
