/**
 * Namibian Open Banking API: /bon/v1/banking/beneficiaries
 * 
 * Payment Initiation Service (PIS) - List Beneficiaries
 * 
 * Purpose: Get list of saved beneficiaries (payees) for Account Holder
 * 
 * GET /bon/v1/banking/beneficiaries?page=1&page-size=25
 * 
 * Headers:
 * - ParticipantId: API123456 (TPP Participant ID)
 * - x-v: 1 (API version)
 * - Authorization: Bearer {access_token}
 * 
 * Response:
 * {
 *   "Data": {
 *     "Beneficiaries": [
 *       {
 *         "BeneficiaryId": "beneficiary-123",
 *         "AccountId": "wallet-456",
 *         "Name": "Jane Doe",
 *         "AccountType": "e-Wallet"
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
 * GET /bon/v1/banking/beneficiaries
 * List beneficiaries (PIS)
 */
async function handleListBeneficiaries(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const startTime = Date.now();
  
  try {
    // Validate Namibian Open Banking headers
    const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
    if (!headerValidation.valid) {
      const responseTime = Date.now() - startTime;
      if (headerValidation.participantId) {
        await recordServiceLevelMetric('/bon/v1/banking/beneficiaries', headerValidation.participantId, false, responseTime);
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
      await recordServiceLevelMetric('/bon/v1/banking/beneficiaries', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Authorization header with Bearer token is required',
        401
      );
    }
    
    const tokenPayload = verifyAccessToken(accessToken);
    if (!tokenPayload) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/beneficiaries', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
        'Invalid or expired access token',
        401
      );
    }
    
    // Verify consent has required scope
    const scopes = tokenPayload.scope.split(' ').filter(Boolean);
    if (!scopes.includes('banking:payments.read')) {
      const responseTime = Date.now() - startTime;
      await recordServiceLevelMetric('/bon/v1/banking/beneficiaries', tppId, false, responseTime);
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_SCOPE,
        'Consent does not include required scope: banking:payments.read',
        403
      );
    }
    
    // Get account holder ID from token
    const accountHolderId = tokenPayload.sub;
    
    // Parse pagination parameters
    const { page, pageSize } = parseNamibianPaginationParams(req);
    const offset = (page - 1) * pageSize;
    
    // Query beneficiaries (contacts that have received payments or are saved)
    const beneficiaries = await query<{
      id: string;
      user_id: string;
      name: string;
      phone_number: string;
      wallet_id: string;
    }>(
      `SELECT DISTINCT c.id, c.user_id, c.name, c.phone_number, c.wallet_id
       FROM contacts c
       WHERE c.user_id = $1
       ORDER BY c.name ASC
       LIMIT $2 OFFSET $3`,
      [accountHolderId, pageSize, offset]
    );
    
    // Get total count
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT id) as count FROM contacts WHERE user_id = $1`,
      [accountHolderId]
    );
    const totalRecords = parseInt(totalResult[0]?.count || '0', 10);
    
    // Transform to Namibian Open Banking format
    const formattedBeneficiaries = beneficiaries.map(ben => ({
      BeneficiaryId: ben.id,
      AccountId: ben.wallet_id || '',
      Name: ben.name || ben.phone_number,
      AccountType: 'e-Wallet',
      PhoneNumber: ben.phone_number,
    }));
    
    // Create pagination links
    const baseUrl = '/bon/v1/banking/beneficiaries';
    const totalPages = Math.ceil(totalRecords / pageSize);
    const links = createNamibianPaginationLinks(baseUrl, page, pageSize, totalPages);
    const meta = createNamibianPaginationMeta(totalRecords, pageSize);
    
    const responseTime = Date.now() - startTime;
    await recordServiceLevelMetric('/bon/v1/banking/beneficiaries', tppId, true, responseTime);
    
    log.info('Beneficiaries listed', {
      account_holder_id: accountHolderId,
      tpp_id: tokenPayload.aud,
      beneficiary_count: formattedBeneficiaries.length,
      response_time_ms: responseTime,
    });
    
    return helpers.success(
      {
        Beneficiaries: formattedBeneficiaries,
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
      await recordServiceLevelMetric('/bon/v1/banking/beneficiaries', tppId, false, responseTime);
    }
    log.error('List beneficiaries error', {
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

export const GET = openBankingSecureRoute(handleListBeneficiaries, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false,
  forceOpenBanking: true,
});
