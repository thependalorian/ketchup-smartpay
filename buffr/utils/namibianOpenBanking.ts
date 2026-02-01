/**
 * Namibian Open Banking Standards Implementation
 * 
 * Location: utils/namibianOpenBanking.ts
 * Purpose: Compliance with Namibian Open Banking Standards v1.0
 * 
 * Standards Reference:
 * - Namibian Open Banking Standards v1.0 (25 April 2025)
 * - OAuth 2.0 with PKCE (RFC 7636)
 * - Pushed Authorization Requests (PAR - RFC 9126)
 * - TS 119 495 (Certificate Profile)
 * 
 * Features:
 * - Participant ID management (APInnnnnn format)
 * - OAuth 2.0 with PKCE consent flows
 * - Consent management (180-day max duration)
 * - Namibian URI structure (/bon/v1/banking/...)
 * - HTTP headers compliance (ParticipantId, x-v)
 * - Service level monitoring (99.9% availability, 300ms response time)
 */

import { randomBytes, createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Namibian Open Banking Constants
 */
export const NAMIBIAN_OPEN_BANKING = {
  SCHEME_IDENTIFIER: 'bon', // Bank of Namibia
  VERSION: 'v1',
  INDUSTRY: {
    BANKING: 'banking',
    COMMON: 'common',
  },
  MAX_CONSENT_DURATION_DAYS: 180,
  MAX_PAGE_SIZE: 1000,
  DEFAULT_PAGE_SIZE: 25,
  MAX_AUTOMATED_REQUESTS_PER_DAY: 4,
  AVAILABILITY_TARGET: 0.999, // 99.9%
  MEDIAN_RESPONSE_TIME_TARGET_MS: 300,
  AUTHORIZATION_CODE_LIFETIME_MINUTES: 10,
} as const;

/**
 * Participant ID Format
 * Format: APInnnnnn (API + 6-digit numeric code)
 */
export interface ParticipantId {
  prefix: 'API';
  numeric: string; // 6 digits
  full: string; // APInnnnnn
}

/**
 * Generate or validate Participant ID
 */
export function generateParticipantId(): ParticipantId {
  const numeric = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
  return {
    prefix: 'API',
    numeric,
    full: `API${numeric}`,
  };
}

/**
 * Validate Participant ID format
 */
export function validateParticipantId(id: string): boolean {
  const pattern = /^API\d{6}$/;
  return pattern.test(id);
}

/**
 * Parse Participant ID
 */
export function parseParticipantId(id: string): ParticipantId | null {
  if (!validateParticipantId(id)) {
    return null;
  }
  return {
    prefix: 'API',
    numeric: id.slice(3),
    full: id,
  };
}

/**
 * PKCE Code Challenge Generation
 * RFC 7636: Proof Key for Code Exchange by OAuth Public Clients
 */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

/**
 * Generate PKCE code verifier and challenge
 * Code verifier: 43-128 character URL-safe string
 * Code challenge: Base64URL(SHA256(code_verifier))
 */
export function generatePKCEChallenge(): PKCEChallenge {
  // Generate code verifier (43-128 characters, URL-safe)
  const codeVerifier = base64URLEncode(randomBytes(32));
  
  // Generate code challenge: Base64URL(SHA256(code_verifier))
  const hash = createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64URLEncode(hash);
  
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
  };
}

/**
 * Verify PKCE code challenge
 */
export function verifyPKCEChallenge(
  codeVerifier: string,
  codeChallenge: string,
  method: string = 'S256'
): boolean {
  if (method !== 'S256') {
    return false;
  }
  
  const hash = createHash('sha256').update(codeVerifier).digest();
  const expectedChallenge = base64URLEncode(hash);
  
  return expectedChallenge === codeChallenge;
}

/**
 * Base64URL encoding (RFC 4648)
 */
function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decoding
 */
