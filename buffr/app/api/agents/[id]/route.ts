/**
 * Agent Details API Route
 * 
 * Location: app/api/agents/[id]/route.ts
 * Purpose: Get or update agent details
 * 
 * Methods:
 * - GET: Get agent details
 * - PUT: Update agent details (admin only)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import { validateAmount } from '@/utils/validators';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest, { id }: { id: string }) {
  try {
    const agent = await agentNetworkService.getAgent(id);

    if (!agent) {
      return errorResponse('Agent not found', HttpStatus.NOT_FOUND);
    }

    // Get liquidity status
    const liquidityStatus = await agentNetworkService.checkLiquidityStatus(id);

    return successResponse({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      location: agent.location,
      coordinates: agent.latitude && agent.longitude
        ? { latitude: parseFloat(agent.latitude.toString()), longitude: parseFloat(agent.longitude.toString()) }
        : null,
      walletId: agent.wallet_id,
      liquidity: {
        balance: parseFloat(agent.liquidity_balance.toString()),
        cashOnHand: parseFloat(agent.cash_on_hand.toString()),
        minRequired: parseFloat(agent.min_liquidity_required.toString()),
        hasSufficient: liquidityStatus.hasSufficientLiquidity,
        canProcessCashOut: liquidityStatus.canProcessCashOut,
      },
      limits: {
        maxDailyCashout: parseFloat(agent.max_daily_cashout.toString()),
      },
      commission: {
        rate: parseFloat(agent.commission_rate.toString()),
      },
      status: agent.status,
      createdAt: agent.created_at.toISOString(),
      updatedAt: agent.updated_at.toISOString(),
    }, 'Agent details retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting agent', error, { agentId: id });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve agent',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function putHandler(req: ExpoRequest, { id }: { id: string }) {
  try {
    const body = await req.json();
    const {
      name,
      type,
      location,
      latitude,
      longitude,
      minLiquidityRequired,
      maxDailyCashout,
      commissionRate,
      status,
    } = body;

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }

    if (type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      params.push(type);
    }

    if (location !== undefined) {
      updates.push(`location = $${paramIndex++}`);
      params.push(location);
    }

    if (latitude !== undefined) {
      updates.push(`latitude = $${paramIndex++}`);
      params.push(latitude);
    }

    if (longitude !== undefined) {
      updates.push(`longitude = $${paramIndex++}`);
      params.push(longitude);
    }

    if (minLiquidityRequired !== undefined) {
      const amountCheck = validateAmount(minLiquidityRequired, { min: 0 });
      if (!amountCheck.valid) {
        return errorResponse(amountCheck.error || 'Invalid min liquidity required', HttpStatus.BAD_REQUEST);
      }
      updates.push(`min_liquidity_required = $${paramIndex++}`);
      params.push(minLiquidityRequired);
    }

    if (maxDailyCashout !== undefined) {
      const amountCheck = validateAmount(maxDailyCashout, { min: 0 });
      if (!amountCheck.valid) {
        return errorResponse(amountCheck.error || 'Invalid max daily cashout', HttpStatus.BAD_REQUEST);
      }
      updates.push(`max_daily_cashout = $${paramIndex++}`);
      params.push(maxDailyCashout);
    }

    if (commissionRate !== undefined) {
      const amountCheck = validateAmount(commissionRate, { min: 0, max: 100 });
      if (!amountCheck.valid) {
        return errorResponse(amountCheck.error || 'Invalid commission rate', HttpStatus.BAD_REQUEST);
      }
      updates.push(`commission_rate = $${paramIndex++}`);
      params.push(commissionRate);
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', HttpStatus.BAD_REQUEST);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const sql = `UPDATE agents SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await query(sql, params);

    if (result.length === 0) {
      return errorResponse('Agent not found', HttpStatus.NOT_FOUND);
    }

    return successResponse(result[0], 'Agent updated successfully');
  } catch (error: any) {
    logger.error('Error updating agent', error, { agentId: id });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update agent',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAdminRoute(RATE_LIMITS.admin, putHandler);
