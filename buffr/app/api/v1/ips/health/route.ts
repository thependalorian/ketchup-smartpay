/**
 * Open Banking API: /api/v1/ips/health
 * 
 * IPS health check (Open Banking format)
 * 
 * CRITICAL: PSDIR-11 compliance - IPS integration monitoring
 * Deadline: February 26, 2026
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { ipsService } from '@/services/ipsService';
import { log } from '@/utils/logger';

async function handleIPSHealth(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const healthCheck = await ipsService.healthCheck();

    if (!healthCheck.healthy) {
      return helpers.error(
        OpenBankingErrorCode.SERVICE_UNAVAILABLE,
        `IPS connection unhealthy: ${healthCheck.error || 'Unknown error'}`,
        503
      );
    }

    const healthResponse = {
      Data: {
        Healthy: healthCheck.healthy,
        ResponseTime: healthCheck.responseTime,
        Service: 'IPS',
        Timestamp: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/ips/health',
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
    log.error('IPS health check error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'Failed to check IPS health',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleIPSHealth,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true, // Admin or authenticated user
    trackResponseTime: true,
  }
);