function base64URLDecode(str: string): Buffer {
  // Add padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Consent Scopes (Namibian Open Banking)
 */
export enum NamibianConsentScope {
  ACCOUNTS_BASIC_READ = 'banking:accounts.basic.read',
  PAYMENTS_WRITE = 'banking:payments.write',
  PAYMENTS_READ = 'banking:payments.read',
  CONSENT_AUTHORIZATION_CODE_WRITE = 'consent:authorisationcode.write',
  CONSENT_AUTHORIZATION_TOKEN_WRITE = 'consent:authorisationtoken.write',
}

/**
 * Consent Status
 */
export enum ConsentStatus {
  AWAITING_AUTHORISATION = 'AwaitingAuthorisation',
  AUTHORISED = 'Authorised',
  REJECTED = 'Rejected',
  REVOKED = 'Revoked',
  EXPIRED = 'Expired',
}

/**
 * Consent Object (Namibian Open Banking)
 */
export interface NamibianConsent {
  ConsentId: string;
  Status: ConsentStatus;
  StatusUpdateDateTime: string;
  CreationDateTime: string;
  ExpirationDateTime: string;
  Permissions: NamibianConsentScope[];
  AccountHolderId: string;
  DataProviderId: string; // Participant ID of Data Provider
  TPPId: string; // Participant ID of TPP
  RequestedExpirationDateTime?: string;
  TransactionFromDateTime?: string;
  TransactionToDateTime?: string;
}

/**
 * Access Token (OAuth 2.0)
 */
export interface AccessToken {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds
  refresh_token?: string;
  scope: string; // space-separated scopes
  consent_id?: string;
}

/**
 * Refresh Token
 */
export interface RefreshToken {
  refresh_token: string;
  expires_in: number; // seconds
  consent_id: string;
}

/**
 * Pushed Authorization Request (PAR) - RFC 9126
 */
export interface PushedAuthorizationRequest {
  request_uri: string;
  expires_in: number; // seconds (typically 600 = 10 minutes)
}

/**
 * Authorization Request Parameters
 */
export interface AuthorizationRequestParams {
  client_id: string; // TPP Participant ID
  redirect_uri: string;
  response_type: 'code';
  scope: string; // space-separated scopes
  code_challenge: string;
  code_challenge_method: 'S256';
  state?: string;
  nonce?: string;
  request_uri?: string; // For PAR flow
}

/**
 * Authorization Response
 */
export interface AuthorizationResponse {
  code: string; // Authorization code (expires in 10 minutes)
  state?: string;
}

/**
 * Token Request (OAuth 2.0 Token Endpoint)
 */
export interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token';
  code?: string; // Authorization code
  redirect_uri: string;
  client_id: string; // TPP Participant ID
  code_verifier?: string; // For PKCE
  refresh_token?: string; // For refresh token grant
}

/**
 * Create Namibian Open Banking URI
 * Format: https://{provider}/bon/{version}/{industry}/{resource}?{query-parameters}
 */
export function createNamibianOpenBankingURI(
  provider: string,
  version: string,
  industry: string,
  resource: string,
  queryParams?: Record<string, string>
): string {
  let uri = `https://${provider}/bon/${version}/${industry}/${resource}`;
  
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams);
    uri += `?${params.toString()}`;
  }
  
  return uri;
}

/**
 * Parse Namibian Open Banking URI
 */
export function parseNamibianOpenBankingURI(uri: string): {
  provider: string;
  scheme: string;
  version: string;
  industry: string;
  resource: string;
  queryParams: Record<string, string>;
} | null {
  try {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected format: /bon/v1/banking/resource
    if (pathParts.length < 4 || pathParts[0] !== 'bon') {
      return null;
    }
    
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    return {
      provider: url.hostname,
      scheme: pathParts[0], // 'bon'
      version: pathParts[1], // 'v1'
      industry: pathParts[2], // 'banking' or 'common'
      resource: pathParts.slice(3).join('/'), // resource path
      queryParams,
    };
  } catch {
    return null;
  }
}

/**
 * Namibian Open Banking HTTP Headers
 */
export interface NamibianOpenBankingHeaders {
  'ParticipantId': string; // TPP or Data Provider Participant ID
  'x-v': string; // API version (e.g., '1')
  'Content-Type'?: 'application/json';
  'Accept'?: 'application/json';
  'Authorization'?: string; // Bearer token
}

/**
 * Create Namibian Open Banking request headers
 */
