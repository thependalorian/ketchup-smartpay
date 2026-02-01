/**
 * Namibian Open Banking API: /bon/v1/common/par
 * 
 * Pushed Authorization Request (PAR) Endpoint
 * RFC 9126: OAuth 2.0 Pushed Authorization Requests
 * 
 * Purpose: TPP initiates consent flow by pushing authorization request
 * 
 * POST /bon/v1/common/par
 * Request Body:
 * {
 *   "Data": {
 *     "client_id": "API123456",
 *     "redirect_uri": "https://tpp-app.com/callback",
 *     "response_type": "code",
 *     "scope": "banking:accounts.basic.read banking:payments.write",
 *     "code_challenge": "...",
 *     "code_challenge_method": "S256",
 *     "state": "optional-state-value"
 *   }
 * }
 * 
 * Response:
 * {
 *   "Data": {
 *     "request_uri": "urn:ietf:params:oauth:request_uri:...",
 *     "expires_in": 600
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { NamibianOpenBankingErrorCode } from '@/utils/namibianOpenBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibianOpenBankingHeaders, validateParticipantId, NamibianConsentScope } from '@/utils/namibianOpenBanking';
import { storePAR, generateRequestURI } from '@/utils/oauth2Consent';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * POST /bon/v1/common/par
 * Create Pushed Authorization Request
 */
async function handlePAR(req: ExpoRequest) {
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
    
    if (participants.length === 0) {
      return helpers.error(
        NamibianOpenBankingErrorCode.PARTICIPANT_NOT_FOUND,
        'TPP not found or not registered',
        401
      );
    }
    
    const participant = participants[0];
    if (participant.status !== 'Active') {
      return helpers.error(
        NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
        `TPP status is ${participant.status}`,
        403
      );
    }
    
    if (participant.role !== 'TPP') {
      return helpers.error(
        NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
        'Only TPPs can create authorization requests',
        403
      );
    }
    
    // Parse request body
    const body = await req.json();
    const { Data } = body;
    
    if (!Data) {
      return helpers.error(
        NamibianOpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400,
        [{
          ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
          Message: 'The field Data is missing',
          Path: 'Data',
        }]
      );
    }
    
    const {
      client_id,
      redirect_uri,
      response_type,
      scope,
      code_challenge,
      code_challenge_method,
      state,
    } = Data;
    
    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];
    
    if (!client_id) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field client_id is missing',
        Path: 'Data.client_id',
      });
    } else if (!validateParticipantId(client_id)) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_INVALID,
        Message: 'Invalid client_id format. Expected APInnnnnn',
        Path: 'Data.client_id',
      });
    } else if (client_id !== tppId) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
        Message: 'client_id must match ParticipantId header',
        Path: 'Data.client_id',
      });
    }
    
    if (!redirect_uri) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field redirect_uri is missing',
        Path: 'Data.redirect_uri',
      });
    }
    
    if (response_type !== 'code') {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.UNSUPPORTED_RESPONSE_TYPE,
        Message: 'response_type must be "code"',
        Path: 'Data.response_type',
      });
    }
    
    if (!scope) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field scope is missing',
        Path: 'Data.scope',
      });
    } else {
      // Validate scopes
      const scopes = scope.split(' ').filter(Boolean);
      const validScopes = Object.values(NamibianConsentScope);
      const invalidScopes = scopes.filter(s => !validScopes.includes(s as NamibianConsentScope));
      
      if (invalidScopes.length > 0) {
        errors.push({
          ErrorCode: NamibianOpenBankingErrorCode.INVALID_SCOPE,
          Message: `Invalid scopes: ${invalidScopes.join(', ')}`,
          Path: 'Data.scope',
        });
      }
    }
    
    if (!code_challenge) {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_MISSING,
        Message: 'The field code_challenge is missing',
        Path: 'Data.code_challenge',
      });
    }
    
    if (code_challenge_method !== 'S256') {
      errors.push({
        ErrorCode: NamibianOpenBankingErrorCode.FIELD_INVALID,
        Message: 'code_challenge_method must be "S256"',
        Path: 'Data.code_challenge_method',
      });
    }
    
    if (errors.length > 0) {
      return helpers.error(
        NamibianOpenBankingErrorCode.INVALID_REQUEST,
        'One or more fields are invalid',
        400,
        errors
      );
    }
    
    // Generate request URI
    const requestUri = generateRequestURI();
    
    // Store PAR (expires in 10 minutes)
    await storePAR(
      requestUri,
      client_id!,
      redirect_uri!,
      code_challenge!,
      code_challenge_method || 'S256',
      scope!,
      600 // 10 minutes
    );
    
    const responseTime = Date.now() - startTime;
    
    log.info('PAR created', {
      request_uri: requestUri,
      client_id: client_id,
      response_time_ms: responseTime,
    });
    
    // Return PAR response
    return helpers.success(
      {
        request_uri: requestUri,
        expires_in: 600, // 10 minutes
      },
      201,
      {
        Self: '/bon/v1/common/par',
      },
      {
        request_time_ms: responseTime,
      }
    );
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    log.error('PAR creation error', {
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

export const POST = openBankingSecureRoute(handlePAR, {
  rateLimitConfig: RATE_LIMITS.api,
  requireAuth: false, // PAR endpoint is public (TPP authenticates via ParticipantId header)
  forceOpenBanking: true,
});
