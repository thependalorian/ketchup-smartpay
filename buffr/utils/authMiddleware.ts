/**
 * Authentication Middleware
 * 
 * Location: utils/authMiddleware.ts
 * Purpose: Middleware for verifying JWT tokens in API routes
 * 
 * Usage:
 * import { withAuth, getUserIdFromRequest } from '@/utils/authMiddleware';
 * 
 * // In API route:
 * const userId = await getUserIdFromRequest(request);
 * if (!userId) {
 *   return jsonResponse({ error: 'Unauthorized' }, 401);
 * }
 */

import { query } from '@/utils/db';
import { log } from '@/utils/logger';

export interface AuthUser {
  id: string;
  buffrId?: string;
  phoneNumber?: string;
  isVerified: boolean;
}

/**
 * Verify access token and get user from database
 */
export async function verifyAccessToken(accessToken: string): Promise<AuthUser | null> {
  try {
    // Query session and user from database
    const sessions = await query(`
      SELECT 
        s.user_id,
        u.buffr_id,
        u.phone_number,
        u.is_verified
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.access_token = $1
      AND s.expires_at > NOW()
    `, [accessToken]);

    if (sessions.length === 0) {
      return null;
    }

    const session = sessions[0];
    return {
      id: session.user_id,
      buffrId: session.buffr_id,
      phoneNumber: session.phone_number,
      isVerified: session.is_verified,
    };
  } catch (error) {
    log.error('Token verification error:', error);
    return null;
  }
}

/**
 * Extract and verify user from request Authorization header
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const accessToken = authHeader.substring(7);
    const user = await verifyAccessToken(accessToken);
    
    return user?.id || null;
  } catch (error) {
    log.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * Extract and verify full user data from request
 */
export async function getAuthUserFromRequest(request: Request): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const accessToken = authHeader.substring(7);
    return await verifyAccessToken(accessToken);
  } catch (error) {
    log.error('Error getting auth user from request:', error);
    return null;
  }
}

/**
 * Create JSON response helper
 */
export const jsonResponse = (data: any, statusOrOptions: number | { status: number } = 200) => {
  const status = typeof statusOrOptions === 'number' ? statusOrOptions : statusOrOptions.status;
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Unauthorized response helper
 */
export const unauthorizedResponse = () => {
  return jsonResponse({
    success: false,
    error: 'Unauthorized - Please login to continue',
  }, 401);
};

/**
 * Wrapper for API routes that require authentication
 * 
 * Usage:
 * export const GET = withAuth(async (request, user) => {
 *   // user is guaranteed to be authenticated
 *   return jsonResponse({ userId: user.id });
 * });
 */
export function withAuth(
  handler: (request: Request, user: AuthUser) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const user = await getAuthUserFromRequest(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    return handler(request, user);
  };
}

/**
 * Optional auth wrapper - passes null user if not authenticated
 * 
 * Usage:
 * export const GET = withOptionalAuth(async (request, user) => {
 *   if (user) {
 *     // authenticated user
 *   } else {
 *     // public access
 *   }
 * });
 */
export function withOptionalAuth(
  handler: (request: Request, user: AuthUser | null) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    const user = await getAuthUserFromRequest(request);
    return handler(request, user);
  };
}
