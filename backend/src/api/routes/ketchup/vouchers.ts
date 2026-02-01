/**
 * Vouchers API Routes
 *
 * Location: backend/src/api/routes/ketchup/vouchers.ts
 * Purpose: REST API for voucher CRUD and operations (extend, cancel, reissue).
 */

import { Router, Request, Response } from 'express';
import { VoucherService } from '../../../services/voucher/VoucherService';
import { validateIssueVoucherDTO } from '../../../services/voucher/validateIssueVoucher';
import { StatusMonitor } from '../../../services/status/StatusMonitor';
import { IssueVoucherDTO, IssueBatchDTO, VoucherFilters } from '../../../../../shared/types';
import { APIResponse } from '../../../../../shared/types';
import { log, logError } from '../../../utils/logger';

const router = Router();
const voucherService = new VoucherService();
const statusMonitor = new StatusMonitor();

/**
 * GET /api/v1/vouchers
 * List all vouchers with optional filters
 */
router.get('/', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const beneficiaryId = req.query.beneficiaryId as string | undefined;
    const region = req.query.region as string | undefined;
    const grantType = req.query.grantType as string | undefined;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const filters: VoucherFilters = {
      ...(beneficiaryId != null && beneficiaryId !== '' && { beneficiaryId }),
      ...(region != null && region !== '' && { region }),
      ...(grantType != null && grantType !== '' && { grantType }),
      ...(status != null && status !== '' && { status }),
      ...(search != null && search !== '' && { search }),
    };

    const vouchers = await voucherService.getAll(filters);

    res.json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError('Failed to get vouchers', err, { message: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV !== 'production' ? err.message : 'Failed to fetch vouchers',
    });
  }
});

/**
 * GET /api/v1/vouchers/:id
 * Get voucher by ID
 */
router.get('/:id', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const voucher = await voucherService.getById(id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher not found',
      });
    }

    res.json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logError('Failed to get voucher', err, { id: req.params.id, message: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV !== 'production' ? err.message : 'Failed to fetch voucher',
    });
  }
});

/**
 * POST /api/v1/vouchers
 * Issue a single voucher (Ketchup assigns every voucher to a beneficiary).
 * Guard rails: beneficiary required, amount > 0, valid grant type; optional scheduled issuance date.
 */
router.post('/', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const validation = validateIssueVoucherDTO(req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, error: validation.error });
    }
    const voucher = await voucherService.issueVoucher(validation.data);

    res.status(201).json({
      success: true,
      data: voucher,
      message: 'Voucher issued successfully',
    });
  } catch (error) {
    logError('Failed to issue voucher', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to issue voucher',
    });
  }
});

/**
 * POST /api/v1/vouchers/batch
 * Issue batch vouchers (guard rails: each item must have required beneficiary, amount, grant type)
 */
router.post('/batch', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const data = req.body as IssueBatchDTO;
    if (!data?.vouchers || !Array.isArray(data.vouchers) || data.vouchers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Batch must contain a non-empty array of vouchers (each with beneficiaryId, amount, grantType).',
      });
    }
    const validated: IssueVoucherDTO[] = [];
    for (let i = 0; i < data.vouchers.length; i++) {
      const v = validateIssueVoucherDTO(data.vouchers[i]);
      if (!v.ok) {
        return res.status(400).json({
          success: false,
          error: `Voucher ${i + 1}: ${v.error}`,
        });
      }
      validated.push(v.data);
    }
    const vouchers = await voucherService.issueBatch({ ...data, vouchers: validated });

    res.status(201).json({
      success: true,
      data: vouchers,
      message: `Batch voucher issuance completed: ${vouchers.length} vouchers issued`,
    });
  } catch (error) {
    logError('Failed to issue batch vouchers', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to issue batch vouchers',
    });
  }
});

/**
 * PUT /api/v1/vouchers/:id/status
 * Update voucher status
 */
router.put('/:id/status', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const { status, redemptionMethod } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    const voucher = await voucherService.updateStatus(id, status, redemptionMethod);

    res.json({
      success: true,
      data: voucher,
      message: 'Voucher status updated successfully',
    });
  } catch (error) {
    logError('Failed to update voucher status', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update voucher status',
    });
  }
});

/**
 * PATCH /api/v1/vouchers/:id/extend
 * Extend voucher expiry (Ketchup operation). Body: { expiryDate: ISO string }.
 */
router.patch('/:id/extend', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const { expiryDate } = req.body;
    if (!expiryDate || typeof expiryDate !== 'string') {
      return res.status(400).json({ success: false, error: 'expiryDate (ISO string) is required' });
    }
    const voucher = await voucherService.extendExpiry(id, expiryDate);
    await statusMonitor.trackStatus(id, 'delivered', { extended_expiry: expiryDate }, 'manual');
    res.json({
      success: true,
      data: voucher,
      message: 'Voucher expiry extended successfully',
    });
  } catch (error) {
    logError('Failed to extend voucher expiry', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extend voucher expiry',
    });
  }
});

/**
 * PATCH /api/v1/vouchers/:id/cancel
 * Cancel voucher (Ketchup operation). Only issued/delivered.
 */
router.patch('/:id/cancel', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const voucher = await voucherService.getById(id);
    if (!voucher) {
      return res.status(404).json({ success: false, error: 'Voucher not found' });
    }
    const updated = await voucherService.cancel(id);
    await statusMonitor.trackStatus(id, 'cancelled', undefined, 'manual');
    res.json({
      success: true,
      data: updated,
      message: 'Voucher cancelled successfully',
    });
  } catch (error) {
    logError('Failed to cancel voucher', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel voucher',
    });
  }
});

/**
 * POST /api/v1/vouchers/:id/reissue
 * Reissue new voucher for same beneficiary (Ketchup operation). Body: { cancelOld?: boolean }.
 */
router.post('/:id/reissue', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const { cancelOld = true } = req.body ?? {};
    const newVoucher = await voucherService.reissue(id, { cancelOld });
    if (cancelOld) {
      await statusMonitor.trackStatus(id, 'cancelled', { reissued_as: newVoucher.id }, 'manual');
    }
    res.status(201).json({
      success: true,
      data: newVoucher,
      message: 'Voucher reissued successfully',
    });
  } catch (error) {
    logError('Failed to reissue voucher', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reissue voucher',
    });
  }
});

/**
 * DELETE /api/v1/vouchers/:id
 * Delete voucher (Ketchup operation). Not allowed for redeemed vouchers (audit trail).
 */
router.delete('/:id', async (req: Request, res: Response<APIResponse<void>>) => {
  try {
    const { id } = req.params;
    await voucherService.delete(id);
    res.status(200).json({
      success: true,
      message: 'Voucher deleted successfully',
    });
  } catch (error) {
    logError('Failed to delete voucher', error);
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete voucher',
    });
  }
});

export default router;
