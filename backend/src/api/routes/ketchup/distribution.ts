/**
 * Distribution API Routes
 * 
 * Location: backend/src/api/routes/distribution.ts
 * Purpose: REST API endpoints for voucher distribution
 */

import { Router, Request, Response } from 'express';
import { DistributionEngine } from '../../../services/distribution/DistributionEngine';
import { VoucherService } from '../../../services/voucher/VoucherService';
import { BeneficiaryService } from '../../../services/beneficiary/BeneficiaryService';
import { APIResponse } from '../../../../../shared/types';
import { log, logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { rateLimit } from '../../middleware/rateLimit';

const router = Router();
const distributionEngine = new DistributionEngine();
const voucherService = new VoucherService();
const beneficiaryService = new BeneficiaryService();

// Apply authentication and rate limiting
router.use(authenticate);
router.use(rateLimit(50, 60000)); // 50 requests per minute

/**
 * POST /api/v1/distribution/disburse
 * Distribute voucher to Buffr
 */
router.post('/disburse', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { voucherId } = req.body;

    if (!voucherId) {
      return res.status(400).json({
        success: false,
        error: 'Voucher ID is required',
      });
    }

    const voucher = await voucherService.getById(voucherId);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Voucher not found',
      });
    }

    const beneficiary = await beneficiaryService.getById(voucher.beneficiaryId);
    const result = await distributionEngine.distributeToBuffr(voucher, beneficiary ?? undefined);

    res.json({
      success: result.success,
      data: result,
      message: result.success ? 'Voucher distributed successfully' : 'Distribution failed',
    });
  } catch (error) {
    logError('Failed to distribute voucher', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to distribute voucher',
    });
  }
});

/**
 * POST /api/v1/distribution/batch
 * Batch distribution
 */
router.post('/batch', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { voucherIds } = req.body;

    if (!voucherIds || !Array.isArray(voucherIds)) {
      return res.status(400).json({
        success: false,
        error: 'Voucher IDs array is required',
      });
    }

    const vouchers = await Promise.all(
      voucherIds.map(id => voucherService.getById(id))
    );

    const validVouchers = vouchers.filter((v): v is NonNullable<typeof v> => v !== null);

    if (validVouchers.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid vouchers found',
      });
    }

    const getBeneficiary = (beneficiaryId: string) => beneficiaryService.getById(beneficiaryId);
    const result = await distributionEngine.distributeBatch(validVouchers, getBeneficiary);

    res.json({
      success: result.failed === 0,
      data: result,
      message: `Batch distribution completed: ${result.successful}/${result.total} successful`,
    });
  } catch (error) {
    logError('Failed to distribute batch vouchers', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to distribute batch vouchers',
    });
  }
});

export default router;
