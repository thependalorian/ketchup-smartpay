/**
 * Beneficiaries API Routes
 *
 * Location: backend/src/api/routes/beneficiaries.ts
 * Purpose: REST API endpoints for beneficiary operations
 */
import { Router } from 'express';
import { BeneficiaryService } from '../../../services/beneficiary/BeneficiaryService';
import { VoucherService } from '../../../services/voucher/VoucherService';
import { DependantService } from '../../../services/dependant/DependantService';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
const router = Router();
const beneficiaryService = new BeneficiaryService();
const voucherService = new VoucherService();
const dependantService = new DependantService();
/**
 * GET /api/v1/beneficiaries
 * List all beneficiaries with optional filters
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            region: req.query.region,
            grantType: req.query.grantType,
            status: req.query.status,
            search: req.query.search,
        };
        const beneficiaries = await beneficiaryService.getAll(filters);
        res.json({
            success: true,
            data: beneficiaries,
        });
    }
    catch (error) {
        logError('Failed to get beneficiaries', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch beneficiaries',
        });
    }
});
/**
 * GET /api/v1/beneficiaries/:id/vouchers
 * Get vouchers for a beneficiary (must be before /:id)
 */
router.get('/:id/vouchers', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const vouchers = await voucherService.getAll({ beneficiaryId: id });
        res.json({
            success: true,
            data: vouchers,
        });
    }
    catch (error) {
        logError('Failed to get beneficiary vouchers', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch vouchers',
        });
    }
});
/**
 * GET /api/v1/beneficiaries/:id/dependants
 * List dependants for a beneficiary (must be before /:id)
 */
router.get('/:id/dependants', async (req, res) => {
    try {
        const { id } = req.params;
        const dependants = await dependantService.getByBeneficiaryId(id);
        res.json({
            success: true,
            data: dependants,
        });
    }
    catch (error) {
        logError('Failed to get beneficiary dependants', error);
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch dependants',
        });
    }
});
/**
 * POST /api/v1/beneficiaries/:id/dependants
 * Create a dependant for a beneficiary
 */
router.post('/:id/dependants', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const dependant = await dependantService.create(id, data);
        res.status(201).json({
            success: true,
            data: dependant,
            message: 'Dependant created successfully',
        });
    }
    catch (error) {
        logError('Failed to create dependant', error);
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 400;
        res.status(status).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create dependant',
        });
    }
});
/**
 * GET /api/v1/beneficiaries/:id/dependants/:dependantId
 * Get a single dependant by ID
 */
router.get('/:id/dependants/:dependantId', async (req, res) => {
    try {
        const { id, dependantId } = req.params;
        const dependant = await dependantService.getById(id, dependantId);
        if (!dependant) {
            return res.status(404).json({
                success: false,
                error: 'Dependant not found',
            });
        }
        res.json({
            success: true,
            data: dependant,
        });
    }
    catch (error) {
        logError('Failed to get dependant', error);
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch dependant',
        });
    }
});
/**
 * PATCH /api/v1/beneficiaries/:id/dependants/:dependantId
 * Update a dependant
 */
router.patch('/:id/dependants/:dependantId', async (req, res) => {
    try {
        const { id, dependantId } = req.params;
        const data = req.body;
        const dependant = await dependantService.update(id, dependantId, data);
        res.json({
            success: true,
            data: dependant,
            message: 'Dependant updated successfully',
        });
    }
    catch (error) {
        logError('Failed to update dependant', error);
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 400;
        res.status(status).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update dependant',
        });
    }
});
/**
 * DELETE /api/v1/beneficiaries/:id/dependants/:dependantId
 * Delete a dependant
 */
router.delete('/:id/dependants/:dependantId', async (req, res) => {
    try {
        const { id, dependantId } = req.params;
        await dependantService.delete(id, dependantId);
        res.json({
            success: true,
            message: 'Dependant deleted successfully',
        });
    }
    catch (error) {
        logError('Failed to delete dependant', error);
        const status = error instanceof Error && error.message.includes('not found') ? 404 : 500;
        res.status(status).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete dependant',
        });
    }
});
/**
 * GET /api/v1/beneficiaries/:id
 * Get beneficiary by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const beneficiary = await beneficiaryService.getById(id);
        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                error: 'Beneficiary not found',
            });
        }
        res.json({
            success: true,
            data: beneficiary,
        });
    }
    catch (error) {
        logError('Failed to get beneficiary', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch beneficiary',
        });
    }
});
/**
 * POST /api/v1/beneficiaries
 * Create a new beneficiary
 */
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const beneficiary = await beneficiaryService.create(data);
        res.status(201).json({
            success: true,
            data: beneficiary,
            message: 'Beneficiary created successfully',
        });
    }
    catch (error) {
        logError('Failed to create beneficiary', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create beneficiary',
        });
    }
});
/**
 * PUT /api/v1/beneficiaries/:id
 * Update beneficiary
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const beneficiary = await beneficiaryService.update(id, data);
        res.json({
            success: true,
            data: beneficiary,
            message: 'Beneficiary updated successfully',
        });
    }
    catch (error) {
        logError('Failed to update beneficiary', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update beneficiary',
        });
    }
});
export default router;
//# sourceMappingURL=beneficiaries.js.map