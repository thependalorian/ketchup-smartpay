/**
 * Savings Interest Calculation Cron Job
 * 
 * Location: app/api/cron/savings-interest-calculation/route.ts
 * Purpose: Calculate and credit daily interest on savings wallets
 * 
 * Schedule: Daily at 1:00 AM (0 1 * * *)
 */

import { ExpoRequest } from 'expo-router/server';
import { savingsWalletService } from '@/services/savingsWalletService';
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

    // Calculate and credit interest
    const result = await savingsWalletService.calculateAndCreditInterest();

    // Aggregate savings analytics for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await savingsWalletService.aggregateDailySavingsAnalytics(yesterday);

    return successResponse(
      {
        message: 'Savings interest calculation completed',
        walletsProcessed: result.walletsProcessed,
        totalInterestCredited: result.totalInterestCredited,
        date: new Date().toISOString().split('T')[0],
      },
      'Savings interest calculation completed successfully'
    );
  } catch (error: any) {
    log.error('Error in savings interest calculation cron:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to calculate savings interest',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
