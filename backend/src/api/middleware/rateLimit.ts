/**
 * Rate Limiting Middleware
 * 
 * Location: backend/src/api/middleware/rateLimit.ts
 * Purpose: Rate limiting to prevent abuse
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '../../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * In production, use Redis for distributed rate limiting
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const forwarded = req.headers['x-forwarded-for'];
    const key =
      req.ip ||
      (Array.isArray(forwarded) ? forwarded[0] : forwarded) ||
      'unknown';
    const now = Date.now();

    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    // Get or create rate limit entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    // Check if limit exceeded
    if (store[key].count >= maxRequests) {
      log('Rate limit exceeded', { key, count: store[key].count, maxRequests });
      res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
      return;
    }

    // Increment count
    store[key].count++;
    next();
  };
}
