/**
 * Open Banking API: /api/v1/vouchers/find-by-qr
 * 
 * Find voucher by QR code (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query } from '@/utils/db';
import { parseNAMQR } from '@/utils/namqr';
import { log } from '@/utils/logger';

async function handleFindByQR(req: ExpoRequest) {
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

    const body = await req.json();
    const { Data } = body;

    if (!Data || !Data.QRCode) {
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

    const { QRCode } = Data;

    // Parse NamQR code
    const parseResult = parseNAMQR(QRCode);
    
    if (!parseResult.data || parseResult.error) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        `Invalid NamQR code: ${parseResult.error || 'Failed to parse QR code'}`,
        400
      );
    }

    const namqrData = parseResult.data;
    const tokenVaultId = namqrData.tokenVaultUniqueIdentifier;

    // Find voucher by NamQR code
    let voucher = await query<any>(
      `SELECT * FROM vouchers 
       WHERE (namqr_code = $1 OR namqr_code LIKE $2)
       AND user_id = $3
       AND status = 'available'
       AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
       ORDER BY created_at DESC
       LIMIT 1`,
      [QRCode, `%${tokenVaultId}%`, actualUserId]
    );

    // If not found by exact match, try token vault ID in metadata
    if (voucher.length === 0 && tokenVaultId) {
      voucher = await query<any>(
        `SELECT * FROM vouchers 
         WHERE metadata::text LIKE $1
         AND user_id = $2
         AND status = 'available'
         AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
         ORDER BY created_at DESC
         LIMIT 1`,
        [`%${tokenVaultId}%`, actualUserId]
      );
    }

    if (voucher.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Voucher not found or already redeemed',
        404
      );
    }

    const v = voucher[0];

    const voucherResponse = {
      Data: {
        VoucherId: v.id,
        UserId: v.user_id,
        Type: v.type,
        Title: v.title,
        Description: v.description,
        Amount: parseFloat(v.amount.toString()),
        Status: v.status,
        ExpiryDate: v.expiry_date ? v.expiry_date.toISOString() : null,
        Issuer: v.issuer,
        NamQRCode: v.namqr_code,
        CreatedDateTime: v.created_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/vouchers/${v.id}`,
        Redeem: `/api/v1/vouchers/${v.id}/redeem`,
      },
      Meta: {},
    };

    return helpers.success(
      voucherResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error finding voucher by QR:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while finding the voucher',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleFindByQR,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
