/**
 * Weekly Analytics Aggregation Cron Job
 * 
 * Location: app/api/cron/analytics-weekly/route.ts
 * Purpose: Aggregate weekly transaction analytics (runs on Monday)
 * 
 * Schedule: 0 0 * * 1 (Monday at midnight)
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

    // Get target week start (last Monday by default, or from query param)
    const { searchParams } = new URL(req.url);
    let weekStart: Date;

    if (searchParams.get('week_start')) {
      weekStart = new Date(searchParams.get('week_start')!);
    } else {
      // Find last Monday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysToMonday - 7); // Last Monday
    }

    weekStart.setHours(0, 0, 0, 0);

    // Run weekly aggregation
    await analyticsService.aggregateWeekly(weekStart);

    return successResponse(
      {
        message: 'Weekly analytics aggregation completed',
        weekStart: weekStart.toISOString().split('T')[0],
      },
      'Weekly analytics aggregation completed successfully'
    );
  } catch (error: any) {
    log.error('Error in weekly analytics aggregation:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to aggregate weekly analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
