/**
 * SmartPay Mobile API Routes
 *
 * Purpose: REST endpoints for mobile units – unit detail, equipment, drivers, issue/return.
 * Location: backend/src/api/routes/ketchup/mobileUnits.ts
 */
import { Router } from 'express';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { AgentService } from '../../../services/agents/AgentService';
import { MobileUnitService } from '../../../services/mobileUnits/MobileUnitService';
const router = Router();
const agentService = new AgentService();
const mobileUnitService = new MobileUnitService();
/**
 * GET /api/v1/mobile-units
 * List mobile units (agents type=mobile_unit)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const region = req.query.region;
        const status = req.query.status;
        const agents = await agentService.getAll({ region, status, type: 'mobile_unit' });
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        const page = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(agents.length / limit);
        const data = agents.slice(offset, offset + limit);
        res.json({
            success: true,
            data: { data, total: agents.length, page, limit, totalPages },
        });
    }
    catch (error) {
        logError('GET /mobile-units', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch mobile units',
        });
    }
});
/**
 * GET /api/v1/mobile-units/stats
 * Stats for mobile units only
 */
router.get('/stats', authenticate, async (req, res) => {
    try {
        const stats = await agentService.getStats('mobile_unit');
        res.json({ success: true, data: stats });
    }
    catch (error) {
        logError('GET /mobile-units/stats', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch stats',
        });
    }
});
/**
 * GET /api/v1/mobile-units/equipment/types
 * Reference list of equipment types (must be before /:id to avoid "equipment" as id)
 */
router.get('/equipment/types', authenticate, async (req, res) => {
    try {
        const types = await mobileUnitService.getEquipmentTypes();
        res.json({ success: true, data: types });
    }
    catch (error) {
        logError('GET /mobile-units/equipment/types', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch equipment types',
        });
    }
});
/**
 * GET /api/v1/mobile-units/:id
 * Single mobile unit (must be type=mobile_unit)
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const unit = await mobileUnitService.getById(req.params.id);
        if (!unit) {
            return res.status(404).json({ success: false, error: 'Mobile unit not found' });
        }
        res.json({ success: true, data: unit });
    }
    catch (error) {
        logError('GET /mobile-units/:id', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch mobile unit',
        });
    }
});
/**
 * GET /api/v1/mobile-units/:id/equipment
 */
router.get('/:id/equipment', authenticate, async (req, res) => {
    try {
        const list = await mobileUnitService.getEquipment(req.params.id);
        res.json({ success: true, data: list });
    }
    catch (error) {
        logError('GET /mobile-units/:id/equipment', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch equipment',
        });
    }
});
/**
 * GET /api/v1/mobile-units/:id/drivers
 */
router.get('/:id/drivers', authenticate, async (req, res) => {
    try {
        const list = await mobileUnitService.getDrivers(req.params.id);
        res.json({ success: true, data: list });
    }
    catch (error) {
        logError('GET /mobile-units/:id/drivers', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch drivers',
        });
    }
});
/**
 * GET /api/v1/mobile-units/:id/activity
 * Combined feed: equipment issue/return + maintenance events, sorted by date desc.
 */
router.get('/:id/activity', authenticate, async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const list = await mobileUnitService.getActivity(req.params.id, limit);
        res.json({ success: true, data: list });
    }
    catch (error) {
        logError('GET /mobile-units/:id/activity', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch activity',
        });
    }
});
/**
 * POST /api/v1/mobile-units/:id/equipment/issue
 * Body: { equipmentTypeCode, assetId, notes? }
 */
router.post('/:id/equipment/issue', authenticate, async (req, res) => {
    try {
        const { equipmentTypeCode, assetId, notes } = req.body;
        if (!equipmentTypeCode || !assetId) {
            return res.status(400).json({
                success: false,
                error: 'equipmentTypeCode and assetId are required',
            });
        }
        const equipment = await mobileUnitService.issueEquipment(req.params.id, {
            equipmentTypeCode,
            assetId,
            notes,
        });
        res.status(201).json({ success: true, data: equipment });
    }
    catch (error) {
        logError('POST /mobile-units/:id/equipment/issue', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to issue equipment',
        });
    }
});
/**
 * POST /api/v1/mobile-units/:id/equipment/return
 * Body: { equipmentId }
 */
