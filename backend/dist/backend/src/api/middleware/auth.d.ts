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
/**
 * Simple API key authentication middleware
 * In production, implement OAuth 2.0 PKCE
 */
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
/**
 * Optional authentication (for public endpoints)
 */
export declare function optionalAuth(req: Request, res: Response, next: NextFunction): void;
/**
 * Alias for authenticate - maintains backward compatibility
 */
export declare const authenticateAPIKey: typeof authenticate;
//# sourceMappingURL=auth.d.ts.map