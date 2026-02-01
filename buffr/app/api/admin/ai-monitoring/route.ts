/**
 * Admin AI Monitoring API
 * 
 * Location: app/api/admin/ai-monitoring/route.ts
 * Purpose: Admin-only endpoints for AI agent health and performance monitoring
 * 
 * Requires: Admin authentication with 'ai.monitoring.view' permission
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

// NOTE: AI Backend migrated from TypeScript (port 8000) to Python (port 8001)
const BUFFR_AI_BASE_URL = process.env.BUFFR_AI_URL || process.env.AI_BACKEND_URL || 'http://localhost:8001';

/**
 * GET /api/admin/ai-monitoring
 * 
 * Query parameters:
 * - action: 'health' | 'agents' | 'metrics'
 */
async function getHandler(request: ExpoRequest) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'health';

    switch (action) {
      case 'health': {
        // Check AI backend health
        try {
          const healthResponse = await fetch(`${BUFFR_AI_BASE_URL}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });

          if (!healthResponse.ok) {
            throw new Error(`Health check failed: ${healthResponse.status}`);
          }

          const healthData = await healthResponse.json();

          return successResponse({
            status: healthData.status || 'unknown',
            services: healthData.services || {},
            timestamp: healthData.timestamp || new Date().toISOString(),
            backend_url: BUFFR_AI_BASE_URL,
          });
        } catch (error: any) {
          return successResponse({
            status: 'unhealthy',
            error: error.message || 'Failed to connect to AI backend',
            backend_url: BUFFR_AI_BASE_URL,
            timestamp: new Date().toISOString(),
          });
        }
      }

      case 'agents': {
        // Get individual agent statuses
        const agents = [
          'guardian',
          'scout',
          'mentor',
          'transaction_analyst',
          'crafter',
          'companion',
        ];

        const agentStatuses: Record<string, any> = {};

        for (const agent of agents) {
          try {
            const agentHealthUrl = `${BUFFR_AI_BASE_URL}/agents/${agent}/health`;
            const response = await fetch(agentHealthUrl, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(3000),
            });

            if (response.ok) {
              const data = await response.json();
              agentStatuses[agent] = {
                status: 'operational',
                ...data,
              };
            } else {
              agentStatuses[agent] = {
                status: 'unavailable',
                error: `HTTP ${response.status}`,
              };
            }
          } catch (error: any) {
            agentStatuses[agent] = {
              status: 'unavailable',
              error: error.message || 'Connection failed',
            };
          }
        }

        return successResponse({
          agents: agentStatuses,
          timestamp: new Date().toISOString(),
        });
      }

      case 'metrics': {
        // Get AI performance metrics (placeholder - would need ML model monitoring)
        return successResponse({
          message: 'AI metrics endpoint - to be implemented with ML model monitoring',
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return errorResponse('Invalid action. Use: health, agents, metrics', HttpStatus.BAD_REQUEST);
    }
  } catch (error: any) {
    logger.error('Error fetching AI monitoring data', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch AI monitoring data',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);

