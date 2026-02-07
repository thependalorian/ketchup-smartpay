/**
 * ATM Management API Routes
 *
 * Purpose: CRUD and stats for ATMs (Ketchup portal).
 * Location: backend/src/api/routes/ketchup/atms.ts
 */
import { Router } from 'express';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { AtmService } from '../../../services/atms/AtmService';
const router = Router();
const atmService = new AtmService();
/**
 * GET /api/v1/atms
 * List ATMs with optional region, status, limit, offset
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const region = req.query.region || undefined;
        const status = req.query.status || undefined;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        const list = await atmService.getAll({ region, status, limit, offset });
        res.json({ success: true, data: list });
    }
    catch (error) {
        logError('GET /atms', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch ATMs',
        });
    }
});
/**
 * GET /api/v1/atms/stats
 * Aggregate stats (total, operational, offline, maintenance, low_cash)
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const stats = await atmService.getStats();
        res.json({ success: true, data: stats });
    }
    catch (error) {
        logError('GET /atms/stats', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch ATM stats',
        });
    }
});
/**
 * GET /api/v1/atms/:id
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const atm = await atmService.getById(req.params.id);
        if (!atm)
            return res.status(404).json({ success: false, error: 'ATM not found' });
        res.json({ success: true, data: atm });
    }
    catch (error) {
        logError('GET /atms/:id', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch ATM',
        });
    }
});
/**
 * POST /api/v1/atms
 * Body: { terminalId, location, region?, status?, cashLevelPercent?, mobileUnitId?, lastServicedAt? }
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const { terminalId, location, region, status, cashLevelPercent, mobileUnitId, lastServicedAt } = req.body;
        if (!terminalId?.trim() || !location?.trim()) {
            return res.status(400).json({ success: false, error: 'terminalId and location are required' });
        }
        const atm = await atmService.create({
            terminalId: terminalId.trim(),
            location: location.trim(),
            region: region?.trim(),
            status,
            cashLevelPercent: cashLevelPercent != null ? Number(cashLevelPercent) : undefined,
            mobileUnitId: mobileUnitId?.trim(),
            lastServicedAt,
        });
        res.status(201).json({ success: true, data: atm });
    }
    catch (error) {
        logError('POST /atms', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create ATM',
        });
    }
});
/**
 * PATCH /api/v1/atms/:id
 * Body: { terminalId?, location?, region?, status?, cashLevelPercent?, mobileUnitId?, lastServicedAt? }
 */
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const { terminalId, location, region, status, cashLevelPercent, mobileUnitId, lastServicedAt } = req.body;
        const atm = await atmService.update(req.params.id, {
            terminalId: terminalId?.trim(),
            location: location?.trim(),
            region: region !== undefined ? (region?.trim() ?? null) : undefined,
            status,
            cashLevelPercent: cashLevelPercent !== undefined ? (cashLevelPercent == null ? undefined : Number(cashLevelPercent)) : undefined,
            mobileUnitId: mobileUnitId !== undefined ? (mobileUnitId ?? undefined) : undefined,
            lastServicedAt: lastServicedAt !== undefined ? (lastServicedAt ?? undefined) : undefined,
        });
        if (!atm)
            return res.status(404).json({ success: false, error: 'ATM not found' });
        res.json({ success: true, data: atm });
    }
    catch (error) {
        logError('PATCH /atms/:id', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update ATM',
        });
    }
});
export default router;
//# sourceMappingURL=atms.js.map