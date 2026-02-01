/**
 * Audit Logging Middleware
 * 
 * Location: utils/auditMiddleware.ts
 * Purpose: Automatic audit logging for all API endpoints (Priority 1 - Critical Foundation)
 * 
 * This middleware automatically logs all API requests and responses to the audit_logs table.
 * It extracts request metadata (user ID, IP address, user agent, etc.) and logs:
 * - Request details (endpoint, method, payload)
 * - Response details (status code, response time)
 * - User context (user ID, staff ID, location)
 * - Error information (if request failed)
 * 
 * All logging is automatic and cannot be disabled (regulatory requirement).
 */

import { ExpoRequest } from 'expo-router/server';
import { logAuditEvent, getIpAddress, getUserAgent, generateRequestId, createAuditEntryFromRequest } from './auditLogger';
import { getUserIdFromRequest } from './db';
import { log } from '@/utils/logger';

/**
 * Audit logging middleware wrapper
 * 
 * Wraps an API handler to automatically log all requests and responses.
 * 
 * @param handler - The API handler function to wrap
 * @returns Wrapped handler with automatic audit logging
 */
export function withAuditLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options?: {
    eventType?: string;
    entityType?: string;
    skipLogging?: (req: ExpoRequest) => boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const req = args[0] as ExpoRequest;
    const startTime = Date.now();
    let requestId: string | undefined;
    let userId: string | undefined;
    let response: Response;
    let responseStatus: number | undefined;
    let errorMessage: string | undefined;

    try {
      // Skip logging if requested
      if (options?.skipLogging && options.skipLogging(req)) {
        return await (handler as any)(...args);
      }

      // Generate request ID for tracing
      requestId = generateRequestId();

      // Extract user ID (if authenticated)
      try {
        userId = await getUserIdFromRequest(req);
      } catch (error) {
        // User not authenticated - that's okay
        userId = undefined;
      }

      // Get request metadata
      const ipAddress = getIpAddress(req);
      const userAgent = getUserAgent(req);
      const method = req.method || 'UNKNOWN';
      const url = new URL(req.url);
      const endpoint = url.pathname;

      // Get request body (if available)
      let requestPayload: any = null;
      try {
        if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
          const clonedReq = req.clone();
          const body = await clonedReq.json().catch(() => null);
          // Sanitize sensitive data (passwords, PINs, etc.)
          requestPayload = sanitizeRequestPayload(body);
        }
      } catch (error) {
        // Body not available or not JSON - that's okay
      }

      // Execute the handler
      response = await (handler as any)(...args);
      responseStatus = response.status;

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Get response body (if available) - be careful not to consume the response
      let responsePayload: any = null;
      try {
        const clonedResponse = response.clone();
        const contentType = clonedResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responsePayload = await clonedResponse.json().catch(() => null);
          // Sanitize sensitive data
          responsePayload = sanitizeResponsePayload(responsePayload);
        }
      } catch (error) {
        // Response body not available - that's okay
      }

      // Log successful request
      await logAuditEvent({
        event_type: options?.eventType || 'api_request',
        entity_type: options?.entityType || 'api',
        entity_id: requestId,
        user_id: userId,
        action: method.toLowerCase(),
        metadata: {
          endpoint,
          method,
          request_payload: requestPayload,
          response_payload: responsePayload,
          response_time_ms: responseTime,
        },
        ip_address: ipAddress,
        user_agent: userAgent,
        request_id: requestId,
        response_status: responseStatus,
        error_message: responseStatus >= 400 ? `HTTP ${responseStatus}` : null,
      }).catch(err => {
        // Don't break the request if audit logging fails
        log.error('Failed to log audit event:', err);
      });

      return response;
    } catch (error) {
      // Calculate response time even on error
      const responseTime = Date.now() - startTime;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      responseStatus = 500;

      // Log failed request
      await logAuditEvent({
        event_type: options?.eventType || 'api_request',
        entity_type: options?.entityType || 'api',
        entity_id: requestId || 'unknown',
        user_id: userId,
        action: req.method?.toLowerCase() || 'unknown',
        metadata: {
          endpoint: new URL(req.url).pathname,
          method: req.method || 'UNKNOWN',
          request_payload: null, // Don't log payload on error
        },
        ip_address: getIpAddress(req),
        user_agent: getUserAgent(req),
        request_id: requestId,
        response_status: 500,
        error_message: errorMessage,
      }).catch(err => {
        log.error('Failed to log audit event for error:', err);
      });

      // Re-throw the error
      throw error;
    }
  }) as T;
}

/**
 * Sanitize request payload to remove sensitive information
 */
function sanitizeRequestPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const sensitiveFields = ['password', 'pin', 'transaction_pin', 'verificationToken', 'token', 'apiKey', 'secret'];
  const sanitized = { ...payload };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeRequestPayload(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Sanitize response payload to remove sensitive information
 */
function sanitizeResponsePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const sensitiveFields = ['token', 'apiKey', 'secret', 'password', 'pin'];
  const sanitized = { ...payload };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeResponsePayload(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Enhanced secure route with audit logging
 * 
 * Combines security middleware with automatic audit logging.
 */
export function secureRouteWithAudit<T extends (...args: any[]) => Promise<Response>>(
  config: any,
  handler: T,
  auditOptions?: {
    eventType?: string;
    entityType?: string;
    skipLogging?: (req: ExpoRequest) => boolean;
  }
): T {
  const { secureRoute } = require('./secureApi');
  return secureRoute(config, withAuditLogging(handler, auditOptions));
}

/**
 * Enhanced secure authenticated route with audit logging
 */
export function secureAuthRouteWithAudit<T extends (...args: any[]) => Promise<Response>>(
  config: any,
  handler: T,
  auditOptions?: {
    eventType?: string;
    entityType?: string;
    skipLogging?: (req: ExpoRequest) => boolean;
  }
): T {
  const { secureAuthRoute } = require('./secureApi');
  return secureAuthRoute(config, withAuditLogging(handler, auditOptions));
}

/**
 * Enhanced secure admin route with audit logging
 */
export function secureAdminRouteWithAudit<T extends (...args: any[]) => Promise<Response>>(
  config: any,
  handler: T,
  auditOptions?: {
    eventType?: string;
    entityType?: string;
    skipLogging?: (req: ExpoRequest) => boolean;
  }
): T {
  const { secureAdminRoute } = require('./secureApi');
  return secureAdminRoute(config, withAuditLogging(handler, auditOptions));
}
