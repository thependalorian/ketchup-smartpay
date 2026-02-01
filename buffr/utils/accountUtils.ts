/**
 * Account Utilities
 * 
 * Location: utils/accountUtils.ts
 * Purpose: Centralized utility functions for account-related operations
 * 
 * Ensures consistency across the app for account number generation and formatting
 */

import { User } from '@/contexts/UserContext';

/**
 * Generate Buffr account number from user data
 * 
 * This function ensures consistent account number generation across the entire app.
 * The account number is derived from the user's identifier (ID, email, or phone number)
 * to ensure it remains stable for the same user.
 * 
 * @param user - User object from UserContext
 * @param fallback - Fallback account number if user is not available (default: '018')
 * @returns 3-digit account number string (e.g., '541', '823')
 */
export function getBuffrAccountNumber(user: User | null, fallback: string = '018'): string {
  if (!user) return fallback;
  
  // Use user ID or email to generate consistent account number
  const identifier = user.id || user.email || user.phoneNumber || fallback;
  
  // Extract last 3 digits from identifier hash
  const hash = identifier.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return String(hash % 1000).padStart(3, '0');
}

/**
 * Format account number for display
 * 
 * @param accountNumber - Account number (3 digits)
 * @returns Formatted account number with dots prefix (e.g., '..541')
 */
export function formatAccountNumber(accountNumber: string): string {
  return `..${accountNumber}`;
}
