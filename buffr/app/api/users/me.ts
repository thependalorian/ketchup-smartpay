/**
 * API Route: /api/users/me
 *
 * - GET: Fetches the profile of the currently authenticated user.
 */
import { ExpoRequest } from 'expo-router/server';

import { query, queryOne, getUserIdFromRequest, findUserId } from '@/utils/db';
import { mapUserRow } from '@/utils/db-adapters';
import { generateBuffrId } from '@/utils/buffrId';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

interface UserRow {
  id: string;
  phone_number: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar: string | null;
  is_verified: boolean;
  is_two_factor_enabled: boolean;
  currency: string;
  last_login_at: Date | null;
  created_at: Date;
}

async function getHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Find user ID (handle both UUID and external_id)
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Fetch user from Neon DB
    const user = await queryOne<any>(
      'SELECT * FROM users WHERE id = $1',
      [actualUserId]
    );

    if (!user) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Map user row to expected format
    const mappedUser = mapUserRow(user);

    // Calculate total wallet balance
    const wallets = await query<{ balance: number }>(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [actualUserId]
    );
    const buffrCardBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance.toString()), 0);

    // Get or generate Buffr ID
    const buffrId = user.buffr_id || generateBuffrId({
      email: mappedUser.email,
      phoneNumber: mappedUser.phone_number,
      fullName: mappedUser.full_name,
      id: mappedUser.id,
    });

    // Format response
    const formattedUser = {
      id: mappedUser.id,
      buffrId, // User's unique Buffr ID (e.g., george@bfr)
      phoneNumber: mappedUser.phone_number || '',
      email: mappedUser.email || '',
      firstName: mappedUser.first_name || '',
      lastName: mappedUser.last_name || '',
      fullName: mappedUser.full_name || `${mappedUser.first_name || ''} ${mappedUser.last_name || ''}`.trim(),
      avatar: mappedUser.avatar || undefined,
      isVerified: mappedUser.is_verified,
      isTwoFactorEnabled: mappedUser.is_two_factor_enabled,
      buffrCardBalance,
      currency: mappedUser.currency,
      createdAt: mappedUser.created_at,
      lastLoginAt: mappedUser.last_login_at || mappedUser.created_at,
    };

    return successResponse(formattedUser);
  } catch (error) {
    log.error('Error fetching user:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function putHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Find user ID (handle both UUID and external_id)
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    const body = await req.json();
    const { firstName, lastName, fullName, avatar, email, city } = body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(fullName);
    }
    if (avatar !== undefined) {
      updates.push(`avatar = $${paramIndex++}`);
      values.push(avatar);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(city);
    }

    if (updates.length === 0) {
      return errorResponse('No fields to update', HttpStatus.BAD_REQUEST);
    }

    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // Add user ID as last parameter
    values.push(actualUserId);

    // Update user in database
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const updatedUser = await queryOne<any>(updateQuery, values);

    if (!updatedUser) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Map updated user row to expected format
    const mappedUser = mapUserRow(updatedUser);

    // Calculate total wallet balance
    const wallets = await query<{ balance: number }>(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [actualUserId]
    );
    const buffrCardBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance.toString()), 0);

    // Get or generate Buffr ID
    const buffrId = updatedUser.buffr_id || generateBuffrId({
      email: mappedUser.email,
      phoneNumber: mappedUser.phone_number,
      fullName: mappedUser.full_name,
      id: mappedUser.id,
    });

    // Format response
    const formattedUser = {
      id: mappedUser.id,
      buffrId,
      phoneNumber: mappedUser.phone_number || '',
      email: mappedUser.email || '',
      firstName: mappedUser.first_name || '',
      lastName: mappedUser.last_name || '',
      fullName: mappedUser.full_name || `${mappedUser.first_name || ''} ${mappedUser.last_name || ''}`.trim(),
      avatar: mappedUser.avatar || undefined,
      isVerified: mappedUser.is_verified,
      isTwoFactorEnabled: mappedUser.is_two_factor_enabled,
      buffrCardBalance,
      currency: mappedUser.currency,
      createdAt: mappedUser.created_at,
      lastLoginAt: mappedUser.last_login_at || mappedUser.created_at,
    };

    return successResponse(formattedUser);
  } catch (error) {
    log.error('Error updating user:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update user',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Wrapped exports with security middleware
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
