/**
 * Open Banking API: /api/v1/agents/{agentId}/liquidity-history
 * 
 * Get agent liquidity history (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

async function handleGetLiquidityHistory(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { agentId } = params;
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const { page, pageSize } = parsePaginationParams(req);

    const result = await agentNetworkService.getLiquidityHistory(agentId, {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // Format as Open Banking liquidity logs
    const formattedLogs = result.logs.map((logEntry: any) => ({
      LogId: logEntry.id,
      AgentId: logEntry.agent_id,
      LiquidityBalance: parseFloat(logEntry.liquidity_balance.toString()),
      CashOnHand: parseFloat(logEntry.cash_on_hand.toString()),
      Timestamp: logEntry.timestamp.toISOString(),
      Notes: logEntry.notes || null,
    }));

    return helpers.paginated(
      formattedLogs,
      'LiquidityHistory',
      `/api/v1/agents/${agentId}/liquidity-history`,
      page,
      pageSize,
      result.total,
      req,
      undefined,
      fromDate,
      toDate,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting agent liquidity history:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving agent liquidity history',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetLiquidityHistory,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