export function createNamibianOpenBankingHeaders(
  participantId: string,
  apiVersion: string = '1',
  accessToken?: string
): NamibianOpenBankingHeaders {
  const headers: NamibianOpenBankingHeaders = {
    ParticipantId: participantId,
    'x-v': apiVersion,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return headers;
}

/**
 * Validate Namibian Open Banking request headers
 */
export function validateNamibianOpenBankingHeaders(
  headers: Headers
): {
  valid: boolean;
  participantId?: string;
  apiVersion?: string;
  errors: string[];
} {
  const errors: string[] = [];
  const participantId = headers.get('ParticipantId');
  const apiVersion = headers.get('x-v');
  
  if (!participantId) {
    errors.push('ParticipantId header is required');
  } else if (!validateParticipantId(participantId)) {
    errors.push(`Invalid ParticipantId format: ${participantId}. Expected format: APInnnnnn`);
  }
  
  if (!apiVersion) {
    errors.push('x-v header is required');
  } else if (!/^\d+$/.test(apiVersion)) {
    errors.push(`Invalid x-v header format: ${apiVersion}. Expected positive integer`);
  }
  
  return {
    valid: errors.length === 0,
    participantId: participantId || undefined,
    apiVersion: apiVersion || undefined,
    errors,
  };
}

/**
 * Service Level Metrics
 */
export interface ServiceLevelMetrics {
  availability: number; // 0.0 to 1.0 (99.9% = 0.999)
  medianResponseTime: number; // milliseconds
  errorRate: number; // 0.0 to 1.0
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number; // milliseconds
}

/**
 * Check if service level targets are met
 */
export function checkServiceLevelTargets(metrics: ServiceLevelMetrics): {
  met: boolean;
  availabilityMet: boolean;
  responseTimeMet: boolean;
  details: {
    availability: { target: number; actual: number; met: boolean };
    responseTime: { target: number; actual: number; met: boolean };
  };
} {
  const availabilityMet = metrics.availability >= NAMIBIAN_OPEN_BANKING.AVAILABILITY_TARGET;
  const responseTimeMet = metrics.medianResponseTime <= NAMIBIAN_OPEN_BANKING.MEDIAN_RESPONSE_TIME_TARGET_MS;
  
  return {
    met: availabilityMet && responseTimeMet,
    availabilityMet,
    responseTimeMet,
    details: {
      availability: {
        target: NAMIBIAN_OPEN_BANKING.AVAILABILITY_TARGET,
        actual: metrics.availability,
        met: availabilityMet,
      },
      responseTime: {
        target: NAMIBIAN_OPEN_BANKING.MEDIAN_RESPONSE_TIME_TARGET_MS,
        actual: metrics.medianResponseTime,
        met: responseTimeMet,
      },
    },
  };
}

/**
 * Namibian Open Banking Error Codes
 * Following Namibian Open Banking Standards error code patterns
 */
export enum NamibianOpenBankingErrorCode {
  // Field errors
  FIELD_MISSING = 'NAM.Field.Missing',
  FIELD_INVALID = 'NAM.Field.Invalid',
  FIELD_INVALID_FORMAT = 'NAM.Field.InvalidFormat',
  
  // Participant errors
  PARTICIPANT_NOT_FOUND = 'NAM.Participant.NotFound',
  PARTICIPANT_INVALID = 'NAM.Participant.Invalid',
  PARTICIPANT_UNAUTHORIZED = 'NAM.Participant.Unauthorized',
  
  // Consent errors
  CONSENT_NOT_FOUND = 'NAM.Consent.NotFound',
  CONSENT_INVALID = 'NAM.Consent.Invalid',
  CONSENT_EXPIRED = 'NAM.Consent.Expired',
  CONSENT_REVOKED = 'NAM.Consent.Revoked',
  CONSENT_SCOPE_INVALID = 'NAM.Consent.ScopeInvalid',
  
  // OAuth errors
  INVALID_REQUEST = 'NAM.OAuth.InvalidRequest',
  UNAUTHORIZED_CLIENT = 'NAM.OAuth.UnauthorizedClient',
  ACCESS_DENIED = 'NAM.OAuth.AccessDenied',
  UNSUPPORTED_RESPONSE_TYPE = 'NAM.OAuth.UnsupportedResponseType',
  INVALID_SCOPE = 'NAM.OAuth.InvalidScope',
  SERVER_ERROR = 'NAM.OAuth.ServerError',
  TEMPORARILY_UNAVAILABLE = 'NAM.OAuth.TemporarilyUnavailable',
  INVALID_GRANT = 'NAM.OAuth.InvalidGrant',
  INVALID_CLIENT = 'NAM.OAuth.InvalidClient',
  
  // Account errors
  ACCOUNT_NOT_FOUND = 'NAM.Account.NotFound',
  ACCOUNT_INVALID = 'NAM.Account.Invalid',
  ACCOUNT_CLOSED = 'NAM.Account.Closed',
  
  // Payment errors
  PAYMENT_FAILED = 'NAM.Payment.Failed',
  PAYMENT_REJECTED = 'NAM.Payment.Rejected',
  INSUFFICIENT_FUNDS = 'NAM.Funds.Insufficient',
  
  // Server errors
  INTERNAL_ERROR = 'NAM.Server.Error',
  SERVICE_UNAVAILABLE = 'NAM.Server.Unavailable',
  TIMEOUT = 'NAM.Server.Timeout',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'NAM.RateLimit.Exceeded',
}

/**
 * Create Namibian Open Banking error response
 */
export function createNamibianErrorResponse(
  code: NamibianOpenBankingErrorCode,
  message: string,
  errors?: Array<{ ErrorCode: string; Message: string; Path?: string }>
): {
  Code: string;
  Id: string;
  Message: string;
  Errors?: Array<{ ErrorCode: string; Message: string; Path?: string }>;
} {
  return {
    Code: code,
    Id: uuidv4(),
    Message: message,
    ...(errors && { Errors: errors }),
  };
}

/**
 * Pagination Parameters (Namibian Standards)
 */
export interface NamibianPaginationParams {
  page: number; // 1-based
  pageSize: number; // 1-1000, default 25
}

/**
 * Parse pagination parameters from request
 */
export function parseNamibianPaginationParams(request: Request): NamibianPaginationParams {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    NAMIBIAN_OPEN_BANKING.MAX_PAGE_SIZE,
    Math.max(1, parseInt(url.searchParams.get('page-size') || String(NAMIBIAN_OPEN_BANKING.DEFAULT_PAGE_SIZE), 10))
  );
  
  return { page, pageSize };
}

