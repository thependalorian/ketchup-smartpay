/**
 * Authentication Utilities
 *
 * Location: utils/auth.ts
 * Purpose: JWT token generation, verification, and user authentication
 *
 * Features:
 * - JWT token generation with refresh tokens
 * - Token verification and decoding
 * - Password hashing using crypto
 * - SecureStore integration for mobile (with web fallback)
 * - 2FA support preparation
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/utils/logger';

/**
 * Platform-aware secure storage wrapper
 * Uses SecureStore on native, AsyncStorage on web
 */
const SecureStorage = {
  async getItemAsync(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItemAsync(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItemAsync(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Token storage keys (SecureStore keys must contain only alphanumeric, ".", "-", "_")
export const AUTH_TOKEN_KEY = 'buffr_auth_token';
export const REFRESH_TOKEN_KEY = 'buffr_refresh_token';
export const USER_ID_KEY = 'buffr_user_id';

// Token expiry times (in seconds)
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

// JWT Header (base64url encoded)
const JWT_HEADER = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

/**
 * Base64 URL encode a string
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Base64 URL decode a string
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Hash a password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return digest;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Generate a random string for tokens
 */
export async function generateRandomString(length: number = 32): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * JWT Payload interface
 */
export interface JWTPayload {
  sub: string; // User ID
  iat: number; // Issued at
  exp: number; // Expiration
  type: 'access' | 'refresh';
  buffrId?: string;
  phoneNumber?: string;
}

/**
 * Generate a simple HMAC-like signature using SHA-256
 * Note: For production, use a proper JWT library with real HMAC
 */
async function generateSignature(data: string, secret: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data + secret
  );
  return base64UrlEncode(digest);
}

/**
 * Generate a JWT token
 */
export async function generateToken(
  userId: string,
  type: 'access' | 'refresh' = 'access',
  additionalPayload: Partial<JWTPayload> = {},
  secret: string = process.env.JWT_SECRET || 'buffr-jwt-secret-change-in-production'
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = type === 'access' ? ACCESS_TOKEN_EXPIRY : REFRESH_TOKEN_EXPIRY;

  const payload: JWTPayload = {
    sub: userId,
    iat: now,
    exp: now + expiry,
    type,
    ...additionalPayload,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${JWT_HEADER}.${encodedPayload}`;
  const signature = await generateSignature(signatureInput, secret);

  return `${JWT_HEADER}.${encodedPayload}.${signature}`;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
  token: string,
  secret: string = process.env.JWT_SECRET || 'buffr-jwt-secret-change-in-production'
): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;

    // Verify signature
    const signatureInput = `${header}.${payload}`;
    const expectedSignature = await generateSignature(signatureInput, secret);
    
    if (signature !== expectedSignature) {
      log.error('Invalid token signature');
      return null;
    }

    // Decode payload
    const decodedPayload = JSON.parse(base64UrlDecode(payload)) as JWTPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp < now) {
      log.error('Token expired');
      return null;
    }

    return decodedPayload;
  } catch (error) {
    log.error('Token verification error:', error);
    return null;
  }
}

/**
 * Generate access and refresh token pair
 */
export async function generateTokenPair(
  userId: string,
  additionalPayload: Partial<JWTPayload> = {}
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = await generateToken(userId, 'access', additionalPayload);
  const refreshToken = await generateToken(userId, 'refresh', additionalPayload);
  
  return { accessToken, refreshToken };
}

/**
 * Store authentication tokens securely
 */
export async function storeTokens(
  accessToken: string,
  refreshToken: string,
  userId: string
): Promise<void> {
  try {
    await SecureStorage.setItemAsync(AUTH_TOKEN_KEY, accessToken);
    await SecureStorage.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    await SecureStorage.setItemAsync(USER_ID_KEY, userId);
  } catch (error) {
    log.error('Error storing tokens:', error);
    throw new Error('Failed to store authentication tokens');
  }
}

/**
 * Get stored access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStorage.getItemAsync(AUTH_TOKEN_KEY);
  } catch (error) {
    log.error('Error getting access token:', error);
    return null;
  }
}

/**
 * Get stored refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStorage.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    log.error('Error getting refresh token:', error);
    return null;
  }
}

/**
 * Get stored user ID
 */
export async function getStoredUserId(): Promise<string | null> {
  try {
    return await SecureStorage.getItemAsync(USER_ID_KEY);
  } catch (error) {
    log.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Clear all stored authentication data
 */
export async function clearAuthData(): Promise<void> {
  try {
    await SecureStorage.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStorage.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStorage.deleteItemAsync(USER_ID_KEY);
  } catch (error) {
    log.error('Error clearing auth data:', error);
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  
  const payload = await verifyToken(token);
  return payload !== null;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    const payload = await verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') return null;

    // Generate new access token
    const newAccessToken = await generateToken(payload.sub, 'access', {
      buffrId: payload.buffrId,
      phoneNumber: payload.phoneNumber,
    });

    // Store new access token
    await SecureStorage.setItemAsync(AUTH_TOKEN_KEY, newAccessToken);

    return newAccessToken;
  } catch (error) {
    log.error('Error refreshing token:', error);
    return null;
  }
}

/**
 * Get current user ID from token
 */
export async function getCurrentUserId(): Promise<string | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  return payload?.sub || null;
}

/**
 * Extract user ID from request headers (for API routes)
 */
export async function getUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token);
  
  return payload?.sub || null;
}

/**
 * Generate OTP for 2FA
 */
export async function generateOTP(length: number = 6): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  const otp = Array.from(randomBytes)
    .map((b) => (b % 10).toString())
    .join('');
  return otp;
}

/**
 * Authentication response type
 */
export interface AuthResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  error?: string;
}

/**
 * Login with phone number and OTP
 * Note: In production, this would verify against the database
 */
export async function loginWithOTP(
  phoneNumber: string,
  otp: string
): Promise<AuthResponse> {
  try {
    // In production, verify OTP against stored value in database
    // For now, accept any 6-digit OTP for development
    if (otp.length !== 6) {
      return { success: false, error: 'Invalid OTP format' };
    }

    // Generate a user ID based on phone number for development
    const userIdHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      phoneNumber
    );
    const userId = `user-${userIdHash.substring(0, 8)}`;

    // Generate token pair
    const { accessToken, refreshToken } = await generateTokenPair(userId, {
      phoneNumber,
    });

    // Store tokens
    await storeTokens(accessToken, refreshToken, userId);

    return {
      success: true,
      accessToken,
      refreshToken,
      userId,
    };
  } catch (error) {
    log.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Logout - clear all auth data
 */
export async function logout(): Promise<void> {
  await clearAuthData();
}
