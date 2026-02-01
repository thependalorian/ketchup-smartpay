/**
 * Open Banking API: /api/v1/requests
 * 
 * Money request management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId, getUserNamesBatch, getUserName } from '@/utils/db';
import { validateNamibiaPhone, validateAmount, validateCurrency, validateUUID } from '@/utils/validators';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * GET /api/v1/requests
 * Get all money requests (sent and received)
 */
async function handleGetRequests(req: ExpoRequest) {
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'sent' | 'received' | null (all)
    const { page, pageSize } = parsePaginationParams(req);

    // Build query
    let queryText = 'SELECT * FROM money_requests WHERE';
    const params: any[] = [];

    if (type === 'sent') {
      queryText += ' from_user_id = $1';
      params.push(actualUserId);
    } else if (type === 'received') {
      queryText += ' to_user_id = $1';
      params.push(actualUserId);
    } else {
      queryText += ' (from_user_id = $1 OR to_user_id = $1)';
      params.push(actualUserId);
    }

    // Get total count
    const countResult = await query<{ count: string }>(
      queryText.replace('SELECT *', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    queryText += ' ORDER BY created_at DESC';

    // Apply pagination
    const offset = (page - 1) * pageSize;
    queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);

    // Fetch requests
    const requests = await query<any>(queryText, params);

    // Fetch user names in batch
    const allUserIds = [...new Set([
      ...requests.map((r: any) => r.from_user_id),
      ...requests.map((r: any) => r.to_user_id),
    ])];
    const userNames = await getUserNamesBatch(allUserIds, actualUserId);

    // Format as Open Banking
    const formattedRequests = requests.map((req: any) => ({
      RequestId: req.id,
      FromUserId: req.from_user_id,
      FromUserName: userNames[req.from_user_id] || 'User',
      ToUserId: req.to_user_id,
      ToUserName: userNames[req.to_user_id] || 'User',
      Amount: parseFloat(req.amount.toString()),
      Currency: req.currency,
      PaidAmount: req.paid_amount ? parseFloat(req.paid_amount.toString()) : 0,
      Note: req.note || null,
      Status: req.status,
      CreatedDateTime: req.created_at.toISOString(),
      PaidDateTime: req.paid_at ? req.paid_at.toISOString() : null,
    }));

    return helpers.paginated(
      formattedRequests,
      'Requests',
      '/api/v1/requests',
      page,
      pageSize,
      total,
      req,
      type ? { type } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching requests:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching requests',
      500
    );
  }
}

/**
 * POST /api/v1/requests
 * Create a new money request
 */
async function handleCreateRequest(req: ExpoRequest) {
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

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { ToUserId, ToUserPhone, Amount, Note, Currency } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!ToUserId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field ToUserId is missing',
          'Data.ToUserId'
        )
      );
    }

    if (!Amount) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Amount is missing',
          'Data.Amount'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    // Validate amount
    const amountCheck = validateAmount(Amount, { 
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

    // Validate currency if provided
    if (Currency) {
      const currencyCheck = validateCurrency(Currency);
      if (!currencyCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID_FORMAT,
          currencyCheck.error || 'Invalid currency',
          400
        );
      }
    }

    // Validate phone number if provided
    let normalizedPhone = ToUserPhone;
    if (ToUserPhone) {
      const phoneCheck = validateNamibiaPhone(ToUserPhone);
      if (!phoneCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID_FORMAT,
          phoneCheck.error || 'Invalid phone number',
          400
        );
      }
      normalizedPhone = phoneCheck.normalized || ToUserPhone;
    }

    // Fetch recipient name
    const toUserName = await getUserName(ToUserId, actualUserId);

    // Create money request
    const result = await query<any>(
      `INSERT INTO money_requests (id, from_user_id, to_user_id, amount, currency, note, status, paid_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        randomUUID(),
        actualUserId,
        ToUserId,
        Amount,
        Currency || 'NAD',
        Note || null,
        'pending',
        0.00,
      ]
    );

    if (result.length === 0) {
      throw new Error('Failed to create money request');
    }

    const request = result[0];
    const fromUserName = await getUserName(actualUserId);

    const requestResponse = {
      Data: {
        RequestId: request.id,
        FromUserId: request.from_user_id,
        FromUserName: fromUserName,
        ToUserId: request.to_user_id,
        ToUserName: toUserName,
        Amount: parseFloat(request.amount.toString()),
        Currency: request.currency,
        PaidAmount: 0,
        Note: request.note || null,
        Status: request.status,
        CreatedDateTime: request.created_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/requests/${request.id}`,
      },
      Meta: {},
    };

    return helpers.created(
      requestResponse,
      `/api/v1/requests/${request.id}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating request:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the request',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetRequests,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateRequest,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
