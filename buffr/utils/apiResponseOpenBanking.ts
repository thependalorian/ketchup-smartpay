/**
 * Open Banking API Response Helpers
 * 
 * Location: utils/apiResponseOpenBanking.ts
 * Purpose: Open Banking-compliant API response utilities
 * 
 * This module extends the existing apiResponse.ts with Open Banking standards
 * while maintaining backward compatibility with existing endpoints.
 * 
 * Features:
 * - Open Banking error response format
 * - Open Banking pagination
 * - API versioning support
 * - Standardized response headers
 */

import { Response } from 'expo-router/server';
import {
  OpenBankingErrorCode,
  createOpenBankingErrorResponse,
  createErrorDetail,
  createOpenBankingPaginatedResponse,
  createOpenBankingSuccessResponse,
  createOpenBankingHeaders,
  parsePaginationParams,
  convertToOpenBankingError,
  createRateLimitHeaders,
  OpenBankingErrorResponse,
  OpenBankingSuccessResponse,
} from './openBanking';
import { HttpStatus } from './apiResponse';
import { generateRequestId } from './auditLogger';

/**
 * Open Banking Error Response
 * Returns Open Banking-compliant error format
 */
export function openBankingErrorResponse(
  code: OpenBankingErrorCode,
  message: string,
  status: number = HttpStatus.BAD_REQUEST,
  errors?: Array<{ ErrorCode: string; Message: string; Path?: string }>,
  requestId?: string
): Response {
  const errorResponse: OpenBankingErrorResponse = createOpenBankingErrorResponse(
    code,
    message,
    errors
  );

  const headers = createOpenBankingHeaders(requestId);

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers,
  });
}

/**
 * Open Banking Success Response
 * Returns Open Banking-compliant success format
 */
export function openBankingSuccessResponse<T>(
  data: T,
  status: number = HttpStatus.OK,
  links?: Record<string, string>,
  meta?: Record<string, any>,
  requestId?: string
): Response {
  const response: OpenBankingSuccessResponse<T> = createOpenBankingSuccessResponse(
    data,
    links,
    meta
  );

  const headers = createOpenBankingHeaders(requestId);

  return new Response(JSON.stringify(response), {
    status,
    headers,
  });
}

/**
 * Open Banking Paginated Response
 * Returns Open Banking-compliant paginated format
 */
export function openBankingPaginatedResponse<T>(
  data: T[],
  dataKey: string,
  baseUrl: string,
  page: number,
  pageSize: number,
  total: number,
  request: Request,
  queryParams?: Record<string, string>,
  firstAvailableDateTime?: string,
  lastAvailableDateTime?: string,
  requestId?: string
): Response {
  const paginatedData = createOpenBankingPaginatedResponse(
    data,
    dataKey,
    baseUrl,
    page,
    pageSize,
    total,
    queryParams,
    firstAvailableDateTime,
    lastAvailableDateTime
  );

  const headers = createOpenBankingHeaders(requestId);

  return new Response(JSON.stringify(paginatedData), {
    status: HttpStatus.OK,
    headers,
  });
}

/**
 * Open Banking Created Response (201)
 */
export function openBankingCreatedResponse<T>(
  data: T,
  location?: string,
  requestId?: string
): Response {
  const response: OpenBankingSuccessResponse<T> = createOpenBankingSuccessResponse(data);
  
  const headers: Record<string, string> = {
    ...createOpenBankingHeaders(requestId),
  };
  
  if (location) {
    headers['Location'] = location;
  }

  return new Response(JSON.stringify(response), {
    status: HttpStatus.CREATED,
    headers,
  });
}

/**
 * Open Banking No Content Response (204)
 */
export function openBankingNoContentResponse(requestId?: string): Response {
  const headers = createOpenBankingHeaders(requestId);
  
  return new Response(null, {
    status: HttpStatus.NO_CONTENT,
    headers,
  });
}

/**
 * Open Banking Rate Limit Response (429)
 */
