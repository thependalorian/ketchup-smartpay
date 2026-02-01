/**
 * Find Nearby Agents API Route
 * 
 * Location: app/api/agents/nearby/route.ts
 * Purpose: Find nearby agents with available liquidity
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radiusKm = searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')!) : 10;
    const minLiquidity = searchParams.get('min_liquidity') ? parseFloat(searchParams.get('min_liquidity')!) : undefined;

    if (!latitude || !longitude) {
      return errorResponse('latitude and longitude are required', HttpStatus.BAD_REQUEST);
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return errorResponse('Invalid latitude or longitude', HttpStatus.BAD_REQUEST);
    }

    const agents = await agentNetworkService.findNearbyAgents(lat, lon, radiusKm, minLiquidity);

    // Format response
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
    }));

    return successResponse({
      agents: formattedAgents,
      total: formattedAgents.length,
      searchParams: {
        latitude: lat,
        longitude: lon,
        radiusKm,
        minLiquidity,
      },
    }, 'Nearby agents retrieved successfully');
  } catch (error: any) {
    logger.error('Error finding nearby agents', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to find nearby agents',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
