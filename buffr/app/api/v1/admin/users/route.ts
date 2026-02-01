/**
 * Open Banking API: /api/v1/admin/users
 * 
 * Admin user management (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/users
 * Get all users (admin only)
 */
async function handleGetUsers(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';
    const { page, pageSize } = parsePaginationParams(req);

    // Build query
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      whereConditions.push(
        `(email ILIKE $${paramIndex} OR phone_number ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Status filter
    if (status !== 'all') {
      whereConditions.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Role filter
    if (role !== 'all') {
      whereConditions.push(`role = $${paramIndex}`);
      queryParams.push(role);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      queryParams
    );
    const total = countResult ? parseInt(countResult.count, 10) : 0;

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const users = await query<any>(
      `SELECT 
        id,
        email,
        phone_number,
        first_name,
        last_name,
        full_name,
        avatar,
        is_verified,
        is_two_factor_enabled,
        role,
        currency,
        created_at,
        last_login_at,
        status
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, pageSize, offset]
    );

    // Format as Open Banking
    const formattedUsers = users.map((user: any) => ({
      UserId: user.id,
      Email: user.email || null,
      PhoneNumber: user.phone_number || null,
      FullName: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
      FirstName: user.first_name || null,
      LastName: user.last_name || null,
      IsVerified: user.is_verified || false,
      IsTwoFactorEnabled: user.is_two_factor_enabled || false,
      Role: user.role || 'user',
      Currency: user.currency || 'NAD',
      CreatedDateTime: user.created_at?.toISOString() || null,
      LastLoginDateTime: user.last_login_at?.toISOString() || null,
      Status: user.status || 'active',
    }));

    return helpers.paginated(
      formattedUsers,
      'Users',
      '/api/v1/admin/users',
      page,
      pageSize,
      total,
      req,
      search || status !== 'all' || role !== 'all' ? { search, status, role } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching users:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching users',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetUsers,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
