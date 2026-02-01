/**
 * API Route: /api/requests
 *
 * - GET: Fetches all money requests (sent and received)
 * - POST: Creates a new money request
 */
import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest, getUserNamesBatch, getUserName } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibiaPhone, validateAmount, validateCurrency, validateUUID } from '@/utils/validators';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
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

async function getHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return jsonResponse(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'sent' | 'received' | null (all)
  
    // Build query
    let queryText = 'SELECT * FROM money_requests WHERE';
    const params: any[] = [];

    if (type === 'sent') {
      queryText += ' from_user_id = $1';
      params.push(userId);
    } else if (type === 'received') {
      queryText += ' to_user_id = $1';
      params.push(userId);
    } else {
      queryText += ' (from_user_id = $1 OR to_user_id = $1)';
      params.push(userId);
    }

    queryText += ' ORDER BY created_at DESC';

    // Fetch requests from Neon DB
    const requests = await query<MoneyRequestRow>(queryText, params);
  
    // Fetch user names in batch
    const allUserIds = [...new Set([
      ...requests.map(r => r.from_user_id),
      ...requests.map(r => r.to_user_id),
    ])];
    const userNames = await getUserNamesBatch(allUserIds, userId);
  
    // Format response
    const formattedRequests = requests.map(req => ({
      id: req.id,
      fromUserId: req.from_user_id,
      fromUserName: userNames[req.from_user_id] || 'User',
      fromUserPhone: '',
      toUserId: req.to_user_id,
      toUserName: userNames[req.to_user_id] || 'User',
      toUserPhone: '',
      amount: parseFloat(req.amount.toString()),
      currency: req.currency,
      paidAmount: req.paid_amount ? parseFloat(req.paid_amount.toString()) : 0,
      note: req.note,
      status: req.status as 'pending' | 'partial' | 'paid' | 'cancelled',
      createdAt: req.created_at,
      paidAt: req.paid_at ? req.paid_at.toISOString() : undefined,
    }));
  
    return successResponse(formattedRequests);
  } catch (error) {
    log.error('Error fetching requests:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch requests',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { toUserId, toUserPhone, amount, note, currency } = await req.json();
  
    // Validate required fields
    if (!toUserId) {
      return errorResponse('Recipient user ID is required', HttpStatus.BAD_REQUEST);
    }

    // Validate recipient user ID format (if it's a UUID)
    // Note: user IDs might be VARCHAR(255) in our schema, so we validate format but allow non-UUID strings
    if (toUserId.length > 0 && toUserId.includes('-')) {
      const userIdCheck = validateUUID(toUserId);
      if (!userIdCheck.valid) {
        // Only validate if it looks like a UUID (contains dashes)
        // Allow non-UUID strings for backward compatibility
      }
    }

    // Validate amount
    const amountCheck = validateAmount(amount, { 
      min: 0.01, 
      max: 1000000, 
      maxDecimals: 2 
    });
    if (!amountCheck.valid) {
      return errorResponse(amountCheck.error || 'Invalid amount', HttpStatus.BAD_REQUEST);
    }

    // Validate currency if provided
    if (currency) {
      const currencyCheck = validateCurrency(currency);
      if (!currencyCheck.valid) {
        return errorResponse(currencyCheck.error || 'Invalid currency', HttpStatus.BAD_REQUEST);
      }
    }

    // Validate phone number if provided
    let normalizedPhone = toUserPhone;
    if (toUserPhone) {
      const phoneCheck = validateNamibiaPhone(toUserPhone);
      if (!phoneCheck.valid) {
        return errorResponse(phoneCheck.error || 'Invalid phone number', HttpStatus.BAD_REQUEST);
      }
      normalizedPhone = phoneCheck.normalized || toUserPhone;
    }
  
    // Fetch recipient name
    const toUserName = await getUserName(toUserId, userId);

    // Create money request in Neon DB
    const result = await query<MoneyRequestRow>(
      `INSERT INTO money_requests (from_user_id, to_user_id, amount, currency, note, status, paid_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        toUserId,
        amount,
        currency || 'N$',
        note || null,
        'pending',
        0.00,
      ]
    );

    if (result.length === 0) {
      throw new Error('Failed to create money request');
    }

    const request = result[0];
    const fromUserName = await getUserName(userId);
  
    const newRequest = {
      id: request.id,
      fromUserId: request.from_user_id,
      fromUserName: fromUserName,
      fromUserPhone: '',
      toUserId: request.to_user_id,
      toUserName: toUserName,
      toUserPhone: normalizedPhone || '',
      amount: parseFloat(request.amount.toString()),
      currency: request.currency,
      paidAmount: request.paid_amount ? parseFloat(request.paid_amount.toString()) : 0,
      note: request.note,
      status: request.status as 'pending' | 'partial' | 'paid' | 'cancelled',
      createdAt: request.created_at,
    };
  
    return createdResponse(newRequest, `/api/requests/${newRequest.id}`);
  } catch (error) {
    log.error('Error creating request:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create request',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Wrapped exports with security middleware
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
