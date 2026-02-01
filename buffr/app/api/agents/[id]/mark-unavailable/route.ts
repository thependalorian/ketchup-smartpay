/**
 * Mark Agent Unavailable API Route
 * 
 * Location: app/api/agents/[id]/mark-unavailable/route.ts
 * Purpose: Mark agent as unavailable (agent self-service or admin)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function postHandler(req: ExpoRequest, { id }: { id: string }) {
  try {
    const body = await req.json();
    const { reason } = body;

    await agentNetworkService.markUnavailable(id, reason);

    return successResponse({
      agentId: id,
      status: 'inactive',
      message: 'Agent marked as unavailable',
    }, 'Agent marked as unavailable successfully');
  } catch (error: any) {
    logger.error('Error marking agent unavailable', error, { agentId: id });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to mark agent unavailable',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
