/**
 * Open Banking API: /api/v1/auth/login
 * 
 * Open Banking-compliant authentication endpoint
 * 
 * Features:
 * - Open Banking authentication format
 * - Token response format
 * - API versioning (v1)
 * 
 * Request Body (Open Banking format):
 * {
 *   "Data": {
 *     "PhoneNumber": "+264811234567",
 *     "Password": "password123"
 *   }
 * }
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { log } from '@/utils/logger';
import { twoFactorTokens } from '@/utils/redisClient';

/**
 * POST /api/v1/auth/login
 * Authenticate user (Open Banking format)
 */
async function handleLogin(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Parse Open Banking request body
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400,
        [
          createErrorDetail(
            OpenBankingErrorCode.FIELD_MISSING,
            'The field Data is missing',
            'Data'
          ),
        ]
      );
    }

    const { PhoneNumber, Password } = Data;

    // Validate required fields
    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!PhoneNumber) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field PhoneNumber is missing',
          'Data.PhoneNumber'
        )
      );
    }

    if (!Password) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field Password is missing',
          'Data.Password'
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

    // Use existing login logic from legacy endpoint
    // Import the login handler logic
    const { default: legacyLoginHandler } = await import('@/app/api/auth/login');
    
    // Create a mock request with legacy format
    const legacyBody = {
      phoneNumber: PhoneNumber,
      password: Password,
    };

    // Call legacy handler logic (we'll need to refactor this)
    // For now, implement directly
    const users = await query<{
      id: string;
      phone_number: string;
      password_hash: string;
      is_two_factor_enabled: boolean;
      first_name: string;
      last_name: string;
    }>(
      'SELECT id, phone_number, password_hash, is_two_factor_enabled, first_name, last_name FROM users WHERE phone_number = $1',
      [PhoneNumber]
    );

    if (users.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Invalid phone number or password',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.UNAUTHORIZED,
            'Authentication failed. Please check your credentials.',
            'Data'
          ),
        ]
      );
    }

    const user = users[0];

    // Verify password (simplified - use proper bcrypt in production)
    const { compare } = await import('bcryptjs');
    const passwordValid = await compare(Password, user.password_hash);

    if (!passwordValid) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Invalid phone number or password',
        401,
        [
          createErrorDetail(
            OpenBankingErrorCode.UNAUTHORIZED,
            'Authentication failed. Please check your credentials.',
            'Data.Password'
          ),
        ]
      );
    }

    // Generate tokens
    const { sign } = await import('jsonwebtoken');
    const accessToken = sign(
      { userId: user.id, type: 'access' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );
    const refreshToken = sign(
      { userId: user.id, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      { expiresIn: '7d' }
    );

    // Return Open Banking authentication response
    const authResponse = {
      Data: {
        AccessToken: accessToken,
        RefreshToken: refreshToken,
        TokenType: 'Bearer',
        ExpiresIn: 900, // 15 minutes in seconds
        User: {
          UserId: user.id,
          PhoneNumber: user.phone_number,
          FirstName: user.first_name,
          LastName: user.last_name,
          IsTwoFactorEnabled: user.is_two_factor_enabled,
        },
      },
      Links: {
        Self: '/api/v1/auth/login',
      },
      Meta: {},
    };

    return helpers.success(
      authResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error during login:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred during authentication',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleLogin,
  {
    rateLimitConfig: RATE_LIMITS.auth,
    requireAuth: false, // Public endpoint
    trackResponseTime: true,
  }
);
