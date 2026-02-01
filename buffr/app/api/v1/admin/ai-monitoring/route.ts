/**
 * Open Banking API: /api/v1/admin/ai-monitoring
 * 
 * AI agent health and performance monitoring (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

const BUFFR_AI_BASE_URL = process.env.BUFFR_AI_URL || process.env.AI_BACKEND_URL || 'http://localhost:8001';

/**
 * GET /api/v1/admin/ai-monitoring
 * Get AI monitoring status
 */
async function handleGetMonitoring(req: ExpoRequest) {
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

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'health';

    switch (action) {
      case 'health': {
        try {
          const healthResponse = await fetch(`${BUFFR_AI_BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
          });

          if (!healthResponse.ok) {
            throw new Error(`Health check failed: ${healthResponse.status}`);
          }

          const healthData = await healthResponse.json();

          const healthResponseData = {
            Data: {
              Status: healthData.status || 'unknown',
              Services: healthData.services || {},
              Timestamp: healthData.timestamp || new Date().toISOString(),
              BackendUrl: BUFFR_AI_BASE_URL,
            },
            Links: {
              Self: '/api/v1/admin/ai-monitoring?action=health',
            },
            Meta: {},
          };

          return helpers.success(
            healthResponseData,
            200,
            undefined,
            undefined,
            context?.requestId
          );
        } catch (error: any) {
          const healthResponseData = {
            Data: {
              Status: 'unhealthy',
              Error: error.message || 'Failed to connect to AI backend',
              BackendUrl: BUFFR_AI_BASE_URL,
              Timestamp: new Date().toISOString(),
            },
            Links: {
              Self: '/api/v1/admin/ai-monitoring?action=health',
            },
            Meta: {},
          };

          return helpers.success(
            healthResponseData,
            200,
            undefined,
            undefined,
            context?.requestId
          );
        }
      }

      default:
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          'Invalid action. Use: health',
          400
        );
    }
  } catch (error) {
    log.error('Error fetching AI monitoring status:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching AI monitoring status',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetMonitoring,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
