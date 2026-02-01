/**
 * Open Banking API: /api/v1/agents/dashboard
 * 
 * Agent dashboard data (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

async function handleGetDashboard(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agent_id');

    if (!agentId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'agent_id query parameter is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field agent_id is missing',
            'agent_id'
          ),
        ]
      );
    }

    // Get agent details
    const agent = await agentNetworkService.getAgent(agentId);
    if (!agent) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Agent not found',
        404
      );
    }

    // Get today's transactions
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = await agentNetworkService.getAgentTransactions(agentId, {
      fromDate: today,
      limit: 100,
    });

    // Get this month's transactions
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const monthTransactions = await agentNetworkService.getAgentTransactions(agentId, {
      fromDate: firstDayOfMonth,
      limit: 1000,
    });

    // Calculate statistics
    const todayTotal = todayTransactions.transactions.reduce(
      (sum: number, tx: any) => sum + parseFloat(tx.amount.toString()),
      0
    );
    const monthTotal = monthTransactions.transactions.reduce(
      (sum: number, tx: any) => sum + parseFloat(tx.amount.toString()),
      0
    );
    const todayCount = todayTransactions.transactions.length;
    const monthCount = monthTransactions.transactions.length;

    // Get liquidity status
    const liquidityStatus = await agentNetworkService.checkLiquidityStatus(agentId);

    const dashboardResponse = {
      Data: {
        Agent: {
          AgentId: agent.id,
          Name: agent.name,
          Type: agent.type,
          Location: agent.location,
          Status: agent.status,
        },
        Liquidity: {
          Balance: parseFloat(agent.liquidity_balance.toString()),
          CashOnHand: parseFloat(agent.cash_on_hand.toString()),
          MinRequired: parseFloat(agent.min_liquidity_required.toString()),
          HasSufficient: liquidityStatus.hasSufficientLiquidity,
          CanProcessCashOut: liquidityStatus.canProcessCashOut,
        },
        Statistics: {
          Today: {
            TransactionCount: todayCount,
            TotalAmount: todayTotal,
          },
          ThisMonth: {
            TransactionCount: monthCount,
            TotalAmount: monthTotal,
          },
        },
        Limits: {
          MaxDailyCashout: parseFloat(agent.max_daily_cashout.toString()),
          RemainingToday: Math.max(0, parseFloat(agent.max_daily_cashout.toString()) - todayTotal),
        },
        Commission: {
          Rate: parseFloat(agent.commission_rate.toString()),
          EstimatedThisMonth: agentNetworkService.calculateCommission(monthTotal, parseFloat(agent.commission_rate.toString())),
        },
      },
      Links: {
        Self: `/api/v1/agents/dashboard?agent_id=${agentId}`,
      },
      Meta: {},
    };

    return helpers.success(
      dashboardResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting agent dashboard:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving the agent dashboard',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetDashboard,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
