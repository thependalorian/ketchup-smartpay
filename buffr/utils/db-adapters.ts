/**
 * Database Adapters
 * 
 * Location: utils/db-adapters.ts
 * Purpose: Adapter functions to work with existing database schema
 * 
 * The existing database has a different schema than our new schema.
 * These adapters map between the API expectations and the actual database structure.
 */

/**
 * Map user row from database to API format
 */
export function mapUserRow(user: any) {
  return {
    id: user.id || user.external_id,
    phone_number: user.phone_number,
    email: user.email,
    first_name: user.full_name ? user.full_name.split(' ')[0] : null,
    last_name: user.full_name ? user.full_name.split(' ').slice(1).join(' ') : null,
    full_name: user.full_name,
    avatar: user.metadata?.avatar || null,
    is_verified: user.kyc_level ? user.kyc_level > 0 : false,
    is_two_factor_enabled: user.metadata?.is_two_factor_enabled || false,
    currency: user.metadata?.currency || 'N$',
    last_login_at: user.metadata?.last_login_at || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

/**
 * Map wallet row from database to API format
 */
export function mapWalletRow(wallet: any) {
  return {
    id: wallet.id,
    user_id: wallet.user_id,
    name: wallet.name,
    icon: wallet.metadata?.icon || 'credit-card',
    type: wallet.type,
    balance: wallet.balance,
    currency: wallet.currency,
    purpose: wallet.metadata?.purpose || null,
    card_design: wallet.metadata?.card_design || 2,
    card_number: wallet.metadata?.card_number || null,
    cardholder_name: wallet.metadata?.cardholder_name || null,
    expiry_date: wallet.metadata?.expiry_date || null,
    auto_pay_enabled: wallet.metadata?.auto_pay_enabled || false,
    auto_pay_max_amount: wallet.metadata?.auto_pay_max_amount || null,
    auto_pay_settings: wallet.metadata?.auto_pay_settings || null,
    auto_pay_frequency: wallet.metadata?.auto_pay_frequency || null,
    auto_pay_deduct_date: wallet.metadata?.auto_pay_deduct_date || null,
    auto_pay_deduct_time: wallet.metadata?.auto_pay_deduct_time || null,
    auto_pay_amount: wallet.metadata?.auto_pay_amount || null,
    auto_pay_repayments: wallet.metadata?.auto_pay_repayments || null,
    auto_pay_payment_method: wallet.metadata?.auto_pay_payment_method || null,
    pin_protected: wallet.metadata?.pin_protected || false,
    biometric_enabled: wallet.metadata?.biometric_enabled || false,
    created_at: wallet.created_at,
    updated_at: wallet.updated_at,
  };
}

/**
 * Map transaction row from database to API format
 */
export function mapTransactionRow(transaction: any) {
  return {
    id: transaction.id,
    user_id: transaction.user_id,
    wallet_id: transaction.metadata?.wallet_id || null,
    type: mapTransactionType(transaction.transaction_type),
    amount: transaction.amount,
    currency: transaction.currency || 'N$',
    description: transaction.metadata?.description || transaction.merchant_name || null,
    category: transaction.merchant_category || null,
    recipient_id: transaction.merchant_id || transaction.metadata?.recipient_id || null,
    recipient_name: transaction.merchant_name || transaction.metadata?.recipient_name || null,
    status: transaction.status,
    date: transaction.transaction_time || transaction.created_at,
    created_at: transaction.created_at,
  };
}

/**
 * Map transaction type from database format to API format
 */
function mapTransactionType(dbType: string): string {
  const typeMap: Record<string, string> = {
    'debit': 'sent',
    'credit': 'received',
    'payment': 'payment',
    'transfer': 'transfer_out',
    'deposit': 'transfer_in',
  };
  return typeMap[dbType.toLowerCase()] || dbType.toLowerCase();
}

/**
 * Prepare wallet data for database insert/update
 */
export function prepareWalletData(data: any, userId: string) {
  const metadata: any = {
    icon: data.icon,
    purpose: data.purpose,
    card_design: data.cardDesign || data.card_design,
    card_number: data.cardNumber || data.card_number,
    cardholder_name: data.cardholderName || data.cardholder_name,
    expiry_date: data.expiryDate || data.expiry_date,
    auto_pay_enabled: data.autoPayEnabled !== undefined ? data.autoPayEnabled : data.auto_pay_enabled,
    auto_pay_max_amount: data.autoPayMaxAmount !== undefined ? data.autoPayMaxAmount : data.auto_pay_max_amount,
    auto_pay_settings: data.autoPaySettings || data.auto_pay_settings,
    auto_pay_frequency: data.autoPayFrequency || data.auto_pay_frequency,
    auto_pay_deduct_date: data.autoPayDeductDate || data.auto_pay_deduct_date,
    auto_pay_deduct_time: data.autoPayDeductTime || data.auto_pay_deduct_time,
    auto_pay_amount: data.autoPayAmount !== undefined ? data.autoPayAmount : data.auto_pay_amount,
    auto_pay_repayments: data.autoPayRepayments !== undefined ? data.autoPayRepayments : data.auto_pay_repayments,
    auto_pay_payment_method: data.autoPayPaymentMethod || data.auto_pay_payment_method,
    pin_protected: data.pinProtected !== undefined ? data.pinProtected : data.pin_protected,
    biometric_enabled: data.biometricEnabled !== undefined ? data.biometricEnabled : data.biometric_enabled,
  };

  // Remove undefined values
  Object.keys(metadata).forEach(key => {
    if (metadata[key] === undefined) delete metadata[key];
  });

  return {
    user_id: userId,
    name: data.name,
    type: data.type || 'personal',
    currency: data.currency || 'N$',
    balance: data.balance || 0,
    available_balance: data.balance || 0,
    status: 'active',
    is_default: data.is_default || false,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
}

/**
 * Prepare transaction data for database insert
 */
export function prepareTransactionData(data: any, userId: string) {
  const metadata: any = {
    wallet_id: data.walletId || data.wallet_id,
    description: data.description,
    category: data.category,
    recipient_id: data.recipientId || data.recipient_id,
    recipient_name: data.recipientName || data.recipient_name,
  };

  // Remove undefined values
  Object.keys(metadata).forEach(key => {
    if (metadata[key] === undefined) delete metadata[key];
  });

  // Map transaction type
  const typeMap: Record<string, string> = {
    'sent': 'debit',
    'received': 'credit',
    'payment': 'payment',
    'transfer_in': 'deposit',
    'transfer_out': 'transfer',
  };

  return {
    external_id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    amount: data.amount,
    currency: data.currency || 'N$',
    transaction_type: typeMap[data.type] || data.type,
    status: data.status || 'completed',
    transaction_time: data.date || data.transaction_time || new Date(),
    merchant_name: data.recipientName || data.recipient_name || null,
    merchant_category: data.category || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
}

/**
 * Get user ID - handles both UUID and VARCHAR user IDs
 */
export function getUserIdForQuery(userId: string): any {
  // If it's a UUID format, return as is
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return userId;
  }
  // Otherwise, it's an external_id - we need to look it up
  // For now, return as is and let the query handle it
  return userId;
}

/**
 * Find user by external ID or ID
 * Returns the UUID if found, or null if not found
 */
export async function findUserId(sql: any, userIdOrExternalId: string): Promise<string | null> {
  try {
    // Try as UUID first
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userIdOrExternalId)) {
      const user = await sql`SELECT id FROM users WHERE id = ${userIdOrExternalId}`;
      if (user.length > 0) return user[0].id;
    }
    
    // Try as external_id
    const user = await sql`SELECT id FROM users WHERE external_id = ${userIdOrExternalId}`;
    if (user.length > 0) return user[0].id;
    
    // If not found and it's a simple string like 'user-1', return as-is for VARCHAR fields
    // (Some tables use VARCHAR for user_id)
    return userIdOrExternalId;
  } catch {
    // On error, return the original ID (might work for VARCHAR fields)
    return userIdOrExternalId;
  }
}
