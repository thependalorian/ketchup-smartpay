/**
 * Agent Liquidity History API Route
 * 
 * Location: app/api/agents/[id]/liquidity-history/route.ts
 * Purpose: Get agent liquidity history
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest, { id: agentId }: { id: string }) {
  try {
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await agentNetworkService.getLiquidityHistory(agentId, {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      limit,
      offset,
    });

    // Format liquidity logs
    const formattedLogs = result.logs.map(log => ({
      id: log.id,
      agentId: log.agent_id,
      liquidityBalance: parseFloat(log.liquidity_balance.toString()),
      cashOnHand: parseFloat(log.cash_on_hand.toString()),
      timestamp: log.timestamp.toISOString(),
      notes: log.notes || null,
    }));

    return successResponse({
      logs: formattedLogs,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    }, 'Agent liquidity history retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting agent liquidity history', error, { agentId });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve agent liquidity history',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
