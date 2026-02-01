/**
 * Fineract Vouchers API Route
 * 
 * Location: app/api/fineract/vouchers/route.ts
 * Purpose: Manage vouchers in Fineract (fineract-voucher module)
 * 
 * Methods:
 * - GET: Get voucher by Buffr voucher ID (external ID)
 * - POST: Create voucher in Fineract (from SmartPay)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const voucherId = searchParams.get('voucher_id'); // Buffr voucher ID

    if (!voucherId) {
      return errorResponse('voucher_id is required', HttpStatus.BAD_REQUEST);
    }

    // Get Fineract voucher by external ID (Buffr voucher ID)
    const externalId = `buffr_voucher_${voucherId}`;
    const voucher = await fineractService.getVoucherByExternalId(externalId, {
      userId: searchParams.get('user_id') || undefined,
    });

    if (!voucher) {
      return errorResponse('Fineract voucher not found for Buffr voucher ID', HttpStatus.NOT_FOUND);
    }

    // Check if mapping exists in database
    const mappings = await query<{
      id: string;
      voucher_id: string;
      fineract_voucher_id: number;
      voucher_code: string;
      status: string;
      synced_at: Date;
    }>(
      'SELECT id, voucher_id, fineract_voucher_id, voucher_code, status, synced_at FROM fineract_vouchers WHERE voucher_id = $1',
      [voucherId]
    );

    return successResponse({
      id: mappings.length > 0 ? mappings[0].id : null,
      voucherId,
      fineractVoucherId: voucher.id,
      voucherCode: voucher.voucherCode,
      amount: voucher.amount,
      currencyCode: voucher.currencyCode,
      status: voucher.status.value,
      issuedDate: voucher.issuedDate,
      expiryDate: voucher.expiryDate,
      clientId: voucher.clientId,
      productId: voucher.productId,
      namqrData: voucher.namqrData,
      tokenVaultId: voucher.tokenVaultId,
      smartPayStatus: voucher.smartPayStatus,
      mapped: mappings.length > 0,
    }, 'Voucher retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting Fineract voucher', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve voucher',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    const {
      voucherId, // Buffr voucher ID
      clientId, // Fineract client ID
      productId, // Voucher product ID (optional, will use default)
      amount,
      currencyCode = 'NAD',
      issuedDate, // yyyy-MM-dd
      expiryDate, // yyyy-MM-dd
      namqrData,
      tokenVaultId,
    } = body;

    if (!voucherId || !clientId || !amount || !issuedDate || !expiryDate) {
      return errorResponse(
        'voucherId, clientId, amount, issuedDate, and expiryDate are required',
        HttpStatus.BAD_REQUEST
      );
    }

    // Create voucher in Fineract
    const externalId = `buffr_voucher_${voucherId}`;
    const voucher = await fineractService.createVoucher(
      {
        clientId,
        productId,
        amount: parseFloat(amount.toString()),
        currencyCode,
        issuedDate,
        expiryDate,
        externalId,
        namqrData,
        tokenVaultId,
      },
      {
        userId: body.userId || undefined,
      }
    );

    // Store voucher mapping
    const mappingResult = await query<{ id: string }>(
      `INSERT INTO fineract_vouchers (
        voucher_id, fineract_voucher_id, voucher_code, status, synced_at
      ) VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (voucher_id) 
      DO UPDATE SET fineract_voucher_id = $2, voucher_code = $3, status = $4, synced_at = NOW()
      RETURNING id`,
      [
        voucherId,
        voucher.id,
        voucher.voucherCode,
        voucher.status.value,
      ]
    );

    return createdResponse(
      {
        id: mappingResult[0].id,
        voucherId,
        fineractVoucherId: voucher.id,
        voucherCode: voucher.voucherCode,
        amount: voucher.amount,
        currencyCode: voucher.currencyCode,
        status: voucher.status.value,
        issuedDate: voucher.issuedDate,
        expiryDate: voucher.expiryDate,
      },
      `/api/fineract/vouchers?voucher_id=${voucherId}`,
      'Voucher created successfully in Fineract'
    );
  } catch (error: any) {
    logger.error('Error creating Fineract voucher', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create voucher',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.api, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
