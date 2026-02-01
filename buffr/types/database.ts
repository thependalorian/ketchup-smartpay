/**
 * Database Types for Buffr Payment Companion
 *
 * Location: types/database.ts
 * Purpose: TypeScript types matching the actual database schema
 *
 * IMPORTANT: These types reflect the PRODUCTION schema after migrations.
 * Always keep in sync with sql/schema.sql and migration files.
 *
 * Naming Convention:
 * - DB types use snake_case (matching PostgreSQL)
 * - API types use camelCase (REST convention)
 * - Use adapters (utils/db-adapters.ts) to convert between them
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserStatus = 'active' | 'suspended' | 'locked' | 'pending_verification';
export type UserRole = 'user' | 'admin' | 'super_admin';
export type KycLevel = 0 | 1 | 2 | 3; // 0=none, 1=basic, 2=verified, 3=enhanced

export interface DBUser {
  id: string; // UUID or VARCHAR(255)
  external_id?: string; // String ID for external references
  phone_number?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar?: string;
  is_verified: boolean;
  is_two_factor_enabled: boolean;
  kyc_level: KycLevel;
  currency: string;
  status: UserStatus;
  role?: UserRole;
  buffr_id?: string;
  last_login_at?: Date;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface APIUser {
  id: string;
  externalId?: string;
  phoneNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  isVerified: boolean;
  isTwoFactorEnabled: boolean;
  kycLevel: number;
  currency: string;
  status: UserStatus;
  role?: UserRole;
  buffrId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// WALLET TYPES
// ============================================================================

export type WalletType = 'personal' | 'savings' | 'business' | 'group';
export type WalletStatus = 'active' | 'dormant' | 'closed' | 'suspended';
export type DormancyStatus = 'active' | 'warning' | 'dormant' | 'closed' | 'funds_released';

export interface DBWallet {
  id: string; // UUID
  user_id: string;
  name: string;
  icon?: string;
  type: WalletType;
  balance: number;
  available_balance: number;
  currency: string;
  purpose?: string;
  card_design?: number;
  card_number?: string;
  cardholder_name?: string;
  expiry_date?: string;

  // AutoPay Settings
  auto_pay_enabled: boolean;
  auto_pay_max_amount?: number;
  auto_pay_frequency?: 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';
  auto_pay_deduct_date?: string;
  auto_pay_deduct_time?: string;
  auto_pay_amount?: number;
  auto_pay_repayments?: number;
  auto_pay_payment_method?: string;

  // Security
  pin_protected: boolean;
  biometric_enabled: boolean;

  // Status
  is_default: boolean;
  status: WalletStatus;

  // Dormancy (PSD-3 compliance)
  last_transaction_at?: Date;
  dormancy_status: DormancyStatus;
  dormancy_warning_sent_at?: Date;
  dormancy_started_at?: Date;

  // Metadata
  metadata?: Record<string, unknown>;

  created_at: Date;
  updated_at: Date;
}

export interface APIWallet {
  id: string;
  userId: string;
  name: string;
  icon?: string;
  type: WalletType;
  balance: number;
  availableBalance: number;
  currency: string;
  purpose?: string;
  cardDesign?: number;

  // AutoPay
  autoPayEnabled: boolean;
  autoPayMaxAmount?: number;
  autoPayFrequency?: string;

  // Security
  pinProtected: boolean;
  biometricEnabled: boolean;

  // Status
  isDefault: boolean;
  status: WalletStatus;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TRANSACTION TYPES
// ============================================================================

// Database stores these values
export type DBTransactionType = 'debit' | 'credit' | 'payment' | 'deposit' | 'transfer';

// API returns these values (more user-friendly)
export type APITransactionType = 'sent' | 'received' | 'payment' | 'transfer_in' | 'transfer_out';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type SettlementStatus = 'pending' | 'processing' | 'settled' | 'failed';

export interface DBTransaction {
  id: string; // UUID
  external_id?: string; // String ID for external references
  user_id: string;
  wallet_id?: string;
  type?: string; // Legacy column
  transaction_type: DBTransactionType;
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  recipient_id?: string;
  recipient_name?: string;
  status: TransactionStatus;
  date?: Date; // Legacy column
  transaction_time: Date;

  // Merchant fields
  merchant_name?: string;
  merchant_category?: string;
  merchant_id?: string;

  // Processing (PSD-3 compliance)
  processing_started_at?: Date;
  processing_completed_at?: Date;
  settlement_batch_id?: string;
  settlement_status?: SettlementStatus;
  processing_latency_ms?: number;

  // Metadata
  metadata?: Record<string, unknown>;

  created_at: Date;
}

export interface APITransaction {
  id: string;
  externalId?: string;
  userId: string;
  walletId?: string;
  type: APITransactionType;
  amount: number;
  currency: string;
  description?: string;
  category?: string;
  recipientId?: string;
  recipientName?: string;
  status: TransactionStatus;
  merchantName?: string;
  merchantCategory?: string;
  createdAt: string;
  transactionTime: string;
}

// ============================================================================
// CONTACT TYPES
// ============================================================================

export interface DBContact {
  id: string;
  user_id: string;
  name: string;
  phone_number?: string;
  email?: string;
  avatar?: string;
  bank_code?: string;
  is_favorite: boolean;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface APIContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  avatar?: string;
  bankCode?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// GROUP TYPES
// ============================================================================

export type GroupType = 'savings' | 'payment' | 'stokvel' | 'custom';

export interface DBGroup {
  id: string;
  name: string;
  description?: string;
  type?: GroupType; // Optional as it may not exist in schema
  avatar?: string;
  owner_id: string; // Database column name (not creator_id)
  target_amount?: number;
  current_amount: number;
  currency: string;
  is_active?: boolean; // Optional as it may not exist in schema
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface APIGroup {
  id: string;
  name: string;
  description?: string;
  type?: GroupType;
  avatar?: string;
  ownerId: string; // API uses camelCase, maps to owner_id in DB
  targetAmount?: number;
  currentAmount: number;
  currency: string;
  isActive?: boolean;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// MONEY REQUEST TYPES
// ============================================================================

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'partially_paid';

export interface DBMoneyRequest {
  id: string;
  from_user_id: string; // Database column name (not requester_id)
  to_user_id: string; // Database column name (not recipient_id)
  amount: number;
  currency: string;
  description?: string;
  status: RequestStatus;
  paid_amount?: number;
  paid_at?: Date;
  expires_at?: Date;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface APIMoneyRequest {
  id: string;
  fromUserId: string; // Maps to from_user_id in DB (API uses camelCase)
  toUserId: string; // Maps to to_user_id in DB (API uses camelCase)
  amount: number;
  currency: string;
  description?: string;
  status: RequestStatus;
  paidAmount?: number;
  paidAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 'transaction' | 'request' | 'group' | 'system' | 'security' | 'marketing';

export interface DBNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  read_at?: Date;
  created_at: Date;
}

export interface APINotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ============================================================================
// MIGRATION HISTORY TYPES
// ============================================================================

export type MigrationStatus = 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';

export interface DBMigrationHistory {
  id: number;
  migration_name: string;
  migration_version?: string;
  checksum?: string;
  applied_at: Date;
  applied_by: string;
  execution_time_ms?: number;
  status: MigrationStatus;
  rollback_sql?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// TYPE CONVERSION MAPS
// ============================================================================

/**
 * Maps API transaction types to database transaction types
 */
