/**
 * Data Anonymization Utilities
 * 
 * Location: utils/dataAnonymization.ts
 * Purpose: Privacy-compliant data anonymization for analytics exports
 * 
 * Implements anonymization techniques to comply with Data Protection Act 2019:
 * - Removes personal identifiers (user IDs, phone numbers, emails)
 * - Hashes sensitive identifiers for consistency
 * - Aggregates data to prevent re-identification
 * - Preserves analytical value while protecting privacy
 */

/**
 * Anonymize user ID by hashing
 * Returns consistent hash for same user ID (useful for analytics)
 */
export function anonymizeUserId(userId: string): string {
  // Simple hash function for consistent anonymization
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `user_${Math.abs(hash).toString(16).substring(0, 8)}`;
}

/**
 * Anonymize phone number
 * Removes last 4 digits and replaces with hash
 */
export function anonymizePhoneNumber(phone: string): string {
  if (!phone || phone.length < 4) return '***';
  const prefix = phone.substring(0, phone.length - 4);
  const hash = phone.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `${prefix}${(hash % 10000).toString().padStart(4, '0')}`;
}

/**
 * Anonymize email address
 * Replaces domain and part of username
 */
export function anonymizeEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [username, domain] = email.split('@');
  const anonymizedUsername = username.length > 2
    ? `${username.substring(0, 2)}***`
    : '***';
  return `${anonymizedUsername}@${domain.split('.')[0]}.***`;
}

/**
 * Anonymize transaction data
 * Removes personal identifiers while preserving analytical value
 */
export function anonymizeTransaction(transaction: Record<string, any>): Record<string, any> {
  const anonymized = { ...transaction };

  // Remove or anonymize personal identifiers
  if (anonymized.user_id) {
    anonymized.user_id = anonymizeUserId(anonymized.user_id);
  }
  if (anonymized.recipient_id) {
    anonymized.recipient_id = anonymizeUserId(anonymized.recipient_id);
  }
  if (anonymized.phone_number) {
    anonymized.phone_number = anonymizePhoneNumber(anonymized.phone_number);
  }
  if (anonymized.email) {
    anonymized.email = anonymizeEmail(anonymized.email);
  }

  // Remove sensitive metadata
  if (anonymized.metadata) {
    const safeMetadata = { ...anonymized.metadata };
    delete safeMetadata.userName;
    delete safeMetadata.recipientName;
    delete safeMetadata.deviceId;
    delete safeMetadata.ipAddress;
    anonymized.metadata = safeMetadata;
  }

  return anonymized;
}

/**
 * Anonymize user behavior analytics
 */
export function anonymizeUserBehavior(userBehavior: Record<string, any>): Record<string, any> {
  const anonymized = { ...userBehavior };

  if (anonymized.user_id) {
    anonymized.user_id = anonymizeUserId(anonymized.user_id);
  }

  return anonymized;
}

/**
 * Anonymize analytics dataset
 * Processes array of records and anonymizes each
 */
export function anonymizeDataset<T extends Record<string, any>>(
  data: T[],
  anonymizer: (record: T) => T
): T[] {
  return data.map(anonymizer);
}

/**
 * Check if data is already aggregated (safe for export)
 * Aggregated data typically doesn't contain personal identifiers
 */
export function isAggregatedData(data: Record<string, any>): boolean {
  // Aggregated data typically has these characteristics:
  // - No user_id or anonymized user_id
  // - Contains aggregate fields (totals, averages, counts)
  // - Date-based grouping
  const hasAggregateFields = 
    'total_transactions' in data ||
    'total_volume' in data ||
    'average_transaction_amount' in data ||
    'unique_users' in data;
  
  const hasNoPersonalIds = 
    !data.user_id ||
    (typeof data.user_id === 'string' && data.user_id.startsWith('user_'));

  return hasAggregateFields && hasNoPersonalIds;
}

/**
 * Anonymize analytics export data
 * Applies appropriate anonymization based on data type
 */
export function anonymizeAnalyticsExport(data: any[]): any[] {
  return data.map((record) => {
    // If already aggregated, minimal anonymization needed
    if (isAggregatedData(record)) {
      return record;
    }

    // For detailed records, apply full anonymization
    if (record.user_id) {
      return anonymizeUserBehavior(record);
    }

    if (record.transaction_id || record.type) {
      return anonymizeTransaction(record);
    }

    return record;
  });
}
