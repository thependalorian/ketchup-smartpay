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
export declare class OAuthService {
    /**
     * Create Pushed Authorization Request (PAR)
     * Section 9.5.1: Initiate Consent request
     */
    createAuthorizationRequest(participantId: string, beneficiaryId: string, codeChallenge: string, codeChallengeMethod: string, scope: string, redirectUri: string, state?: string, nonce?: string): Promise<{
        requestUri: string;
        expiresIn: number;
    }>;
    /**
     * Create Authorization Code (after user grants consent)
     * Section 9.5.1: Account Holder grants Consent
     */
    createAuthorizationCode(requestUri: string, beneficiaryId: string): Promise<string>;
    /**
     * Exchange Authorization Code for Access Token
     * Section 9.5.1: Retrieve Access Token(s)
     */
    exchangeCodeForToken(code: string, codeVerifier: string, participantId: string): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: number;
        refreshToken?: string;
        scope: string;
    }>;
    /**
     * Refresh Access Token using Refresh Token
     * Section 9.5.1: Token refresh flow
     */
    refreshAccessToken(refreshToken: string, participantId: string): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: number;
        scope: string;
    }>;
    /**
     * Validate Access Token
     * Used by API endpoints to verify requests
     */
    validateAccessToken(accessToken: string): Promise<{
        valid: boolean;
        participantId?: string;
        beneficiaryId?: string;
        scope?: string;
    }>;
    /**
     * Revoke Refresh Token
     * Section 9.5.1: Consent revocation
     */
    revokeToken(token: string, reason: 'user_request' | 'tpp_request' | 'security'): Promise<void>;
    /**
     * Check if scope is authorized
     */
    checkScope(requiredScope: string, grantedScopes: string): boolean;
    /**
     * Generate PKCE code verifier (for TPPs)
     * Helper method for testing/documentation
     */
    static generateCodeVerifier(): string;
    /**
     * Generate PKCE code challenge (for TPPs)
     * Helper method for testing/documentation
     */
    static generateCodeChallenge(verifier: string): string;
}
//# sourceMappingURL=OAuthService.d.ts.map