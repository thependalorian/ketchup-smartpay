/**
 * User Sessions API Route
 * 
 * Location: app/api/users/sessions/route.ts
 * Purpose: Manage user authentication sessions
 * 
 * Endpoints:
 * - GET: List all active sessions for the authenticated user
 * - DELETE: Revoke a specific session (by session ID)
 * 
 * Compliance: PSD-12 (Security), Session Management
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

interface SessionRow {
  id: string;
  device_info: any; // JSONB
  ip_address: string | null;
  created_at: Date;
  last_active_at: Date;
  expires_at: Date;
  access_token: string;
}

interface SessionResponse {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'web';
  location: string;
  lastActive: Date;
  isCurrent: boolean;
  ipAddress: string;
}

/**
 * GET /api/users/sessions
 * Returns all active sessions for the authenticated user
 */
async function getHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Find actual user ID
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Get current session token to identify current session
    const authHeader = req.headers.get('authorization');
    const currentToken = authHeader?.replace('Bearer ', '');

    // Fetch active sessions from database
    const sessions = await query<SessionRow>(
      `SELECT 
        id,
        device_info,
        ip_address,
        created_at,
        last_active_at,
        expires_at,
        access_token
      FROM sessions
      WHERE user_id = $1 
        AND refresh_expires_at > NOW()
      ORDER BY last_active_at DESC`,
      [actualUserId]
    );

    // Transform sessions to frontend format
    const formattedSessions: SessionResponse[] = sessions.map((session) => {
      const deviceInfo = session.device_info || {};
      const deviceName = deviceInfo.deviceName || deviceInfo.name || 'Unknown Device';
      const deviceType = (deviceInfo.deviceType || 
                         (deviceInfo.platform === 'ios' || deviceInfo.platform === 'android' ? 'mobile' : 'web')) as SessionResponse['deviceType'];
      
      // Determine location (could be enhanced with geolocation service)
      const location = deviceInfo.location || 'Unknown Location';

      // Check if this is the current session
      const isCurrent = session.access_token === currentToken;

      return {
        id: session.id,
        deviceName,
        deviceType,
        location,
        lastActive: session.last_active_at,
        isCurrent,
        ipAddress: session.ip_address || 'Unknown',
      };
    });

    return successResponse(formattedSessions);
  } catch (error: any) {
    logger.error('Error fetching sessions:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch sessions',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * DELETE /api/users/sessions
 * Revoke a specific session or all other sessions
 * 
 * Query params:
 * - sessionId: Specific session to revoke (optional)
 * - revokeAll: If true, revoke all other sessions (optional)
 */
async function deleteHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Find actual user ID
    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return errorResponse('User not found', HttpStatus.NOT_FOUND);
    }

    // Get current session token
    const authHeader = req.headers.get('authorization');
    const currentToken = authHeader?.replace('Bearer ', '');

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const revokeAll = searchParams.get('revokeAll') === 'true';

    if (revokeAll) {
      // Revoke all other sessions (keep current one)
      const result = await query(
        `DELETE FROM sessions 
         WHERE user_id = $1 
           AND access_token != $2
           AND refresh_expires_at > NOW()`,
        [actualUserId, currentToken]
      );

      logger.info('Revoked all other sessions', { userId: actualUserId, revokedCount: result.length });
      
      return successResponse({ 
        message: 'All other sessions revoked successfully',
        revokedCount: result.length 
      });
    } else if (sessionId) {
      // Revoke specific session
      // Verify session belongs to user and is not current session
      const session = await query<{ access_token: string }>(
        'SELECT access_token FROM sessions WHERE id = $1 AND user_id = $2',
        [sessionId, actualUserId]
      );

      if (session.length === 0) {
        return errorResponse('Session not found or access denied', HttpStatus.NOT_FOUND);
      }

      if (session[0].access_token === currentToken) {
        return errorResponse('Cannot revoke current session', HttpStatus.BAD_REQUEST);
      }

      // Delete the session
      await query(
        'DELETE FROM sessions WHERE id = $1 AND user_id = $2',
        [sessionId, actualUserId]
      );

      logger.info('Session revoked', { userId: actualUserId, sessionId });
      
      return successResponse({ 
        message: 'Session revoked successfully',
        sessionId 
      });
    } else {
      return errorResponse('Either sessionId or revokeAll=true must be provided', HttpStatus.BAD_REQUEST);
    }
  } catch (error: any) {
    logger.error('Error revoking session:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to revoke session',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);
