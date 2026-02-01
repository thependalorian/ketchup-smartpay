/**
 * Open Banking API: /api/v1/merchants/validate-qr
 * 
 * Validate merchant QR code (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleValidateQR(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Data is missing',
            'Data'
          ),
        ]
      );
    }

    const { QRCode } = Data;

    if (!QRCode) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.QRCode is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field QRCode is missing',
            'Data.QRCode'
          ),
        ]
      );
    }

    // Find merchant by QR code
    const merchants = await query<any>(
      `SELECT 
        id, name, category, location, address, latitude, longitude,
        cashback_rate, is_active, is_open, phone, email, opening_hours, qr_code
      FROM merchants
      WHERE qr_code = $1 AND is_active = TRUE`,
      [QRCode]
    );

    if (merchants.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Merchant not found for this QR code',
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
        },
        IsValid: true,
      },
      Links: {
        Self: '/api/v1/merchants/validate-qr',
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
    log.error('Error validating merchant QR code:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while validating QR code',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleValidateQR,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
