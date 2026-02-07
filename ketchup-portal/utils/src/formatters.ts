/**
 * Formatting Utilities
 */

import { format, formatDistance, formatRelative } from 'date-fns';

/**
 * Format currency in Namibian Dollars
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    return `N$${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (amount >= 1_000_000) {
    return `N$${(amount / 1_000_000).toFixed(2)}M`;
  }
  return new Intl.NumberFormat('en-NA', {
    style: 'currency',
    currency: 'NAD',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: Date | string, formatStr: string = 'PPP'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Format relative time
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(dateObj, new Date(), { addSuffix: true });
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+264 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format number with commas
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-NA').format(value);
};
