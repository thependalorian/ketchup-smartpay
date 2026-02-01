/**
 * Open Banking API: /api/v1/agents/{agentId}/liquidity
 * 
 * Get agent liquidity status (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

async function handleGetLiquidity(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { agentId } = params;

    const liquidityStatus = await agentNetworkService.checkLiquidityStatus(agentId);

    const liquidityResponse = {
      Data: {
        AgentId: agentId,
        AgentName: liquidityStatus.agent.name,
        Liquidity: {
          Balance: parseFloat(liquidityStatus.agent.liquidity_balance.toString()),
          CashOnHand: parseFloat(liquidityStatus.agent.cash_on_hand.toString()),
          MinRequired: parseFloat(liquidityStatus.agent.min_liquidity_required.toString()),
          Available: liquidityStatus.availableLiquidity,
        },
        Status: {
          HasSufficientLiquidity: liquidityStatus.hasSufficientLiquidity,
          CanProcessCashOut: liquidityStatus.canProcessCashOut,
          AgentStatus: liquidityStatus.agent.status,
        },
        Timestamp: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/agents/${agentId}/liquidity`,
      },
      Meta: {},
    };

    return helpers.success(
      liquidityResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting agent liquidity:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving agent liquidity',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetLiquidity,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
