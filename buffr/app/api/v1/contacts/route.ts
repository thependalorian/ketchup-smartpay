/**
 * Open Banking API: /api/v1/contacts
 * 
 * Contact management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateNamibiaPhone, validateStringLength } from '@/utils/validators';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * GET /api/v1/contacts
 * Get all contacts for the current user
 */
async function handleGetContacts(req: ExpoRequest) {
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
    const search = searchParams.get('search');
    const { page, pageSize } = parsePaginationParams(req);

    // Build query
    let queryText = 'SELECT * FROM contacts WHERE user_id = $1';
    const params: any[] = [actualUserId];

    if (search) {
      queryText += ` AND (LOWER(name) LIKE $${params.length + 1} OR phone LIKE $${params.length + 2})`;
      const searchPattern = `%${search.toLowerCase()}%`;
      params.push(searchPattern, searchPattern);
    }

    queryText += ' ORDER BY is_favorite DESC, name ASC';

    // Get total count
    const countResult = await query<{ count: string }>(
      queryText.replace('SELECT *', 'SELECT COUNT(*) as count'),
      params
    );
    const total = parseInt(countResult[0]?.count || '0', 10);

    // Apply pagination
    const offset = (page - 1) * pageSize;
    queryText += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(pageSize, offset);

    // Fetch contacts
    const contacts = await query<any>(queryText, params);

    // Format as Open Banking
    const formattedContacts = contacts.map((contact: any) => ({
      ContactId: contact.id,
      Name: contact.name,
      PhoneNumber: contact.phone || null,
      Email: contact.email || null,
      IsFavorite: contact.is_favorite,
      CreatedDateTime: contact.created_at.toISOString(),
      UpdatedDateTime: contact.updated_at.toISOString(),
    }));

    return helpers.paginated(
      formattedContacts,
      'Contacts',
      '/api/v1/contacts',
      page,
      pageSize,
      total,
      req,
      search ? { search } : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching contacts:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching contacts',
      500
    );
  }
}

/**
 * POST /api/v1/contacts
 * Create a new contact
 */
async function handleCreateContact(req: ExpoRequest) {
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

    const { Name, PhoneNumber, Email } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!Name) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Name is missing',
          'Data.Name'
        )
      );
    }

    if (!PhoneNumber) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field PhoneNumber is missing',
          'Data.PhoneNumber'
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

    // Validate name length
    const nameCheck = validateStringLength(Name, {
      min: 1,
      max: 100,
      fieldName: 'Name',
      allowEmpty: false
    });
    if (!nameCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        nameCheck.error || 'Invalid name',
        400
      );
    }

    // Validate phone number format
    const phoneCheck = validateNamibiaPhone(PhoneNumber);
    if (!phoneCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        phoneCheck.error || 'Invalid phone number',
        400
      );
    }

    const normalizedPhone = phoneCheck.normalized || PhoneNumber.trim();

    // Insert contact
    const result = await query<any>(
      `INSERT INTO contacts (id, user_id, name, phone, email)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, phone) DO UPDATE
       SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = NOW()
       RETURNING *`,
      [randomUUID(), actualUserId, Name.trim(), normalizedPhone, Email || null]
    );

    if (result.length === 0) {
      throw new Error('Failed to create contact');
    }

    const contact = result[0];

    const contactResponse = {
      Data: {
        ContactId: contact.id,
        Name: contact.name,
        PhoneNumber: contact.phone || null,
        Email: contact.email || null,
        IsFavorite: contact.is_favorite,
        CreatedDateTime: contact.created_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/contacts/${contact.id}`,
      },
      Meta: {},
    };

    return helpers.created(
      contactResponse,
      `/api/v1/contacts/${contact.id}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating contact:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the contact',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetContacts,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateContact,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
