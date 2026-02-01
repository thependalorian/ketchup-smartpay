/**
 * Open Banking API: /api/v1/agents/{agentId}/settlement
 * 
 * Get or process agent settlements (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/agents/{agentId}/settlement
 * Get settlement history
 */
async function handleGetSettlement(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { agentId } = params;
    const { searchParams } = new URL(req.url);
    const settlementPeriod = searchParams.get('period'); // e.g., "2026-01"

    if (settlementPeriod) {
      // Get specific settlement
      const settlements = await query<any>(
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
        return helpers.error(
          OpenBankingErrorCode.RESOURCE_NOT_FOUND,
          'Settlement not found',
          404
        );
      }

      const settlement = settlements[0];

      const settlementResponse = {
        Data: {
          SettlementId: settlement.id,
          AgentId: settlement.agent_id,
          Period: settlement.settlement_period,
          TotalAmount: parseFloat(settlement.total_amount.toString()),
          Commission: parseFloat(settlement.commission.toString()),
          Status: settlement.settlement_status,
          SettledDateTime: settlement.settled_at?.toISOString() || null,
          CreatedDateTime: settlement.created_at.toISOString(),
        },
        Links: {
          Self: `/api/v1/agents/${agentId}/settlement?period=${settlementPeriod}`,
        },
        Meta: {},
      };

      return helpers.success(
        settlementResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    } else {
      // Get all settlements for agent
      const { page, pageSize } = parsePaginationParams(req);
      const offset = (page - 1) * pageSize;

      const settlements = await query<any>(
        `SELECT 
          id, settlement_period, total_amount, commission,
          settlement_status, settled_at, created_at
        FROM agent_settlements
        WHERE agent_id = $1
        ORDER BY settlement_period DESC
        LIMIT $2 OFFSET $3`,
        [agentId, pageSize, offset]
      );

      // Get total count
      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM agent_settlements WHERE agent_id = $1',
        [agentId]
      );
      const total = parseInt(countResult[0]?.count || '0', 10);

      const formattedSettlements = settlements.map((s: any) => ({
        SettlementId: s.id,
        Period: s.settlement_period,
        TotalAmount: parseFloat(s.total_amount.toString()),
        Commission: parseFloat(s.commission.toString()),
        Status: s.settlement_status,
        SettledDateTime: s.settled_at?.toISOString() || null,
        CreatedDateTime: s.created_at.toISOString(),
      }));

      return helpers.paginated(
        formattedSettlements,
        'Settlements',
        `/api/v1/agents/${agentId}/settlement`,
        page,
        pageSize,
        total,
        req,
        undefined,
        undefined,
        undefined,
        context?.requestId
      );
    }
  } catch (error) {
    log.error('Error getting agent settlements:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving settlements',
      500
    );
  }
}

/**
 * POST /api/v1/agents/{agentId}/settlement
 * Process new settlement (admin only)
 */
async function handleProcessSettlement(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { agentId } = params;
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { SettlementPeriod } = Data;

    if (!SettlementPeriod) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.SettlementPeriod is required (format: YYYY-MM)',
        400
      );
    }

    // Validate period format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(SettlementPeriod)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid settlement period format. Use YYYY-MM (e.g., 2026-01)',
        400
      );
    }

    // Process settlement
    const settlement = await agentNetworkService.processSettlement(agentId, SettlementPeriod);

    const settlementResponse = {
      Data: {
        SettlementId: settlement.id,
        AgentId: settlement.agent_id,
        Period: settlement.settlement_period,
        TotalAmount: parseFloat(settlement.total_amount.toString()),
        Commission: parseFloat(settlement.commission.toString()),
        Status: settlement.settlement_status,
        CreatedDateTime: settlement.created_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/agents/${agentId}/settlement?period=${SettlementPeriod}`,
      },
      Meta: {},
    };

    return helpers.created(
      settlementResponse,
      `/api/v1/agents/${agentId}/settlement?period=${SettlementPeriod}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error processing settlement:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the settlement',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetSettlement,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleProcessSettlement,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
