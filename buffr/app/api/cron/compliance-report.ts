/**
 * Cron Endpoint: Monthly Compliance Report Generation
 * 
 * Location: app/api/cron/compliance-report.ts
 * Purpose: Automated monthly compliance report generation (PSD-1 requirement)
 * 
 * This endpoint is called by:
 * - Vercel Cron Jobs
 * - System cron (via curl)
 * - AWS EventBridge / Google Cloud Scheduler
 * 
 * Schedule: 10th of each month at 9:00 AM (Africa/Windhoek timezone)
 */

import { ExpoRequest } from 'expo-router/server';
import { generateMonthlyComplianceReport } from '@/services/complianceScheduler';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger, { log } from '@/utils/logger';

export async function GET(req: ExpoRequest) {
  try {
    // Verify cron secret (set by Vercel or your scheduler)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.error('[Cron] Unauthorized report generation attempt');
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    logger.info('[Cron] Starting automated monthly compliance report generation...');

    const result = await generateMonthlyComplianceReport();

    if (!result.success) {
      log.error('[Cron] Report generation failed:', result.error);
      return errorResponse(result.error || 'Report generation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    logger.info('[Cron] Report generation completed:', { reportId: result.reportId });

    return successResponse({
      success: true,
      reportId: result.reportId,
      message: 'Monthly compliance report generated successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error('[Cron] Report generation error:', errorMessage);
    return errorResponse(`Report generation failed: ${errorMessage}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

// Also support POST for flexibility
export async function POST(req: ExpoRequest) {
  return GET(req);
}
