/**
 * Namibian Open Banking API: /bon/v1/common/token
 * 
 * OAuth 2.0 Token Endpoint
 * RFC 6749: The OAuth 2.0 Authorization Framework
 * 
 * Purpose: Exchange authorization code for access token, or refresh access token
 * 
 * POST /bon/v1/common/token
 * 
 * Request Body (Authorization Code Grant):
 * {
 *   "grant_type": "authorization_code",
 *   "code": "authorization-code",
 *   "redirect_uri": "https://tpp-app.com/callback",
 *   "client_id": "API123456",
 *   "code_verifier": "..."
 * }
 * 
 * Request Body (Refresh Token Grant):
 * {
 *   "grant_type": "refresh_token",
 *   "refresh_token": "refresh-token",
 *   "client_id": "API123456"
 * }
 * 
 * Response:
 * {
 *   "Data": {
 *     "access_token": "...",
 *     "token_type": "Bearer",
 *     "expires_in": 3600,
 *     "refresh_token": "...",
 *     "scope": "banking:accounts.basic.read banking:payments.write",
 *     "consent_id": "consent-id"
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { NamibianOpenBankingErrorCode } from '@/utils/namibianOpenBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibianOpenBankingHeaders, validateParticipantId, NAMIBIAN_OPEN_BANKING } from '@/utils/namibianOpenBanking';
import {
  retrieveAuthorizationCode,
  markAuthorizationCodeAsUsed,
  createAccessToken,
  createRefreshToken,
  storeConsent,
  getConsent,
  verifyRefreshToken,
} from '@/utils/oauth2Consent';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Data Provider Participant ID (Buffr as Data Provider)
const DATA_PROVIDER_ID = process.env.DATA_PROVIDER_PARTICIPANT_ID || 'API000001';

/**
 * POST /bon/v1/common/token
 * Exchange authorization code for tokens, or refresh access token
 */
async function handleToken(req: ExpoRequest) {
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
    
    const tppId = headerValidation.participantId!;
    
    // Verify TPP is registered and active
    const participants = await query<{ status: string; role: string }>(
      `SELECT status, role FROM participants WHERE participant_id = $1`,
      [tppId]
    );
    
    if (participants.length === 0 || participants[0].status !== 'Active') {
      return helpers.error(
        NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
        'TPP not found or not active',
        401
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
    
    const { grant_type, code, redirect_uri, client_id, code_verifier, refresh_token } = body;
    
    // Validate grant_type
    if (!grant_type || !['authorization_code', 'refresh_token'].includes(grant_type)) {
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_REQUEST,
        'grant_type must be "authorization_code" or "refresh_token"',
        400,
        [{
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_INVALID,
          Message: 'Invalid grant_type',
          Path: 'grant_type',
        }]
      );
    }
    
    // Handle authorization code grant
    if (grant_type === 'authorization_code') {
      if (!code || !redirect_uri || !client_id || !code_verifier) {
        return helpers.error(
          NamibianOpenBankingErrorCode.INVALID_REQUEST,
          'Missing required fields for authorization_code grant',
          400
        );
      }
      
      if (client_id !== tppId) {
        return helpers.error(
          NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
          'client_id must match ParticipantId header',
          401
        );
      }
      
      // Retrieve and validate authorization code
      const authCode = await retrieveAuthorizationCode(code, client_id, redirect_uri, code_verifier);
      
      if (!authCode) {
        return helpers.error(
          NamibianOpenBankingErrorCode.INVALID_GRANT,
          'Invalid or expired authorization code',
          400
        );
      }
      
      // Mark code as used
      await markAuthorizationCodeAsUsed(code);
      
      // Create consent
      const consentId = uuidv4();
      const scopes = authCode.scope.split(' ').filter(Boolean);
      const expirationDate = new Date(
        Date.now() + NAMIBIAN_OPEN_BANKING.MAX_CONSENT_DURATION_DAYS * 24 * 60 * 60 * 1000
      );
      
      await storeConsent(
        consentId,
        authCode.accountHolderId,
        DATA_PROVIDER_ID,
        tppId,
        scopes,
        expirationDate
      );
      
      // Create tokens
      const accessToken = createAccessToken(
        authCode.accountHolderId,
        DATA_PROVIDER_ID,
        tppId,
        authCode.scope,
        consentId,
        3600 // 1 hour
      );
      
      const refreshToken = createRefreshToken(
        authCode.accountHolderId,
        DATA_PROVIDER_ID,
        tppId,
        consentId,
        NAMIBIAN_OPEN_BANKING.MAX_CONSENT_DURATION_DAYS * 24 * 60 * 60 // 180 days
      );
      
      const responseTime = Date.now() - startTime;
      
      log.info('Access token issued', {
        consent_id: consentId,
        tpp_id: tppId,
        account_holder_id: authCode.accountHolderId,
        response_time_ms: responseTime,
      });
      
      return helpers.success(
        {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: refreshToken,
          scope: authCode.scope,
          consent_id: consentId,
        },
        200,
        {
          Self: '/bon/v1/common/token',
        },
        {
          request_time_ms: responseTime,
        }
      );
    }
    
    // Handle refresh token grant
    if (grant_type === 'refresh_token') {
      if (!refresh_token || !client_id) {
        return helpers.error(
          NamibianOpenBankingErrorCode.INVALID_REQUEST,
          'Missing required fields for refresh_token grant',
          400
        );
      }
      
      if (client_id !== tppId) {
        return helpers.error(
          NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
          'client_id must match ParticipantId header',
          401
        );
      }
      
      // Verify refresh token
      const tokenPayload = verifyRefreshToken(refresh_token);
      
      if (!tokenPayload) {
        return helpers.error(
          NamibianOpenBankingErrorCode.INVALID_GRANT,
          'Invalid or expired refresh token',
          400
        );
      }
      
      // Verify consent is still valid
      const consent = await getConsent(tokenPayload.consent_id);
      
      if (!consent || consent.status !== 'Authorised') {
        return helpers.error(
          NamibianOpenBankingErrorCode.CONSENT_INVALID,
          'Consent is invalid or revoked',
          400
        );
      }
      
      if (new Date(consent.expiration_date_time) < new Date()) {
        return helpers.error(
          NamibianOpenBankingErrorCode.CONSENT_EXPIRED,
          'Consent has expired',
          400
        );
      }
      
      // Create new access token
      const accessToken = createAccessToken(
        tokenPayload.sub,
        tokenPayload.iss,
        tokenPayload.aud,
        consent.permissions ? JSON.parse(consent.permissions).join(' ') : '',
        tokenPayload.consent_id,
        3600 // 1 hour
      );
      
      const responseTime = Date.now() - startTime;
      
      log.info('Access token refreshed', {
        consent_id: tokenPayload.consent_id,
        tpp_id: tppId,
        response_time_ms: responseTime,
      });
      
      return helpers.success(
        {
          access_token: accessToken,
          token_type: 'Bearer',
          expires_in: 3600,
          scope: consent.permissions ? JSON.parse(consent.permissions).join(' ') : '',
          consent_id: tokenPayload.consent_id,
        },
        200,
        {
          Self: '/bon/v1/common/token',
        },
        {
          request_time_ms: responseTime,
        }
      );
    }
    
    return helpers.error(
      NamibianOpenBankingErrorCode.INVALID_REQUEST,
      'Unsupported grant_type',
      400
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    log.error('Token endpoint error', {
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

export const POST = openBankingSecureRoute(handleToken, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false, // Token endpoint uses ParticipantId header for authentication
  forceOpenBanking: true,
});
