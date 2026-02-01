/**
 * Login API Route
 * 
 * Location: app/api/auth/login.ts
 * Purpose: Handle user login with phone number and OTP
 * 
 * Endpoints:
 * POST /api/auth/login - Login with phone/OTP or generate OTP
 * 
 * Request body:
 * - { phone_number: string, action: 'request_otp' } - Request OTP
 * - { phone_number: string, otp: string, action: 'verify_otp' } - Verify OTP and login
 */

import { ExpoRequest } from 'expo-router/server';
import logger from '@/utils/logger';
import { query, findUserId } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';

// Import JWT token generation
import { generateTokenPair } from '@/utils/authServer';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate random 8-character ID for user/wallet IDs
function generateRandomId(): string {
  // Use crypto.randomUUID if available, otherwise fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  }
  // Fallback: generate random hex string
  return Math.random().toString(36).substring(2, 10);
}

// Store OTP in database
async function storeOTP(phoneNumber: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await query(`
    INSERT INTO otp_codes (phone_number, code, expires_at, used)
    VALUES ($1, $2, $3, false)
    ON CONFLICT (phone_number) DO UPDATE
    SET code = $2, expires_at = $3, used = false
  `, [phoneNumber, otp, expiresAt]);
}

// Verify OTP from database
async function verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
  const result = await query(`
    SELECT * FROM otp_codes
    WHERE phone_number = $1
    AND code = $2
    AND expires_at > NOW()
    AND used = false
  `, [phoneNumber, otp]);

  if (result.length === 0) {
    return false;
  }

  // Mark OTP as used
  await query(`
    UPDATE otp_codes
    SET used = true
    WHERE phone_number = $1
  `, [phoneNumber]);

  return true;
}

// Get or create user by phone number
async function getOrCreateUser(phoneNumber: string): Promise<{
  id: string;
  isNewUser: boolean;
  buffrId?: string;
}> {
  // Check if user exists
  const existingUsers = await query(`
    SELECT id, buffr_id FROM users WHERE phone_number = $1
  `, [phoneNumber]);

  if (existingUsers.length > 0) {
    return {
      id: existingUsers[0].id,
      isNewUser: false,
      buffrId: existingUsers[0].buffr_id,
    };
  }

  // Create new user
  const newUserId = `user-${generateRandomId()}`;
  const buffrId = `${phoneNumber.replace(/\D/g, '').slice(-8)}@bfr`;

  await query(`
    INSERT INTO users (id, phone_number, buffr_id, is_verified, currency, created_at)
    VALUES ($1, $2, $3, true, 'N$', NOW())
  `, [newUserId, phoneNumber, buffrId]);

  // Create default wallet for new user
  await query(`
    INSERT INTO wallets (id, user_id, name, icon, balance, currency, is_default, created_at)
    VALUES ($1, $2, 'Buffr Account', 'credit-card', 0, 'N$', true, NOW())
  `, [`wallet-${generateRandomId()}`, newUserId]);

  return {
    id: newUserId,
    isNewUser: true,
    buffrId,
  };
}

// Create JWT tokens (no database session storage needed)
async function createTokens(userId: string, buffrId?: string, phoneNumber?: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}> {
  // Generate JWT token pair
  const { accessToken, refreshToken } = generateTokenPair(userId, {
    buffrId,
    phoneNumber,
  });
  
  // Calculate expiration (15 minutes for access token)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  return { accessToken, refreshToken, expiresAt };
}

async function handleLogin(request: ExpoRequest) {
  let action: string | undefined;
  let normalizedPhone: string | undefined;
  try {
    const body = await request.json();
    const { phone_number, otp } = body;
    action = body.action;

    if (!phone_number) {
      return errorResponse('Phone number is required', HttpStatus.BAD_REQUEST);
    }

    // Normalize phone number
    normalizedPhone = phone_number.replace(/\s+/g, '');

    switch (action) {
      case 'request_otp': {
        if (!normalizedPhone) {
          return errorResponse('Phone number is required', HttpStatus.BAD_REQUEST);
        }
        // Generate and store OTP
        const generatedOtp = generateOTP();
        await storeOTP(normalizedPhone, generatedOtp);

        // In production, send OTP via SMS
        // For development, log it (or return it in response)
        logger.debug({ phone: normalizedPhone, otp: generatedOtp }, 'OTP generated');

        const responseData: any = { message: 'OTP sent successfully' };
        // Remove in production - only for development
        if (process.env.NODE_ENV === 'development') {
          responseData.dev_otp = generatedOtp;
        }
        return successResponse(responseData);
      }

      case 'verify_otp': {
        if (!otp) {
          return errorResponse('OTP is required', HttpStatus.BAD_REQUEST);
        }
        if (!normalizedPhone) {
          return errorResponse('Phone number is required', HttpStatus.BAD_REQUEST);
        }

        // Verify OTP
        const isValid = await verifyOTP(normalizedPhone, otp);
        if (!isValid) {
          return errorResponse('Invalid or expired OTP', HttpStatus.UNAUTHORIZED);
        }

        // Get or create user
        const { id: userId, isNewUser, buffrId } = await getOrCreateUser(normalizedPhone);

        // Create JWT tokens
        const tokens = await createTokens(userId, buffrId, normalizedPhone);

        return successResponse({
          user_id: userId,
          buffr_id: buffrId,
          is_new_user: isNewUser,
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: tokens.expiresAt.toISOString(),
        });
      }

      default:
        return errorResponse('Invalid action. Use "request_otp" or "verify_otp"', HttpStatus.BAD_REQUEST);
    }
  } catch (error) {
    logger.error({ err: error, action, phone: normalizedPhone }, 'Auth login error');
    return errorResponse(
      error instanceof Error ? error.message : 'Authentication failed',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply security wrappers with auth rate limits
export const POST = secureAuthRoute(RATE_LIMITS.auth, handleLogin);
