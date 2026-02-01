/**
 * Secure API Utilities
 *
 * Location: utils/secureApi.ts
 * Purpose: Combined security middleware for all API routes
 *
 * Combines:
 * - Rate limiting (via rateLimiter.ts)
 * - Security headers (via securityHeaders.ts)
 * - Centralized error handling
 * - Standardized responses (via apiResponse.ts)
 *
 * Usage:
 * ```typescript
 * import { secureRoute, secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
 *
 * // Public endpoint with rate limiting
 * export const GET = secureRoute(RATE_LIMITS.api, async (req) => {
 *   return successResponse({ data: 'hello' });
 * });
 *
 * // Authenticated endpoint with user-based rate limiting
 * export const POST = secureAuthRoute(RATE_LIMITS.api, async (req) => {
 *   return successResponse({ data: 'hello' });
 * });
 * ```
 */

import { withRateLimit, withRateLimitAndAuth, RATE_LIMITS, RateLimitConfig } from './rateLimiter';
import { withSecurityHeaders } from './securityHeaders';
import { errorResponse, HttpStatus } from './apiResponse';
import { withAuditLogging } from './auditMiddleware';
import { log } from '@/utils/logger';
import { validateEnvironment } from './envValidation';

// Validate environment on first import (startup check)
// This runs once when the module is first loaded
let envValidated = false;
if (!envValidated) {
  try {
    validateEnvironment();
    envValidated = true;
  } catch (error: any) {
    // In production, fail fast
    if (process.env.NODE_ENV === 'production') {
      log.error('❌ Environment validation failed on startup:', error);
      throw error;
    } else {
      // In development, log warning but continue
      log.warn('⚠️  Environment validation warning (continuing in development):', error.message);
      envValidated = true; // Prevent repeated warnings
    }
  }
}

// Re-export rate limits for convenience
export { RATE_LIMITS, type RateLimitConfig };

/**
 * Secure route wrapper - combines rate limiting, security headers, and audit logging
 *
 * Use for public endpoints that don't require authentication
 * All requests are automatically logged to audit_logs table
 */
export function secureRoute<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  return withSecurityHeaders(withAuditLogging(withRateLimit(config, handler)));
}

/**
 * Secure authenticated route wrapper - combines user-based rate limiting, security headers, and audit logging
 *
 * Use for authenticated endpoints - extracts user ID for more accurate rate limiting
 * All requests are automatically logged to audit_logs table with user context
 */
export function secureAuthRoute<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  return withSecurityHeaders(withAuditLogging(withRateLimitAndAuth(config, handler)));
}

/**
 * Secure admin route wrapper - combines admin authentication, rate limiting, security headers, and audit logging
 *
 * Use for admin-only endpoints - requires admin role check
 * All requests are automatically logged to audit_logs table with admin user context
 */
export function secureAdminRoute<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  const adminHandler = (async (...args: Parameters<T>) => {
    const req = args[0] as any;
    const { checkAdminAuth } = await import('./adminAuth');
    
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      const { errorResponse, HttpStatus } = await import('./apiResponse');
      return errorResponse(authResult.error || 'Admin access required', HttpStatus.FORBIDDEN);
    }
    
    // Call original handler
    return await (handler as any)(...args);
  }) as T;
  
  return withSecurityHeaders(withAuditLogging(withRateLimitAndAuth(config, adminHandler), {
    eventType: 'admin_action',
    entityType: 'admin_api',
  }));
}

/**
 * Secure route with error handling - catches all errors and returns standardized responses
 */
export function secureRouteWithErrorHandling<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  const wrappedHandler = (async (...args: any[]) => {
    try {
      return await (handler as any)(...args);
    } catch (error) {
      log.error('[API Error]', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return errorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }) as T;

  return secureRoute(config, wrappedHandler);
}

/**
 * Secure authenticated route with error handling
 */
export function secureAuthRouteWithErrorHandling<T extends (...args: any[]) => Promise<Response>>(
  config: RateLimitConfig,
  handler: T
): T {
  const wrappedHandler = (async (...args: any[]) => {
    try {
      return await (handler as any)(...args);
    } catch (error) {
      log.error('[API Error]', error);
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return errorResponse(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }) as T;

  return secureAuthRoute(config, wrappedHandler);
}

/**
 * Quick secure wrapper with default API rate limit
 *
 * Convenience function for simple endpoints
 */
export function quickSecure<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return secureRoute(RATE_LIMITS.api, handler);
}

/**
 * Quick secure wrapper for authenticated endpoints with default API rate limit
 */
export function quickSecureAuth<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  return secureAuthRoute(RATE_LIMITS.api, handler);
}

/**
 * Middleware chain builder for complex routes
 *
 * Usage:
 * ```typescript
 * export const POST = middlewareChain()
 *   .rateLimit(RATE_LIMITS.payment)
 *   .securityHeaders()
 *   .handler(async (req) => { ... });
 * ```
 */
export function middlewareChain() {
  type Handler = (...args: any[]) => Promise<Response>;

  return {
    _config: null as RateLimitConfig | null,
    _useSecurityHeaders: false,
    _useAuth: false,

    rateLimit(config: RateLimitConfig) {
      this._config = config;
      return this;
    },

    securityHeaders() {
      this._useSecurityHeaders = true;
      return this;
    },

    withAuth() {
      this._useAuth = true;
      return this;
    },

    handler<T extends Handler>(handler: T): T {
      let wrapped: any = handler;

      if (this._config) {
        if (this._useAuth) {
          wrapped = withRateLimitAndAuth(this._config, wrapped);
        } else {
          wrapped = withRateLimit(this._config, wrapped);
        }
      }

      if (this._useSecurityHeaders) {
        wrapped = withSecurityHeaders(wrapped);
      }

      return wrapped;
    },
  };
}

export default {
  secureRoute,
  secureAuthRoute,
  secureRouteWithErrorHandling,
  secureAuthRouteWithErrorHandling,
  quickSecure,
  quickSecureAuth,
  middlewareChain,
  RATE_LIMITS,
};
