/**
 * Namibian Open Banking API: /bon/v1/banking/accounts
 * 
 * Account Information Service (AIS) - List Accounts
 * 
 * Purpose: Get list of Account Holder's accounts
 * 
 * GET /bon/v1/banking/accounts?page=1&page-size=25
 * 
 * Headers:
 * - ParticipantId: API123456 (TPP Participant ID)
 * - x-v: 1 (API version)
 * - Authorization: Bearer {access_token}
 * 
 * Response:
 * {
 *   "Data": {
 *     "Accounts": [
 *       {
 *         "AccountId": "wallet-123",
 *         "AccountType": "e-Wallet",
 *         "AccountHolderName": "John Doe",
 *         "Currency": "NAD",
 *         "Status": "Open"
 *       }
 *     ],
 *     "Links": {
 *       "first": "...",
 *       "last": "...",
 *       "prev": null,
 *       "next": "..."
 *     },
 *     "Meta": {
 *       "totalRecords": 5,
 *       "totalPages": 1
 *     }
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
 * GET /bon/v1/banking/accounts
 * List accounts (AIS)
 */
async function handleListAccounts(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const startTime = Date.now();
  
  try {
    // Validate Namibian Open Banking headers
    const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
    if (!headerValidation.valid) {
      const responseTime = Date.now() - startTime;
      if (headerValidation.participantId) {
        await recordServiceLevelMetric('/bon/v1/banking/accounts', headerValidation.participantId, false, responseTime);
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
      await recordServiceLevelMetric('/bon/v1/banking/accounts', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Authorization header with Bearer token is required',
        401
      );
    }
    
    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/accounts', tppId, false, responseTime);
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
      await recordServiceLevelMetric('/bon/v1/banking/accounts', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_SCOPE,
        'Consent does not include required scope: banking:accounts.basic.read',
        403
      );
    }
    
    // Get account holder ID from token
    const accountHolderId = tokenPayload.sub;
    
    // Parse pagination parameters
    const { page, pageSize } = parseNamibianPaginationParams(req);
    
    // Query accounts (wallets)
    const offset = (page - 1) * pageSize;
    
    const wallets = await query<{
      id: string;
      user_id: string;
      balance: number;
      currency: string;
      status: string;
    }>(
      `SELECT id, user_id, balance, currency, status 
       FROM wallets 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [accountHolderId, pageSize, offset]
    );
    
    // Get user name for AccountHolderName
    const users = await query<{ first_name: string; last_name: string }>(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [accountHolderId]
    );
    const userName = users.length > 0 
      ? `${users[0].first_name} ${users[0].last_name}`.trim()
      : '';
    
    // Get total count
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM wallets WHERE user_id = $1 AND status = 'active'`,
      [accountHolderId]
    );
    const totalRecords = parseInt(totalResult[0]?.count || '0', 10);
    
    // Transform to Namibian Open Banking format
    const accounts = wallets.map(wallet => ({
      AccountId: wallet.id,
      AccountType: 'e-Wallet',
      AccountHolderName: userName,
      Currency: wallet.currency || 'NAD',
      Status: wallet.status === 'active' ? 'Open' : 'Closed',
    }));
    
    // Create pagination links
    const baseUrl = '/bon/v1/banking/accounts';
    const totalPages = Math.ceil(totalRecords / pageSize);
    const links = createNamibianPaginationLinks(baseUrl, page, pageSize, totalPages);
    const meta = createNamibianPaginationMeta(totalRecords, pageSize);
    
    const responseTime = Date.now() - startTime;
    await recordServiceLevelMetric('/bon/v1/banking/accounts', tppId, true, responseTime);
    
    log.info('Accounts listed', {
      account_holder_id: accountHolderId,
      tpp_id: tokenPayload.aud,
      account_count: accounts.length,
      response_time_ms: responseTime,
    });
    
    return helpers.success(
      {
        Accounts: accounts,
        Links: links,
        Meta: meta,
      },
      200,
      {
        Self: `${baseUrl}?page=${page}&page-size=${pageSize}`,
      },
      {
        request_time_ms: responseTime,
      }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const tppId = validateNamibianOpenBankingHeaders(req.headers).participantId;
    if (tppId) {
      await recordServiceLevelMetric('/bon/v1/banking/accounts', tppId, false, responseTime);
    }
    log.error('List accounts error', {
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

export const GET = openBankingSecureRoute(handleListAccounts, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false, // Uses Bearer token in Authorization header
  forceOpenBanking: true,
});
