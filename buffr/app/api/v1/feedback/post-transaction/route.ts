/**
 * Post-Transaction Feedback API
 * 
 * Location: app/api/v1/feedback/post-transaction/route.ts
 * Purpose: Submit feedback after a transaction
 * 
 * Endpoint: POST /api/v1/feedback/post-transaction
 */

import { ExpoRequest } from 'expo-router/server';
import { beneficiaryFeedbackService } from '@/services/beneficiaryFeedbackService';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { getUserIdFromRequest } from '@/utils/db';
import { log } from '@/utils/logger';

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const { transactionId, satisfactionScore, feedbackText, channel = 'app' } = body;

    if (!transactionId || !satisfactionScore) {
      return errorResponse('transactionId and satisfactionScore are required', HttpStatus.BAD_REQUEST);
    }

    if (satisfactionScore < 1 || satisfactionScore > 5) {
      return errorResponse('satisfactionScore must be between 1 and 5', HttpStatus.BAD_REQUEST);
    }

    const feedbackId = await beneficiaryFeedbackService.submitPostTransactionFeedback({
      userId,
      transactionId,
      satisfactionScore,
      feedbackText,
      channel: channel as 'app' | 'ussd' | 'sms',
    });

    return successResponse(
      {
        feedbackId,
        message: 'Feedback submitted successfully',
      },
      'Feedback submitted successfully'
    );
  } catch (error: any) {
    log.error('Error submitting post-transaction feedback:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to submit feedback',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.standard, postHandler);
