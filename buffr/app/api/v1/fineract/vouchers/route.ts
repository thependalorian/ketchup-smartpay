/**
 * Open Banking API: /api/v1/fineract/vouchers
 * 
 * Fineract voucher management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/fineract/vouchers
 * Get Fineract voucher by Buffr voucher ID
 */
async function handleGetVoucher(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const voucherId = searchParams.get('voucher_id'); // Buffr voucher ID

    if (!voucherId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'voucher_id query parameter is required',
        400
      );
    }

    // Get Fineract voucher by external ID
    const externalId = `buffr_voucher_${voucherId}`;
    const voucher = await fineractService.getVoucherByExternalId(externalId, {
      userId: searchParams.get('user_id') || undefined,
    });

    if (!voucher) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Fineract voucher not found for Buffr voucher ID',
        404
      );
    }

    // Check if mapping exists
    const mappings = await query<any>(
      'SELECT id, voucher_id, fineract_voucher_id, voucher_code, status, synced_at FROM fineract_vouchers WHERE voucher_id = $1',
      [voucherId]
    );

    const voucherResponse = {
      Data: {
        VoucherId: voucherId,
        FineractVoucherId: voucher.id,
        VoucherCode: voucher.voucherCode,
        Amount: parseFloat(voucher.amount.toString()),
        CurrencyCode: voucher.currencyCode,
        Status: voucher.status.value,
        IssuedDate: voucher.issuedDate,
        ExpiryDate: voucher.expiryDate,
        ClientId: voucher.clientId,
        ProductId: voucher.productId,
        NamQRData: voucher.namqrData,
        TokenVaultId: voucher.tokenVaultId,
        SmartPayStatus: voucher.smartPayStatus,
        Mapped: mappings.length > 0,
      },
      Links: {
        Self: `/api/v1/fineract/vouchers?voucher_id=${voucherId}`,
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
    log.error('Error getting Fineract voucher:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving the voucher',
      500
    );
  }
}

/**
 * POST /api/v1/fineract/vouchers
 * Create voucher in Fineract
 */
async function handleCreateVoucher(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { VoucherId, ClientId, ProductId, Amount, CurrencyCode, IssuedDate, ExpiryDate, NamQRData, TokenVaultId } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!VoucherId || !ClientId || !Amount || !IssuedDate || !ExpiryDate) {
      if (!VoucherId) {
        errors.push(
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field VoucherId is missing',
            'Data.VoucherId'
          )
        );
      }
      if (!ClientId) {
        errors.push(
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field ClientId is missing',
            'Data.ClientId'
          )
        );
      }
      if (!Amount) {
        errors.push(
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Amount is missing',
            'Data.Amount'
          )
        );
      }
      if (!IssuedDate) {
        errors.push(
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field IssuedDate is missing',
            'Data.IssuedDate'
          )
        );
      }
      if (!ExpiryDate) {
        errors.push(
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field ExpiryDate is missing',
            'Data.ExpiryDate'
          )
        );
      }
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    // Create voucher in Fineract
    const externalId = `buffr_voucher_${VoucherId}`;
    const voucher = await fineractService.createVoucher(
      parseInt(ClientId.toString()),
      {
        externalId,
        productId: ProductId ? parseInt(ProductId.toString()) : undefined,
        amount: Amount,
        currencyCode: CurrencyCode || 'NAD',
        issuedDate: IssuedDate,
        expiryDate: ExpiryDate,
        namqrData: NamQRData,
        tokenVaultId: TokenVaultId,
      },
      {
        userId: Data.UserId || undefined,
        requestId: context?.requestId,
      }
    );

    // Store mapping
    await query(
      `INSERT INTO fineract_vouchers (
        voucher_id, fineract_voucher_id, voucher_code, status, synced_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (voucher_id) 
      DO UPDATE SET fineract_voucher_id = $2, synced_at = NOW()`,
      [
        VoucherId,
        voucher.id,
        voucher.voucherCode,
        'ACTIVE',
      ]
    ).catch(err => log.error('Failed to store voucher mapping:', err));

    const voucherResponse = {
      Data: {
        VoucherId,
        FineractVoucherId: voucher.id,
        VoucherCode: voucher.voucherCode,
        Amount: parseFloat(voucher.amount.toString()),
        CurrencyCode: voucher.currencyCode,
        Status: voucher.status.value,
        IssuedDate: voucher.issuedDate,
        ExpiryDate: voucher.expiryDate,
        ClientId: voucher.clientId,
        ProductId: voucher.productId,
      },
      Links: {
        Self: `/api/v1/fineract/vouchers?voucher_id=${VoucherId}`,
      },
      Meta: {},
    };

    return helpers.created(
      voucherResponse,
      `/api/v1/fineract/vouchers?voucher_id=${VoucherId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating Fineract voucher:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the voucher',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetVoucher,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateVoucher,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
