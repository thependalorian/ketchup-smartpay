/**
 * Open Banking API: /api/v1/agents/{agentId}/mark-unavailable
 * 
 * Mark agent as unavailable (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

async function handleMarkUnavailable(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { agentId } = params;
    const body = await req.json();
    const { Data } = body;

    const reason = Data?.Reason || null;

    await agentNetworkService.markUnavailable(agentId, reason);

    const unavailableResponse = {
      Data: {
        AgentId: agentId,
        Status: 'inactive',
        Message: 'Agent marked as unavailable',
        Reason: reason,
        UpdatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/agents/${agentId}`,
      },
      Meta: {},
    };

    return helpers.success(
      unavailableResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error marking agent unavailable:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while marking the agent unavailable',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleMarkUnavailable,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
