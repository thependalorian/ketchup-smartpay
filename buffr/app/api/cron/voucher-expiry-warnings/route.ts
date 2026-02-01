/**
 * Voucher Expiry Warnings Cron Job
 * 
 * Location: app/api/cron/voucher-expiry-warnings/route.ts
 * Purpose: Send proactive expiry warnings (7, 3, 1 day before expiry)
 * 
 * Schedule: Daily at 9:00 AM (0 9 * * *)
 */

import { ExpoRequest } from 'expo-router/server';
import { voucherExpiryService } from '@/services/voucherExpiryService';
import { errorResponse, successResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

const CRON_SECRET = process.env.CRON_SECRET || '';

async function getHandler(req: ExpoRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get('days'); // Optional: specific days (7, 3, 1, 0)

    const results: Array<{
      days: number;
      checked: number;
      warningsSent: number;
      errors: number;
    }> = [];

    if (daysParam) {
      // Check specific day
      const days = parseInt(daysParam);
      if (![7, 3, 1, 0].includes(days)) {
        return errorResponse('Invalid days parameter. Must be 7, 3, 1, or 0', HttpStatus.BAD_REQUEST);
      }

      const result = await voucherExpiryService.checkAndSendWarnings(days);
      results.push({ days, ...result });
    } else {
      // Check all warning days (7, 3, 1, 0)
      for (const days of [7, 3, 1, 0]) {
        try {
          const result = await voucherExpiryService.checkAndSendWarnings(days);
          results.push({ days, ...result });
        } catch (error: any) {
          log.error(`Error checking ${days}-day warnings:`, error);
          results.push({ days, checked: 0, warningsSent: 0, errors: 1 });
        }
      }
    }

    // Aggregate analytics for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await voucherExpiryService.aggregateDailyExpiryAnalytics(yesterday);

    return successResponse(
      {
        message: 'Voucher expiry warnings processed',
        results,
        date: new Date().toISOString().split('T')[0],
      },
      'Voucher expiry warnings processed successfully'
    );
  } catch (error: any) {
    log.error('Error in voucher expiry warnings cron:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process expiry warnings',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
