/**
 * Hourly Analytics Aggregation Cron Job
 * 
 * Location: app/api/cron/analytics-hourly/route.ts
 * Purpose: Aggregate hourly transaction analytics for real-time current day metrics
 * 
 * Schedule: 0 * * * * (every hour)
 * 
 * This provides real-time analytics for the current day by aggregating data hourly.
 * Daily aggregation at midnight handles full day aggregation for historical data.
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

    // Get current date and hour
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();

    // Aggregate hourly data for current day
    await analyticsService.aggregateHourlyTransactions(currentDate, currentHour);

    return successResponse(
      {
        message: 'Hourly analytics aggregation completed',
        date: currentDate.toISOString().split('T')[0],
        hour: currentHour,
      },
      'Hourly analytics aggregation completed successfully'
    );
  } catch (error: any) {
    log.error('Error in hourly analytics aggregation:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to aggregate hourly analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
