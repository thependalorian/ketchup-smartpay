/**
 * Find Voucher by QR Code API Route
 * 
 * Location: app/api/utilities/vouchers/find-by-qr.ts
 * Purpose: Find a voucher by scanning its NamQR code
 * 
 * This endpoint:
 * 1. Parses the NamQR code
 * 2. Extracts the token vault ID or matches the QR code string
 * 3. Finds the matching voucher in the database
 * 4. Returns voucher details for redemption
 * 
 * Compliance: PSD-12 (2FA will be required during redemption)
 * Integration: NamQR parser, Token Vault (for validation)
 */

import { ExpoRequest } from 'expo-router/server';
import { query, getUserIdFromRequest } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { parseNAMQR } from '@/utils/namqr';
import { log } from '@/utils/logger';

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { qrCode } = await req.json();

    if (!qrCode || typeof qrCode !== 'string') {
      return errorResponse('QR code is required', HttpStatus.BAD_REQUEST);
    }

    // Parse NamQR code
    const parseResult = parseNAMQR(qrCode);
    
    if (!parseResult.data || parseResult.error) {
      return errorResponse(
        `Invalid NamQR code: ${parseResult.error || 'Failed to parse QR code'}`,
        HttpStatus.BAD_REQUEST
      );
    }

    const namqrData = parseResult.data;
    const tokenVaultId = namqrData.tokenVaultUniqueIdentifier;

    // Find voucher by NamQR code (exact match) or token vault ID
    // First try exact match on namqr_code column
    let voucher = await query<{
      id: string;
      user_id: string;
      type: string;
      title: string;
      description: string | null;
      amount: number;
      status: string;
      expiry_date: Date | null;
      redeemed_at: Date | null;
      issuer: string | null;
      icon: string | null;
      voucher_code: string | null;
      namqr_code: string | null;
      metadata: any;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM vouchers 
       WHERE (namqr_code = $1 OR namqr_code LIKE $2)
       AND user_id = $3
       AND status = 'available'
       AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
       ORDER BY created_at DESC
       LIMIT 1`,
      [qrCode, `%${tokenVaultId}%`, userId]
    );

    // If not found by exact match, try finding by token vault ID in metadata
    if (voucher.length === 0 && tokenVaultId) {
      voucher = await query<{
        id: string;
        user_id: string;
        type: string;
        title: string;
        description: string | null;
        amount: number;
        status: string;
        expiry_date: Date | null;
        redeemed_at: Date | null;
        issuer: string | null;
        icon: string | null;
        voucher_code: string | null;
        namqr_code: string | null;
        metadata: any;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT * FROM vouchers 
         WHERE user_id = $1
         AND status = 'available'
         AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
         AND (
           metadata::text LIKE $2
           OR namqr_code LIKE $3
         )
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId, `%${tokenVaultId}%`, `%${tokenVaultId}%`]
      );
    }

    if (voucher.length === 0) {
      return errorResponse(
        'Voucher not found. Please ensure you are scanning a valid voucher QR code that belongs to you.',
        HttpStatus.NOT_FOUND
      );
    }

    const v = voucher[0];

    // Validate voucher ownership
    if (v.user_id !== userId) {
      return errorResponse('Unauthorized: This voucher does not belong to you', HttpStatus.FORBIDDEN);
    }

    // Check if voucher is expired
    if (v.expiry_date && new Date(v.expiry_date) < new Date()) {
      return errorResponse('This voucher has expired', HttpStatus.BAD_REQUEST);
    }

    // Check if voucher is already redeemed
    if (v.status !== 'available') {
      return errorResponse(`This voucher is ${v.status}`, HttpStatus.BAD_REQUEST);
    }

    // Return voucher details
    return successResponse({
      id: v.id,
      userId: v.user_id,
      type: v.type,
      title: v.title,
      description: v.description,
      amount: parseFloat(v.amount.toString()),
      status: v.status,
      expiryDate: v.expiry_date ? v.expiry_date.toISOString().split('T')[0] : null,
      redeemedAt: v.redeemed_at ? v.redeemed_at.toISOString() : null,
      issuer: v.issuer,
      icon: v.icon,
      voucherCode: v.voucher_code,
      namqrCode: v.namqr_code,
      metadata: v.metadata,
      createdAt: v.created_at.toISOString(),
      updatedAt: v.updated_at.toISOString(),
      // Include parsed NamQR data for validation
      namqrData: {
        tokenVaultId: tokenVaultId,
        purposeCode: namqrData.unreservedTemplate?.purpose,
        payeeName: namqrData.payeeName,
        amount: namqrData.transactionAmount,
      },
    });
  } catch (error: any) {
    log.error('Error finding voucher by QR code:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to find voucher',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
