/**
 * SmartPay Health Check API
 * 
 * Location: app/api/admin/smartpay/health/route.ts
 * Purpose: Check SmartPay API connection health
 * 
 * Returns:
 * - Connection status (healthy/unhealthy)
 * - Response time
 * - Error details if unhealthy
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { checkSmartPayHealth } from '@/services/ketchupSmartPayService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const healthStatus = await checkSmartPayHealth();
    
    return successResponse({
      healthy: healthStatus.healthy,
      responseTime: healthStatus.responseTime,
      error: healthStatus.error,
      lastChecked: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('SmartPay health check error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to check SmartPay health',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
