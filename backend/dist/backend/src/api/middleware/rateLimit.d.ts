/**
 * Rate Limiting Middleware
 *
 * Location: backend/src/api/middleware/rateLimit.ts
 * Purpose: Rate limiting to prevent abuse
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Simple in-memory rate limiter
 * In production, use Redis for distributed rate limiting
 */
export declare function rateLimit(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rateLimit.d.ts.map