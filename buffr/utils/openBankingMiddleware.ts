/**
 * Open Banking Middleware
 * 
 * Location: utils/openBankingMiddleware.ts
 * Purpose: Middleware to add Open Banking compliance to API routes
 * 
 * Features:
 * - API version detection
 * - Open Banking format detection
 * - Response transformation
 * - Request ID tracking
 * - Response time tracking
 */

import { ExpoRequest } from 'expo-router/server';
import {
  prefersOpenBankingFormat,
  getApiVersion,
  hybridResponse,
  hybridErrorResponse,
} from './apiResponseOpenBanking';
import { generateRequestId } from './auditLogger';

/**
 * Open Banking Middleware Options
 */
export interface OpenBankingMiddlewareOptions {
  /**
   * Force Open Banking format (ignore request preferences)
   */
  forceOpenBanking?: boolean;
  
  /**
   * API version to use (overrides detection)
   */
  apiVersion?: string;
  
  /**
   * Enable response time tracking
   */
  trackResponseTime?: boolean;
}

/**
 * Open Banking Request Context
 * Attached to request for use in handlers
 */
export interface OpenBankingContext {
  useOpenBanking: boolean;
  apiVersion: string | null;
  requestId: string;
  startTime: number;
}

/**
 * Add Open Banking context to request
 */
export function withOpenBankingContext<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options: OpenBankingMiddlewareOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const req = args[0] as ExpoRequest;
    const startTime = Date.now();
    
    // Generate request ID
    const requestId = generateRequestId();
    
    // Detect Open Banking format preference
    const useOpenBanking = options.forceOpenBanking ?? prefersOpenBankingFormat(req);
    
    // Get API version
    const apiVersion = options.apiVersion ?? getApiVersion(req) ?? null;
    
    // Attach context to request
    (req as any).openBanking = {
      useOpenBanking,
      apiVersion,
      requestId,
      startTime,
    } as OpenBankingContext;
    
    // Call handler
    const response = await handler(...args);
    
    // Add response time header if enabled
    if (options.trackResponseTime) {
      const responseTime = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${responseTime}ms`);
    }
    
    // Add request ID header
    response.headers.set('X-Request-ID', requestId);
    
    // Add API version header if available
    if (apiVersion) {
      response.headers.set('X-API-Version', apiVersion);
    }
    
    return response;
  }) as T;
}

/**
 * Get Open Banking context from request
 */
export function getOpenBankingContext(req: ExpoRequest): OpenBankingContext | null {
  return (req as any).openBanking || null;
}

/**
 * Open Banking-compatible secure route
 * Combines security middleware with Open Banking support
 */
export function openBankingSecureRoute<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options: OpenBankingMiddlewareOptions & {
    rateLimitConfig?: any;
    requireAuth?: boolean;
  } = {}
): T {
  const { rateLimitConfig, requireAuth, ...openBankingOptions } = options;
  
  // Apply Open Banking context
  let wrappedHandler = withOpenBankingContext(handler, openBankingOptions);
  
  // Apply security middleware if provided
  if (rateLimitConfig) {
    const { secureRoute, secureAuthRoute } = require('@/utils/secureApi');
    if (requireAuth) {
      wrappedHandler = secureAuthRoute(rateLimitConfig, wrappedHandler);
    } else {
      wrappedHandler = secureRoute(rateLimitConfig, wrappedHandler);
    }
  }
  
  return wrappedHandler;
}

/**
 * Helper to get response helpers based on Open Banking context
 */
export function getResponseHelpers(req: ExpoRequest) {
  const context = getOpenBankingContext(req);
  const useOpenBanking = context?.useOpenBanking ?? false;
  
  if (useOpenBanking) {
    const {
      openBankingSuccessResponse,
      openBankingErrorResponse,
      openBankingPaginatedResponse,
      openBankingCreatedResponse,
      openBankingNoContentResponse,
      OpenBankingErrorCode,
    } = require('./apiResponseOpenBanking');
    
    return {
      success: openBankingSuccessResponse,
      error: openBankingErrorResponse,
      paginated: openBankingPaginatedResponse,
      created: openBankingCreatedResponse,
      noContent: openBankingNoContentResponse,
      errorCode: OpenBankingErrorCode,
      requestId: context?.requestId,
    };
  } else {
    // Legacy format
    const {
      successResponse,
      errorResponse,
      paginatedResponse,
      createdResponse,
      noContentResponse,
      HttpStatus,
    } = require('./apiResponse');
    
    return {
      success: successResponse,
      error: errorResponse,
      paginated: paginatedResponse,
      created: createdResponse,
      noContent: noContentResponse,
      httpStatus: HttpStatus,
      requestId: context?.requestId,
    };
  }
}
