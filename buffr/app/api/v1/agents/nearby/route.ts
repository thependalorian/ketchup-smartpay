/**
 * Open Banking API: /api/v1/agents/nearby
 * 
 * Find nearby agents (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

async function handleGetNearbyAgents(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radiusKm = searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')!) : 10;
    const minLiquidity = searchParams.get('min_liquidity') ? parseFloat(searchParams.get('min_liquidity')!) : undefined;

    if (!latitude || !longitude) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'latitude and longitude query parameters are required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field latitude is missing',
            'latitude'
          ),
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field longitude is missing',
            'longitude'
          ),
        ]
      );
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid latitude or longitude',
        400
      );
    }

    const agents = await agentNetworkService.findNearbyAgents(lat, lon, radiusKm, minLiquidity);

    // Format as Open Banking
    const formattedAgents = agents.map((agent: any) => ({
      AgentId: agent.id,
      Name: agent.name,
      Type: agent.type,
      Location: agent.location,
      Coordinates: agent.latitude && agent.longitude ? {
        Latitude: parseFloat(agent.latitude.toString()),
        Longitude: parseFloat(agent.longitude.toString()),
      } : null,
      Liquidity: {
        Balance: parseFloat(agent.liquidity_balance.toString()),
        CashOnHand: parseFloat(agent.cash_on_hand.toString()),
        MinRequired: parseFloat(agent.min_liquidity_required.toString()),
        HasSufficient: agent.liquidity_balance >= agent.min_liquidity_required,
      },
      Limits: {
        MaxDailyCashout: parseFloat(agent.max_daily_cashout.toString()),
      },
      Commission: {
        Rate: parseFloat(agent.commission_rate.toString()),
      },
      Status: agent.status,
    }));

    const nearbyAgentsResponse = {
      Data: {
        Agents: formattedAgents,
        Total: formattedAgents.length,
        SearchParams: {
          Latitude: lat,
          Longitude: lon,
          RadiusKm: radiusKm,
          MinLiquidity: minLiquidity || null,
        },
      },
      Links: {
        Self: `/api/v1/agents/nearby?latitude=${lat}&longitude=${lon}`,
      },
      Meta: {},
    };

    return helpers.success(
      nearbyAgentsResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error finding nearby agents:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while finding nearby agents',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetNearbyAgents,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
