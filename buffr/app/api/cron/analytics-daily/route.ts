/**
 * Daily Analytics Aggregation Cron Job
 * 
 * Location: app/api/cron/analytics-daily/route.ts
 * Purpose: Aggregate daily transaction analytics (runs at 00:00 daily)
 * 
 * Schedule: 0 0 * * * (daily at midnight)
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

    // Get target date (yesterday by default, or from query param)
    const { searchParams } = new URL(req.url);
    const targetDateParam = searchParams.get('date');
    const targetDate = targetDateParam
      ? new Date(targetDateParam)
      : new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

    // Run daily aggregation
    await analyticsService.aggregateDaily(targetDate);

    return successResponse(
      {
        message: 'Daily analytics aggregation completed',
        date: targetDate.toISOString().split('T')[0],
      },
      'Daily analytics aggregation completed successfully'
    );
  } catch (error: any) {
    log.error('Error in daily analytics aggregation:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to aggregate daily analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
