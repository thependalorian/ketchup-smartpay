/**
 * Token Vault Service
 *
 * Location: backend/src/services/tokenVault/TokenVaultService.ts
 * Purpose: G2P engine tokenization for vouchers and NAMQR (PRD: Token Vault – generate/validate tokens;
 *          no PII in logs; token ↔ voucher mapping with secure storage).
 */
export interface GenerateTokenInput {
    voucherId: string;
    purpose?: 'g2p' | 'namqr' | 'offline';
    expiresAt: Date;
}
export interface GenerateTokenResult {
    tokenId: string;
    token: string;
    voucherId: string;
    purpose: string;
    expiresAt: string;
}
export interface ValidateTokenResult {
    valid: boolean;
    voucherId?: string;
    purpose?: string;
    reason?: string;
}
export declare class TokenVaultService {
    /**
     * Generate a new token for a voucher. Returns opaque token; stores only hash + voucherId in DB.
     */
    generateToken(input: GenerateTokenInput): Promise<GenerateTokenResult>;
    /**
     * Validate a token: resolve to voucherId if valid and not expired/used.
     */
    validateToken(token: string): Promise<ValidateTokenResult>;
    /**
     * Mark token as used (idempotent by token_hash). Call after successful redemption.
     */
    markTokenUsed(token: string): Promise<boolean>;
    /**
     * Resolve Token Vault ID (tokenId) to voucherId for NAMQR/API. Does not consume token.
     */
    resolveTokenId(tokenId: string): Promise<ValidateTokenResult>;
}
export declare const tokenVaultService: TokenVaultService;
//# sourceMappingURL=TokenVaultService.d.ts.map