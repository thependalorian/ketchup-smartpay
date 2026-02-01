/**
 * Vouchers API Route - All Vouchers (Including History)
 * 
 * Location: app/api/utilities/vouchers/all.ts
 * Purpose: API endpoint for fetching all vouchers including redeemed and expired
 * 
 * Endpoints:
 * - GET /api/utilities/vouchers/all - List all vouchers for authenticated user (all statuses)
 * 
 * Compliance: Payment System Management Act, PSD-1/PSD-3
 * Integration: NamPay, NamPost, retail partners
 */

import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Fetch ALL vouchers regardless of status (for history view)
    const vouchers = await query<{
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
      `SELECT *, namqr_code FROM vouchers 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Map to API format
    const mappedVouchers = vouchers.map(v => ({
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
      namqrCode: (v as any).namqr_code || null,
      metadata: v.metadata,
      createdAt: v.created_at.toISOString(),
      updatedAt: v.updated_at.toISOString(),
    }));

    return successResponse(mappedVouchers);
  } catch (error: any) {
    log.error('Error fetching all vouchers:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch vouchers',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
