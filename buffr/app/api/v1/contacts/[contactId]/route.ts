/**
 * Open Banking API: /api/v1/contacts/{contactId}
 * 
 * Get, update, or delete a specific contact (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { validateNamibiaPhone, validateStringLength } from '@/utils/validators';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/contacts/{contactId}
 * Get a specific contact
 */
async function handleGetContact(
  req: ExpoRequest,
  { params }: { params: { contactId: string } }
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

    const { contactId } = params;

    const contact = await queryOne<any>(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [contactId, actualUserId]
    );

    if (!contact) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Contact not found',
        404
      );
    }

    const contactResponse = {
      Data: {
        ContactId: contact.id,
        Name: contact.name,
        PhoneNumber: contact.phone || null,
        Email: contact.email || null,
        IsFavorite: contact.is_favorite,
        CreatedDateTime: contact.created_at.toISOString(),
        UpdatedDateTime: contact.updated_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/contacts/${contactId}`,
      },
      Meta: {},
    };

    return helpers.success(
      contactResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching contact:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the contact',
      500
    );
  }
}

/**
 * PUT /api/v1/contacts/{contactId}
 * Update a contact
 */
async function handleUpdateContact(
  req: ExpoRequest,
  { params }: { params: { contactId: string } }
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

    const { contactId } = params;
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    // Verify contact exists and belongs to user
    const existingContact = await queryOne<any>(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [contactId, actualUserId]
    );

    if (!existingContact) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Contact not found',
        404
      );
    }

    const { Name, PhoneNumber, Email, IsFavorite } = Data;

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (Name !== undefined) {
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
      updates.push(`name = $${paramIndex++}`);
      values.push(Name.trim());
    }

    if (PhoneNumber !== undefined) {
      const phoneCheck = validateNamibiaPhone(PhoneNumber);
      if (!phoneCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID_FORMAT,
          phoneCheck.error || 'Invalid phone number',
          400
        );
      }
      updates.push(`phone = $${paramIndex++}`);
      values.push(phoneCheck.normalized || PhoneNumber.trim());
    }

    if (Email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(Email ? Email.trim() : null);
    }

    if (IsFavorite !== undefined) {
      updates.push(`is_favorite = $${paramIndex++}`);
      values.push(IsFavorite);
    }

    if (updates.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'No updates provided',
        400
      );
    }

    // Add updated_at and WHERE clause params
    updates.push('updated_at = NOW()');
    values.push(contactId, actualUserId);

    await query(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
      values
    );

    // Fetch updated contact
    const updatedContact = await queryOne<any>(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [contactId, actualUserId]
    );

    const contactResponse = {
      Data: {
        ContactId: updatedContact!.id,
        Name: updatedContact!.name,
        PhoneNumber: updatedContact!.phone || null,
        Email: updatedContact!.email || null,
        IsFavorite: updatedContact!.is_favorite,
        UpdatedDateTime: updatedContact!.updated_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/contacts/${contactId}`,
      },
      Meta: {},
    };

    return helpers.success(
      contactResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error updating contact:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating the contact',
      500
    );
  }
}

/**
 * DELETE /api/v1/contacts/{contactId}
 * Delete a contact
 */
async function handleDeleteContact(
  req: ExpoRequest,
  { params }: { params: { contactId: string } }
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

    const { contactId } = params;

    // Verify contact exists and belongs to user
    const existingContact = await queryOne<any>(
      'SELECT id FROM contacts WHERE id = $1 AND user_id = $2',
      [contactId, actualUserId]
    );

    if (!existingContact) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Contact not found',
        404
      );
    }

    // Delete contact
    await query(
      'DELETE FROM contacts WHERE id = $1 AND user_id = $2',
      [contactId, actualUserId]
    );

    return helpers.noContent(context?.requestId);
  } catch (error) {
    log.error('Error deleting contact:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while deleting the contact',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetContact,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdateContact,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const DELETE = openBankingSecureRoute(
  handleDeleteContact,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
