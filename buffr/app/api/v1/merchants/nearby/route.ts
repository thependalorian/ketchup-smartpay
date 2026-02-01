/**
 * Open Banking API: /api/v1/merchants/nearby
 * 
 * Find nearby merchants (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetNearbyMerchants(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const { searchParams } = new URL(req.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radiusKm = searchParams.get('radius_km') ? parseFloat(searchParams.get('radius_km')!) : 10;
    const category = searchParams.get('category');

    // Build query
    let queryText = `
      SELECT 
        id, name, category, location, address, latitude, longitude,
        cashback_rate, is_active, is_open, phone, email, opening_hours
      FROM merchants
      WHERE is_active = TRUE
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      queryText += ` AND category = $${paramIndex++}`;
      params.push(category);
    }

    // If coordinates provided, filter by distance
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lon)) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID_FORMAT,
          'Invalid latitude or longitude',
          400
        );
      }

      // Use PostGIS or simple distance calculation
      // For now, use simple bounding box (can be improved with PostGIS)
      queryText += ` AND latitude IS NOT NULL AND longitude IS NOT NULL
                     AND (
                       (latitude BETWEEN $${paramIndex} - 0.1 AND $${paramIndex} + 0.1) AND
                       (longitude BETWEEN $${paramIndex + 1} - 0.1 AND $${paramIndex + 1} + 0.1)
                     )`;
      params.push(lat, lon);
      paramIndex += 2;
    }

    queryText += ` ORDER BY name ASC`;

    const merchants = await query<any>(queryText, params);

    // Calculate distance if coordinates provided
    const formattedMerchants = merchants.map((m: any) => {
      let distance: number | null = null;
      if (latitude && longitude && m.latitude && m.longitude) {
        const lat1 = parseFloat(latitude);
        const lon1 = parseFloat(longitude);
        const lat2 = parseFloat(m.latitude.toString());
        const lon2 = parseFloat(m.longitude.toString());
        
        // Haversine formula for distance calculation
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      return {
        MerchantId: m.id,
        Name: m.name,
        Category: m.category,
        Location: m.location,
        Address: m.address || null,
        Coordinates: m.latitude && m.longitude ? {
          Latitude: parseFloat(m.latitude.toString()),
          Longitude: parseFloat(m.longitude.toString()),
        } : null,
        Distance: distance ? parseFloat(distance.toFixed(2)) : null,
        Cashback: {
          Rate: parseFloat(m.cashback_rate.toString()),
        },
        Status: {
          IsActive: m.is_active || false,
          IsOpen: m.is_open || false,
        },
        Contact: {
          Phone: m.phone || null,
          Email: m.email || null,
        },
        OpeningHours: m.opening_hours || null,
      };
    });

    // Filter by radius if provided
    const filteredMerchants = latitude && longitude
      ? formattedMerchants.filter((m: any) => !m.Distance || m.Distance <= radiusKm)
      : formattedMerchants;

    const response = {
      Data: {
        Merchants: filteredMerchants,
        Total: filteredMerchants.length,
        SearchParams: latitude && longitude ? {
          Latitude: parseFloat(latitude),
          Longitude: parseFloat(longitude),
          RadiusKm: radiusKm,
        } : null,
      },
      Links: {
        Self: '/api/v1/merchants/nearby',
      },
      Meta: {},
    };

    return helpers.success(
      response,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error finding nearby merchants:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while finding nearby merchants',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetNearbyMerchants,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
