/**
 * Open Banking Authentication Middleware
 * 
 * Location: backend/src/api/middleware/openBankingAuth.ts
 * Purpose: OAuth 2.0 Bearer token validation for Open Banking APIs
 * 
 * Standards Compliance:
 * - RFC 6750: OAuth 2.0 Bearer Token Usage
 * - Section 9.4: Security Standards
 * - Section 9.1.5: HTTP Request Headers
 */

import { Request, Response, NextFunction } from 'express';
import { OAuthService } from '../../services/openbanking/OAuthService';
import { logError } from '../../utils/logger';

const oauthService = new OAuthService();

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Middleware to authenticate Open Banking API requests using OAuth 2.0
 * 
 * Required headers:
 * - Authorization: Bearer <access_token>
 * - ParticipantId: APInnnnnn
 * - x-v: 1 (API version)
 */
export async function authenticateOpenBanking(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract Bearer token
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({
        errors: [{
          code: 'invalid_token',
          title: 'Unauthorized',
          detail: 'Missing or invalid Authorization header. Expected: Bearer <token>',
        }],
      });
      return;
    }

    // Validate ParticipantId header (Section 9.1.5)
    const participantId = req.headers['participantid'] as string;
    if (!participantId) {
      res.status(400).json({
        errors: [{
          code: 'missing_participant_id',
          title: 'Bad Request',
          detail: 'Missing required header: ParticipantId',
        }],
      });
      return;
    }

    // Validate API version header (Section 9.1.5)
    const apiVersion = req.headers['x-v'] as string;
    if (!apiVersion) {
      res.status(400).json({
        errors: [{
          code: 'missing_version',
          title: 'Bad Request',
          detail: 'Missing required header: x-v',
        }],
      });
      return;
    }

    // Validate version number
    if (apiVersion !== '1') {
      res.status(406).json({
        errors: [{
          code: 'unsupported_version',
          title: 'Not Acceptable',
          detail: `API version ${apiVersion} is not supported. Current version: 1`,
        }],
      });
      return;
    }

    // Validate access token
    const validation = await oauthService.validateAccessToken(token);
    
    if (!validation.valid) {
      res.status(401).json({
        errors: [{
          code: 'invalid_token',
          title: 'Unauthorized',
          detail: 'Access token is invalid or expired',
        }],
      });
      return;
    }

    // Verify participant ID matches
    if (validation.participantId !== participantId) {
      res.status(403).json({
        errors: [{
          code: 'participant_mismatch',
          title: 'Forbidden',
          detail: 'ParticipantId does not match token owner',
        }],
      });
      return;
    }

    // Attach validated data to request
    (req as any).oauth = {
      participantId: validation.participantId,
      beneficiaryId: validation.beneficiaryId,
      scope: validation.scope,
    };

    // Set response header (Section 9.1.6)
    res.setHeader('x-v', apiVersion);

    next();
  } catch (error) {
    logError('Open Banking authentication failed', error);
    res.status(500).json({
      errors: [{
        code: 'internal_error',
        title: 'Internal Server Error',
        detail: 'Authentication service error',
      }],
    });
  }
}

/**
 * Middleware to check if specific scope is authorized
 */
export function requireScope(requiredScope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const oauth = (req as any).oauth;
    
    if (!oauth || !oauth.scope) {
      res.status(403).json({
        errors: [{
          code: 'insufficient_scope',
          title: 'Forbidden',
          detail: 'No scope information available',
        }],
      });
      return;
    }

    const scopes = oauth.scope.split(' ');
    if (!scopes.includes(requiredScope)) {
      res.status(403).json({
        errors: [{
          code: 'insufficient_scope',
          title: 'Forbidden',
          detail: `Required scope not granted: ${requiredScope}`,
        }],
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to log API access (Section 10.1: Transaction Reporting)
 */
export async function logAPIAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  
  // Store original send function
  const originalSend = res.send;
  
  // Override send to capture response
  res.send = function(data: any): Response {
    const responseTime = Date.now() - startTime;
    const oauth = (req as any).oauth;
    
    // Log to database asynchronously
    import('../../database/connection').then(({ sql }) => {
      sql`
        INSERT INTO open_banking_api_logs (
          participant_id, beneficiary_id, endpoint, http_method,
          http_status, response_time_ms, ip_address, user_agent
        )
        VALUES (
          ${oauth?.participantId || null},
          ${oauth?.beneficiaryId || null},
          ${req.path},
          ${req.method},
          ${res.statusCode},
          ${responseTime},
          ${req.ip || null},
          ${req.get('user-agent') || null}
        )
      `.catch(err => logError('Failed to log API access', err));
    });
    
    return originalSend.call(this, data);
  };
  
  next();
}
