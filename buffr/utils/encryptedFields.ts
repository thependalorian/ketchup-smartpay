/**
 * Encrypted Fields Helper Utilities
 * 
 * Location: utils/encryptedFields.ts
 * Purpose: Helper functions for encrypting/decrypting sensitive database fields
 * 
 * This module provides convenient wrappers around the encryption utility
 * for common database operations involving sensitive fields.
 * 
 * Usage:
 *   import { encryptBankAccount, decryptBankAccount } from '@/utils/encryptedFields';
 * 
 *   // When storing
 *   const encrypted = encryptBankAccount('1234567890');
 *   await query(
 *     `INSERT INTO user_banks (account_number_encrypted_data, account_number_iv, account_number_tag)
 *      VALUES ($1, $2, $3)`,
 *     [encrypted.data, encrypted.iv, encrypted.tag]
 *   );
 * 
 *   // When reading
 *   const row = await queryOne('SELECT * FROM user_banks WHERE id = $1', [id]);
 *   const decrypted = decryptBankAccount(row.account_number_encrypted_data, row.account_number_iv, row.account_number_tag);
 */

import { 
  encryptField, 
  decryptField, 
  hashSensitive, 
  verifySensitiveHash,
  type EncryptedData 
} from './encryption';
import { log } from './logger';

// ============================================================================
// Bank Account Number Encryption
// ============================================================================

/**
 * Encrypt bank account number for database storage
 * 
 * @param accountNumber - Plain text account number
 * @returns EncryptedData with data, iv, and tag
 */
export function encryptBankAccount(accountNumber: string): EncryptedData {
  if (!accountNumber) {
    throw new Error('Account number cannot be empty');
  }
  return encryptField(accountNumber);
}

/**
 * Decrypt bank account number from database
 * 
 * @param encryptedData - Encrypted data from database
 * @param iv - IV from database
 * @param tag - Tag from database
 * @returns Decrypted account number
 */
export function decryptBankAccount(
  encryptedData: string | null | undefined,
  iv: string | null | undefined,
  tag: string | null | undefined
): string | null {
  if (!encryptedData || !iv || !tag) {
    return null;
  }
  
  try {
    return decryptField(encryptedData, iv, tag);
  } catch (error) {
    log.error('Failed to decrypt bank account number', error);
    return null;
  }
}

// ============================================================================
// Card Number Encryption
// ============================================================================

/**
 * Encrypt card number for database storage
 * 
 * @param cardNumber - Plain text card number
 * @returns EncryptedData with data, iv, and tag
 */
export function encryptCardNumber(cardNumber: string): EncryptedData {
  if (!cardNumber) {
    throw new Error('Card number cannot be empty');
  }
  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');
  return encryptField(cleaned);
}

/**
 * Decrypt card number from database
 * 
 * @param encryptedData - Encrypted data from database
 * @param iv - IV from database
 * @param tag - Tag from database
 * @returns Decrypted card number
 */
export function decryptCardNumber(
  encryptedData: string | null | undefined,
  iv: string | null | undefined,
  tag: string | null | undefined
): string | null {
  if (!encryptedData || !iv || !tag) {
    return null;
  }
  
  try {
    return decryptField(encryptedData, iv, tag);
  } catch (error) {
    log.error('Failed to decrypt card number', error);
    return null;
  }
}

// ============================================================================
// National ID Encryption
// ============================================================================

/**
 * Encrypt national ID number for database storage
 * Also generates a hash for duplicate detection
 * 
 * @param nationalId - Plain text national ID
 * @returns Object with encrypted data and hash for searching
 */
export function encryptNationalId(nationalId: string): {
  encrypted: EncryptedData;
  hash: string;
  salt: string;
} {
  if (!nationalId) {
    throw new Error('National ID cannot be empty');
  }
  
  const encrypted = encryptField(nationalId);
  const hashed = hashSensitive(nationalId);
  
  return {
    encrypted,
    hash: hashed.hash,
    salt: hashed.salt,
  };
}

/**
 * Decrypt national ID number from database
 * 
 * @param encryptedData - Encrypted data from database
 * @param iv - IV from database
 * @param tag - Tag from database
 * @returns Decrypted national ID
 */
