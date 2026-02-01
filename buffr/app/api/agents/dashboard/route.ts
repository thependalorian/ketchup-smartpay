/**
 * Agent Dashboard API Route
 * 
 * Location: app/api/agents/dashboard/route.ts
 * Purpose: Get agent dashboard data (summary statistics)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agent_id');

    if (!agentId) {
      return errorResponse('agent_id is required', HttpStatus.BAD_REQUEST);
    }

    // Get agent details
    const agent = await agentNetworkService.getAgent(agentId);
    if (!agent) {
      return errorResponse('Agent not found', HttpStatus.NOT_FOUND);
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
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0
    );
    const monthTotal = monthTransactions.transactions.reduce(
      (sum, tx) => sum + parseFloat(tx.amount.toString()),
      0
    );
    const todayCount = todayTransactions.transactions.length;
    const monthCount = monthTransactions.transactions.length;

    // Get liquidity status
    const liquidityStatus = await agentNetworkService.checkLiquidityStatus(agentId);

    return successResponse({
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        location: agent.location,
        status: agent.status,
      },
      liquidity: {
        balance: parseFloat(agent.liquidity_balance.toString()),
        cashOnHand: parseFloat(agent.cash_on_hand.toString()),
        minRequired: parseFloat(agent.min_liquidity_required.toString()),
        hasSufficient: liquidityStatus.hasSufficientLiquidity,
        canProcessCashOut: liquidityStatus.canProcessCashOut,
      },
      statistics: {
        today: {
          transactionCount: todayCount,
          totalAmount: todayTotal,
        },
        thisMonth: {
          transactionCount: monthCount,
          totalAmount: monthTotal,
        },
      },
      limits: {
        maxDailyCashout: parseFloat(agent.max_daily_cashout.toString()),
        remainingToday: Math.max(0, parseFloat(agent.max_daily_cashout.toString()) - todayTotal),
      },
      commission: {
        rate: parseFloat(agent.commission_rate.toString()),
        estimatedThisMonth: agentNetworkService.calculateCommission(monthTotal, parseFloat(agent.commission_rate.toString())),
      },
    }, 'Agent dashboard data retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting agent dashboard', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve agent dashboard',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
