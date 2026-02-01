/**
 * Data Encryption Utility
 * 
 * Location: utils/encryption.ts
 * Purpose: Encrypt sensitive data at rest using AES-256-GCM
 * 
 * This utility provides application-level encryption for sensitive fields
 * that need to be encrypted before storing in the database.
 * 
 * Note: Database-level encryption (TDE) should be configured at the
 * infrastructure level (Neon/PostgreSQL). This utility provides
 * field-level encryption for additional security.
 * 
 * Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Unique IV per encryption operation
 * - Key derivation from master key (PBKDF2)
 * - Secure key management via environment variables
 * 
 * Usage:
 *   import { encryptField, decryptField, hashSensitive } from '@/utils/encryption';
 * 
 *   // Encrypt sensitive data before storing
 *   const encrypted = encryptField('sensitive-data');
 *   // Store encrypted.data and encrypted.iv in database
 * 
 *   // Decrypt when needed
 *   const decrypted = decryptField(encrypted.data, encrypted.iv);
 * 
 *   // Hash for one-way comparison (e.g., ID numbers for searching)
 *   const hash = hashSensitive('id-number');
 */

import crypto from 'crypto';
import { log } from './logger';

// ============================================================================
// Configuration
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const TAG_LENGTH = 16; // 128 bits for GCM authentication tag

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.DATABASE_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  log.warn(
    'ENCRYPTION_KEY not set - encryption will use a default key (NOT SECURE FOR PRODUCTION)',
    { source: 'encryption.ts' }
  );
}

