/**
 * IPS Health Check API
 * 
 * Location: app/api/ips/health/route.ts
 * Purpose: Health check endpoint for IPS (Instant Payment Switch) connection
 * 
 * Compliance: PSDIR-11 (IPS integration monitoring)
 * Integration: IPS (Instant Payment Switch) health monitoring
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { ipsService } from '@/services/ipsService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const healthCheck = await ipsService.healthCheck();

    if (!healthCheck.healthy) {
      return errorResponse(
        `IPS connection unhealthy: ${healthCheck.error || 'Unknown error'}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return successResponse({
      healthy: healthCheck.healthy,
      responseTime: healthCheck.responseTime,
      timestamp: new Date().toISOString(),
    }, 'IPS connection healthy');
  } catch (error: any) {
    logger.error('IPS health check error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to check IPS health',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.api, getHandler);
