/**
 * Open Banking API: /api/v1/merchants/{merchantId}
 * 
 * Get merchant details (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetMerchant(
  req: ExpoRequest,
  { params }: { params: { merchantId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { merchantId } = params;

    const merchants = await query<any>(
      `SELECT 
        id, name, category, location, address, latitude, longitude,
        cashback_rate, is_active, is_open, phone, email, opening_hours, qr_code
      FROM merchants
      WHERE id = $1 AND is_active = TRUE`,
      [merchantId]
    );

    if (merchants.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Merchant not found',
        404
      );
    }

    const merchant = merchants[0];

    const response = {
      Data: {
        Merchant: {
          MerchantId: merchant.id,
          Name: merchant.name,
          Category: merchant.category,
          Location: merchant.location,
          Address: merchant.address || null,
          Coordinates: merchant.latitude && merchant.longitude ? {
            Latitude: parseFloat(merchant.latitude.toString()),
            Longitude: parseFloat(merchant.longitude.toString()),
          } : null,
          Cashback: {
            Rate: parseFloat(merchant.cashback_rate.toString()),
          },
          Status: {
            IsActive: merchant.is_active || false,
            IsOpen: merchant.is_open || false,
          },
          Contact: {
            Phone: merchant.phone || null,
            Email: merchant.email || null,
          },
          OpeningHours: merchant.opening_hours || null,
          QRCode: merchant.qr_code || null,
        },
      },
      Links: {
        Self: `/api/v1/merchants/${merchantId}`,
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
    log.error('Error fetching merchant:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching merchant',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetMerchant,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
