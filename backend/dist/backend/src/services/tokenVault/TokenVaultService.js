/**
 * Token Vault Service
 *
 * Location: backend/src/services/tokenVault/TokenVaultService.ts
 * Purpose: G2P engine tokenization for vouchers and NAMQR (PRD: Token Vault – generate/validate tokens;
 *          no PII in logs; token ↔ voucher mapping with secure storage).
 */
import crypto from 'crypto';
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
const TOKEN_BYTES = 32;
const HASH_ALGORITHM = 'sha256';
/**
 * Hash a token for storage (never store plain token in DB).
 */
function hashToken(token) {
    return crypto.createHash(HASH_ALGORITHM).update(token).digest('hex');
}
export class TokenVaultService {
    /**
     * Generate a new token for a voucher. Returns opaque token; stores only hash + voucherId in DB.
     */
    async generateToken(input) {
        const { voucherId, purpose = 'g2p', expiresAt } = input;
        const tokenId = crypto.randomUUID();
        const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
        const tokenHash = hashToken(token);
        try {
            await sql `
        INSERT INTO token_vault (id, token_hash, voucher_id, purpose, expires_at, updated_at)
        VALUES (${tokenId}, ${tokenHash}, ${voucherId}, ${purpose}, ${expiresAt.toISOString()}, NOW())
      `;
            log('Token Vault: token generated', { tokenId, voucherId, purpose });
            return {
                tokenId,
                token,
                voucherId,
                purpose,
                expiresAt: expiresAt.toISOString(),
            };
        }
        catch (error) {
            logError('Token Vault: generate failed', error, { voucherId });
            throw error;
        }
    }
    /**
     * Validate a token: resolve to voucherId if valid and not expired/used.
     */
    async validateToken(token) {
        const tokenHash = hashToken(token);
        try {
            const rows = await sql `
        SELECT id, voucher_id, purpose, expires_at, used_at
        FROM token_vault
        WHERE token_hash = ${tokenHash}
        LIMIT 1
      `;
            if (!rows.length) {
                return { valid: false, reason: 'Token not found' };
            }
            const row = rows[0];
            if (row.used_at) {
                return { valid: false, reason: 'Token already used', voucherId: row.voucher_id };
            }
            if (new Date(row.expires_at) < new Date()) {
                return { valid: false, reason: 'Token expired', voucherId: row.voucher_id };
            }
            return {
                valid: true,
                voucherId: row.voucher_id,
                purpose: row.purpose,
            };
        }
        catch (error) {
            logError('Token Vault: validate failed', error);
            return { valid: false, reason: 'Validation error' };
        }
    }
    /**
     * Mark token as used (idempotent by token_hash). Call after successful redemption.
     */
    async markTokenUsed(token) {
        const tokenHash = hashToken(token);
        try {
            const updated = await sql `
        UPDATE token_vault
        SET used_at = NOW(), updated_at = NOW()
        WHERE token_hash = ${tokenHash} AND used_at IS NULL
        RETURNING id
      `;
            return Array.isArray(updated) && updated.length > 0;
        }
        catch (error) {
            logError('Token Vault: markUsed failed', error);
            return false;
        }
    }
    /**
     * Resolve Token Vault ID (tokenId) to voucherId for NAMQR/API. Does not consume token.
     */
    async resolveTokenId(tokenId) {
        try {
            const rows = await sql `
        SELECT voucher_id, purpose, expires_at, used_at
        FROM token_vault
        WHERE id = ${tokenId}
        LIMIT 1
      `;
            if (!rows.length) {
                return { valid: false, reason: 'Token ID not found' };
            }
            const row = rows[0];
            if (row.used_at) {
                return { valid: false, reason: 'Token already used', voucherId: row.voucher_id };
            }
            if (new Date(row.expires_at) < new Date()) {
                return { valid: false, reason: 'Token expired', voucherId: row.voucher_id };
            }
            return { valid: true, voucherId: row.voucher_id, purpose: row.purpose };
        }
        catch (error) {
            logError('Token Vault: resolveTokenId failed', error);
            return { valid: false, reason: 'Resolution error' };
        }
    }
}
export const tokenVaultService = new TokenVaultService();
//# sourceMappingURL=TokenVaultService.js.map