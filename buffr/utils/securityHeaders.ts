/**
 * Security Headers Utilities for Expo Router API Routes
 * 
 * Location: utils/securityHeaders.ts
 * Purpose: Add security headers to all API responses
 * 
 * Since Expo Router doesn't use Express middleware, we implement
 * security headers as a wrapper function that can be applied to route handlers.
 * 
 * Headers included:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - X-XSS-Protection
 * - Referrer-Policy
 * - Permissions-Policy
 */

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  'X-Content-Type-Options': 'nosniff',
  
  'X-Frame-Options': 'DENY',
  
  'X-XSS-Protection': '1; mode=block',
  
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
  ].join(', '),
  
  // Remove server information
  'X-Powered-By': '', // Empty value removes the header
} as const;

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Add all security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value === '') {
      // Remove header if value is empty
      headers.delete(key);
    } else {
      headers.set(key, value);
    }
  });
  
  // Return new response with security headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Security headers wrapper for Expo Router API route handlers
 * 
 * Usage:
 * ```typescript
 * export const POST = withSecurityHeaders(
 *   async (req: ExpoRequest) => {
 *     // Your route handler
 *   }
 * );
 * ```
 */
export function withSecurityHeaders<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const response = await (handler as any)(...args);
    return applySecurityHeaders(response);
  }) as T;
}

/**
 * Helper to create JSON response with security headers
 */
export function secureJsonResponse(
  data: any,
  statusOrOptions: number | { status: number } = 200
): Response {
  const status = typeof statusOrOptions === 'number' ? statusOrOptions : statusOrOptions.status;
  const response = new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return applySecurityHeaders(response);
}