export function openBankingRateLimitResponse(
  retryAfter: number,
  limit: number,
  remaining: number,
  resetTime: number,
  requestId?: string
): Response {
  const errorResponse: OpenBankingErrorResponse = createOpenBankingErrorResponse(
    OpenBankingErrorCode.RATE_LIMIT_EXCEEDED,
    'Too many requests. Please retry after the specified time.',
    [
      createErrorDetail(
        OpenBankingErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Retry after ${retryAfter} seconds.`
      ),
    ]
  );

  const headers = {
    ...createOpenBankingHeaders(requestId),
    'Retry-After': String(retryAfter),
    ...createRateLimitHeaders(limit, remaining, resetTime),
  };

  return new Response(JSON.stringify(errorResponse), {
    status: HttpStatus.TOO_MANY_REQUESTS,
    headers,
  });
}

/**
 * Hybrid Response Helper
 * Supports both legacy format and Open Banking format based on request
 * 
 * This allows gradual migration - endpoints can support both formats
 */
export function hybridResponse<T>(
  data: T,
  options: {
    status?: number;
    useOpenBanking?: boolean;
    requestId?: string;
    links?: Record<string, string>;
    meta?: Record<string, any>;
    legacyFormat?: { success: boolean; data: T; message?: string };
  } = {}
): Response {
  const {
    status = HttpStatus.OK,
    useOpenBanking = false,
    requestId = generateRequestId(),
    links,
    meta,
    legacyFormat,
  } = options;

  if (useOpenBanking) {
    return openBankingSuccessResponse(data, status, links, meta, requestId);
  }

  // Legacy format (backward compatibility)
  const response = legacyFormat || {
    success: true,
    data,
  };

  const headers = createOpenBankingHeaders(requestId);

  return new Response(JSON.stringify(response), {
    status,
    headers,
  });
}

/**
 * Hybrid Error Response Helper
 * Supports both legacy format and Open Banking format
 */
export function hybridErrorResponse(
  error: string | OpenBankingErrorCode,
  options: {
    status?: number;
    useOpenBanking?: boolean;
    requestId?: string;
    errors?: Array<{ ErrorCode: string; Message: string; Path?: string }>;
    legacyFormat?: { success: false; error: string };
  } = {}
): Response {
  const {
    status = HttpStatus.BAD_REQUEST,
    useOpenBanking = false,
    requestId = generateRequestId(),
    errors,
    legacyFormat,
  } = options;

  if (useOpenBanking) {
    const code = typeof error === 'string'
      ? convertToOpenBankingError(error, status).Code as OpenBankingErrorCode
      : error;
    const message = typeof error === 'string' ? error : 'An error occurred';
    
    return openBankingErrorResponse(code, message, status, errors, requestId);
  }

  // Legacy format (backward compatibility)
  const response = legacyFormat || {
    success: false,
    error: typeof error === 'string' ? error : 'An error occurred',
  };

  const headers = createOpenBankingHeaders(requestId);

  return new Response(JSON.stringify(response), {
    status,
    headers,
  });
}

/**
 * Check if request prefers Open Banking format
 * Checks for API version in path or Accept header
 */
export function prefersOpenBankingFormat(request: Request): boolean {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Check if path includes /v1/ or /v2/
  if (pathParts.includes('v1') || pathParts.includes('v2')) {
    return true;
  }
  
  // Check Accept header
  const acceptHeader = request.headers.get('Accept');
  if (acceptHeader?.includes('application/vnd.openbanking+json')) {
    return true;
  }
  
  // Check X-API-Version header
  const apiVersion = request.headers.get('X-API-Version');
  if (apiVersion === 'v1' || apiVersion === 'v2') {
    return true;
  }
  
  return false;
}

/**
 * Get API version from request
 */
export function getApiVersion(request: Request): string | null {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Check path for version
  for (const part of pathParts) {
    if (part.startsWith('v') && (part === 'v1' || part === 'v2')) {
      return part;
    }
  }
  
  // Check header
  const apiVersion = request.headers.get('X-API-Version');
  if (apiVersion === 'v1' || apiVersion === 'v2') {
    return apiVersion;
  }
  
  return null;
}
