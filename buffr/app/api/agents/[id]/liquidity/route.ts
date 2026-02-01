/**
 * Agent Liquidity Status API Route
 * 
 * Location: app/api/agents/[id]/liquidity/route.ts
 * Purpose: Get agent liquidity status
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest, { id }: { id: string }) {
  try {
    const liquidityStatus = await agentNetworkService.checkLiquidityStatus(id);

    return successResponse({
      agentId: id,
      agentName: liquidityStatus.agent.name,
      liquidity: {
        balance: parseFloat(liquidityStatus.agent.liquidity_balance.toString()),
        cashOnHand: parseFloat(liquidityStatus.agent.cash_on_hand.toString()),
        minRequired: parseFloat(liquidityStatus.agent.min_liquidity_required.toString()),
        available: liquidityStatus.availableLiquidity,
      },
      status: {
        hasSufficientLiquidity: liquidityStatus.hasSufficientLiquidity,
        canProcessCashOut: liquidityStatus.canProcessCashOut,
        agentStatus: liquidityStatus.agent.status,
      },
      timestamp: new Date().toISOString(),
    }, 'Agent liquidity status retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting agent liquidity', error, { agentId: id });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve agent liquidity',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
