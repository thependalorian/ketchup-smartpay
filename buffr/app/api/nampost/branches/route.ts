/**
 * NamPost Branches API Route
 * 
 * Location: app/api/nampost/branches/route.ts
 * Purpose: Get NamPost branch locations
 * 
 * Integration: NamPost API for branch information
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { namPostService } from '@/services/namPostService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location'); // Filter by location/city
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

    return successResponse({
      branches,
      total: branches.length,
    }, 'NamPost branches retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting NamPost branches', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve NamPost branches',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
