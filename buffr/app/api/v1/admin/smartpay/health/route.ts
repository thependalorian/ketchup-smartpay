/**
 * Open Banking API: /api/v1/admin/smartpay/health
 * 
 * SmartPay API health check (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
import { checkSmartPayHealth } from '@/services/ketchupSmartPayService';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/smartpay/health
 * Check SmartPay API connection health
 */
async function handleGetHealth(req: ExpoRequest) {
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

    const healthStatus = await checkSmartPayHealth();

    const healthResponse = {
      Data: {
        Healthy: healthStatus.healthy,
        ResponseTime: healthStatus.responseTime,
        Error: healthStatus.error || null,
        LastChecked: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/admin/smartpay/health',
      },
      Meta: {},
    };

    return helpers.success(
      healthResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error checking SmartPay health:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while checking SmartPay health',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetHealth,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
