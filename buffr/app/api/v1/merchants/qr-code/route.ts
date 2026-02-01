/**
 * Open Banking API: /api/v1/merchants/qr-code
 * 
 * Merchant QR code generation (Open Banking format)
 * 
 * Compliance: NamQR Standards v5.0, Purpose Code 19
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateAmount, validateCurrency } from '@/utils/validators';
import { generateMerchantNAMQR } from '@/utils/voucherNamQR';
import { tokenVaultService } from '@/services/tokenVaultService';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/merchants/qr-code
 * Get merchant QR code history or retrieve existing QR code
 */
async function handleGetQRCode(req: ExpoRequest) {
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
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchant_id');
    const qrCodeId = searchParams.get('qr_code_id');

    if (qrCodeId) {
      // Get specific QR code
      const qrCodes = await query<any>(
        `SELECT id, merchant_id, merchant_name, qr_code, token_vault_id, 
                amount, currency, is_static, purpose_code, created_at
         FROM merchant_qr_codes
         WHERE id = $1 AND (merchant_id = $2 OR $2 IS NULL)`,
        [qrCodeId, merchantId || actualUserId]
      );

      if (qrCodes.length === 0) {
        return helpers.error(
          OpenBankingErrorCode.RESOURCE_NOT_FOUND,
          'QR code not found',
          404
        );
      }

      const qrCode = qrCodes[0];
      const qrResponse = {
        Data: {
          QRCodeId: qrCode.id,
          MerchantId: qrCode.merchant_id,
          MerchantName: qrCode.merchant_name,
          QRCode: qrCode.qr_code,
          TokenVaultId: qrCode.token_vault_id,
          Amount: qrCode.amount ? parseFloat(qrCode.amount.toString()) : null,
          Currency: qrCode.currency || 'NAD',
          IsStatic: qrCode.is_static || false,
          PurposeCode: qrCode.purpose_code || '19',
          CreatedDateTime: qrCode.created_at?.toISOString() || null,
        },
        Links: {
          Self: `/api/v1/merchants/qr-code?qr_code_id=${qrCodeId}`,
        },
        Meta: {},
      };

      return helpers.success(
        qrResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    // Get QR code history for merchant
    if (!merchantId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'merchant_id or qr_code_id query parameter is required',
        400
      );
    }

    // Verify merchant access
    const merchant = await query<{ id: string; owner_id: string }>(
      'SELECT id, owner_id FROM merchants WHERE id = $1',
      [merchantId]
    );

    if (merchant.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Merchant not found',
        404
      );
    }

    if (merchant[0].owner_id !== actualUserId) {
      // Check if user is admin
      const user = await query<{ role: string }>(
        'SELECT role FROM users WHERE id = $1',
        [actualUserId]
      );

      if (user[0]?.role !== 'admin') {
        return helpers.error(
          OpenBankingErrorCode.FORBIDDEN,
          'Unauthorized: You do not have access to this merchant',
          403
        );
      }
    }

    const qrCodes = await query<any>(
      `SELECT id, merchant_id, merchant_name, qr_code, token_vault_id, 
              amount, currency, is_static, purpose_code, created_at
       FROM merchant_qr_codes
       WHERE merchant_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [merchantId]
    );

    const formattedQRCodes = qrCodes.map((qr: any) => ({
      QRCodeId: qr.id,
      MerchantId: qr.merchant_id,
      MerchantName: qr.merchant_name,
      QRCode: qr.qr_code,
      TokenVaultId: qr.token_vault_id,
      Amount: qr.amount ? parseFloat(qr.amount.toString()) : null,
      Currency: qr.currency || 'NAD',
      IsStatic: qr.is_static || false,
      PurposeCode: qr.purpose_code || '19',
      CreatedDateTime: qr.created_at?.toISOString() || null,
    }));

    const historyResponse = {
      Data: {
        QRCodes: formattedQRCodes,
        Count: formattedQRCodes.length,
      },
      Links: {
        Self: `/api/v1/merchants/qr-code?merchant_id=${merchantId}`,
      },
      Meta: {},
    };

    return helpers.success(
      historyResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting merchant QR code:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving the QR code',
      500
    );
  }
}

/**
 * POST /api/v1/merchants/qr-code
 * Generate merchant QR code
 */
async function handlePostQRCode(req: ExpoRequest) {
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
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const {
      MerchantId,
      MerchantName,
      Amount,
      Currency = 'NAD',
      Description,
      PurposeCode = '19',
      IsStatic = true,
    } = Data;

    // Validate required fields
    if (!MerchantName || MerchantName.trim().length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.MerchantName is required',
        400
      );
    }

    // If merchantId provided, verify merchant exists and user has access
    if (MerchantId) {
      const merchant = await query<{ id: string; owner_id: string }>(
        'SELECT id, owner_id FROM merchants WHERE id = $1',
        [MerchantId]
      );

      if (merchant.length === 0) {
        return helpers.error(
          OpenBankingErrorCode.RESOURCE_NOT_FOUND,
          'Merchant not found',
          404
        );
      }

      // Check if user is merchant owner or admin
      const user = await query<{ role: string }>(
        'SELECT role FROM users WHERE id = $1',
        [actualUserId]
      );

      if (merchant[0].owner_id !== actualUserId && user[0]?.role !== 'admin') {
        return helpers.error(
          OpenBankingErrorCode.FORBIDDEN,
          'Unauthorized: You do not have access to this merchant',
          403
        );
      }
    }

    // Validate amount if provided
    if (Amount !== undefined && Amount !== null) {
      const amountCheck = validateAmount(Amount, {
        min: 0.01,
        max: 1000000,
        maxDecimals: 2,
      });
      if (!amountCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          amountCheck.error || 'Invalid amount',
          400
        );
      }
    }

    // Validate currency
    const currencyCheck = validateCurrency(Currency);
    if (!currencyCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        currencyCheck.error || 'Invalid currency',
        400
      );
    }

    // Generate Token Vault ID
    const tokenVaultResult = await tokenVaultService.generateToken({
      merchantId: MerchantId || null,
      merchantName: MerchantName,
      amount: Amount || null,
      currency: Currency,
      purposeCode: PurposeCode,
      isStatic: IsStatic,
    });

    if (!tokenVaultResult.success || !tokenVaultResult.tokenVaultId) {
      return helpers.error(
        OpenBankingErrorCode.SERVER_ERROR,
        `Failed to generate Token Vault ID: ${tokenVaultResult.error || 'Unknown error'}`,
        500
      );
    }

    // Generate NamQR code
    const namqrCode = generateMerchantNAMQR({
      merchantName: MerchantName.substring(0, 25),
      merchantCity: 'Namibia',
      amount: Amount ? Amount.toFixed(2) : undefined,
      currency: Currency,
      tokenVaultId: tokenVaultResult.tokenVaultId,
      purposeCode: PurposeCode,
      isStatic: IsStatic,
      description: Description,
    });

    // Store QR code in database
    const qrCodeResult = await query<any>(
      `INSERT INTO merchant_qr_codes (
        merchant_id, merchant_name, qr_code, token_vault_id,
        amount, currency, is_static, purpose_code, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, created_at`,
      [
        MerchantId || null,
        MerchantName,
        namqrCode,
        tokenVaultResult.tokenVaultId,
        Amount || null,
        Currency,
        IsStatic,
        PurposeCode,
        Description || null,
      ]
    );

    const qrResponse = {
      Data: {
        QRCodeId: qrCodeResult[0].id,
        QRCode: namqrCode,
        TokenVaultId: tokenVaultResult.tokenVaultId,
        MerchantId: MerchantId || null,
        MerchantName: MerchantName,
        Amount: Amount || null,
        Currency: Currency,
        IsStatic: IsStatic,
        PurposeCode: PurposeCode,
        CreatedDateTime: qrCodeResult[0].created_at?.toISOString() || new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/merchants/qr-code?qr_code_id=${qrCodeResult[0].id}`,
      },
      Meta: {},
    };

    return helpers.created(
      qrResponse,
      `/api/v1/merchants/qr-code?qr_code_id=${qrCodeResult[0].id}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error generating merchant QR code:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while generating the QR code',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetQRCode,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handlePostQRCode,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
