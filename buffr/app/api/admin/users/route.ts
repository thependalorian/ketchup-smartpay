/**
 * Admin Users Management API
 * 
 * Location: app/api/admin/users/route.ts
 * Purpose: Admin-only endpoints for user management
 * 
 * Requires: Admin authentication (role: support, compliance, or super-admin)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
import { query, queryOne } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

/**
 * GET /api/admin/users
 * 
 * Query parameters:
 * - search: Search term (email, phone, name)
 * - status: Filter by status (active, suspended, locked)
 * - role: Filter by role (user, support, compliance, super-admin)
 * - limit: Pagination limit (default: 50)
 * - offset: Pagination offset (default: 0)
 */
async function handleGetUsers(request: ExpoRequest) {
  try {
    // Admin auth is handled by secureAdminRoute wrapper
    // Get user ID for query purposes
    const { getUserIdFromRequest } = await import('@/utils/db');
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

    // Get users
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
        status,
        currency,
        created_at,
        last_login_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Format users
    const formattedUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email || null,
      phone_number: user.phone_number || null,
      full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      is_verified: user.is_verified || false,
      is_two_factor_enabled: user.is_two_factor_enabled || false,
      role: user.role || 'user',
      currency: user.currency || 'N$',
      created_at: user.created_at?.toISOString() || null,
      last_login_at: user.last_login_at?.toISOString() || null,
      status: user.status || 'active',
    }));

    return successResponse(formattedUsers, undefined);
  } catch (error: any) {
    logger.error('Error fetching users', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch users',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.admin, handleGetUsers);

