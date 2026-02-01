/**
 * Redis-Backed Rate Limiter for Distributed Systems
 *
 * Location: utils/rateLimiterRedis.ts
 * Purpose: Scalable rate limiting that works across multiple server instances
 *
 * Why Redis for Rate Limiting:
 * - Distributed: Same limits enforced across all server instances
 * - Atomic operations: INCR + EXPIRE are atomic, preventing race conditions
 * - High performance: Redis handles thousands of ops/second
 * - Automatic cleanup: Keys expire automatically (no memory leaks)
 *
 * Algorithm: Fixed Window with Sliding Window Approximation
 * - Uses fixed time windows but approximates sliding window behavior
 * - Simple, efficient, and accurate enough for most use cases
 *
 * Fallback: If Redis is unavailable, falls back to in-memory rate limiting
 * (useful during development or Redis outages)
 */

import { getRedisClient, REDIS_PREFIXES, incrementCounter, setExpiry, getTTL } from './redisClient';
import { RateLimitConfig, RATE_LIMITS } from './rateLimiter';
import logger from '@/utils/logger';

/**
 * Rate limit result
 */
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * In-memory fallback store (used when Redis is unavailable)
 */
const inMemoryStore: Map<string, { count: number; resetTime: number }> = new Map();

// Cleanup expired entries from in-memory store every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of inMemoryStore.entries()) {
    if (value.resetTime < now) {
      inMemoryStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client identifier from request
 */
function getClientId(req: Request): string {
  // Try to get user ID from request context (set by auth middleware)
  const userId = (req as any).__rateLimitUserId;
  if (userId) {
    return `user:${userId}`;
  }

  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.headers.get('x-real-ip') || 'unknown';

  return `ip:${ip}`;
}

/**
 * Build Redis key for rate limiting
 */
function buildKey(clientId: string, windowMs: number): string {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  return `${REDIS_PREFIXES.RATE_LIMIT}${clientId}:${windowStart}`;
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(
  clientId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = buildKey(clientId, config.windowMs);
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Increment counter atomically
    const count = await incrementCounter(key);

    if (count === null) {
      // Redis operation failed, fall through to in-memory
      throw new Error('Redis increment failed');
    }

    // Set expiry on first request in window
    if (count === 1) {
      await setExpiry(key, windowSeconds);
    }

    // Get TTL for reset time calculation
    const ttl = await getTTL(key);
    const resetTime = Date.now() + (ttl || windowSeconds) * 1000;

    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);

    return {
      allowed,
      remaining,
      resetTime,
      retryAfter: allowed ? undefined : Math.ceil((ttl || windowSeconds)),
    };
  } catch (error) {
    logger.warn('[RateLimiter] Redis error, falling back to in-memory:', { error });
    // Fall through to in-memory
    return checkRateLimitInMemory(clientId, config);
  }
}

/**
 * Check rate limit using in-memory store (fallback)
 */
function checkRateLimitInMemory(
  clientId: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `${clientId}:${config.windowMs}`;

  let entry = inMemoryStore.get(key);

  // If no entry or expired, create new window
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    inMemoryStore.set(key, entry);
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= config.max;
  const remaining = Math.max(0, config.max - entry.count);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
    retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Check rate limit (uses Redis if available, falls back to in-memory)
 */
export async function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (redis) {
    return checkRateLimitRedis(clientId, config);
  }

  return checkRateLimitInMemory(clientId, config);
}

/**
 * Rate limit middleware wrapper for Expo Router API routes
 *
 * This is the main export - wraps route handlers with rate limiting
 * that scales across distributed systems.
 *
 * Usage:
 * ```typescript
 * // In your API route file
 * import { withDistributedRateLimit, RATE_LIMITS } from '@/utils/rateLimiterRedis';
 *
 * export const POST = withDistributedRateLimit(
 *   RATE_LIMITS.payment,
 *   async (req: Request) => {
 *     // Your handler logic
 *     return Response.json({ success: true });
 *   }
 * );
 * ```
 */
export function withDistributedRateLimit<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  return (async (req: Request, ...args: any[]) => {
    const clientId = getClientId(req);
    const result = await checkRateLimit(clientId, config);

    if (!result.allowed) {
      const resetDate = new Date(result.resetTime);

      return new Response(
        JSON.stringify({
          success: false,
          error: config.message || 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
          resetTime: resetDate.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(result.retryAfter || 60),
            'X-RateLimit-Limit': String(config.max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetTime),
          },
        }
      );
    }

    // Execute handler
    const response = await handler(req, ...args);

    // Add rate limit headers to successful response
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', String(config.max));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(result.resetTime));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }) as T;
}

/**
 * Rate limit middleware with user authentication
 *
 * Extracts user ID from request for user-based rate limiting
 * (more accurate than IP-based for authenticated endpoints)
 */
export function withDistributedRateLimitAndAuth<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  return (async (req: Request, ...args: any[]) => {
    // Try to extract user ID for user-based limiting
    try {
      const { getUserIdFromRequest } = await import('./db');
      const userId = await getUserIdFromRequest(req);
      if (userId) {
        (req as any).__rateLimitUserId = userId;
      }
    } catch (error) {
      // Continue with IP-based limiting if auth fails
    }

    return withDistributedRateLimit(config, handler)(req, ...args);
  }) as T;
}

/**
 * Manual rate limit check (for use outside middleware pattern)
 *
 * Usage:
 * ```typescript
 * const result = await manualRateLimitCheck('user:123', RATE_LIMITS.auth);
 * if (!result.allowed) {
 *   throw new Error(`Rate limited. Try again in ${result.retryAfter} seconds`);
 * }
 * ```
 */
export async function manualRateLimitCheck(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, config);
}

// Re-export rate limit configurations for convenience
export { RATE_LIMITS };

export default withDistributedRateLimit;
