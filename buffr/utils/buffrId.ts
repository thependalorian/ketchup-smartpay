/**
 * Buffr ID Utility Functions
 * 
 * Location: utils/buffrId.ts
 * Purpose: Generate and validate Buffr ID payment aliases
 * 
 * === NAMIBIA INSTANT PAYMENT PROJECT (IPP) ALIGNMENT ===
 * 
 * The Bank of Namibia launched the Instant Payment Project in April 2024,
 * partnering with NPCI International to deploy India's UPI technology.
 * Namclear operates the system, with target go-live in 2025.
 * 
 * Buffr ID Format: username@bfr
 * IPP Alias Format: +264XXXXXXXXX@buffr (phone-based) or walletId@buffr.wallet
 * 
 * Key Standards:
 * - NAMQR Code Standards v5.0 (TLV format, EMVCo compliant)
 * - IPP interoperability requirements
 * - ISO 20022 messaging standards
 * 
 * References:
 * - Bank of Namibia: https://www.bon.com.na
 * - NPCI International Partnership: May 2024
 * - Payment Association of Namibia (PAN): https://pan.org.na
 */

/**
 * Generate a Buffr ID from user data
 * Priority: email > phone > fullName > random
 */
export function generateBuffrId(user: {
  email?: string | null;
  phoneNumber?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  id?: string;
}): string {
  let username = 'user';

  if (user.email) {
    // Extract username from email (before @)
    username = user.email.split('@')[0].toLowerCase();
    // Remove special characters, keep alphanumeric and dots
    username = username.replace(/[^a-z0-9.]/g, '');
  } else if (user.phoneNumber) {
    // Use last 8 digits of phone number
    username = user.phoneNumber.replace(/[^0-9]/g, '').slice(-8);
  } else if (user.fullName) {
    // Convert full name to username format
    username = user.fullName.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '');
  } else if (user.firstName) {
    username = user.firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  } else if (user.id) {
    // Fallback to first 8 chars of user ID
    username = user.id.substring(0, 8).toLowerCase();
  }

  // Ensure minimum length
  if (username.length < 3) {
    username = `user${username}`;
  }

  // Truncate if too long (max 20 chars for username part)
  if (username.length > 20) {
    username = username.substring(0, 20);
  }

  return `${username}@bfr`;
}

/**
 * Validate Buffr ID format
 */
export function isValidBuffrId(buffrId: string): boolean {
  if (!buffrId || typeof buffrId !== 'string') {
    return false;
  }

  // Must end with @bfr
  if (!buffrId.endsWith('@bfr')) {
    return false;
  }

  // Extract username
  const username = buffrId.slice(0, -4); // Remove @bfr

  // Username must be 3-20 characters
  if (username.length < 3 || username.length > 20) {
    return false;
  }

  // Username can only contain lowercase alphanumeric and dots
  if (!/^[a-z0-9.]+$/.test(username)) {
    return false;
  }

  // Cannot start or end with a dot
  if (username.startsWith('.') || username.endsWith('.')) {
    return false;
  }

  // Cannot have consecutive dots
  if (username.includes('..')) {
    return false;
  }

  return true;
}

/**
 * Parse Buffr ID to extract username
 */
export function parseBuffrId(buffrId: string): {
  username: string;
  domain: string;
  isValid: boolean;
} {
  if (!buffrId || typeof buffrId !== 'string') {
    return { username: '', domain: '', isValid: false };
  }

  const parts = buffrId.split('@');
  if (parts.length !== 2) {
    return { username: '', domain: '', isValid: false };
  }

  const [username, domain] = parts;
  const isValid = domain === 'bfr' && isValidBuffrId(buffrId);

  return { username, domain, isValid };
}

/**
 * Generate IPP alias for NAMQR from phone number
 */
export function generateIPPAlias(phoneNumber: string): string {
  // Normalize phone number (ensure it has country code)
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return 'user@bfr'; // Default fallback
  }
  let normalized = phoneNumber.replace(/[^0-9+]/g, '');
  if (!normalized) return 'user@bfr';
  
  // Add Namibia country code if missing
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('264')) {
      normalized = '+' + normalized;
    } else if (normalized.startsWith('0')) {
      normalized = '+264' + normalized.substring(1);
    } else {
      normalized = '+264' + normalized;
    }
  }

  return `${normalized}@buffr`;
}

/**
 * Generate wallet IPP alias for NAMQR
 */
export function generateWalletIPPAlias(walletId: string): string {
  return `${walletId}@buffr.wallet`;
}

/**
 * Check if a string is a valid phone-based IPP alias
 */
export function isPhoneIPPAlias(alias: string): boolean {
  return alias.includes('@buffr') && !alias.includes('@buffr.wallet');
}

/**
 * Check if a string is a wallet IPP alias
 */
export function isWalletIPPAlias(alias: string): boolean {
  return alias.includes('@buffr.wallet');
}

/**
 * Extract identifier from IPP alias
 */
export function extractFromIPPAlias(alias: string): {
  identifier: string;
  type: 'phone' | 'wallet' | 'unknown';
} {
  if (alias.includes('@buffr.wallet')) {
    return {
      identifier: alias.replace('@buffr.wallet', ''),
      type: 'wallet',
    };
  }
  
  if (alias.includes('@buffr')) {
    return {
      identifier: alias.replace('@buffr', ''),
      type: 'phone',
    };
  }

  return { identifier: alias, type: 'unknown' };
}

/**
 * Normalize Buffr ID (lowercase, trim whitespace)
 */
export function normalizeBuffrId(buffrId: string): string {
  return buffrId.toLowerCase().trim();
}

/**
 * Generate a unique Buffr ID with suffix if needed
 */
export function generateUniqueBuffrId(
  user: Parameters<typeof generateBuffrId>[0],
  existingIds: string[]
): string {
  let baseId = generateBuffrId(user);
  
  if (!existingIds.includes(baseId)) {
    return baseId;
  }

  // Add numeric suffix to make unique
  let suffix = 1;
  let username = baseId.slice(0, -4); // Remove @bfr
  
  // Truncate username if needed to make room for suffix
  if (username.length > 17) {
    username = username.substring(0, 17);
  }

  while (existingIds.includes(`${username}${suffix}@bfr`)) {
    suffix++;
    if (suffix > 999) {
      // Fallback to random suffix
      suffix = Math.floor(Math.random() * 9000) + 1000;
      break;
    }
  }

  return `${username}${suffix}@bfr`;
}
