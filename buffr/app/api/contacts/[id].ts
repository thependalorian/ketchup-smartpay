/**
 * API Route: /api/contacts/[id]
 *
 * - GET: Fetches a specific contact
 * - PUT: Updates a contact (including favorite status)
 * - DELETE: Deletes a contact
 */
import { ExpoRequest } from 'expo-router/server';

import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibiaPhone, validateStringLength } from '@/utils/validators';
import { successResponse, errorResponse, noContentResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

interface ContactRow {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  is_favorite: boolean;
  created_at: Date;
  updated_at: Date;
}

async function getHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const contact = await queryOne<ContactRow>(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [params.id, userId]
    );

    if (!contact) {
      return errorResponse('Contact not found', HttpStatus.NOT_FOUND);
    }

    return successResponse({
      id: contact.id,
      name: contact.name,
      phoneNumber: contact.phone || '',
      email: contact.email,
      isFavorite: contact.is_favorite,
      createdAt: contact.created_at,
    });
  } catch (error) {
    log.error('Error fetching contact:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch contact',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function putHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const { name, phoneNumber, email, isFavorite } = body;

    // Verify contact exists and belongs to user
    const existingContact = await queryOne<ContactRow>(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [params.id, userId]
    );

    if (!existingContact) {
      return errorResponse('Contact not found', HttpStatus.NOT_FOUND);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      const nameCheck = validateStringLength(name, {
        min: 1,
        max: 100,
        fieldName: 'Name',
        allowEmpty: false
      });
      if (!nameCheck.valid) {
        return errorResponse(nameCheck.error || 'Invalid name', HttpStatus.BAD_REQUEST);
      }
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (phoneNumber !== undefined) {
      const phoneCheck = validateNamibiaPhone(phoneNumber);
      if (!phoneCheck.valid) {
        return errorResponse(phoneCheck.error || 'Invalid phone number', HttpStatus.BAD_REQUEST);
      }
      updates.push(`phone = $${paramIndex++}`);
      values.push(phoneCheck.normalized || phoneNumber.trim());
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email ? email.trim() : null);
    }

    if (isFavorite !== undefined) {
      updates.push(`is_favorite = $${paramIndex++}`);
      values.push(isFavorite);
    }

    if (updates.length === 0) {
      return errorResponse('No updates provided', HttpStatus.BAD_REQUEST);
    }

    // Add updated_at and WHERE clause params
    updates.push('updated_at = NOW()');
    values.push(params.id, userId);

    await query(
      `UPDATE contacts SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`,
      values
    );

    // Fetch updated contact
    const updatedContact = await queryOne<ContactRow>(
      'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
      [params.id, userId]
    );

    return successResponse({
      id: updatedContact!.id,
      name: updatedContact!.name,
      phoneNumber: updatedContact!.phone || '',
      email: updatedContact!.email,
      isFavorite: updatedContact!.is_favorite,
      createdAt: updatedContact!.created_at,
    });
  } catch (error) {
    log.error('Error updating contact:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update contact',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function deleteHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Verify contact exists and belongs to user
    const existingContact = await queryOne<ContactRow>(
      'SELECT id FROM contacts WHERE id = $1 AND user_id = $2',
      [params.id, userId]
    );

    if (!existingContact) {
      return errorResponse('Contact not found', HttpStatus.NOT_FOUND);
    }

    // Delete contact
    await query(
      'DELETE FROM contacts WHERE id = $1 AND user_id = $2',
      [params.id, userId]
    );

    return noContentResponse();
  } catch (error) {
    log.error('Error deleting contact:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to delete contact',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export wrapped handlers with security middleware
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);
