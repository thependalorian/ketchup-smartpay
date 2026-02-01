/**
 * OAuth 2.0 Consent Management
 * 
 * Location: utils/oauth2Consent.ts
 * Purpose: OAuth 2.0 with PKCE consent management for Namibian Open Banking
 * 
 * Standards:
 * - OAuth 2.0 (RFC 6749)
 * - PKCE (RFC 7636)
 * - PAR - Pushed Authorization Requests (RFC 9126)
 * - Namibian Open Banking Standards v1.0
 * 
 * Features:
 * - Authorization code flow with PKCE
 * - Pushed Authorization Requests (PAR)
 * - Access token and refresh token management
 * - Consent lifecycle management (180-day max duration)
 * - Token revocation
 */

import { query } from './db';
import { generatePKCEChallenge, verifyPKCEChallenge, NamibianConsentScope, ConsentStatus } from './namibianOpenBanking';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { sign, verify } from 'jsonwebtoken';

/**
 * Authorization Code
 */
export interface AuthorizationCode {
  code: string;
  clientId: string; // TPP Participant ID
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scope: string;
  accountHolderId: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Access Token Payload
 */
export interface AccessTokenPayload {
  sub: string; // Account Holder ID
  iss: string; // Data Provider Participant ID
  aud: string; // TPP Participant ID
  exp: number;
  iat: number;
  scope: string;
  consent_id: string;
  token_type: 'access';
}

/**
 * Refresh Token Payload
 */
export interface RefreshTokenPayload {
  sub: string; // Account Holder ID
  iss: string; // Data Provider Participant ID
  aud: string; // TPP Participant ID
  exp: number;
  iat: number;
  consent_id: string;
  token_type: 'refresh';
}

/**
 * Store authorization code in database
 */
export async function storeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  scope: string,
  accountHolderId: string,
  expiresInMinutes: number = 10
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  
  await query(
    `INSERT INTO oauth_authorization_codes (
      code, client_id, redirect_uri, code_challenge, code_challenge_method,
      scope, account_holder_id, expires_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [code, clientId, redirectUri, codeChallenge, codeChallengeMethod, scope, accountHolderId, expiresAt]
  );
}

/**
 * Retrieve and validate authorization code
 */
export async function retrieveAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string
): Promise<AuthorizationCode | null> {
  const results = await query<{
    code: string;
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    scope: string;
    account_holder_id: string;
    expires_at: Date;
    created_at: Date;
  }>(
    `SELECT * FROM oauth_authorization_codes 
     WHERE code = $1 AND client_id = $2 AND redirect_uri = $3 
     AND expires_at > NOW() AND used = false`,
    [code, clientId, redirectUri]
  );
  
  if (results.length === 0) {
    return null;
  }
  
  const authCode = results[0];
  
  // Verify PKCE code challenge
  if (!verifyPKCEChallenge(codeVerifier, authCode.code_challenge, authCode.code_challenge_method)) {
    return null;
  }
  
  return {
    code: authCode.code,
    clientId: authCode.client_id,
    redirectUri: authCode.redirect_uri,
    codeChallenge: authCode.code_challenge,
    codeChallengeMethod: authCode.code_challenge_method as 'S256',
    scope: authCode.scope,
    accountHolderId: authCode.account_holder_id,
    expiresAt: authCode.expires_at,
    createdAt: authCode.created_at,
  };
}

/**
 * Mark authorization code as used
 */
export async function markAuthorizationCodeAsUsed(code: string): Promise<void> {
  await query(
    `UPDATE oauth_authorization_codes SET used = true, used_at = NOW() WHERE code = $1`,
    [code]
  );
}

/**
 * Generate authorization code
 */
export function generateAuthorizationCode(): string {
  // Generate a secure random code (43-128 characters, URL-safe)
  return base64URLEncode(randomBytes(32));
}

/**
 * Base64URL encoding
 */
function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Create access token
 */
export function createAccessToken(
  accountHolderId: string,
  dataProviderId: string,
  tppId: string,
  scope: string,
  consentId: string,
  expiresInSeconds: number = 3600 // 1 hour default
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: accountHolderId,
    iss: dataProviderId,
    aud: tppId,
    exp: now + expiresInSeconds,
    iat: now,
    scope,
    consent_id: consentId,
    token_type: 'access',
  };
  
  return sign(payload, process.env.JWT_SECRET || 'secret', {
    algorithm: 'HS256',
  });
}

/**
 * Create refresh token
 */
export function createRefreshToken(
  accountHolderId: string,
  dataProviderId: string,
  tppId: string,
  consentId: string,
  expiresInSeconds: number = 15552000 // 180 days in seconds
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: RefreshTokenPayload = {
    sub: accountHolderId,
    iss: dataProviderId,
    aud: tppId,
    exp: now + expiresInSeconds,
    iat: now,
    consent_id: consentId,
    token_type: 'refresh',
  };
  
  return sign(payload, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
    algorithm: 'HS256',
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = verify(token, process.env.JWT_SECRET || 'secret', {
      algorithms: ['HS256'],
    }) as AccessTokenPayload;
    
    if (payload.token_type !== 'access') {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const payload = verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret', {
      algorithms: ['HS256'],
    }) as RefreshTokenPayload;
    
    if (payload.token_type !== 'refresh') {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Store consent in database
 */
export async function storeConsent(
  consentId: string,
  accountHolderId: string,
  dataProviderId: string,
  tppId: string,
  permissions: string[],
  expirationDateTime: Date
): Promise<void> {
  await query(
    `INSERT INTO oauth_consents (
      consent_id, account_holder_id, data_provider_id, tpp_id,
      permissions, status, expiration_date_time, created_at, status_update_date_time
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [
      consentId,
      accountHolderId,
      dataProviderId,
      tppId,
      JSON.stringify(permissions),
      ConsentStatus.AUTHORISED,
      expirationDateTime,
    ]
  );
}

/**
 * Get consent by ID
 */
export async function getConsent(consentId: string): Promise<{
  consent_id: string;
  account_holder_id: string;
  data_provider_id: string;
  tpp_id: string;
  permissions: string;
  status: string;
  expiration_date_time: Date;
  created_at: Date;
  status_update_date_time: Date;
} | null> {
  const results = await query<{
    consent_id: string;
    account_holder_id: string;
    data_provider_id: string;
    tpp_id: string;
    permissions: string;
    status: string;
    expiration_date_time: Date;
    created_at: Date;
    status_update_date_time: Date;
  }>(
    `SELECT * FROM oauth_consents WHERE consent_id = $1`,
    [consentId]
  );
  
  return results.length > 0 ? results[0] : null;
}

/**
 * Revoke consent
 */
export async function revokeConsent(consentId: string): Promise<void> {
  await query(
    `UPDATE oauth_consents 
     SET status = $1, status_update_date_time = NOW() 
     WHERE consent_id = $2`,
    [ConsentStatus.REVOKED, consentId]
  );
}

/**
 * Check if consent is valid
 */
export async function isConsentValid(consentId: string): Promise<boolean> {
  const consent = await getConsent(consentId);
  
  if (!consent) {
    return false;
  }
  
  if (consent.status !== ConsentStatus.AUTHORISED) {
    return false;
  }
  
  if (new Date(consent.expiration_date_time) < new Date()) {
    // Mark as expired
    await query(
      `UPDATE oauth_consents 
       SET status = $1, status_update_date_time = NOW() 
       WHERE consent_id = $2`,
      [ConsentStatus.EXPIRED, consentId]
    );
    return false;
  }
  
  return true;
}

/**
 * Store Pushed Authorization Request (PAR)
 */
export async function storePAR(
  requestUri: string,
  clientId: string,
  redirectUri: string,
  codeChallenge: string,
  codeChallengeMethod: string,
  scope: string,
  expiresInSeconds: number = 600 // 10 minutes default
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  
  await query(
    `INSERT INTO oauth_par_requests (
      request_uri, client_id, redirect_uri, code_challenge, code_challenge_method,
      scope, expires_at, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
    [requestUri, clientId, redirectUri, codeChallenge, codeChallengeMethod, scope, expiresAt]
  );
}

/**
 * Retrieve PAR
 */
export async function retrievePAR(requestUri: string): Promise<{
  request_uri: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  scope: string;
  expires_at: Date;
} | null> {
  const results = await query<{
    request_uri: string;
    client_id: string;
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: string;
    scope: string;
    expires_at: Date;
  }>(
    `SELECT * FROM oauth_par_requests 
     WHERE request_uri = $1 AND expires_at > NOW() AND used = false`,
    [requestUri]
  );
  
  return results.length > 0 ? results[0] : null;
}

/**
 * Mark PAR as used
 */
export async function markPARAsUsed(requestUri: string): Promise<void> {
  await query(
    `UPDATE oauth_par_requests SET used = true, used_at = NOW() WHERE request_uri = $1`,
    [requestUri]
  );
}

/**
 * Generate request URI for PAR
 */
export function generateRequestURI(): string {
  // Generate a unique request URI (typically urn:ietf:params:oauth:request_uri:...)
  const randomId = base64URLEncode(randomBytes(16));
  return `urn:ietf:params:oauth:request_uri:${randomId}`;
}