export function decryptNationalId(
  encryptedData: string | null | undefined,
  iv: string | null | undefined,
  tag: string | null | undefined
): string | null {
  if (!encryptedData || !iv || !tag) {
    return null;
  }
  
  try {
    return decryptField(encryptedData, iv, tag);
  } catch (error) {
    log.error('Failed to decrypt national ID', error);
    return null;
  }
}

/**
 * Check if a national ID matches a stored hash (for duplicate detection)
 * 
 * @param nationalId - Plain text national ID to check
 * @param storedHash - Hash from database
 * @param storedSalt - Salt from database
 * @returns True if national ID matches
 */
export function verifyNationalId(
  nationalId: string,
  storedHash: string | null | undefined,
  storedSalt: string | null | undefined
): boolean {
  if (!storedHash || !storedSalt) {
    return false;
  }
  
  return verifySensitiveHash(nationalId, storedHash, storedSalt);
}

// ============================================================================
// Database Helper Functions
// ============================================================================

/**
 * Prepare encrypted bank account data for database insertion
 * 
 * @param accountNumber - Plain text account number
 * @returns Object with encrypted_data, iv, and tag columns
 */
export function prepareEncryptedBankAccount(accountNumber: string): {
  account_number_encrypted_data: string;
  account_number_iv: string;
  account_number_tag: string;
} {
  const encrypted = encryptBankAccount(accountNumber);
  return {
    account_number_encrypted_data: encrypted.data,
    account_number_iv: encrypted.iv,
    account_number_tag: encrypted.tag,
  };
}

/**
 * Prepare encrypted card number data for database insertion
 * 
 * @param cardNumber - Plain text card number
 * @returns Object with encrypted_data, iv, and tag columns
 */
export function prepareEncryptedCardNumber(cardNumber: string): {
  card_number_encrypted_data: string;
  card_number_iv: string;
  card_number_tag: string;
} {
  const encrypted = encryptCardNumber(cardNumber);
  return {
    card_number_encrypted_data: encrypted.data,
    card_number_iv: encrypted.iv,
    card_number_tag: encrypted.tag,
  };
}

/**
 * Prepare encrypted national ID data for database insertion
 * 
 * @param nationalId - Plain text national ID
 * @returns Object with encrypted, iv, tag, hash, and salt columns
 */
export function prepareEncryptedNationalId(nationalId: string): {
  national_id_encrypted: string;
  national_id_iv: string;
  national_id_tag: string;
  national_id_hash: string;
  national_id_salt: string;
} {
  const { encrypted, hash, salt } = encryptNationalId(nationalId);
  return {
    national_id_encrypted: encrypted.data,
    national_id_iv: encrypted.iv,
    national_id_tag: encrypted.tag,
    national_id_hash: hash,
    national_id_salt: salt,
  };
}

/**
 * Extract and decrypt bank account from database row
 * 
 * @param row - Database row with encrypted fields
 * @returns Decrypted account number or null
 */
export function extractBankAccount(row: {
  account_number_encrypted_data?: string | null;
  account_number_iv?: string | null;
  account_number_tag?: string | null;
}): string | null {
  return decryptBankAccount(
    row.account_number_encrypted_data,
    row.account_number_iv,
    row.account_number_tag
  );
}

/**
 * Extract and decrypt card number from database row
 * 
 * @param row - Database row with encrypted fields
 * @returns Decrypted card number or null
 */
export function extractCardNumber(row: {
  card_number_encrypted_data?: string | null;
  card_number_iv?: string | null;
  card_number_tag?: string | null;
}): string | null {
  return decryptCardNumber(
    row.card_number_encrypted_data,
    row.card_number_iv,
    row.card_number_tag
  );
}

/**
 * Extract and decrypt national ID from database row
 * 
 * @param row - Database row with encrypted fields
 * @returns Decrypted national ID or null
 */
export function extractNationalId(row: {
  national_id_encrypted?: string | null;
  national_id_iv?: string | null;
  national_id_tag?: string | null;
}): string | null {
  return decryptNationalId(
    row.national_id_encrypted,
    row.national_id_iv,
    row.national_id_tag
  );
}
