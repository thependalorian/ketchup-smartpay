/**
 * Namibian Open Banking API: /bon/v1/common/revoke
 * 
 * Token Revocation Endpoint
 * RFC 7009: OAuth 2.0 Token Revocation
 * 
 * Purpose: Revoke access token or refresh token (revokes consent)
 * 
 * POST /bon/v1/common/revoke
 * 
 * Request Body:
 * {
 *   "token": "refresh-token-or-access-token",
 *   "token_type_hint": "refresh_token" | "access_token"
 * }
 * 
 * Response: 200 OK (no body)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { NamibianOpenBankingErrorCode } from '@/utils/namibianOpenBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibianOpenBankingHeaders } from '@/utils/namibianOpenBanking';
import { verifyAccessToken, verifyRefreshToken, revokeConsent } from '@/utils/oauth2Consent';
import { log } from '@/utils/logger';

/**
 * POST /bon/v1/common/revoke
 * Revoke token (and consent)
 */
async function handleRevoke(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const startTime = Date.now();
  
  try {
    // Validate Namibian Open Banking headers
    const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
    if (!headerValidation.valid) {
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
    
    // Parse request body (application/x-www-form-urlencoded or JSON)
    const contentType = req.headers.get('content-type') || '';
    let body: any;
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      body = await req.json();
    }
    
    const { token, token_type_hint } = body;
    
    if (!token) {
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_REQUEST,
        'token is required',
        400,
        [{
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
          Message: 'The field token is missing',
          Path: 'token',
        }]
      );
    }
    
    // Try to verify token and get consent_id
    let consentId: string | null = null;
    
    if (token_type_hint === 'refresh_token' || !token_type_hint) {
      const refreshPayload = verifyRefreshToken(token);
      if (refreshPayload) {
        consentId = refreshPayload.consent_id;
      }
    }
    
    if (!consentId && (token_type_hint === 'access_token' || !token_type_hint)) {
      const accessPayload = verifyAccessToken(token);
      if (accessPayload) {
        consentId = accessPayload.consent_id;
      }
    }
    
    if (consentId) {
      // Revoke consent
      await revokeConsent(consentId);
      
      const responseTime = Date.now() - startTime;
      
      log.info('Token revoked', {
        consent_id: consentId,
        token_type_hint,
        response_time_ms: responseTime,
      });
    } else {
      // Token is invalid, but we still return 200 (per RFC 7009)
      log.warn('Revoke called with invalid token', {
        token_type_hint,
      });
    }
    
    // Always return 200 OK (per RFC 7009)
    return helpers.noContent();
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    log.error('Revoke endpoint error', {
      error: error.message,
      response_time_ms: responseTime,
    });
    
    // Still return 200 OK even on error (per RFC 7009)
    return helpers.noContent();
  }
}

export const POST = openBankingSecureRoute(handleRevoke, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false,
  forceOpenBanking: true,
});