/**
 * Pagination Response (Namibian Standards)
 */
export interface NamibianPaginationResponse {
  first: string | null; // URI to first page (null if this is first page)
  last: string | null; // URI to last page (null if this is last page)
  prev: string | null; // URI to previous page (null if this is first page)
  next: string | null; // URI to next page (null if this is last page)
}

/**
 * Pagination Meta (Namibian Standards)
 */
export interface NamibianPaginationMeta {
  totalRecords: number;
  totalPages: number;
}

/**
 * Create pagination links (Namibian Standards)
 */
export function createNamibianPaginationLinks(
  baseUrl: string,
  page: number,
  pageSize: number,
  totalPages: number,
  queryParams?: Record<string, string>
): NamibianPaginationResponse {
  const params = new URLSearchParams({
    'page-size': String(pageSize),
    ...queryParams,
  });
  
  const basePath = baseUrl.split('?')[0];
  
  return {
    first: page > 1 ? `${basePath}?${new URLSearchParams({ ...queryParams, page: '1', 'page-size': String(pageSize) }).toString()}` : null,
    last: page < totalPages ? `${basePath}?${new URLSearchParams({ ...queryParams, page: String(totalPages), 'page-size': String(pageSize) }).toString()}` : null,
    prev: page > 1 ? `${basePath}?${new URLSearchParams({ ...queryParams, page: String(page - 1), 'page-size': String(pageSize) }).toString()}` : null,
    next: page < totalPages ? `${basePath}?${new URLSearchParams({ ...queryParams, page: String(page + 1), 'page-size': String(pageSize) }).toString()}` : null,
  };
}

/**
 * Create pagination meta (Namibian Standards)
 */
export function createNamibianPaginationMeta(
  totalRecords: number,
  pageSize: number
): NamibianPaginationMeta {
  return {
    totalRecords,
    totalPages: totalRecords === 0 ? 0 : Math.ceil(totalRecords / pageSize),
  };
}