// Derive encryption key from master key
function deriveKey(masterKey?: string): Buffer {
  const key = masterKey || ENCRYPTION_KEY || 'default-key-change-in-production';
  
  // Use PBKDF2 to derive a proper encryption key
  const salt = Buffer.from('buffr-encryption-salt-v1', 'utf-8'); // In production, use a random salt stored securely
  
  return crypto.pbkdf2Sync(
    key,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
}

// ============================================================================
// Encryption Functions
// ============================================================================

export interface EncryptedData {
  /** Base64-encoded encrypted data */
  data: string;
  /** Base64-encoded initialization vector (IV) */
  iv: string;
  /** Base64-encoded authentication tag */
  tag: string;
}

/**
 * Encrypt sensitive field using AES-256-GCM
 * 
 * @param plaintext - Plain text data to encrypt
 * @param masterKey - Optional master key (defaults to ENCRYPTION_KEY env var)
 * @returns EncryptedData object with data, iv, and tag
 * 
 * @example
 * ```typescript
 * const encrypted = encryptField('sensitive-id-number');
 * // Store encrypted.data, encrypted.iv, encrypted.tag in database
 * ```
 */
export function encryptField(plaintext: string, masterKey?: string): EncryptedData {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty string');
  }

  try {
    const key = deriveKey(masterKey);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf-8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  } catch (error) {
    log.error('Encryption failed', error, { source: 'encryption.ts', operation: 'encryptField' });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive field using AES-256-GCM
 * 
 * @param encryptedData - Base64-encoded encrypted data
 * @param iv - Base64-encoded initialization vector
 * @param tag - Base64-encoded authentication tag
 * @param masterKey - Optional master key (defaults to ENCRYPTION_KEY env var)
 * @returns Decrypted plain text
 * 
 * @example
 * ```typescript
 * const decrypted = decryptField(encrypted.data, encrypted.iv, encrypted.tag);
 * ```
 */
export function decryptField(
  encryptedData: string,
  iv: string,
  tag: string,
  masterKey?: string
): string {
  if (!encryptedData || !iv || !tag) {
    throw new Error('Missing required encryption parameters');
  }

  try {
    const key = deriveKey(masterKey);
    const ivBuffer = Buffer.from(iv, 'base64');
    const tagBuffer = Buffer.from(tag, 'base64');
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    
    let decrypted = decipher.update(encryptedBuffer, undefined, 'utf-8');
    decrypted += decipher.final('utf-8');
    
    return decrypted;
  } catch (error) {
    log.error('Decryption failed', error, { 
      source: 'encryption.ts', 
      operation: 'decryptField',
      // Don't log the actual data for security
    });
    throw new Error('Failed to decrypt data - data may be corrupted or key may be incorrect');
  }
}

/**
 * Hash sensitive data (one-way, for comparison/searching)
 * 
 * Use this for fields that need to be searchable but not retrievable
 * in plain text (e.g., ID numbers for duplicate detection).
 * 
 * @param data - Data to hash
 * @param salt - Optional salt (if not provided, generates a random one)
 * @returns Object with hash and salt
 * 
 * @example
 * ```typescript
 * const hashed = hashSensitive('id-number');
 * // Store hashed.hash and hashed.salt in database
 * 
 * // To verify/match:
 * const match = verifySensitiveHash('id-number', hashed.hash, hashed.salt);
 * ```
 */
export function hashSensitive(data: string, salt?: string): { hash: string; salt: string } {
  if (!data) {
    throw new Error('Cannot hash empty string');
  }

  const saltBuffer = salt 
    ? Buffer.from(salt, 'hex')
    : crypto.randomBytes(SALT_LENGTH);
  
  const hash = crypto.pbkdf2Sync(
    data,
    saltBuffer,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  
  return {
    hash: hash.toString('hex'),
    salt: saltBuffer.toString('hex'),
  };
}

/**
 * Verify hashed sensitive data
 * 
 * @param data - Plain text data to verify
 * @param hash - Stored hash
 * @param salt - Stored salt
 * @returns True if data matches hash
 */
export function verifySensitiveHash(data: string, hash: string, salt: string): boolean {
  try {
    const computed = hashSensitive(data, salt);
    return computed.hash === hash;
  } catch (error) {
    log.error('Hash verification failed', error, { source: 'encryption.ts', operation: 'verifySensitiveHash' });
    return false;
  }
}

/**
 * Generate a secure random token
 * 
 * @param length - Token length in bytes (default: 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a secure random string (base64)
 * 
 * @param length - String length in bytes (default: 32)
 * @returns Base64-encoded random string
 */
export function generateSecureString(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64');
}

// ============================================================================
// Helper Functions for Database Operations
// ============================================================================

/**
 * Encrypt a field and return values ready for database insertion
 * 
 * @param plaintext - Plain text to encrypt
 * @returns Object with encrypted_data, iv, and tag columns
 */
export function encryptForDatabase(plaintext: string): {
  encrypted_data: string;
  iv: string;
  tag: string;
} {
  const encrypted = encryptField(plaintext);
  return {
    encrypted_data: encrypted.data,
    iv: encrypted.iv,
    tag: encrypted.tag,
  };
}

/**
 * Decrypt a field from database columns
 * 
 * @param encryptedData - Encrypted data from database
 * @param iv - IV from database
 * @param tag - Tag from database
 * @returns Decrypted plain text
 */
export function decryptFromDatabase(
  encryptedData: string,
  iv: string,
  tag: string
): string {
  return decryptField(encryptedData, iv, tag);
}

// ============================================================================
// Key Management
// ============================================================================

/**
 * Validate encryption key configuration
 * 
 * @returns True if encryption is properly configured
 */
export function validateEncryptionConfig(): boolean {
  const key = ENCRYPTION_KEY;
  
  if (!key) {
    log.warn('ENCRYPTION_KEY not configured', { source: 'encryption.ts' });
    return false;
  }
  
  if (key.length < 32) {
    log.warn('ENCRYPTION_KEY is too short (minimum 32 characters recommended)', {
      source: 'encryption.ts',
      keyLength: key.length,
    });
    return false;
  }
  
  if (key === 'default-key-change-in-production') {
    log.warn('ENCRYPTION_KEY is using default value - NOT SECURE FOR PRODUCTION', {
      source: 'encryption.ts',
    });
    return false;
  }
  
  return true;
}

/**
 * Get encryption status
 * 
 * @returns Status object with configuration details
 */
export function getEncryptionStatus(): {
  configured: boolean;
  keyLength: number;
  algorithm: string;
  secure: boolean;
} {
  const key = ENCRYPTION_KEY || '';
  const configured = !!key && key !== 'default-key-change-in-production';
  
  return {
    configured,
    keyLength: key.length,
    algorithm: ALGORITHM,
    secure: configured && key.length >= 32,
  };
}
