/**
 * Open Banking API: /api/v1/nampost/branches
 * 
 * NamPost branch locations (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { namPostService } from '@/services/namPostService';
import { log } from '@/utils/logger';

async function handleGetBranches(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')!) : undefined;
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')!) : undefined;
    const radiusKm = searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')!) : 50;

    let branches;

    // If coordinates provided, find nearby branches
    if (latitude !== undefined && longitude !== undefined) {
      branches = await namPostService.findNearbyBranches(latitude, longitude, radiusKm);
    } else {
      // List all branches with optional location filter
      branches = await namPostService.listBranches(location || undefined);
    }

    // Format as Open Banking
    const formattedBranches = branches.map((branch: any) => ({
      BranchId: branch.id,
      Name: branch.name,
      Location: branch.location,
      Address: branch.address,
      PhoneNumber: branch.phoneNumber,
      Coordinates: branch.latitude && branch.longitude ? {
        Latitude: parseFloat(branch.latitude.toString()),
        Longitude: parseFloat(branch.longitude.toString()),
      } : null,
      OperatingHours: branch.operatingHours,
      Services: branch.services,
    }));

    // For pagination, use simple approach (no DB pagination for external service)
    const { page, pageSize } = parsePaginationParams(req);
    const total = formattedBranches.length;
    const offset = (page - 1) * pageSize;
    const paginatedBranches = formattedBranches.slice(offset, offset + pageSize);

    return helpers.paginated(
      paginatedBranches,
      'Branches',
      '/api/v1/nampost/branches',
      page,
      pageSize,
      total,
      req,
      location ? { location } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching NamPost branches:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching branches',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBranches,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
