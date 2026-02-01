/**
 * Namibian Open Banking API: /bon/v1/banking/accountbalance
 * 
 * Account Information Service (AIS) - Get Account Balance
 * 
 * Purpose: Get balance for a specific account
 * 
 * GET /bon/v1/banking/accountbalance?AccountId=wallet-123
 * 
 * Headers:
 * - ParticipantId: API123456 (TPP Participant ID)
 * - x-v: 1 (API version)
 * - Authorization: Bearer {access_token}
 * 
 * Response:
 * {
 *   "Data": {
 *     "AccountId": "wallet-123",
 *     "Balances": [
 *       {
 *         "BalanceType": "Available",
 *         "Amount": "100.00",
 *         "Currency": "NAD"
 *       },
 *       {
 *         "BalanceType": "Actual",
 *         "Amount": "100.00",
 *         "Currency": "NAD"
 *       }
 *     ]
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { NamibianOpenBankingErrorCode } from '@/utils/namibianOpenBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibianOpenBankingHeaders } from '@/utils/namibianOpenBanking';
import { verifyAccessToken } from '@/utils/oauth2Consent';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';
import { recordServiceLevelMetric } from '@/utils/namibianOpenBankingMiddleware';

/**
 * GET /bon/v1/banking/accountbalance
 * Get account balance (AIS)
 */
async function handleGetBalance(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const startTime = Date.now();
  
  try {
    // Validate Namibian Open Banking headers
    const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
    if (!headerValidation.valid) {
      const responseTime = Date.now() - startTime;
      if (headerValidation.participantId) {
        await recordServiceLevelMetric('/bon/v1/banking/accountbalance', headerValidation.participantId, false, responseTime);
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
      await recordServiceLevelMetric('/bon/v1/banking/accountbalance', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Authorization header with Bearer token is required',
        401
      );
    }
    
    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/accountbalance', tppId, false, responseTime);
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
      await recordServiceLevelMetric('/bon/v1/banking/accountbalance', tppId, false, responseTime);
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
      await recordServiceLevelMetric('/bon/v1/banking/accountbalance', tppId, false, responseTime);
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
    
    // Query wallet/account
    const wallets = await query<{
      id: string;
      user_id: string;
      balance: number;
      currency: string;
      status: string;
    }>(
      `SELECT id, user_id, balance, currency, status 
       FROM wallets 
       WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [accountId, accountHolderId]
    );
    
    if (wallets.length === 0) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/accountbalance', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.ACCOUNT_NOT_FOUND,
        'Account not found or access denied',
        404
      );
    }
    
    const wallet = wallets[0];
    
    // Format balance (two decimal places per Namibian standards)
    const balanceAmount = (wallet.balance / 100).toFixed(2);
    
    const responseTime = Date.now() - startTime;
    await recordServiceLevelMetric('/bon/v1/banking/accountbalance', tppId, true, responseTime);
    
    log.info('Account balance retrieved', {
      account_id: accountId,
      account_holder_id: accountHolderId,
      tpp_id: tokenPayload.aud,
      response_time_ms: responseTime,
    });
    
    return helpers.success(
      {
        AccountId: accountId,
        Balances: [
          {
            BalanceType: 'Available',
            Amount: balanceAmount,
            Currency: wallet.currency || 'NAD',
          },
          {
            BalanceType: 'Actual',
            Amount: balanceAmount,
            Currency: wallet.currency || 'NAD',
          },
        ],
      },
      200,
      {
        Self: `/bon/v1/banking/accountbalance?AccountId=${accountId}`,
      },
      {
        request_time_ms: responseTime,
      }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const tppId = validateNamibianOpenBankingHeaders(req.headers).participantId;
    if (tppId) {
      await recordServiceLevelMetric('/bon/v1/banking/accountbalance', tppId, false, responseTime);
    }
    log.error('Get balance error', {
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

export const GET = openBankingSecureRoute(handleGetBalance, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false,
  forceOpenBanking: true,
});
