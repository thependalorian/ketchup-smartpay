/**
 * Admin Authentication Utilities
 * 
 * Location: utils/adminAuth.ts
 * Purpose: Role-based access control for admin endpoints
 * 
 * Compliance endpoints require admin role for security.
 */

import { ExpoRequest } from 'expo-router/server';
import { getUserIdFromRequest, queryOne } from './db';
import logger, { log } from '@/utils/logger';

/**
 * Check if user has admin role
 * @param userId User ID to check
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    // Check if user has admin role in users table
    // Supports both 'role' VARCHAR and 'is_admin' BOOLEAN columns
    // Handles case where columns might not exist yet (graceful degradation)
    let user: { role?: string; is_admin?: boolean } | null = null;
    
    try {
      // Try to query with both columns
      user = await queryOne<{ role?: string; is_admin?: boolean }>(
        `SELECT role, is_admin FROM users WHERE id = $1 OR external_id = $1`,
        [userId]
      );
    } catch (error: any) {
      // If columns don't exist, try querying just id
      if (error?.message?.includes('column') || error?.message?.includes('does not exist')) {
        // Columns don't exist yet - return false (no admin access until migration is run)
        logger.warn('Admin role columns not found. Run migration_add_admin_role.sql to enable admin access.');
        return false;
      }
      throw error;
    }

    if (!user) {
      return false;
    }

    // Check role column (preferred method)
    if (user.role === 'admin' || user.role === 'administrator') {
      return true;
    }

    // Check is_admin boolean (backward compatibility)
    if (user.is_admin === true) {
      return true;
    }

    return false;
  } catch (error) {
    log.error('Error checking admin role:', error);
    return false;
  }
}

/**
 * Middleware to require admin authentication
 * @param request ExpoRequest object
 * @returns userId if authenticated and admin, null otherwise
 */
export async function requireAdmin(request: ExpoRequest): Promise<string | null> {
  // First check authentication
  const userId = await getUserIdFromRequest(request);
  
  if (!userId) {
    return null;
  }

  // Then check admin role
  const userIsAdmin = await isAdmin(userId);
  
  if (!userIsAdmin) {
    return null;
  }

  return userId;
}

/**
 * Check admin authentication and return error response if not authorized
 * @param request ExpoRequest object
 * @returns { authorized: boolean, userId: string | null, errorResponse: Response | null }
 */
export async function checkAdminAuth(request: ExpoRequest): Promise<{
  authorized: boolean;
  userId: string | null;
  errorResponse: Response | null;
}> {
  const userId = await requireAdmin(request);

  if (!userId) {
    return {
      authorized: false,
      userId: null,
      errorResponse: new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized. Admin access required.' 
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      ),
    };
  }

  return {
    authorized: true,
    userId,
    errorResponse: null,
  };
}

