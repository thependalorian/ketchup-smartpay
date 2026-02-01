/**
 * Rate Limiting Utilities for Expo Router API Routes
 * 
 * Location: utils/rateLimiter.ts
 * Purpose: Protect API endpoints from abuse and DoS attacks
 * 
 * Since Expo Router doesn't use Express middleware, we implement
 * rate limiting as a wrapper function that can be applied to route handlers.
 * 
 * Features:
 * - In-memory rate limiting (can be extended to Redis for distributed systems)
 * - Different limits for different endpoint types
 * - IP-based and user-based rate limiting
 * - Automatic cleanup of expired entries
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// In production with multiple instances, use Redis or similar distributed store
const rateLimitStore: RateLimitStore = {};

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 * Uses IP address or user ID if authenticated
 */
function getClientId(req: any): string {
  // Try to get user ID from authenticated request
  // This will be set by the rate limit wrapper after auth check
  const userId = (req as any).__rateLimitUserId;
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             req.headers.get('x-real-ip') || 
             'unknown';
  return `ip:${ip}`;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  max: number;          // Maximum requests per window
  message?: string;     // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // General API endpoints: 100 requests per 15 minutes
  api: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests. Please try again later.',
  },
  
  // Authentication endpoints: 5 requests per 15 minutes (prevent brute force)
  auth: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  
  // Payment endpoints: 20 requests per 15 minutes (prevent abuse)
  payment: {
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many payment requests. Please try again later.',
  },
  
  // Admin endpoints: 50 requests per 15 minutes
  admin: {
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many admin requests. Please try again later.',
  },
  
  // Compliance endpoints: 30 requests per 15 minutes
  compliance: {
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many compliance requests. Please try again later.',
  },
} as const;

/**
 * Check if request exceeds rate limit
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}`;
  
  const entry = rateLimitStore[key];
  
  // If no entry or expired, create new entry
  if (!entry || entry.resetTime < now) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: now + config.windowMs,
    };
  }
  
  // Increment count
  entry.count++;
  
  // Check if limit exceeded
  if (entry.count > config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit wrapper for Expo Router API route handlers
 * 
 * Usage:
 * ```typescript
 * export const POST = withRateLimit(
 *   RATE_LIMITS.payment,
 *   async (req: ExpoRequest) => {
 *     // Your route handler
 *   }
 * );
 * ```
 */
export function withRateLimit<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  return (async (req: any, ...args: any[]) => {
    // Get client identifier
    const clientId = getClientId(req);
    
    // Check rate limit
    const { allowed, remaining, resetTime } = checkRateLimit(clientId, config);
    
    if (!allowed) {
      const resetDate = new Date(resetTime);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      // Check if Open Banking format is preferred
      const useOpenBanking = (req as any).openBanking?.useOpenBanking ?? false;
      
      if (useOpenBanking) {
        const { openBankingRateLimitResponse } = require('./apiResponseOpenBanking');
        const resetTimeSeconds = Math.floor(resetTime / 1000);
        return openBankingRateLimitResponse(
          retryAfter,
          config.max,
          remaining,
          resetTimeSeconds,
          (req as any).openBanking?.requestId
        );
      }
      
      // Legacy format
      return new Response(
        JSON.stringify({
          success: false,
          error: config.message || 'Too many requests',
          retryAfter,
          resetTime: resetDate.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.max),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
          },
        }
      );
    }
    
    // Add rate limit headers to response
    const originalHandler = handler as any;
    const response = await originalHandler(req, ...args);
    
    // Clone response to add headers
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(config.max));
    headers.set('X-RateLimit-Remaining', String(remaining));
    headers.set('X-RateLimit-Reset', String(resetTime));
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }) as T;
}

/**
 * Rate limit wrapper that also extracts user ID for user-based limiting
 * 
 * Usage:
 * ```typescript
 * export const POST = withRateLimitAndAuth(
 *   RATE_LIMITS.payment,
 *   async (req: ExpoRequest) => {
 *     const userId = await getUserIdFromRequest(req);
 *     // Your route handler
 *   }
 * );
 * ```
 */
export function withRateLimitAndAuth<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  return (async (req: any, ...args: any[]) => {
    // Try to get user ID for user-based rate limiting
    try {
      const { getUserIdFromRequest } = await import('./db');
      const userId = await getUserIdFromRequest(req);
      if (userId) {
        (req as any).__rateLimitUserId = userId;
      }
    } catch (error) {
      // If auth fails, continue with IP-based limiting
    }
    
    // Apply rate limiting
    return withRateLimit(config, handler)(req, ...args);
  }) as T;
}

/**
 * Helper to create rate-limited JSON response
 */
export function rateLimitedResponse(
  message: string,
  retryAfter: number,
  resetTime: number
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      retryAfter,
      resetTime: new Date(resetTime).toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