router.post('/:id/equipment/return', authenticate, async (req, res) => {
    try {
        const { equipmentId } = req.body;
        if (!equipmentId) {
            return res.status(400).json({ success: false, error: 'equipmentId is required' });
        }
        const equipment = await mobileUnitService.returnEquipment(req.params.id, equipmentId);
        if (!equipment) {
            return res.status(404).json({ success: false, error: 'Equipment not found or not assigned to this unit' });
        }
        res.json({ success: true, data: equipment });
    }
    catch (error) {
        logError('POST /mobile-units/:id/equipment/return', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to return equipment',
        });
    }
});
/**
 * POST /api/v1/mobile-units/:id/maintenance
 * Body: { type, description, partsUsed?, cost?, meterReading?, equipmentId? }
 */
router.post('/:id/maintenance', authenticate, async (req, res) => {
    try {
        const { type, description, partsUsed, cost, meterReading, equipmentId } = req.body;
        if (!type || !description) {
            return res.status(400).json({
                success: false,
                error: 'type and description are required',
            });
        }
        const event = await mobileUnitService.postMaintenance(req.params.id, {
            type,
            description,
            partsUsed,
            cost: cost != null ? Number(cost) : undefined,
            meterReading,
            equipmentId,
        });
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        logError('POST /mobile-units/:id/maintenance', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create maintenance event',
        });
    }
});
/**
 * POST /api/v1/mobile-units/:id/drivers
 * Body: { name, idNumber?, phone?, role? }
 */
router.post('/:id/drivers', authenticate, async (req, res) => {
    try {
        const { name, idNumber, phone, role } = req.body;
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ success: false, error: 'name is required' });
        }
        const driver = await mobileUnitService.addDriver(req.params.id, {
            name: name.trim(),
            idNumber: idNumber?.trim() || undefined,
            phone: phone?.trim() || undefined,
            role: role?.trim() || undefined,
        });
        res.status(201).json({ success: true, data: driver });
    }
    catch (error) {
        logError('POST /mobile-units/:id/drivers', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add driver',
        });
    }
});
/**
 * PATCH /api/v1/mobile-units/:id/drivers/:driverId
 * Body: { name?, idNumber?, phone?, role?, status? }
 */
router.patch('/:id/drivers/:driverId', authenticate, async (req, res) => {
    try {
        const { name, idNumber, phone, role, status } = req.body;
        const driver = await mobileUnitService.updateDriver(req.params.id, req.params.driverId, {
            name: name?.trim(),
            idNumber: idNumber !== undefined ? (idNumber === null ? undefined : String(idNumber).trim()) : undefined,
            phone: phone !== undefined ? (phone === null ? undefined : String(phone).trim()) : undefined,
            role: role?.trim(),
            status,
        });
        if (!driver) {
            return res.status(404).json({ success: false, error: 'Driver not found' });
        }
        res.json({ success: true, data: driver });
    }
    catch (error) {
        logError('PATCH /mobile-units/:id/drivers/:driverId', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update driver',
        });
    }
});
/**
 * DELETE /api/v1/mobile-units/:id/drivers/:driverId
 */
router.delete('/:id/drivers/:driverId', authenticate, async (req, res) => {
    try {
        const removed = await mobileUnitService.removeDriver(req.params.id, req.params.driverId);
        if (!removed) {
            return res.status(404).json({ success: false, error: 'Driver not found' });
        }
        res.status(204).send();
    }
    catch (error) {
        logError('DELETE /mobile-units/:id/drivers/:driverId', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to remove driver',
        });
    }
});
export default router;
//# sourceMappingURL=mobileUnits.js.map