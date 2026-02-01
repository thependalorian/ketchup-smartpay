/**
 * Server-Side JWT Authentication Utilities
 * 
 * Location: utils/authServer.ts
 * Purpose: JWT token generation and verification for server-side API routes
 * 
 * This file is for server-side use only (API routes).
 * For client-side (React Native), use utils/auth.ts
 * 
 * Features:
 * - JWT token generation with jsonwebtoken library
 * - Token verification and decoding
 * - Access and refresh token pairs
 * - Proper HMAC-SHA256 signing
 */

import jwt from 'jsonwebtoken';
import { log } from '@/utils/logger';

// Token expiry times (in seconds)
export const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

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
 * Get JWT secret from environment
 */
function getJWTSecret(type: 'access' | 'refresh' = 'access'): string {
  const secret = type === 'access' 
    ? process.env.JWT_SECRET 
    : process.env.JWT_REFRESH_SECRET;
  
  if (!secret) {
    throw new Error(
      `JWT ${type} secret is not set. Please set ${type === 'access' ? 'JWT_SECRET' : 'JWT_REFRESH_SECRET'} in environment variables.`
    );
  }
  
  // Validate secret length in production
  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      `JWT ${type} secret must be at least 32 characters for security.`
    );
  }
  
  return secret;
}

/**
 * Generate a JWT access token
 */
export function generateAccessToken(
  userId: string,
  additionalPayload: Partial<JWTPayload> = {}
): string {
  const payload: JWTPayload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY,
    type: 'access',
    ...additionalPayload,
  };

  return jwt.sign(payload, getJWTSecret('access'), {
    algorithm: 'HS256',
  });
}

/**
 * Generate a JWT refresh token
 */
export function generateRefreshToken(
  userId: string,
  additionalPayload: Partial<JWTPayload> = {}
): string {
  const payload: JWTPayload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY,
    type: 'refresh',
    ...additionalPayload,
  };

  return jwt.sign(payload, getJWTSecret('refresh'), {
    algorithm: 'HS256',
  });
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(
  userId: string,
  additionalPayload: Partial<JWTPayload> = {}
): { accessToken: string; refreshToken: string } {
  const accessToken = generateAccessToken(userId, additionalPayload);
  const refreshToken = generateRefreshToken(userId, additionalPayload);
  
  return { accessToken, refreshToken };
}

/**
 * Verify and decode a JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret('access'), {
      algorithms: ['HS256'],
    }) as JWTPayload;
    
    // Ensure it's an access token
    if (decoded.type !== 'access') {
      log.error('Token is not an access token');
      return null;
    }
    
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      log.error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      log.error('Invalid access token:', error.message);
    } else {
      log.error('Token verification error:', error);
    }
    return null;
  }
}

/**
 * Verify and decode a JWT refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret('refresh'), {
      algorithms: ['HS256'],
    }) as JWTPayload;
    
    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      log.error('Token is not a refresh token');
      return null;
    }
    
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      log.error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      log.error('Invalid refresh token:', error.message);
    } else {
      log.error('Token verification error:', error);
    }
    return null;
  }
}

/**
 * Extract user ID from JWT token (access or refresh)
 * Returns null if token is invalid or expired
 */
export function getUserIdFromToken(token: string, type: 'access' | 'refresh' = 'access'): string | null {
  const payload = type === 'access' 
    ? verifyAccessToken(token)
    : verifyRefreshToken(token);
  
  return payload?.sub || null;
}

/**
 * Extract user ID from Authorization header
 * Returns null if header is missing or token is invalid
 */
export function getUserIdFromAuthHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return getUserIdFromToken(token, 'access');
}

