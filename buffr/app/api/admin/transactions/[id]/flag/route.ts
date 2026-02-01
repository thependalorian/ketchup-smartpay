/**
 * Flag Transaction API
 * 
 * Location: app/api/admin/transactions/[id]/flag/route.ts
 * Purpose: Flag a transaction for fraud review (admin only)
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import logger from '@/utils/logger';

/**
 * POST /api/admin/transactions/[id]/flag
 * Flag a transaction for fraud review
 */
async function postHandler(
  request: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper
    const adminUserId = await getUserIdFromRequest(request);

    const body = await request.json();
    const { reason, risk_score } = body;

    // Check if transaction exists
    const transaction = await queryOne<any>(
      'SELECT id, user_id, metadata FROM transactions WHERE id = $1',
      [params.id]
    );

    if (!transaction) {
      return jsonResponse(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Update transaction metadata to flag it
    const currentMetadata = transaction.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      flagged: true,
      flagged_reason: reason || 'Manual flag by admin',
      flagged_at: new Date().toISOString(),
      flagged_by: adminUserId,
      fraud_risk_score: risk_score || currentMetadata.fraud_risk_score || 0.5,
    };

    await query(
      `UPDATE transactions 
       SET metadata = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(updatedMetadata), params.id]
    );

    // Get admin user role for authorization level
    const adminUser = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 OR external_id = $1',
      [adminUserId]
    );

    // Log staff action
    await logStaffActionWithContext(
      request,
      {
        actionType: 'transaction_flag',
        targetEntityType: 'transaction',
        targetEntityId: params.id,
        location: 'system',
        actionDetails: {
          transaction_id: params.id,
          user_id: transaction.user_id,
          reason: reason || 'Manual flag by admin',
          risk_score: risk_score || updatedMetadata.fraud_risk_score,
        },
        authorizationLevel: adminUser?.role || 'admin',
      },
      true
    ).catch(err => {
      logger.warn('[Transaction Flag] Staff action logging failed (non-critical)', err);
    });

    return successResponse({ transaction_id: params.id }, 'Transaction flagged successfully');
  } catch (error: any) {
    logger.error('Error flagging transaction', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to flag transaction',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/admin/transactions/[id]/flag
 * Unflag a transaction
 */
async function deleteHandler(
  request: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper
    const adminUserId = await getUserIdFromRequest(request);

    // Check if transaction exists
    const transaction = await queryOne<any>(
      'SELECT id, metadata FROM transactions WHERE id = $1',
      [params.id]
    );

    if (!transaction) {
      return errorResponse('Transaction not found', HttpStatus.NOT_FOUND);
    }

    // Update transaction metadata to unflag it
    const currentMetadata = transaction.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      flagged: false,
      unflagged_at: new Date().toISOString(),
      unflagged_by: adminUserId,
    };

    await query(
      `UPDATE transactions 
       SET metadata = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(updatedMetadata), params.id]
    );

    // Get admin user role for authorization level
    const adminUser = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 OR external_id = $1',
      [adminUserId]
    );

    // Log staff action
    await logStaffActionWithContext(
      request,
      {
        actionType: 'transaction_unflag',
        targetEntityType: 'transaction',
        targetEntityId: params.id,
        location: 'system',
        actionDetails: {
          transaction_id: params.id,
          action: 'unflag',
        },
        authorizationLevel: adminUser?.role || 'admin',
      },
      true
    ).catch(err => {
      logger.warn('[Transaction Unflag] Staff action logging failed (non-critical)', err);
    });

    return successResponse({ transaction_id: params.id }, 'Transaction unflagged successfully');
  } catch (error: any) {
    logger.error('Error unflagging transaction', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to unflag transaction',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
export const DELETE = secureAdminRoute(RATE_LIMITS.admin, deleteHandler);

