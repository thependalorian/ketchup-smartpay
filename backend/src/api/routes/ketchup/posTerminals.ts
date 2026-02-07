/**
 * POS Terminal Management API Routes
 *
 * Purpose: CRUD for POS terminals (Ketchup portal).
 * Location: backend/src/api/routes/ketchup/posTerminals.ts
 */

import { Router, Request, Response } from 'express';
import { APIResponse } from '../../../../../shared/types';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { PosTerminalService } from '../../../services/posTerminals/PosTerminalService';

const router: Router = Router();
const posTerminalService = new PosTerminalService();

/**
 * GET /api/v1/pos-terminals
 * List POS terminals with optional agentId, merchantId, status, limit, offset
 */
router.get('/', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const agentId = (req.query.agentId as string) || undefined;
    const merchantId = (req.query.merchantId as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    const list = await posTerminalService.getAll({ agentId, merchantId, status, limit, offset });
    res.json({ success: true, data: list });
  } catch (error) {
    logError('GET /pos-terminals', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch POS terminals',
    });
  }
});

/**
 * GET /api/v1/pos-terminals/:id
 */
router.get('/:id', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const terminal = await posTerminalService.getById(req.params.id);
    if (!terminal) return res.status(404).json({ success: false, error: 'POS terminal not found' });
    res.json({ success: true, data: terminal });
  } catch (error) {
    logError('GET /pos-terminals/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch POS terminal',
    });
  }
});

/**
 * POST /api/v1/pos-terminals
 * Body: { terminalId, agentId?, merchantId?, status?, deviceId? }
 */
router.post('/', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { terminalId, agentId, merchantId, status, deviceId } = req.body;
    if (!terminalId?.trim()) {
      return res.status(400).json({ success: false, error: 'terminalId is required' });
    }
    const terminal = await posTerminalService.create({
      terminalId: terminalId.trim(),
      agentId: agentId?.trim(),
      merchantId: merchantId?.trim(),
      status,
      deviceId: deviceId?.trim(),
    });
    res.status(201).json({ success: true, data: terminal });
  } catch (error) {
    logError('POST /pos-terminals', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create POS terminal',
    });
  }
});

/**
 * PATCH /api/v1/pos-terminals/:id
 * Body: { terminalId?, agentId?, merchantId?, status?, deviceId? }
 */
router.patch('/:id', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { terminalId, agentId, merchantId, status, deviceId } = req.body;
    const terminal = await posTerminalService.update(req.params.id, {
      terminalId: terminalId?.trim(),
      agentId: agentId !== undefined ? (agentId ?? null) : undefined,
      merchantId: merchantId !== undefined ? (merchantId ?? null) : undefined,
      status,
      deviceId: deviceId !== undefined ? (deviceId ?? null) : undefined,
    });
    if (!terminal) return res.status(404).json({ success: false, error: 'POS terminal not found' });
    res.json({ success: true, data: terminal });
  } catch (error) {
    logError('PATCH /pos-terminals/:id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update POS terminal',
    });
  }
});

export default router;
