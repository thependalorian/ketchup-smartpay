/**
 * API Route: /api/contacts
 *
 * - GET: Fetches all contacts for the current user
 * - POST: Adds a new contact
 */
import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { validateNamibiaPhone, validateStringLength } from '@/utils/validators';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
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

async function handleGetContacts(req: ExpoRequest) {
  try {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    
    // Build query
    let queryText = 'SELECT * FROM contacts WHERE user_id = $1';
    const params: any[] = [userId];

    if (search) {
      queryText += ` AND (LOWER(name) LIKE $${params.length + 1} OR phone LIKE $${params.length + 2})`;
      const searchPattern = `%${search.toLowerCase()}%`;
      params.push(searchPattern, searchPattern);
    }

    queryText += ' ORDER BY is_favorite DESC, name ASC';

    // Fetch contacts from Neon DB
    const contacts = await query<ContactRow>(queryText, params);
    
    // Format response
    const formattedContacts = contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      phoneNumber: contact.phone || '',
      email: contact.email,
      isFavorite: contact.is_favorite,
      createdAt: contact.created_at,
    }));
  
    return successResponse(formattedContacts);
  } catch (error) {
    log.error('Error fetching contacts:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch contacts',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function handleCreateContact(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { name, phoneNumber, email, avatar } = await req.json();
  
    // Validate required fields
    if (!name) {
      return errorResponse('Name is required', HttpStatus.BAD_REQUEST);
    }

    if (!phoneNumber) {
      return errorResponse('Phone number is required', HttpStatus.BAD_REQUEST);
    }

    // Validate name length
    const nameCheck = validateStringLength(name, {
      min: 1,
      max: 100,
      fieldName: 'Name',
      allowEmpty: false
    });
    if (!nameCheck.valid) {
      return errorResponse(nameCheck.error || 'Invalid name', HttpStatus.BAD_REQUEST);
    }

    // Validate phone number format (Namibia)
    const phoneCheck = validateNamibiaPhone(phoneNumber);
    if (!phoneCheck.valid) {
      return errorResponse(phoneCheck.error || 'Invalid phone number', HttpStatus.BAD_REQUEST);
    }

    // Use normalized phone number
    const normalizedPhone = phoneCheck.normalized || phoneNumber.trim();
  
    // Insert contact into Neon DB
    const result = await query<ContactRow>(
      `INSERT INTO contacts (user_id, name, phone, email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, phone) DO UPDATE
       SET name = EXCLUDED.name, email = EXCLUDED.email, updated_at = NOW()
       RETURNING *`,
      [userId, name.trim(), normalizedPhone, email || null]
    );

    if (result.length === 0) {
      throw new Error('Failed to create contact');
    }

    const contact = result[0];
  
    const newContact = {
      id: contact.id,
      name: contact.name,
      phoneNumber: contact.phone || '',
      email: contact.email,
      isFavorite: contact.is_favorite,
      createdAt: contact.created_at,
    };
  
    return createdResponse(newContact, `/api/contacts/${newContact.id}`);
  } catch (error) {
    log.error('Error creating contact:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create contact',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export wrapped handlers with security middleware
export const GET = secureAuthRoute(RATE_LIMITS.api, handleGetContacts);
export const POST = secureAuthRoute(RATE_LIMITS.api, handleCreateContact);