export const API_TO_DB_TRANSACTION_TYPE: Record<APITransactionType, DBTransactionType> = {
  sent: 'debit',
  received: 'credit',
  payment: 'payment',
  transfer_in: 'deposit',
  transfer_out: 'transfer',
};

/**
 * Maps database transaction types to API transaction types
 */
export const DB_TO_API_TRANSACTION_TYPE: Record<DBTransactionType, APITransactionType> = {
  debit: 'sent',
  credit: 'received',
  payment: 'payment',
  deposit: 'transfer_in',
  transfer: 'transfer_out',
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

// ============================================================================
// BILL TYPES
// ============================================================================

export type BillCategory = 'utilities' | 'water' | 'internet' | 'tv' | 'insurance' | 'other';

export interface DBBill {
  id: string;
  user_id: string;
  name: string;
  provider: string;
  account_number: string;
  category: BillCategory;
  amount: number;
  minimum_amount?: number;
  due_date: Date;
  is_paid: boolean;
  paid_at?: Date;
  paid_amount?: number;
  payment_reference?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface DBScheduledBill {
  id: string;
  bill_id: string;
  user_id: string;
  wallet_id?: string;
  schedule_type: 'monthly' | 'weekly' | 'custom';
  amount: number;
  is_active: boolean;
  next_payment_date: Date;
  last_payment_date?: Date;
  payment_count: number;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface DBBillPayment {
  id: string;
  bill_id: string;
  user_id: string;
  wallet_id?: string;
  transaction_id?: string;
  amount: number;
  payment_date: Date;
  status: 'pending' | 'completed' | 'failed';
  payment_reference?: string;
  receipt_url?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// ============================================================================
// MERCHANT TYPES
// ============================================================================

export interface DBMerchant {
  id: string;
  name: string;
  category: string;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  cashback_rate: number;
  is_active: boolean;
  is_open: boolean;
  phone?: string;
  email?: string;
  opening_hours?: string;
  qr_code?: string;
  owner_id?: string;
  wallet_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBMerchantPayment {
  id: string;
  user_id: string;
  merchant_id: string;
  wallet_id?: string;
  transaction_id?: string;
  amount: number;
  cashback_amount: number;
  cashback_rate: number;
  payment_method: string;
  qr_code?: string;
  status: 'pending' | 'completed' | 'failed';
  payment_date: Date;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// ============================================================================
// CASHBACK TYPES
// ============================================================================

export interface DBCashbackTransaction {
  id: string;
  user_id: string;
  merchant_id?: string;
  transaction_id?: string;
  payment_amount: number;
  cashback_amount: number;
  cashback_rate: number;
  status: 'pending' | 'completed' | 'failed';
  credited_at?: Date;
  wallet_id?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

/**
 * Paginated API response
 */
export interface PaginatedAPIResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
