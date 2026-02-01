/**
 * Merchant QR Code Generation API
 * 
 * Location: app/api/merchants/qr-code/route.ts
 * Purpose: Generate NamQR code for merchants (merchant-presented QR)
 * 
 * Compliance: NamQR Standards v5.0, Purpose Code 19 (Private Corporate voucher)
 * Integration: Token Vault for QR validation
 * 
 * Requires: Merchant authentication or admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { validateAmount, validateCurrency } from '@/utils/validators';
import { generateMerchantNAMQR } from '@/utils/voucherNamQR';
import { tokenVaultService } from '@/services/tokenVaultService';
import { log } from '@/utils/logger';

interface MerchantQRRequest {
  merchantId?: string; // Optional: if merchant is creating their own QR
  merchantName: string;
  amount?: number; // Optional: for dynamic QR codes
  currency?: string;
  description?: string;
  purposeCode?: string; // Default: '19' (Private Corporate voucher)
  isStatic?: boolean; // true = static QR, false = dynamic QR
}

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const {
      merchantId,
      merchantName,
      amount,
      currency = 'NAD',
      description,
      purposeCode = '19', // Private Corporate voucher (merchants)
      isStatic = true,
    }: MerchantQRRequest = await req.json();

    // Validate required fields
    if (!merchantName || merchantName.trim().length === 0) {
      return errorResponse('merchantName is required', HttpStatus.BAD_REQUEST);
    }

    // If merchantId provided, verify merchant exists and user has access
    if (merchantId) {
      const merchant = await query<{ id: string; owner_id: string }>(
        'SELECT id, owner_id FROM merchants WHERE id = $1',
        [merchantId]
      );

      if (merchant.length === 0) {
        return errorResponse('Merchant not found', HttpStatus.NOT_FOUND);
      }

      // Check if user is merchant owner or admin
      const isAdmin = await query<{ role: string }>(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (merchant[0].owner_id !== userId && isAdmin[0]?.role !== 'admin') {
        return errorResponse('Unauthorized: You do not have access to this merchant', HttpStatus.FORBIDDEN);
      }
    }

    // Validate amount if provided (for dynamic QR)
    if (amount !== undefined) {
      const amountCheck = validateAmount(amount, {
        min: 0.01,
        max: 1000000,
        maxDecimals: 2,
      });
      if (!amountCheck.valid) {
        return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
      }
    }

    // Validate currency
    const currencyCheck = validateCurrency(currency);
    if (!currencyCheck.valid) {
      return errorResponse(currencyCheck.error || 'Invalid currency', HttpStatus.BAD_REQUEST);
    }

    // Generate Token Vault ID
    const tokenVaultResult = await tokenVaultService.generateToken({
      merchantId: merchantId || null,
      merchantName,
      amount: amount || null,
      currency,
      purposeCode,
      isStatic,
    });

    if (!tokenVaultResult.success || !tokenVaultResult.tokenVaultId) {
      return errorResponse(
        `Failed to generate Token Vault ID: ${tokenVaultResult.error || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Generate NamQR code
    const namqrCode = generateMerchantNAMQR({
      merchantName: merchantName.substring(0, 25), // Max 25 chars
      merchantCity: 'Namibia', // Default city
      amount: amount ? amount.toFixed(2) : undefined,
      currency,
      tokenVaultId: tokenVaultResult.tokenVaultId,
      purposeCode,
      isStatic,
      description,
    });

    return successResponse({
      qrCode: namqrCode,
      tokenVaultId: tokenVaultResult.tokenVaultId,
      merchantName,
      amount: amount || null,
      currency,
      isStatic,
      purposeCode,
      message: 'Merchant QR code generated successfully',
    });
  } catch (error: any) {
    log.error('Merchant QR generation error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
