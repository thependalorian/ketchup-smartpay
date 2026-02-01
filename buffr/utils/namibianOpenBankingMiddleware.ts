/**
 * Namibian Open Banking Middleware
 * 
 * Location: utils/namibianOpenBankingMiddleware.ts
 * Purpose: Middleware for Namibian Open Banking Standards compliance
 * 
 * Features:
 * - Participant ID validation
 * - Namibian header validation
 * - Access token verification
 * - Consent scope validation
 * - Service level monitoring
 * - Response header injection
 */

import { NextRequest } from 'next/server';
import {
  validateNamibianOpenBankingHeaders,
  NamibianOpenBankingErrorCode,
  createNamibianErrorResponse,
} from './namibianOpenBanking';
import { verifyAccessToken, isConsentValid } from './oauth2Consent';
import { query } from './db';
import { log } from './logger';

/**
 * Namibian Open Banking Request Context
 */
export interface NamibianOpenBankingContext {
  participantId: string;
  apiVersion: string;
  accessToken?: string;
  tokenPayload?: any;
  accountHolderId?: string;
  consentId?: string;
  scopes?: string[];
  startTime: number;
}

/**
 * Validate Namibian Open Banking request
 */
export async function validateNamibianRequest(
  req: ExpoRequest,
  requiredScopes?: string[]
): Promise<{
  valid: boolean;
  context?: NamibianOpenBankingContext;
  error?: Response;
}> {
  const startTime = Date.now();
  
  // Validate headers
  const headerValidation = validateNamibianOpenBankingHeaders(req.headers);
  if (!headerValidation.valid) {
    return {
      valid: false,
      error: new Response(
        JSON.stringify({
          Code: NamibianOpenBankingErrorCode.INVALID_REQUEST,
          Id: crypto.randomUUID(),
          Message: 'Invalid request headers',
          Errors: headerValidation.errors.map(err => ({
            ErrorCode: NamibianOpenBankingErrorCode.FIELD_INVALID,
            Message: err,
            Path: 'Headers',
          })),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'x-v': headerValidation.apiVersion || '1',
          },
        }
      ),
    };
  }
  
  const participantId = headerValidation.participantId!;
  const apiVersion = headerValidation.apiVersion!;
  
  // Verify participant is registered and active
  const participants = await query<{ status: string; role: string }>(
    `SELECT status, role FROM participants WHERE participant_id = $1`,
    [participantId]
  );
  
  if (participants.length === 0) {
    return {
      valid: false,
      error: new Response(
        JSON.stringify({
          Code: NamibianOpenBankingErrorCode.PARTICIPANT_NOT_FOUND,
          Id: crypto.randomUUID(),
          Message: 'Participant not found or not registered',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'x-v': apiVersion,
            ParticipantId: participantId,
          },
        }
      ),
    };
  }
  
  if (participants[0].status !== 'Active') {
    return {
      valid: false,
      error: new Response(
        JSON.stringify({
          Code: NamibianOpenBankingErrorCode.PARTICIPANT_UNAUTHORIZED,
          Id: crypto.randomUUID(),
          Message: `Participant status is ${participants[0].status}`,
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'x-v': apiVersion,
            ParticipantId: participantId,
          },
        }
      ),
    };
  }
  
  // Verify access token if required
  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.replace('Bearer ', '');
  
  let tokenPayload: any = null;
  let accountHolderId: string | undefined;
  let consentId: string | undefined;
  let scopes: string[] = [];
  
  if (accessToken) {
    tokenPayload = verifyAccessToken(accessToken);
    
    if (tokenPayload) {
      accountHolderId = tokenPayload.sub;
      consentId = tokenPayload.consent_id;
      scopes = tokenPayload.scope.split(' ').filter(Boolean);
      
      // Verify consent is valid
      if (consentId) {
        const consentValid = await isConsentValid(consentId);
        if (!consentValid) {
          return {
            valid: false,
            error: new Response(
              JSON.stringify({
                Code: NamibianOpenBankingErrorCode.CONSENT_INVALID,
                Id: crypto.randomUUID(),
                Message: 'Consent is invalid, expired, or revoked',
              }),
              {
                status: 403,
                headers: {
                  'Content-Type': 'application/json',
                  'x-v': apiVersion,
                  ParticipantId: participantId,
                },
              }
            ),
          };
        }
      }
    }
  }
  
  // Validate required scopes
  if (requiredScopes && requiredScopes.length > 0) {
    if (!accessToken || !tokenPayload) {
      return {
        valid: false,
        error: new Response(
          JSON.stringify({
            Code: NamibianOpenBankingErrorCode.UNAUTHORIZED_CLIENT,
            Id: crypto.randomUUID(),
            Message: 'Authorization header with Bearer token is required',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'x-v': apiVersion,
              ParticipantId: participantId,
            },
          }
        ),
      };
    }
    
    const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));
    if (missingScopes.length > 0) {
      return {
        valid: false,
        error: new Response(
          JSON.stringify({
            Code: NamibianOpenBankingErrorCode.INVALID_SCOPE,
            Id: crypto.randomUUID(),
            Message: `Consent does not include required scopes: ${missingScopes.join(', ')}`,
            Errors: missingScopes.map(scope => ({
              ErrorCode: NamibianOpenBankingErrorCode.INVALID_SCOPE,
              Message: `Missing scope: ${scope}`,
              Path: 'Authorization',
            })),
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'x-v': apiVersion,
              ParticipantId: participantId,
            },
          }
        ),
      };
    }
  }
  
  return {
    valid: true,
    context: {
      participantId,
      apiVersion,
      accessToken,
      tokenPayload,
      accountHolderId,
      consentId,
      scopes,
      startTime,
    },
  };
}

/**
 * Add Namibian Open Banking response headers
 */
export function addNamibianResponseHeaders(
  response: Response,
  participantId: string,
  apiVersion: string,
  responseTime?: number
): Response {
  response.headers.set('ParticipantId', participantId);
  response.headers.set('x-v', apiVersion);
  response.headers.set('Content-Type', 'application/json');
  
  if (responseTime !== undefined) {
    response.headers.set('X-Response-Time', `${responseTime}ms`);
  }
  
  return response;
}

/**
 * Record service level metrics
 */
export async function recordServiceLevelMetric(
  endpoint: string,
  participantId: string,
  success: boolean,
  responseTime: number
): Promise<void> {
  try {
    // Record metric (aggregate hourly)
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
    const periodEnd = new Date(periodStart.getTime() + 60 * 60 * 1000); // 1 hour
    
    await query(
      `INSERT INTO service_level_metrics 
       (endpoint, participant_id, request_count, success_count, error_count, 
        total_response_time_ms, min_response_time_ms, max_response_time_ms, period_start, period_end)
       VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (endpoint, participant_id, period_start) 
       DO UPDATE SET
         request_count = service_level_metrics.request_count + 1,
         success_count = service_level_metrics.success_count + $3,
         error_count = service_level_metrics.error_count + $4,
         total_response_time_ms = service_level_metrics.total_response_time_ms + $5,
         min_response_time_ms = LEAST(service_level_metrics.min_response_time_ms, $6),
         max_response_time_ms = GREATEST(service_level_metrics.max_response_time_ms, $7)`,
      [
        endpoint,
        participantId,
        success ? 1 : 0,
        success ? 0 : 1,
        responseTime,
        responseTime,
        responseTime,
        periodStart,
        periodEnd,
      ]
    );
  } catch (error) {
    log.error('Failed to record service level metric', { error, endpoint, participantId });
    // Don't throw - metrics are non-critical
  }
}
