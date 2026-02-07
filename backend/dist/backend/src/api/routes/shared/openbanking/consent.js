/**
 * Open Banking Consent API Routes
 *
 * Location: backend/src/api/routes/openbanking/consent.ts
 * Purpose: OAuth 2.0 consent endpoints per Namibian Open Banking Standards v1.0
 *
 * Standards Compliance:
 * - Section 9.1.2: URI Structure - /bon/v1/common/*
 * - Section 9.5: Consent and Customer Authentication Standards
 * - RFC 9126: OAuth 2.0 Pushed Authorization Requests
 * - RFC 7636: PKCE
 */
import { Router } from 'express';
import { OAuthService } from '../../../../services/openbanking/OAuthService';
import { logError } from '../../../../utils/logger';
const router = Router();
const oauthService = new OAuthService();
/**
 * POST /bon/v1/common/par
 * Pushed Authorization Request (PAR)
 *
 * Standards: RFC 9126, Section 9.5.1
 */
router.post('/par', async (req, res) => {
    try {
        const { participantId, beneficiaryId, codeChallenge, codeChallengeMethod, scope, redirectUri, state, nonce, } = req.body;
        // Validate required fields
        if (!participantId || !beneficiaryId || !codeChallenge || !scope || !redirectUri) {
            res.status(400).json({
                errors: [{
                        code: 'invalid_request',
                        title: 'Bad Request',
                        detail: 'Missing required parameters',
                    }],
            });
            return;
        }
        // Validate code challenge method
        if (codeChallengeMethod !== 'S256') {
            res.status(400).json({
                errors: [{
                        code: 'invalid_request',
                        title: 'Bad Request',
                        detail: 'Only S256 code challenge method is supported',
                    }],
            });
            return;
        }
        const result = await oauthService.createAuthorizationRequest(participantId, beneficiaryId, codeChallenge, codeChallengeMethod, scope, redirectUri, state, nonce);
        res.json({
            data: {
                requestUri: result.requestUri,
                expiresIn: result.expiresIn,
            },
        });
    }
    catch (error) {
        logError('Failed to create authorization request', error);
        res.status(500).json({
            errors: [{
                    code: 'server_error',
                    title: 'Internal Server Error',
                    detail: 'Failed to process authorization request',
                }],
        });
    }
});
/**
 * POST /bon/v1/common/authorize
 * Create Authorization Code (after user grants consent)
 *
 * Standards: Section 9.5.1
 */
router.post('/authorize', async (req, res) => {
    try {
        const { requestUri, beneficiaryId } = req.body;
        if (!requestUri || !beneficiaryId) {
            res.status(400).json({
                errors: [{
                        code: 'invalid_request',
                        title: 'Bad Request',
                        detail: 'Missing requestUri or beneficiaryId',
                    }],
            });
            return;
        }
        const code = await oauthService.createAuthorizationCode(requestUri, beneficiaryId);
        res.json({
            data: {
                code,
                state: req.body.state,
            },
        });
    }
    catch (error) {
        logError('Failed to create authorization code', error);
        res.status(500).json({
            errors: [{
                    code: 'server_error',
                    title: 'Internal Server Error',
                    detail: error instanceof Error ? error.message : 'Failed to create authorization code',
                }],
        });
    }
});
/**
 * POST /bon/v1/common/token
 * Token Endpoint (exchange code for access/refresh tokens)
 *
 * Standards: RFC 6749, Section 9.5.1
 */
router.post('/token', async (req, res) => {
    try {
        const { grantType, code, refreshToken, codeVerifier, participantId, redirectUri } = req.body;
        if (!grantType || !participantId) {
            res.status(400).json({
                error: 'invalid_request',
                error_description: 'Missing grantType or participantId',
            });
            return;
        }
        if (grantType === 'authorization_code') {
            if (!code || !codeVerifier || !redirectUri) {
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'Missing code, codeVerifier, or redirectUri',
                });
                return;
            }
            const tokens = await oauthService.exchangeCodeForToken(code, codeVerifier, participantId);
            res.json({
                access_token: tokens.accessToken,
                token_type: tokens.tokenType,
                expires_in: tokens.expiresIn,
                refresh_token: tokens.refreshToken,
                scope: tokens.scope,
            });
        }
        else if (grantType === 'refresh_token') {
            if (!refreshToken) {
                res.status(400).json({
                    error: 'invalid_request',
                    error_description: 'Missing refreshToken',
                });
                return;
            }
            const tokens = await oauthService.refreshAccessToken(refreshToken, participantId);
            res.json({
                access_token: tokens.accessToken,
                token_type: tokens.tokenType,
                expires_in: tokens.expiresIn,
                scope: tokens.scope,
            });
        }
        else {
            res.status(400).json({
                error: 'unsupported_grant_type',
                error_description: 'Only authorization_code and refresh_token grant types are supported',
            });
        }
    }
    catch (error) {
        logError('Token endpoint error', error);
        res.status(500).json({
            error: 'server_error',
            error_description: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});
/**
 * POST /bon/v1/common/revoke
 * Token Revocation Endpoint
 *
 * Standards: RFC 7009, Section 9.5.1
 */
router.post('/revoke', async (req, res) => {
    try {
        const { token, tokenTypeHint } = req.body;
        if (!token) {
            res.status(400).json({
                error: 'invalid_request',
                error_description: 'Missing token parameter',
            });
            return;
        }
        if (tokenTypeHint !== 'refresh_token') {
            res.status(400).json({
                error: 'unsupported_token_type',
                error_description: 'Only refresh_token revocation is supported',
            });
            return;
        }
        await oauthService.revokeToken(token, 'tpp_request');
        // RFC 7009: Return 200 OK even if token doesn't exist
        res.status(200).send();
    }
    catch (error) {
        logError('Token revocation error', error);
        res.status(500).json({
            error: 'server_error',
            error_description: 'Failed to revoke token',
        });
    }
});
export default router;
//# sourceMappingURL=consent.js.map