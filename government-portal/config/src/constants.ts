/**
 * Application Constants
 */

export const GRANT_TYPES = {
  BPSIG: 'Basic Protected Social Income Grant',
  OVC: 'Orphans and Vulnerable Children',
  DISABILITY: 'Disability Grant',
  VETERANS: 'Veterans Grant',
  ELDERLY: 'Elderly Grant',
  OTHER: 'Other',
} as const;

export const REGIONS = [
  'Erongo',
  'Hardap',
  'Karas',
  'Kavango East',
  'Kavango West',
  'Khomas',
  'Kunene',
  'Ohangwena',
  'Omaheke',
  'Omusati',
  'Oshana',
  'Oshikoto',
  'Otjozondjupa',
  'Zambezi',
] as const;

export const STATUS_COLORS = {
  active: 'green',
  inactive: 'gray',
  pending: 'yellow',
  suspended: 'red',
  completed: 'green',
  processing: 'blue',
  failed: 'red',
  cancelled: 'gray',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
} as const;
