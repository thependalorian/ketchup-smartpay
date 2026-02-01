/**
 * Agent Settlement API Route
 * 
 * Location: app/api/agents/[id]/settlement/route.ts
 * Purpose: Get or process agent settlements
 * 
 * Methods:
 * - GET: Get settlement history
 * - POST: Process new settlement (admin only)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest, { id: agentId }: { id: string }) {
  try {
    const { searchParams } = new URL(req.url);
    const settlementPeriod = searchParams.get('period'); // e.g., "2026-01"

    if (settlementPeriod) {
      // Get specific settlement
      const settlements = await query<{
        id: string;
        agent_id: string;
        settlement_period: string;
        total_amount: number;
        commission: number;
        settlement_status: string;
        settled_at: Date | null;
        created_at: Date;
      }>(
        `SELECT 
          id, agent_id, settlement_period, total_amount, commission,
          settlement_status, settled_at, created_at
        FROM agent_settlements
        WHERE agent_id = $1 AND settlement_period = $2
        ORDER BY created_at DESC
        LIMIT 1`,
        [agentId, settlementPeriod]
      );

      if (settlements.length === 0) {
        return errorResponse('Settlement not found', HttpStatus.NOT_FOUND);
      }

      const settlement = settlements[0];
      return successResponse({
        id: settlement.id,
        agentId: settlement.agent_id,
        period: settlement.settlement_period,
        totalAmount: parseFloat(settlement.total_amount.toString()),
        commission: parseFloat(settlement.commission.toString()),
        status: settlement.settlement_status,
        settledAt: settlement.settled_at?.toISOString() || null,
        createdAt: settlement.created_at.toISOString(),
      }, 'Settlement retrieved successfully');
    } else {
      // Get all settlements for agent
      const settlements = await query<{
        id: string;
        settlement_period: string;
        total_amount: number;
        commission: number;
        settlement_status: string;
        settled_at: Date | null;
        created_at: Date;
      }>(
        `SELECT 
          id, settlement_period, total_amount, commission,
          settlement_status, settled_at, created_at
        FROM agent_settlements
        WHERE agent_id = $1
        ORDER BY settlement_period DESC
        LIMIT 50`,
        [agentId]
      );

      const formattedSettlements = settlements.map(s => ({
        id: s.id,
        period: s.settlement_period,
        totalAmount: parseFloat(s.total_amount.toString()),
        commission: parseFloat(s.commission.toString()),
        status: s.settlement_status,
        settledAt: s.settled_at?.toISOString() || null,
        createdAt: s.created_at.toISOString(),
      }));

      return successResponse({
        settlements: formattedSettlements,
        total: formattedSettlements.length,
      }, 'Settlements retrieved successfully');
    }
  } catch (error: any) {
    logger.error('Error getting agent settlements', error, { agentId });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve settlements',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest, { id: agentId }: { id: string }) {
  try {
    const body = await req.json();
    const { settlementPeriod } = body;

    if (!settlementPeriod) {
      return errorResponse('settlementPeriod is required (format: YYYY-MM)', HttpStatus.BAD_REQUEST);
    }

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(settlementPeriod)) {
      return errorResponse('Invalid settlement period format. Use YYYY-MM (e.g., 2026-01)', HttpStatus.BAD_REQUEST);
    }

    // Process settlement
    const settlement = await agentNetworkService.processSettlement(agentId, settlementPeriod);

    return createdResponse(
      {
        id: settlement.id,
        agentId: settlement.agent_id,
        period: settlement.settlement_period,
        totalAmount: parseFloat(settlement.total_amount.toString()),
        commission: parseFloat(settlement.commission.toString()),
        status: settlement.settlement_status,
        createdAt: settlement.created_at.toISOString(),
      },
      `/api/agents/${agentId}/settlement?period=${settlementPeriod}`,
      'Settlement processed successfully'
    );
  } catch (error: any) {
    logger.error('Error processing settlement', error, { agentId });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process settlement',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
