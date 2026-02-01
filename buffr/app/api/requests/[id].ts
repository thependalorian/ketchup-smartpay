/**
 * API Route: /api/requests/[id]
 * 
 * - GET: Fetches a single money request by ID
 * - PUT: Updates a money request (pay, cancel, etc.)
 */
import { ExpoRequest } from 'expo-router/server';

import { query, queryOne, getUserIdFromRequest, getUserNamesBatch } from '@/utils/db';
import { validateUUID, validateAmount } from '@/utils/validators';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

interface MoneyRequestRow {
  id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  paid_amount: number | null;
  currency: string;
  note: string | null;
  status: string;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

async function getHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate request ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid request ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Fetch request from Neon DB
    const request = await queryOne<MoneyRequestRow>(
      'SELECT * FROM money_requests WHERE id = $1',
      [id]
    );

    if (!request) {
      return errorResponse('Request not found', HttpStatus.NOT_FOUND);
    }

    // Check authorization
    if (request.from_user_id !== userId && request.to_user_id !== userId) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }
  
    // Fetch user names
    const userNames = await getUserNamesBatch([request.from_user_id, request.to_user_id], userId);
  
    // Format response
    const formattedRequest = {
      id: request.id,
      fromUserId: request.from_user_id,
      fromUserName: userNames[request.from_user_id] || 'User',
      fromUserPhone: '',
      toUserId: request.to_user_id,
      toUserName: userNames[request.to_user_id] || 'User',
      toUserPhone: '',
      amount: parseFloat(request.amount.toString()),
      currency: request.currency,
      paidAmount: request.paid_amount ? parseFloat(request.paid_amount.toString()) : 0,
      note: request.note,
      status: request.status as 'pending' | 'partial' | 'paid' | 'cancelled',
      createdAt: request.created_at,
      paidAt: request.paid_at ? request.paid_at.toISOString() : undefined,
    };
  
    return successResponse(formattedRequest);
  } catch (error) {
    log.error('Error fetching request:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch request',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function putHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Validate request ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid request ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Fetch request
    const request = await queryOne<MoneyRequestRow>(
      'SELECT * FROM money_requests WHERE id = $1',
      [id]
    );

    if (!request) {
      return errorResponse('Request not found', HttpStatus.NOT_FOUND);
    }

    const { action, amount } = await req.json();
  
    // Actions: 'pay', 'cancel', 'decline'
    if (action === 'pay') {
      // Validate amount if provided
      if (amount !== undefined) {
        const amountCheck = validateAmount(amount, { 
          min: 0.01, 
          max: 1000000, 
          maxDecimals: 2 
        });
        if (!amountCheck.valid) {
          return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
        }
      }
      // Only recipient can pay
      if (request.to_user_id !== userId) {
        return errorResponse('Only recipient can pay this request', HttpStatus.FORBIDDEN);
      }

      const paidAmount = amount || parseFloat(request.amount.toString());
      const totalPaid = (request.paid_amount ? parseFloat(request.paid_amount.toString()) : 0) + paidAmount;
      const remainingAmount = parseFloat(request.amount.toString()) - totalPaid;
      const newStatus = remainingAmount <= 0 ? 'paid' : 'partial';

      // Update request status and paid amount in Neon DB
      const result = await query<MoneyRequestRow>(
        `UPDATE money_requests 
         SET status = $1, paid_amount = $2, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END, updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [newStatus, totalPaid, id]
      );

      if (result.length === 0) {
        throw new Error('Failed to update request');
      }

      const updatedRequest = result[0];
    
      return successResponse({
        id: updatedRequest.id,
        status: updatedRequest.status,
        paidAmount: totalPaid,
        paidAt: updatedRequest.paid_at ? updatedRequest.paid_at.toISOString() : undefined,
      }, 'Payment processed successfully');
    }
  
    if (action === 'cancel' || action === 'decline') {
      // Only sender can cancel, only recipient can decline
      if (action === 'cancel' && request.from_user_id !== userId) {
        return errorResponse('Only sender can cancel request', HttpStatus.FORBIDDEN);
      }
      if (action === 'decline' && request.to_user_id !== userId) {
        return errorResponse('Only recipient can decline request', HttpStatus.FORBIDDEN);
      }

      // Update request status
      const result = await query<MoneyRequestRow>(
        `UPDATE money_requests 
         SET status = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        ['cancelled', id]
      );

      if (result.length === 0) {
        throw new Error('Failed to update request');
      }
    
      return successResponse({
        id: result[0].id,
        status: result[0].status,
      }, action === 'cancel' ? 'Request cancelled' : 'Request declined');
    }
  
    return errorResponse('Invalid action. Use: pay, cancel, or decline', HttpStatus.BAD_REQUEST);
  } catch (error) {
    log.error('Error updating request:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update request',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
