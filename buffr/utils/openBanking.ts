/**
 * Open Banking Standards Implementation
 * 
 * Location: utils/openBanking.ts
 * Purpose: Open Banking API standards compliance (PSD-12, Open Banking UK patterns)
 * 
 * Features:
 * - Open Banking error response format
 * - Standardized pagination (Open Banking pattern)
 * - API versioning support
 * - Request/Response metadata
 * - Compliance with Open Banking Customer Experience Guidelines
 * 
 * References:
 * - Open Banking UK API Specifications
 * - Open Banking Security Profile
 * - Open Banking Customer Experience Guidelines
 */

import { randomUUID } from 'crypto';
import { HttpStatus } from './apiResponse';

/**
 * Open Banking Error Codes
 * Following Open Banking UK error code patterns
 */
export enum OpenBankingErrorCode {
  // Field errors
  FIELD_MISSING = 'BUFFR.Field.Missing',
  FIELD_INVALID = 'BUFFR.Field.Invalid',
  FIELD_INVALID_FORMAT = 'BUFFR.Field.InvalidFormat',
  
  // Amount errors
  AMOUNT_INVALID = 'BUFFR.Amount.Invalid',
  AMOUNT_TOO_LARGE = 'BUFFR.Amount.TooLarge',
  AMOUNT_TOO_SMALL = 'BUFFR.Amount.TooSmall',
  
  // Account errors
  ACCOUNT_NOT_FOUND = 'BUFFR.Account.NotFound',
  ACCOUNT_INVALID = 'BUFFR.Account.Invalid',
  ACCOUNT_CLOSED = 'BUFFR.Account.Closed',
  
  // Payment errors
  PAYMENT_FAILED = 'BUFFR.Payment.Failed',
  PAYMENT_REJECTED = 'BUFFR.Payment.Rejected',
  INSUFFICIENT_FUNDS = 'BUFFR.Funds.Insufficient',
  PAYMENT_LIMIT_EXCEEDED = 'BUFFR.Payment.LimitExceeded',
  
  // Authentication errors
  UNAUTHORIZED = 'BUFFR.Auth.Unauthorized',
  TOKEN_INVALID = 'BUFFR.Auth.TokenInvalid',
  TOKEN_EXPIRED = 'BUFFR.Auth.TokenExpired',
  SCA_REQUIRED = 'BUFFR.Auth.SCARequired',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'BUFFR.Resource.NotFound',
  RESOURCE_CONFLICT = 'BUFFR.Resource.Conflict',
  
  // Server errors
  SERVER_ERROR = 'BUFFR.Server.Error',
  SERVICE_UNAVAILABLE = 'BUFFR.Server.Unavailable',
  TIMEOUT = 'BUFFR.Server.Timeout',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'BUFFR.RateLimit.Exceeded',
}

/**
 * Open Banking Error Detail
 */
export interface OpenBankingErrorDetail {
  ErrorCode: string;
  Message: string;
  Path?: string;
}

/**
 * Open Banking Error Response
 * Following Open Banking UK error response format
 */
export interface OpenBankingErrorResponse {
  Code: string;
  Id: string;
  Message: string;
  Errors?: OpenBankingErrorDetail[];
  timestamp?: string;
}

/**
 * Create Open Banking-compliant error response
 */
export function createOpenBankingErrorResponse(
  code: OpenBankingErrorCode,
  message: string,
  errors?: OpenBankingErrorDetail[]
): OpenBankingErrorResponse {
  return {
    Code: code,
    Id: randomUUID(),
    Message: message,
    Errors: errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create Open Banking error detail
 */
export function createErrorDetail(
  errorCode: string,
  message: string,
  path?: string
): OpenBankingErrorDetail {
  return {
    ErrorCode: errorCode,
    Message: message,
    ...(path && { Path: path }),
  };
}

/**
 * Open Banking Pagination Links
 */
export interface OpenBankingPaginationLinks {
  Self: string;
  First: string;
  Prev: string | null;
  Next: string | null;
  Last: string;
}

/**
 * Open Banking Pagination Meta
 */
export interface OpenBankingPaginationMeta {
  TotalPages: number;
  FirstAvailableDateTime?: string;
  LastAvailableDateTime?: string;
}

/**
 * Open Banking Paginated Response Structure
 */
export interface OpenBankingPaginatedResponse<T> {
  Data: {
    [key: string]: T[];
    Links: OpenBankingPaginationLinks;
    Meta: OpenBankingPaginationMeta;
  };
}

/**
 * Create Open Banking pagination links
 */
export function createPaginationLinks(
  baseUrl: string,
  page: number,
  pageSize: number,
  totalPages: number,
  queryParams?: Record<string, string>
): OpenBankingPaginationLinks {
  const params = new URLSearchParams({
    page: String(page),
    'page-size': String(pageSize),
    ...queryParams,
  });

  const basePath = `${baseUrl}?${params.toString()}`;
  
  // Update page number for different links
  const firstParams = new URLSearchParams(params);
  firstParams.set('page', '1');
  
  const lastParams = new URLSearchParams(params);
  lastParams.set('page', String(totalPages));
  
  const prevParams = new URLSearchParams(params);
  prevParams.set('page', String(Math.max(1, page - 1)));
  
  const nextParams = new URLSearchParams(params);
  nextParams.set('page', String(Math.min(totalPages, page + 1)));

  return {
    Self: `${baseUrl}?${params.toString()}`,
    First: `${baseUrl}?${firstParams.toString()}`,
    Prev: page > 1 ? `${baseUrl}?${prevParams.toString()}` : null,
    Next: page < totalPages ? `${baseUrl}?${nextParams.toString()}` : null,
    Last: `${baseUrl}?${lastParams.toString()}`,
  };
}

/**
 * Create Open Banking paginated response
 */
export function createOpenBankingPaginatedResponse<T>(
  data: T[],
  dataKey: string,
  baseUrl: string,
  page: number,
  pageSize: number,
  total: number,
  queryParams?: Record<string, string>,
  firstAvailableDateTime?: string,
  lastAvailableDateTime?: string
): OpenBankingPaginatedResponse<T> {
  const totalPages = Math.ceil(total / pageSize);
  
  const links = createPaginationLinks(
    baseUrl,
    page,
    pageSize,
    totalPages,
    queryParams
  );

  const meta: OpenBankingPaginationMeta = {
    TotalPages: totalPages,
    ...(firstAvailableDateTime && { FirstAvailableDateTime: firstAvailableDateTime }),
    ...(lastAvailableDateTime && { LastAvailableDateTime: lastAvailableDateTime }),
  };

  return {
    Data: {
      [dataKey]: data,
      Links: links,
      Meta: meta,
    },
  };
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(request: Request): {
  page: number;
  pageSize: number;
} {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('page-size') || '25', 10)));
  
  return { page, pageSize };
}

