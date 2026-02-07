/**
 * Distribution API Routes
 * 
 * Location: backend/src/api/routes/distribution.ts
 * Purpose: REST API endpoints for voucher distribution
 * PRD Requirement: Accept idempotency key; same key returns cached response
 * Aligned with buffr/utils/idempotency.ts and buffr/app/api/v1/distribution/receive/route.ts
 */

import { Router, Request, Response } from 'express';
import { DistributionEngine } from '../../../services/distribution/DistributionEngine';
import { VoucherService } from '../../../services/voucher/VoucherService';
import { BeneficiaryService } from '../../../services/beneficiary/BeneficiaryService';
import { APIResponse } from '../../../../../shared/types';
import { log, logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { rateLimit } from '../../middleware/rateLimit';
import { idempotencyService, generateIdempotencyKey, ENDPOINT_DISTRIBUTION } from '../../../services/idempotency/IdempotencyService';

const router: Router = Router();
const distributionEngine = new DistributionEngine();
const voucherService = new VoucherService();
const beneficiaryService = new BeneficiaryService();

// Apply authentication and rate limiting
router.use(authenticate);
router.use(rateLimit(50, 60000)); // 50 requests per minute

/**
 * POST /api/v1/distribution/disburse
 * Distribute voucher to Buffr
 * Header: Idempotency-Key or idempotency-key (aligned with buffr)
 */
router.post('/disburse', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { voucherId } = req.body;
    // Support both header formats (aligned with buffr)
    const clientIdempotencyKey = req.headers['Idempotency-Key'] as string | undefined
      || req.headers['idempotency-key'] as string | undefined
      || req.headers['x-idempotency-key'] as string | undefined;

    if (!voucherId) {
      return res.status(400).json({
        success: false,
        error: 'Voucher ID is required',
      });
    }

    // Generate idempotency key
    const idempotencyKey = clientIdempotencyKey || generateIdempotencyKey(voucherId, 'disburse');

    // Check for duplicate request (aligned with buffr utils/idempotency.ts)
    if (clientIdempotencyKey) {
      const cached = await idempotencyService.getCachedResponse(idempotencyKey, ENDPOINT_DISTRIBUTION);
      if (cached) {
        log('Distribution: duplicate request detected, returning cached response', { idempotencyKey, voucherId });
        return res.status(cached.status).json(cached.body as APIResponse<any>);
      }
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

    const response: APIResponse<any> = {
      success: result.success,
      data: result,
      message: result.success ? 'Voucher distributed successfully' : 'Distribution failed',
    };

    // Store idempotency record (aligned with buffr)
    if (clientIdempotencyKey) {
      await idempotencyService.setCachedResponse(idempotencyKey, 200, response, ENDPOINT_DISTRIBUTION);
    }

    res.json(response);
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
 * Batch distribution with idempotency support
 * Header: Idempotency-Key or idempotency-key (aligned with buffr)
 */
router.post('/batch', async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { voucherIds } = req.body;
    // Support both header formats (aligned with buffr)
    const clientIdempotencyKey = req.headers['Idempotency-Key'] as string | undefined
      || req.headers['idempotency-key'] as string | undefined
      || req.headers['x-idempotency-key'] as string | undefined;

    if (!voucherIds || !Array.isArray(voucherIds)) {
      return res.status(400).json({
        success: false,
        error: 'Voucher IDs array is required',
      });
    }

    // Generate idempotency key from batch content
    const batchKey = voucherIds.sort().join(',');
    const idempotencyKey = clientIdempotencyKey || generateIdempotencyKey(`batch:${batchKey}`, 'batch');

    // Check for duplicate request (aligned with buffr)
    if (clientIdempotencyKey) {
      const cached = await idempotencyService.getCachedResponse(idempotencyKey, ENDPOINT_DISTRIBUTION);
      if (cached) {
        log('Batch distribution: duplicate request detected, returning cached response', { idempotencyKey });
        return res.status(cached.status).json(cached.body as APIResponse<any>);
      }
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

    const response: APIResponse<any> = {
      success: result.failed === 0,
      data: result,
      message: `Batch distribution completed: ${result.successful}/${result.total} successful`,
    };

    // Store idempotency record (aligned with buffr)
    if (clientIdempotencyKey) {
      await idempotencyService.setCachedResponse(idempotencyKey, 200, response, ENDPOINT_DISTRIBUTION);
    }

    res.json(response);
  } catch (error) {
    logError('Failed to distribute batch vouchers', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to distribute batch vouchers',
    });
  }
});

export default router;
