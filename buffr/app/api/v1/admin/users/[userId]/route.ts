/**
 * Open Banking API: /api/v1/admin/users/{userId}
 * 
 * Admin user management - single user (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { logAuditEvent, createAuditEntry } from '@/utils/auditLog';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/users/{userId}
 * Get user details
 */
async function handleGetUser(
  req: ExpoRequest,
  { params }: { params: { userId: string } }
) {
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

    const adminUserId = await getUserIdFromRequest(req);
    const { userId } = params;

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
        last_login_at,
        status
      FROM users 
      WHERE id = $1 OR external_id = $1`,
      [userId]
    );

    if (!user) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
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

    const userResponse = {
      Data: {
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
        Stats: {
          WalletCount: wallets.length,
          TotalBalance: totalBalance,
          TransactionCount: transactionCount ? parseInt(transactionCount.count, 10) : 0,
        },
      },
      Links: {
        Self: `/api/v1/admin/users/${userId}`,
      },
      Meta: {},
    };

    return helpers.success(
      userResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching user:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the user',
      500
    );
  }
}

/**
 * PUT /api/v1/admin/users/{userId}
 * Update user
 */
async function handleUpdateUser(
  req: ExpoRequest,
  { params }: { params: { userId: string } }
) {
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

    const adminUserId = await getUserIdFromRequest(req);
    const { userId } = params;
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Role, IsVerified, IsTwoFactorEnabled } = Data;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (Role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(Role);
      // Update is_admin for backward compatibility
      if (['support', 'compliance', 'super-admin', 'admin', 'administrator'].includes(Role)) {
        updates.push(`is_admin = $${paramIndex++}`);
        values.push(true);
      } else {
        updates.push(`is_admin = $${paramIndex++}`);
        values.push(false);
      }
    }

    if (IsVerified !== undefined) {
      updates.push(`is_verified = $${paramIndex++}`);
      values.push(IsVerified);
    }

    if (IsTwoFactorEnabled !== undefined) {
      updates.push(`is_two_factor_enabled = $${paramIndex++}`);
      values.push(IsTwoFactorEnabled);
    }

    if (updates.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'No fields to update',
        400
      );
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

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
        adminUserId!,
        'user.update',
        'user',
        req,
        {
          resourceId: userId,
          actionDetails: {
            updated_fields: Object.keys(Data),
            role: Role,
            is_verified: IsVerified,
            is_two_factor_enabled: IsTwoFactorEnabled,
          },
        }
      )
    ).catch(err => log.error('Failed to log audit event:', err));

    const userResponse = {
      Data: {
        UserId: updatedUser!.id,
        Role: updatedUser!.role,
        IsVerified: updatedUser!.is_verified,
        IsTwoFactorEnabled: updatedUser!.is_two_factor_enabled,
        UpdatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/admin/users/${userId}`,
      },
      Meta: {},
    };

    return helpers.success(
      userResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error updating user:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating the user',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetUser,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdateUser,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
