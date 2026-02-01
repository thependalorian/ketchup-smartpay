/**
 * Feature Interest Survey API
 * 
 * Location: app/api/v1/feedback/feature-interest/route.ts
 * Purpose: Submit feature interest survey
 * 
 * Endpoint: POST /api/v1/feedback/feature-interest
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
    const {
      featureName,
      wouldUse,
      interestLevel,
      concerns,
      suggestions,
      channel = 'app',
    } = body;

    if (!featureName || typeof wouldUse !== 'boolean') {
      return errorResponse('featureName and wouldUse (boolean) are required', HttpStatus.BAD_REQUEST);
    }

    const validFeatures = [
      'Savings Account',
      'Micro-Loans',
      'Recurring Payments',
      'Emergency Funds',
      'Family Management',
    ];

    if (!validFeatures.includes(featureName)) {
      return errorResponse(
        `featureName must be one of: ${validFeatures.join(', ')}`,
        HttpStatus.BAD_REQUEST
      );
    }

    const surveyId = await beneficiaryFeedbackService.submitFeatureInterestSurvey({
      userId,
      featureName: featureName as any,
      wouldUse,
      interestLevel,
      concerns,
      suggestions,
      channel: channel as 'app' | 'ussd' | 'sms',
    });

    return successResponse(
      {
        surveyId,
        message: 'Feature interest survey submitted successfully',
      },
      'Feature interest survey submitted successfully'
    );
  } catch (error: any) {
    log.error('Error submitting feature interest survey:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to submit survey',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.standard, postHandler);
