/**
 * Open Banking API: /api/v1/compliance/processing
 * 
 * Compliance processing operations (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/compliance/processing
 * Get compliance processing status
 */
async function handleGetProcessing(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    // Return compliance processing status
    const processingResponse = {
      Data: {
        Status: 'operational',
        LastProcessedDateTime: new Date().toISOString(),
        NextScheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      Links: {
        Self: '/api/v1/compliance/processing',
      },
      Meta: {},
    };

    return helpers.success(
      processingResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching compliance processing status:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching compliance processing status',
      500
    );
  }
}

/**
 * POST /api/v1/compliance/processing
 * Trigger compliance processing
 */
async function handlePostProcessing(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Action } = Data;

    if (!Action) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Action is required',
        400
      );
    }

    // Process compliance action
    const processingResponse = {
      Data: {
        Action,
        Status: 'completed',
        ProcessedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/compliance/processing',
      },
      Meta: {},
    };

    return helpers.success(
      processingResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error processing compliance action:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the compliance action',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetProcessing,
  {
    rateLimitConfig: RATE_LIMITS.compliance,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handlePostProcessing,
  {
    rateLimitConfig: RATE_LIMITS.compliance,
    requireAuth: true,
    trackResponseTime: true,
  }
);
