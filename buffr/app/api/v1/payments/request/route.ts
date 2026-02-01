/**
 * Open Banking API: /api/v1/payments/request
 * 
 * Request money from a user (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail, parsePaginationParams } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { getUserIdFromRequest, findUserId, query, getUserNamesBatch } from '@/utils/db';
import { validateAmount, validateCurrency, validateNamibiaPhone } from '@/utils/validators';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * GET /api/v1/payments/request
 * List money requests (Open Banking format)
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
      `SELECT COUNT(*) as count FROM (${queryText}) as subquery`,
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / pageSize);

    // Add pagination
    queryText += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(pageSize, (page - 1) * pageSize);

    const requests = await query<any>(queryText, params);

    // Get user names
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
      Note: req.note,
      Status: req.status,
      CreatedDateTime: req.created_at.toISOString(),
      PaidDateTime: req.paid_at ? req.paid_at.toISOString() : null,
    }));

    return helpers.paginated(
      formattedRequests,
      'Requests',
      '/api/v1/payments/request',
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
 * POST /api/v1/payments/request
 * Create money request (Open Banking format)
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

    if (!ToUserId && !ToUserPhone) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'Either ToUserId or ToUserPhone is required',
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
    const amountCheck = validateAmount(Amount, { min: 0.01, max: 1000000, maxDecimals: 2 });
    if (!amountCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.AMOUNT_INVALID,
        amountCheck.error || 'Invalid amount',
        400
      );
    }

    // Validate currency
    const currency = Currency || 'NAD';
    if (!validateCurrency(currency)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        'Invalid currency code',
        400
      );
    }

    // Resolve recipient
    let recipientUserId = ToUserId;
    if (!recipientUserId && ToUserPhone) {
      const phoneCheck = validateNamibiaPhone(ToUserPhone);
      if (!phoneCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID_FORMAT,
          'Invalid phone number format',
          400
        );
      }

      const users = await query<{ id: string }>(
        'SELECT id FROM users WHERE phone_number = $1',
        [phoneCheck.normalized || ToUserPhone]
      );

      if (users.length === 0) {
        return helpers.error(
          OpenBankingErrorCode.RESOURCE_NOT_FOUND,
          'Recipient user not found',
          404
        );
      }

      recipientUserId = users[0].id;
    }

    // Create request
    const requestId = randomUUID();
    await query(
      `INSERT INTO money_requests (
        id, from_user_id, to_user_id, amount, currency, note, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        requestId,
        actualUserId,
        recipientUserId,
        Amount,
        currency,
        Note || null,
        'pending',
        new Date(),
      ]
    );

    const requestResponse = {
      Data: {
        RequestId: requestId,
        FromUserId: actualUserId,
        ToUserId: recipientUserId,
        Amount,
        Currency: currency,
        Note: Note || null,
        Status: 'pending',
        CreatedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: `/api/v1/payments/request/${requestId}`,
      },
      Meta: {},
    };

    return helpers.created(
      requestResponse,
      `/api/v1/payments/request/${requestId}`,
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
