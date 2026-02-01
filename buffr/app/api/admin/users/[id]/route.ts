/**
 * Admin User Management API - Single User
 * 
 * Location: app/api/admin/users/[id]/route.ts
 * Purpose: Admin endpoints for individual user management
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { logAuditEvent, createAuditEntry } from '@/utils/auditLog';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

/**
 * GET /api/admin/users/[id]
 * Get user details
 */
async function getHandler(
  request: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper
    const userId = await getUserIdFromRequest(request);

    const user = await queryOne<any>(
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
        last_login_at
      FROM users 
      WHERE id = $1 OR external_id = $1`,
      [params.id]
    );

    if (!user) {
      return jsonResponse(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's wallet count and total balance
    const wallets = await query<{ balance: number }>(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [user.id]
    );
    const totalBalance = wallets.reduce(
      (sum, w) => sum + parseFloat(w.balance.toString()),
      0
    );

    // Get transaction count
    const transactionCount = await queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = $1',
      [user.id]
    );

    return successResponse({
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
      stats: {
        wallet_count: wallets.length,
        total_balance: totalBalance,
        transaction_count: transactionCount ? parseInt(transactionCount.count, 10) : 0,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching user', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user
 */
async function putHandler(
  request: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper
    const userId = await getUserIdFromRequest(request);

    const body = await request.json();
    const { role, is_verified, is_two_factor_enabled } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
      // Update is_admin for backward compatibility
      if (['support', 'compliance', 'super-admin', 'admin', 'administrator'].includes(role)) {
        updates.push(`is_admin = $${paramIndex++}`);
        values.push(true);
      } else {
        updates.push(`is_admin = $${paramIndex++}`);
        values.push(false);
      }
    }

    if (is_verified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      values.push(is_verified);
    }

    if (is_two_factor_enabled !== undefined) {
      updates.push(`is_two_factor_enabled = $${paramIndex++}`);
      values.push(is_two_factor_enabled);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', HttpStatus.BAD_REQUEST);
    }

    updates.push(`updated_at = NOW()`);
    values.push(params.id);

    const updatedUser = await queryOne<any>(
      `UPDATE users 
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex} OR external_id = $${paramIndex}
       RETURNING *`,
      values
    );

    // Log audit event
    await logAuditEvent(
      createAuditEntry(
        userId,
        'user.update',
        'user',
        request,
        {
          resourceId: params.id,
          actionDetails: {
            updated_fields: Object.keys(body),
            role: role,
            is_verified: is_verified,
            is_two_factor_enabled: is_two_factor_enabled,
          },
        }
      )
    );

    return successResponse(updatedUser, 'User updated successfully');
  } catch (error: any) {
    logger.error('Error updating user', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
export const PUT = secureAdminRoute(RATE_LIMITS.admin, putHandler);

