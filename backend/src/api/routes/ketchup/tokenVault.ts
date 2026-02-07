/**
 * Token Vault API
 *
 * Location: backend/src/api/routes/ketchup/tokenVault.ts
 * Purpose: Generate/validate tokens for vouchers and NAMQR (PRD Token Vault).
 */

import { Router } from 'express';
import { z } from 'zod';
import { tokenVaultService } from '../../../services/tokenVault/TokenVaultService';
import { logError } from '../../../utils/logger';

const router: Router = Router();

const generateSchema = z.object({
  voucherId: z.string().min(1),
  purpose: z.enum(['g2p', 'namqr', 'offline']).optional().default('g2p'),
  expiresAt: z.string().min(1),
});

const validateSchema = z.object({
  token: z.string().min(1),
});

const markUsedSchema = z.object({
  token: z.string().min(1),
});

/** POST /api/v1/token-vault/generate – internal/ketchup: generate token for voucher */
router.post('/generate', async (req, res) => {
  try {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const { voucherId, purpose, expiresAt } = parsed.data;
    const result = await tokenVaultService.generateToken({
      voucherId,
      purpose,
      expiresAt: new Date(expiresAt),
    });
    return res.status(201).json(result);
  } catch (error) {
    logError('Token Vault generate failed', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});

/** POST /api/v1/token-vault/validate – validate token, return voucherId if valid */
router.post('/validate', async (req, res) => {
  try {
    const parsed = validateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const result = await tokenVaultService.validateToken(parsed.data.token);
    return res.json(result);
  } catch (error) {
    logError('Token Vault validate failed', error);
    return res.status(500).json({ valid: false, reason: 'Validation error' });
  }
});

/** POST /api/v1/token-vault/mark-used – mark token as used (e.g. after redemption) */
router.post('/mark-used', async (req, res) => {
  try {
    const parsed = markUsedSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const ok = await tokenVaultService.markTokenUsed(parsed.data.token);
    return res.json({ marked: ok });
  } catch (error) {
    logError('Token Vault mark-used failed', error);
    return res.status(500).json({ error: 'Failed to mark token used' });
  }
});

/** GET /api/v1/token-vault/resolve/:tokenId – resolve Token Vault ID to voucherId (for NAMQR/API) */
router.get('/resolve/:tokenId', async (req, res) => {
  try {
    const tokenId = req.params.tokenId;
    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId required' });
    }
    const result = await tokenVaultService.resolveTokenId(tokenId);
    return res.json(result);
  } catch (error) {
    logError('Token Vault resolve failed', error);
    return res.status(500).json({ valid: false, reason: 'Resolution error' });
  }
});

export default router;
