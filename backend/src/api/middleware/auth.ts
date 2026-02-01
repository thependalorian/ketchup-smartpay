/**
 * Authentication Middleware
 *
 * Location: backend/src/api/middleware/auth.ts
 * Purpose: Authentication and authorization middleware
 *
 * Enhancements (PRD): Device attestation and enhanced session security can be added:
 * - Validate device fingerprint / attestation header (X-Device-Id, X-Device-Signature)
 * - Bind session to device; reject if device changed without re-auth
 * - Optional: HSM-signed device certificate for POS/ATM
 */

import { Request, Response, NextFunction } from 'express';
import { log, logError } from '../../utils/logger';

// Accept any of: legacy API_KEY, Ketchup portal key, Government portal key (for shared routes)
const VALID_KEYS = [
  process.env.API_KEY,
  process.env.KETCHUP_SMARTPAY_API_KEY,
  process.env.KETCHUP_API_KEY,
  process.env.GOVERNMENT_API_KEY,
].filter(Boolean) as string[];

/**
 * Simple API key authentication middleware
 * In production, implement OAuth 2.0 PKCE
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers['x-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '');
  const apiKey = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

  if (VALID_KEYS.length === 0) {
    log('No API keys configured, skipping authentication');
    return next();
  }

  if (!apiKey || !VALID_KEYS.includes(apiKey)) {
    log('Authentication failed', { apiKey: apiKey ? 'provided' : 'missing' });
    res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid API key',
    });
    return;
  }

  next();
}

/**
 * Optional authentication (for public endpoints)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  // Set user context if authenticated, but don't require it
  next();
}

/**
 * Alias for authenticate - maintains backward compatibility
 */
export const authenticateAPIKey = authenticate;
