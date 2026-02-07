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
/**
 * Middleware to authenticate Open Banking API requests using OAuth 2.0
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 * - ParticipantId: APInnnnnn
 * - x-v: 1 (API version)
 */
export declare function authenticateOpenBanking(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware to check if specific scope is authorized
 */
export declare function requireScope(requiredScope: string): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware to log API access (Section 10.1: Transaction Reporting)
 */
export declare function logAPIAccess(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=openBankingAuth.d.ts.map