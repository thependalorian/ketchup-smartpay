/**
 * Agents API Route
 * 
 * Location: app/api/agents/route.ts
 * Purpose: List available agents with liquidity status
 * 
 * Features:
 * - List all agents with filters
 * - Show liquidity status
 * - Filter by location, type, status
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'active' | 'inactive' | 'suspended' | 'pending_approval' | undefined;
    const type = searchParams.get('type') as 'small' | 'medium' | 'large' | undefined;
    const location = searchParams.get('location');
    const minLiquidity = searchParams.get('min_liquidity') ? parseFloat(searchParams.get('min_liquidity')!) : undefined;
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined;
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined;
    const radiusKm = searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')!) : 10;

    let agents;

    // If coordinates provided, find nearby agents
    if (latitude !== undefined && longitude !== undefined) {
      agents = await agentNetworkService.findNearbyAgents(
        latitude,
        longitude,
        radiusKm,
        minLiquidity
      );
    } else {
      // List all agents with filters
      agents = await agentNetworkService.listAgents({
        status,
        type,
        location: location || undefined,
        minLiquidity,
      });
    }

    // Format response with liquidity status
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      location: agent.location,
      coordinates: agent.latitude && agent.longitude
        ? { latitude: parseFloat(agent.latitude.toString()), longitude: parseFloat(agent.longitude.toString()) }
        : null,
      liquidity: {
        balance: parseFloat(agent.liquidity_balance.toString()),
        cashOnHand: parseFloat(agent.cash_on_hand.toString()),
        minRequired: parseFloat(agent.min_liquidity_required.toString()),
        hasSufficient: agent.liquidity_balance >= agent.min_liquidity_required,
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
    }));

    return successResponse({
      agents: formattedAgents,
      total: formattedAgents.length,
    }, 'Agents retrieved successfully');
  } catch (error: any) {
    logger.error('Error listing agents', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve agents',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
