/**
 * Cron Endpoint: Trust Account Reconciliation
 * 
 * Location: app/api/cron/trust-account-reconcile.ts
 * Purpose: Automated daily trust account reconciliation (PSD-3 requirement)
 * 
 * This endpoint is called by:
 * - Vercel Cron Jobs
 * - System cron (via curl)
 * - AWS EventBridge / Google Cloud Scheduler
 * 
 * Schedule: Daily at 2:00 AM (Africa/Windhoek timezone)
 */

import { ExpoRequest } from 'expo-router/server';
import { performTrustAccountReconciliation } from '@/services/complianceScheduler';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger, { log } from '@/utils/logger';

export async function GET(req: ExpoRequest) {
  try {
    // Verify cron secret (set by Vercel or your scheduler)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.error('[Cron] Unauthorized reconciliation attempt');
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    logger.info('[Cron] Starting automated trust account reconciliation...');

    const result = await performTrustAccountReconciliation();

    if (result.status === 'error') {
      log.error('[Cron] Reconciliation failed:', result.message);
      return errorResponse(result.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    logger.info('[Cron] Reconciliation completed:', { message: result.message });

    return successResponse({
      success: true,
      reconciliationDate: result.reconciliationDate,
      trustAccountBalance: result.trustAccountBalance,
      eMoneyLiabilities: result.eMoneyLiabilities,
      discrepancyAmount: result.discrepancyAmount,
      status: result.status,
      message: result.message,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('[Cron] Reconciliation error:', errorMessage);
    return errorResponse(`Reconciliation failed: ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Also support POST for flexibility
export async function POST(req: ExpoRequest) {
  return GET(req);
}
