/**
 * Open Banking API: /api/v1/admin/transactions/{transactionId}/flag
 * 
 * Flag transaction for fraud review (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import { log } from '@/utils/logger';

/**
 * POST /api/v1/admin/transactions/{transactionId}/flag
 * Flag a transaction for fraud review
 */
async function handleFlag(
  req: ExpoRequest,
  { params }: { params: { transactionId: string } }
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
    const { transactionId } = params;
    const body = await req.json();
    const { Data } = body;

    // Check if transaction exists
    const transaction = await queryOne<any>(
      'SELECT id, user_id, metadata FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (!transaction) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Transaction not found',
        404
      );
    }

    const { Reason, RiskScore } = Data || {};

    // Update transaction metadata to flag it
    const currentMetadata = transaction.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      flagged: true,
      flagged_reason: Reason || 'Manual flag by admin',
      flagged_at: new Date().toISOString(),
      flagged_by: adminUserId,
      fraud_risk_score: RiskScore || currentMetadata.fraud_risk_score || 0.5,
    };

    await query(
      `UPDATE transactions 
       SET metadata = $1, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(updatedMetadata), transactionId]
    );

    // Get admin user role for authorization level
    const adminUser = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 OR external_id = $1',
      [adminUserId]
    );

    // Log staff action
    await logStaffActionWithContext(
      req,
      {
        actionType: 'transaction_flag',
        targetEntityType: 'transaction',
        targetEntityId: transactionId,
        location: 'system',
        actionDetails: {
          transaction_id: transactionId,
          user_id: transaction.user_id,
          reason: Reason || 'Manual flag by admin',
          risk_score: RiskScore || updatedMetadata.fraud_risk_score,
        },
        authorizationLevel: adminUser?.role || 'admin',
      },
      true
    ).catch(err => log.warn('Staff action logging failed (non-critical):', err));

    const flagResponse = {
      Data: {
        TransactionId: transactionId,
        Flagged: true,
        Reason: Reason || 'Manual flag by admin',
        RiskScore: RiskScore || updatedMetadata.fraud_risk_score,
        FlaggedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/admin/transactions/${transactionId}/flag`,
      },
      Meta: {},
    };

    return helpers.success(
      flagResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error flagging transaction:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while flagging the transaction',
      500
    );
  }
}

/**
 * DELETE /api/v1/admin/transactions/{transactionId}/flag
 * Unflag a transaction
 */
async function handleUnflag(
  req: ExpoRequest,
  { params }: { params: { transactionId: string } }
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
    const { transactionId } = params;

    // Check if transaction exists
    const transaction = await queryOne<any>(
      'SELECT id, metadata FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (!transaction) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Transaction not found',
        404
      );
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
      [JSON.stringify(updatedMetadata), transactionId]
    );

    // Get admin user role for authorization level
    const adminUser = await queryOne<{ role: string }>(
      'SELECT role FROM users WHERE id = $1 OR external_id = $1',
      [adminUserId]
    );

    // Log staff action
    await logStaffActionWithContext(
      req,
      {
        actionType: 'transaction_unflag',
        targetEntityType: 'transaction',
        targetEntityId: transactionId,
        location: 'system',
        actionDetails: {
          transaction_id: transactionId,
          action: 'unflag',
        },
        authorizationLevel: adminUser?.role || 'admin',
      },
      true
    ).catch(err => log.warn('Staff action logging failed (non-critical):', err));

    const unflagResponse = {
      Data: {
        TransactionId: transactionId,
        Flagged: false,
        UnflaggedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/admin/transactions/${transactionId}/flag`,
      },
      Meta: {},
    };

    return helpers.success(
      unflagResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error unflagging transaction:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while unflagging the transaction',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleFlag,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const DELETE = openBankingSecureRoute(
  handleUnflag,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
