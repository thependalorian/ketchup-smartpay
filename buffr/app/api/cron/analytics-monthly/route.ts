/**
 * Monthly Analytics Aggregation Cron Job
 * 
 * Location: app/api/cron/analytics-monthly/route.ts
 * Purpose: Aggregate monthly transaction analytics (runs on 1st of month)
 * 
 * Schedule: 0 0 1 * * (1st of month at midnight)
 */

import { ExpoRequest } from 'expo-router/server';
import { analyticsService } from '@/services/analyticsService';
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

    // Get target month (last month by default, or from query param)
    const { searchParams } = new URL(req.url);
    let targetMonth: Date;

    if (searchParams.get('month')) {
      targetMonth = new Date(searchParams.get('month')!);
    } else {
      // Last month
      targetMonth = new Date();
      targetMonth.setMonth(targetMonth.getMonth() - 1);
    }

    // Run monthly aggregation
    await analyticsService.aggregateMonthly(targetMonth);

    return successResponse(
      {
        message: 'Monthly analytics aggregation completed',
        month: targetMonth.toISOString().split('T')[0].substring(0, 7), // YYYY-MM
      },
      'Monthly analytics aggregation completed successfully'
    );
  } catch (error: any) {
    log.error('Error in monthly analytics aggregation:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to aggregate monthly analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
