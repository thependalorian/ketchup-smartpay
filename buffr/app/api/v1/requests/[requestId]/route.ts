/**
 * Open Banking API: /api/v1/requests/{requestId}
 * 
 * Get or update a specific money request (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId, getUserNamesBatch } from '@/utils/db';
import { validateUUID, validateAmount } from '@/utils/validators';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/requests/{requestId}
 * Get a specific money request
 */
async function handleGetRequest(
  req: ExpoRequest,
  { params }: { params: { requestId: string } }
) {
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

    const { requestId } = params;

    // Validate request ID format
    const idCheck = validateUUID(requestId);
    if (!idCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        idCheck.error || 'Invalid request ID',
        400
      );
    }

    // Fetch request
    const request = await queryOne<any>(
      'SELECT * FROM money_requests WHERE id = $1',
      [requestId]
    );

    if (!request) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Request not found',
        404
      );
    }

    // Check authorization
    if (request.from_user_id !== actualUserId && request.to_user_id !== actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        'Unauthorized',
        403
      );
    }

    // Fetch user names
    const userNames = await getUserNamesBatch([request.from_user_id, request.to_user_id], actualUserId);

    const requestResponse = {
      Data: {
        RequestId: request.id,
        FromUserId: request.from_user_id,
        FromUserName: userNames[request.from_user_id] || 'User',
        ToUserId: request.to_user_id,
        ToUserName: userNames[request.to_user_id] || 'User',
        Amount: parseFloat(request.amount.toString()),
        Currency: request.currency,
        PaidAmount: request.paid_amount ? parseFloat(request.paid_amount.toString()) : 0,
        Note: request.note || null,
        Status: request.status,
        CreatedDateTime: request.created_at.toISOString(),
        PaidDateTime: request.paid_at ? request.paid_at.toISOString() : null,
      },
      Links: {
        Self: `/api/v1/requests/${requestId}`,
      },
      Meta: {},
    };

    return helpers.success(
      requestResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching request:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the request',
      500
    );
  }
}

/**
 * PUT /api/v1/requests/{requestId}
 * Update a money request (pay, cancel, decline)
 */
async function handleUpdateRequest(
  req: ExpoRequest,
  { params }: { params: { requestId: string } }
) {
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

    const { requestId } = params;

    // Validate request ID format
    const idCheck = validateUUID(requestId);
    if (!idCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        idCheck.error || 'Invalid request ID',
        400
      );
    }

    // Fetch request
    const request = await queryOne<any>(
      'SELECT * FROM money_requests WHERE id = $1',
      [requestId]
    );

    if (!request) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Request not found',
        404
      );
    }

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Action, Amount } = Data;

    if (!Action) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Action is required (pay, cancel, or decline)',
        400
      );
    }

    // Handle different actions
    if (Action === 'pay') {
      // Only recipient can pay
      if (request.to_user_id !== actualUserId) {
        return helpers.error(
          OpenBankingErrorCode.FORBIDDEN,
          'Only recipient can pay this request',
          403
        );
      }

      // Validate amount if provided
      let paidAmount = Amount;
      if (paidAmount === undefined) {
        paidAmount = parseFloat(request.amount.toString());
      } else {
        const amountCheck = validateAmount(paidAmount, { 
          min: 0.01, 
          max: 1000000, 
          maxDecimals: 2 
        });
        if (!amountCheck.valid) {
          return helpers.error(
            OpenBankingErrorCode.AMOUNT_INVALID,
            amountCheck.error || 'Invalid amount',
            400
          );
        }
      }

      const totalPaid = (request.paid_amount ? parseFloat(request.paid_amount.toString()) : 0) + paidAmount;
      const remainingAmount = parseFloat(request.amount.toString()) - totalPaid;
      const newStatus = remainingAmount <= 0 ? 'paid' : 'partial';

      // Update request
      const result = await query<any>(
        `UPDATE money_requests 
         SET status = $1, paid_amount = $2, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [newStatus, totalPaid, requestId]
      );

      if (result.length === 0) {
        throw new Error('Failed to update request');
      }

      const updatedRequest = result[0];

      const requestResponse = {
        Data: {
          RequestId: updatedRequest.id,
          Status: updatedRequest.status,
          PaidAmount: totalPaid,
          PaidDateTime: updatedRequest.paid_at ? updatedRequest.paid_at.toISOString() : null,
        },
        Links: {
          Self: `/api/v1/requests/${requestId}`,
        },
        Meta: {},
      };

      return helpers.success(
        requestResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    if (Action === 'cancel' || Action === 'decline') {
      // Only sender can cancel, only recipient can decline
      if (Action === 'cancel' && request.from_user_id !== actualUserId) {
        return helpers.error(
          OpenBankingErrorCode.FORBIDDEN,
          'Only sender can cancel request',
          403
        );
      }
      if (Action === 'decline' && request.to_user_id !== actualUserId) {
        return helpers.error(
          OpenBankingErrorCode.FORBIDDEN,
          'Only recipient can decline request',
          403
        );
      }

      // Update request status
      const result = await query<any>(
        `UPDATE money_requests 
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        ['cancelled', requestId]
      );

      if (result.length === 0) {
        throw new Error('Failed to update request');
      }

      const requestResponse = {
        Data: {
          RequestId: result[0].id,
          Status: result[0].status,
        },
        Links: {
          Self: `/api/v1/requests/${requestId}`,
        },
        Meta: {},
      };

      return helpers.success(
        requestResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    return helpers.error(
      OpenBankingErrorCode.FIELD_INVALID,
      'Invalid action. Use: pay, cancel, or decline',
      400
    );
  } catch (error) {
    log.error('Error updating request:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating the request',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetRequest,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdateRequest,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
