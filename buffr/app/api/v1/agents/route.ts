/**
 * Open Banking API: /api/v1/agents
 * 
 * Agent network management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

async function handleGetAgents(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
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
      CreatedDateTime: agent.created_at.toISOString(),
      UpdatedDateTime: agent.updated_at.toISOString(),
    }));

    // Pagination
    const { page, pageSize } = parsePaginationParams(req);
    const total = formattedAgents.length;
    const offset = (page - 1) * pageSize;
    const paginatedAgents = formattedAgents.slice(offset, offset + pageSize);

    return helpers.paginated(
      paginatedAgents,
      'Agents',
      '/api/v1/agents',
      page,
      pageSize,
      total,
      req,
      status ? { status } : type ? { type } : location ? { location } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching agents:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching agents',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetAgents,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
