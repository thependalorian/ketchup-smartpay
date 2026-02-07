/**
 * OAuth 2.0 Service
 *
 * Location: backend/src/services/openbanking/OAuthService.ts
 * Purpose: OAuth 2.0 with PKCE implementation for Namibian Open Banking Standards v1.0
 *
 * Standards Compliance:
 * - RFC 7636: Proof Key for Code Exchange (PKCE)
 * - RFC 9126: OAuth 2.0 Pushed Authorization Requests (PAR)
 * - Section 9.5: Consent and Customer Authentication Standards
 */
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
import crypto from 'crypto';
export class OAuthService {
    /**
     * Create Pushed Authorization Request (PAR)
     * Section 9.5.1: Initiate Consent request
     */
    async createAuthorizationRequest(participantId, beneficiaryId, codeChallenge, codeChallengeMethod, scope, redirectUri, state, nonce) {
        try {
            // Generate unique request_uri
            const requestUri = `urn:ietf:params:oauth:request_uri:${crypto.randomBytes(32).toString('hex')}`;
            // Request expires in 10 minutes (600 seconds)
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            const expiresIn = 600;
            // Store authorization request
            await sql `
        INSERT INTO oauth_authorization_requests (
          request_uri, participant_id, beneficiary_id, code_challenge,
          code_challenge_method, scope, redirect_uri, state, nonce, expires_at
        )
        VALUES (
          ${requestUri}, ${participantId}, ${beneficiaryId}, ${codeChallenge},
          ${codeChallengeMethod}, ${scope}, ${redirectUri}, ${state || null}, 
          ${nonce || null}, ${expiresAt.toISOString()}
        )
      `;
            log('Authorization request created', { requestUri, participantId, beneficiaryId });
            return { requestUri, expiresIn };
        }
        catch (error) {
            logError('Failed to create authorization request', error);
            throw error;
        }
    }
    /**
     * Create Authorization Code (after user grants consent)
     * Section 9.5.1: Account Holder grants Consent
     */
    async createAuthorizationCode(requestUri, beneficiaryId) {
        try {
            // Get the authorization request
            const [request] = await sql `
        SELECT * FROM oauth_authorization_requests
        WHERE request_uri = ${requestUri}
        AND beneficiary_id = ${beneficiaryId}
        AND expires_at > NOW()
      `;
            if (!request) {
                throw new Error('Invalid or expired authorization request');
            }
            // Generate authorization code
            const code = crypto.randomBytes(32).toString('hex');
            // Code expires in 10 minutes per standards
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            // Store authorization code
            await sql `
        INSERT INTO oauth_authorization_codes (
          code, client_id, redirect_uri, code_challenge, code_challenge_method,
          scope, account_holder_id, expires_at
        )
        VALUES (
          ${code}, ${request.participant_id}, ${request.redirect_uri},
          ${request.code_challenge}, ${request.code_challenge_method},
          ${request.scope}, ${beneficiaryId}, ${expiresAt.toISOString()}
        )
      `;
            log('Authorization code created', { code: code.substring(0, 10) + '...', beneficiaryId });
            return code;
        }
        catch (error) {
            logError('Failed to create authorization code', error);
            throw error;
        }
    }
    /**
     * Exchange Authorization Code for Access Token
     * Section 9.5.1: Retrieve Access Token(s)
     */
    async exchangeCodeForToken(code, codeVerifier, participantId) {
        try {
            // Get and validate authorization code
            const [authCode] = await sql `
        SELECT * FROM oauth_authorization_codes
        WHERE code = ${code}
        AND client_id = ${participantId}
        AND expires_at > NOW()
        AND used = false
      `;
            if (!authCode) {
                throw new Error('Invalid or expired authorization code');
            }
            // Validate PKCE code challenge  
            const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
            if (hash !== authCode.code_challenge) {
                throw new Error('Invalid code verifier');
            }
            // Mark code as used
            await sql `
        UPDATE oauth_authorization_codes
        SET used = true, used_at = NOW()
        WHERE code = ${code}
      `;
            // Generate access token (15 minutes expiry)
            const accessToken = crypto.randomBytes(32).toString('hex');
            const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
            const accessExpiresIn = 900; // 15 minutes in seconds
            await sql `
        INSERT INTO oauth_access_tokens (
          access_token, participant_id, beneficiary_id, scope, expires_at
        )
        VALUES (
          ${accessToken}, ${participantId}, ${authCode.account_holder_id}, 
          ${authCode.scope}, ${accessExpiresAt.toISOString()}
        )
      `;
            // Generate refresh token (180 days max per standards)
            let refreshToken;
            const scopes = authCode.scope.split(' ');
            const isLongTermConsent = scopes.some((s) => s.includes('accounts') || s.includes('payments.read'));
            if (isLongTermConsent) {
                refreshToken = crypto.randomBytes(32).toString('hex');
                const refreshExpiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000); // 180 days
                await sql `
          INSERT INTO oauth_refresh_tokens (
            refresh_token, participant_id, beneficiary_id, scope, expires_at
          )
          VALUES (
            ${refreshToken}, ${participantId}, ${authCode.account_holder_id}, 
            ${authCode.scope}, ${refreshExpiresAt.toISOString()}
          )
        `;
            }
            // Audit trail
            await sql `
        INSERT INTO open_banking_consent_audit (
          beneficiary_id, participant_id, action, scope, duration_days
        )
        VALUES (
          ${authCode.account_holder_id}, ${participantId}, 'granted', 
          ${authCode.scope}, ${isLongTermConsent ? 180 : 0}
        )
      `;
            log('Tokens generated', { participantId, beneficiaryId: authCode.beneficiary_id });
            return {
                accessToken,
                tokenType: 'Bearer',
                expiresIn: accessExpiresIn,
                refreshToken,
                scope: authCode.scope,
            };
        }
        catch (error) {
            logError('Failed to exchange code for token', error);
            throw error;
        }
    }
    /**
     * Refresh Access Token using Refresh Token
     * Section 9.5.1: Token refresh flow
     */
    async refreshAccessToken(refreshToken, participantId) {
        try {
            // Validate refresh token
            const [token] = await sql `
        SELECT * FROM oauth_refresh_tokens
        WHERE refresh_token = ${refreshToken}
        AND participant_id = ${participantId}
        AND expires_at > NOW()
        AND revoked = false
      `;
            if (!token) {
                throw new Error('Invalid or expired refresh token');
            }
            // Update last used timestamp
            await sql `
        UPDATE oauth_refresh_tokens
        SET last_used = NOW()
        WHERE refresh_token = ${refreshToken}
      `;
            // Generate new access token
            const accessToken = crypto.randomBytes(32).toString('hex');
            const accessExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
            const accessExpiresIn = 900;
            await sql `
        INSERT INTO oauth_access_tokens (
          access_token, participant_id, beneficiary_id, scope, expires_at
        )
        VALUES (
          ${accessToken}, ${participantId}, ${token.beneficiary_id}, 
          ${token.scope}, ${accessExpiresAt.toISOString()}
        )
      `;
            // Audit trail
            await sql `
        INSERT INTO open_banking_consent_audit (
          beneficiary_id, participant_id, action, scope
        )
        VALUES (
          ${token.beneficiary_id}, ${participantId}, 'refreshed', ${token.scope}
        )
      `;
            log('Access token refreshed', { participantId });
            return {
                accessToken,
                tokenType: 'Bearer',
                expiresIn: accessExpiresIn,
                scope: token.scope,
            };
        }
        catch (error) {
            logError('Failed to refresh access token', error);
            throw error;
        }
    }
    /**
     * Validate Access Token
     * Used by API endpoints to verify requests
     */
    async validateAccessToken(accessToken) {
        try {
            const [token] = await sql `
        SELECT * FROM oauth_access_tokens
        WHERE access_token = ${accessToken}
        AND expires_at > NOW()
      `;
            if (!token) {
                return { valid: false };
            }
            return {
                valid: true,
                participantId: token.participant_id,
                beneficiaryId: token.beneficiary_id,
                scope: token.scope,
            };
        }
        catch (error) {
            logError('Failed to validate access token', error);
            return { valid: false };
        }
    }
    /**
     * Revoke Refresh Token
     * Section 9.5.1: Consent revocation
     */
    async revokeToken(token, reason) {
        try {
            const result = await sql `
        UPDATE oauth_refresh_tokens
        SET revoked = true, 
            revoked_at = NOW(),
            revoked_reason = ${reason}
        WHERE refresh_token = ${token}
        AND revoked = false
        RETURNING beneficiary_id, participant_id, scope
      `;
            if (result.length > 0) {
                const { beneficiary_id, participant_id, scope } = result[0];
                // Audit trail
                await sql `
          INSERT INTO open_banking_consent_audit (
            beneficiary_id, participant_id, action, scope, revocation_reason
          )
          VALUES (
            ${beneficiary_id}, ${participant_id}, 'revoked', ${scope}, ${reason}
          )
        `;
                log('Refresh token revoked', { reason });
            }
        }
        catch (error) {
            logError('Failed to revoke token', error);
            throw error;
        }
    }
    /**
     * Check if scope is authorized
     */
    checkScope(requiredScope, grantedScopes) {
        const granted = grantedScopes.split(' ');
        return granted.includes(requiredScope);
    }
    /**
     * Generate PKCE code verifier (for TPPs)
     * Helper method for testing/documentation
     */
    static generateCodeVerifier() {
        return crypto.randomBytes(32).toString('base64url');
    }
    /**
     * Generate PKCE code challenge (for TPPs)
     * Helper method for testing/documentation
     */
    static generateCodeChallenge(verifier) {
        return crypto.createHash('sha256').update(verifier).digest('base64url');
    }
}
//# sourceMappingURL=OAuthService.js.map