/**
 * API Versioning
 */
export const API_VERSION = {
  V1: 'v1',
  V2: 'v2',
} as const;

export type ApiVersion = typeof API_VERSION[keyof typeof API_VERSION];

/**
 * Extract API version from request path
 */
export function extractApiVersion(request: Request): ApiVersion | null {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  // Check if path starts with /api/v1 or /api/v2
  if (pathParts[0] === 'api' && pathParts[1] && pathParts[1].startsWith('v')) {
    const version = pathParts[1] as ApiVersion;
    if (version === API_VERSION.V1 || version === API_VERSION.V2) {
      return version;
    }
  }
  
  return null;
}

/**
 * Open Banking Response Headers
 */
export interface OpenBankingHeaders {
  'Content-Type': 'application/json';
  'X-Request-ID'?: string;
  'X-Response-Time'?: string;
  'X-API-Version'?: string;
}

/**
 * Create Open Banking response headers
 */
export function createOpenBankingHeaders(
  requestId?: string,
  responseTime?: number,
  apiVersion?: string
): OpenBankingHeaders {
  const headers: OpenBankingHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (requestId) {
    headers['X-Request-ID'] = requestId;
  }
  
  if (responseTime !== undefined) {
    headers['X-Response-Time'] = `${responseTime}ms`;
  }
  
  if (apiVersion) {
    headers['X-API-Version'] = apiVersion;
  }
  
  return headers;
}

/**
 * Open Banking Success Response Wrapper
 * Maintains backward compatibility while supporting Open Banking format
 */
export interface OpenBankingSuccessResponse<T> {
  Data: T;
  Links?: Record<string, string>;
  Meta?: Record<string, any>;
}

/**
 * Create Open Banking success response
 */
export function createOpenBankingSuccessResponse<T>(
  data: T,
  links?: Record<string, string>,
  meta?: Record<string, any>
): OpenBankingSuccessResponse<T> {
  return {
    Data: data,
    ...(links && { Links: links }),
    ...(meta && { Meta: meta }),
  };
}

/**
 * Convert legacy error to Open Banking format
 */
export function convertToOpenBankingError(
  error: string,
  statusCode: number
): OpenBankingErrorResponse {
  let code = OpenBankingErrorCode.SERVER_ERROR;
  
  // Map status codes to Open Banking error codes
  if (statusCode === HttpStatus.BAD_REQUEST) {
    code = OpenBankingErrorCode.FIELD_INVALID;
  } else if (statusCode === HttpStatus.UNAUTHORIZED) {
    code = OpenBankingErrorCode.UNAUTHORIZED;
  } else if (statusCode === HttpStatus.FORBIDDEN) {
    code = OpenBankingErrorCode.UNAUTHORIZED;
  } else if (statusCode === HttpStatus.NOT_FOUND) {
    code = OpenBankingErrorCode.RESOURCE_NOT_FOUND;
  } else if (statusCode === HttpStatus.UNPROCESSABLE_ENTITY) {
    code = OpenBankingErrorCode.FIELD_INVALID;
  } else if (statusCode === HttpStatus.TOO_MANY_REQUESTS) {
    code = OpenBankingErrorCode.RATE_LIMIT_EXCEEDED;
  }
  
  return createOpenBankingErrorResponse(code, error);
}

/**
 * Open Banking Rate Limit Headers
 */
export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
}

/**
 * Create rate limit headers
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): RateLimitHeaders {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(resetTime),
  };
}
