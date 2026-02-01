/**
 * Open Banking API: /api/v1/vouchers
 * 
 * Open Banking-compliant vouchers endpoint
 * 
 * Features:
 * - Open Banking voucher format
 * - Open Banking pagination
 * - API versioning (v1)
 * - Standardized response headers
 * 
 * Example requests:
 * GET /api/v1/vouchers?page=1&page-size=25
 * GET /api/v1/vouchers/{voucherId}
 */

import { ExpoRequest } from 'expo-router/server';
import { RATE_LIMITS } from '@/utils/secureApi';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/vouchers
 * List vouchers with Open Banking pagination
 */
async function handleGetVouchers(req: ExpoRequest) {
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

    // Parse Open Banking pagination parameters
    const { page, pageSize } = parsePaginationParams(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'available';
    const type = searchParams.get('type');

    // Build query
    let queryText = `SELECT * FROM vouchers WHERE user_id = $1`;
    const params: any[] = [actualUserId];

    // Filter by status
    if (status === 'available') {
      queryText += ` AND status = 'available' AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)`;
    } else if (status) {
      queryText += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    // Filter by type
    if (type) {
      queryText += ` AND type = $${params.length + 1}`;
      params.push(type);
    }

    // Get total count for pagination
    const countQuery = queryText.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    queryText += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);

    // Fetch vouchers
    const vouchers = await query<any>(queryText, params);

    // Format vouchers as Open Banking format
    const formattedVouchers = vouchers.map((v: any) => ({
      VoucherId: v.id,
      UserId: v.user_id,
      Type: v.type,
      Title: v.title,
      Description: v.description,
      Amount: {
        Amount: parseFloat(v.amount.toString()),
        Currency: v.currency || 'NAD',
      },
      Status: v.status === 'available' ? 'Available' : 
              v.status === 'redeemed' ? 'Redeemed' :
              v.status === 'expired' ? 'Expired' : v.status,
      ExpiryDate: v.expiry_date ? v.expiry_date.toISOString().split('T')[0] : null,
      RedeemedAt: v.redeemed_at ? v.redeemed_at.toISOString() : null,
      Issuer: v.issuer || 'Buffr',
      VoucherCode: v.voucher_code,
      NamQRCode: v.namqr_code,
      Metadata: v.metadata,
      CreatedDateTime: v.created_at,
      UpdatedDateTime: v.updated_at,
    }));

    // Get base URL for pagination links
    const baseUrl = new URL(req.url).origin + '/api/v1/vouchers';
    
    // Build query params for pagination links
    const queryParams: Record<string, string> = {};
    if (status) queryParams.status = status;
    if (type) queryParams.type = type;

    // Return Open Banking paginated response
    return helpers.paginated(
      formattedVouchers,
      'Voucher',
      baseUrl,
      page,
      pageSize,
      total,
      req,
      queryParams,
      undefined,
      new Date().toISOString(),
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching vouchers:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching vouchers',
      500
    );
  }
}

// Export handler with Open Banking middleware
export const GET = openBankingSecureRoute(
  handleGetVouchers,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
