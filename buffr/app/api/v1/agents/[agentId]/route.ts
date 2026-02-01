/**
 * Open Banking API: /api/v1/agents/{agentId}
 * 
 * Get or update agent details (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { validateAmount } from '@/utils/validators';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/agents/{agentId}
 * Get agent details
 */
async function handleGetAgent(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { agentId } = params;

    const agent = await agentNetworkService.getAgent(agentId);

    if (!agent) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Agent not found',
        404
      );
    }

    // Get liquidity status
    const liquidityStatus = await agentNetworkService.checkLiquidityStatus(agentId);

    const agentResponse = {
      Data: {
        AgentId: agent.id,
        Name: agent.name,
        Type: agent.type,
        Location: agent.location,
        Coordinates: agent.latitude && agent.longitude ? {
          Latitude: parseFloat(agent.latitude.toString()),
          Longitude: parseFloat(agent.longitude.toString()),
        } : null,
        WalletId: agent.wallet_id,
        Liquidity: {
          Balance: parseFloat(agent.liquidity_balance.toString()),
          CashOnHand: parseFloat(agent.cash_on_hand.toString()),
          MinRequired: parseFloat(agent.min_liquidity_required.toString()),
          HasSufficient: liquidityStatus.hasSufficientLiquidity,
          CanProcessCashOut: liquidityStatus.canProcessCashOut,
        },
        Limits: {
          MaxDailyCashout: parseFloat(agent.max_daily_cashout.toString()),
        },
        Commission: {
          Rate: parseFloat(agent.commission_rate.toString()),
        },
        Status: agent.status,
        CreatedDateTime: agent.created_at.toISOString(),
        UpdatedDateTime: agent.updated_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/agents/${agentId}`,
      },
      Meta: {},
    };

    return helpers.success(
      agentResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting agent:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving the agent',
      500
    );
  }
}

/**
 * PUT /api/v1/agents/{agentId}
 * Update agent details (admin only)
 */
async function handleUpdateAgent(
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

    const { Name, Type, Location, Latitude, Longitude, MinLiquidityRequired, MaxDailyCashout, CommissionRate, Status } = Data;

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (Name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(Name);
    }

    if (Type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      params.push(Type);
    }

    if (Location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      params.push(Location);
    }

    if (Latitude !== undefined) {
      updates.push(`latitude = $${paramIndex++}`);
      params.push(Latitude);
    }

    if (Longitude !== undefined) {
      updates.push(`longitude = $${paramIndex++}`);
      params.push(Longitude);
    }

    if (MinLiquidityRequired !== undefined) {
      const amountCheck = validateAmount(MinLiquidityRequired, { min: 0 });
      if (!amountCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.AMOUNT_INVALID,
          amountCheck.error || 'Invalid min liquidity required',
          400
        );
      }
      updates.push(`min_liquidity_required = $${paramIndex++}`);
      params.push(MinLiquidityRequired);
    }

    if (MaxDailyCashout !== undefined) {
      const amountCheck = validateAmount(MaxDailyCashout, { min: 0 });
      if (!amountCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.AMOUNT_INVALID,
          amountCheck.error || 'Invalid max daily cashout',
          400
        );
      }
      updates.push(`max_daily_cashout = $${paramIndex++}`);
      params.push(MaxDailyCashout);
    }

    if (CommissionRate !== undefined) {
      const amountCheck = validateAmount(CommissionRate, { min: 0, max: 100 });
      if (!amountCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.AMOUNT_INVALID,
          amountCheck.error || 'Invalid commission rate',
          400
        );
      }
      updates.push(`commission_rate = $${paramIndex++}`);
      params.push(CommissionRate);
    }

    if (Status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(Status);
    }

    if (updates.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'No fields to update',
        400
      );
    }

    updates.push(`updated_at = NOW()`);
    params.push(agentId);

    const sql = `UPDATE agents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);

    if (result.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Agent not found',
        404
      );
    }

    const agent = result[0];

    const agentResponse = {
      Data: {
        AgentId: agent.id,
        Name: agent.name,
        Type: agent.type,
        Location: agent.location,
        Status: agent.status,
        UpdatedDateTime: agent.updated_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/agents/${agentId}`,
      },
      Meta: {},
    };

    return helpers.success(
      agentResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error updating agent:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating the agent',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetAgent,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdateAgent,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
