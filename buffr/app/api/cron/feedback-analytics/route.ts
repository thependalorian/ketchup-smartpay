/**
 * Feedback Analytics Aggregation Cron Job
 * 
 * Location: app/api/cron/feedback-analytics/route.ts
 * Purpose: Aggregate daily feedback analytics
 * 
 * Schedule: Daily at 2:00 AM (0 2 * * *)
 */

import { ExpoRequest } from 'expo-router/server';
import { beneficiaryFeedbackService } from '@/services/beneficiaryFeedbackService';
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

    // Aggregate feedback analytics for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await beneficiaryFeedbackService.aggregateDailyFeedbackAnalytics(yesterday);

    return successResponse(
      {
        message: 'Feedback analytics aggregation completed',
        date: yesterday.toISOString().split('T')[0],
      },
      'Feedback analytics aggregation completed successfully'
    );
  } catch (error: any) {
    log.error('Error in feedback analytics cron:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to aggregate feedback analytics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
