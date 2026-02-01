/**
 * Comprehensive Audit Logger
 * 
 * Location: utils/auditLogger.ts
 * Purpose: Centralized audit logging for all operations (Priority 1 - Critical Foundation)
 * 
 * This utility provides comprehensive audit logging for:
 * - All operations (main audit_logs table)
 * - PIN operations (pin_audit_logs table)
 * - Voucher operations (voucher_audit_logs table)
 * - Transaction operations (transaction_audit_logs table)
 * - API sync operations (api_sync_audit_logs table)
 * - Staff actions (staff_audit_logs table)
 * 
 * All logging is automatic and cannot be disabled (regulatory requirement).
 */

import { query } from './db';
import logger from './logger';

// ============================================================================
// TYPES
// ============================================================================

export type AuditEventType =
  | 'voucher_issued'
  | 'voucher_verified'
  | 'voucher_redeemed'
  | 'voucher_expired'
  | 'voucher_cancelled'
  | 'pin_setup'
  | 'pin_change'
  | 'pin_reset'
  | 'pin_verify'
  | 'transaction_created'
  | 'transaction_completed'
  | 'transaction_failed'
  | 'account_created'
  | 'account_modified'
  | 'api_sync_inbound'
  | 'api_sync_outbound'
  | 'staff_action'
  | 'user_action'
  | 'system_action';

export type EntityType =
  | 'voucher'
  | 'transaction'
  | 'user'
  | 'account'
  | 'wallet'
  | 'pin'
  | 'api_sync'
  | 'staff'
  | 'system';

export type PINOperationType = 'setup' | 'change' | 'reset' | 'verify';

export type VoucherOperationType = 'issued' | 'verified' | 'redeemed' | 'expired' | 'cancelled';

export type TransactionType = 'credit' | 'debit' | 'transfer' | 'payment';

export type APISyncDirection = 'inbound' | 'outbound';

export interface AuditLogEntry {
  event_type: AuditEventType;
  entity_type: EntityType;
  entity_id: string;
  user_id?: string;
  staff_id?: string;
  location?: string;
  action: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  smartpay_beneficiary_id?: string;
  biometric_verification_id?: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  response_status?: number;
  error_message?: string;
}

export interface PINAuditLogEntry {
  user_id: string;
  staff_id?: string;
  operation_type: PINOperationType;
  location: string;
  biometric_verification_id?: string;
  id_verification_status?: boolean;
  reason?: string;
  ip_address?: string;
  success: boolean;
  error_message?: string;
}

export interface VoucherAuditLogEntry {
  voucher_id: string;
  operation_type: VoucherOperationType;
  user_id?: string;
  staff_id?: string;
  location?: string;
  smartpay_beneficiary_id: string;
  biometric_verification_id?: string;
  old_status?: string;
  new_status: string;
  amount?: number;
  redemption_method?: string;
  settlement_reference?: string;
  metadata?: Record<string, any>;
}

export interface TransactionAuditLogEntry {
  transaction_id: string;
  transaction_type: TransactionType;
  user_id: string;
  amount: number;
  currency?: string;
  from_wallet_id?: string;
  to_wallet_id?: string;
  recipient_id?: string;
  payment_method?: string;
  payment_reference?: string;
  two_factor_verified: boolean;
  biometric_verification_id?: string;
  ip_address?: string;
  device_info?: Record<string, any>;
  status: string;
  error_message?: string;
  fraud_check_status?: string;
  guardian_agent_result?: Record<string, any>;
}

export interface APISyncAuditLogEntry {
  direction: APISyncDirection;
  endpoint: string;
  method: string;
  request_payload?: Record<string, any>;
  response_payload?: Record<string, any>;
  status_code?: number;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  beneficiary_id?: string;
  voucher_id?: string;
  user_id?: string;
  request_id?: string;
  retry_count?: number;
}

export interface StaffAuditLogEntry {
  staff_id: string;
  action_type: string;
  target_entity_type: string;
  target_entity_id: string;
  location: string;
  action_details?: Record<string, any>;
  authorization_level?: string;
  biometric_verification_required?: boolean;
  biometric_verification_id?: string;
  ip_address?: string;
  success: boolean;
  error_message?: string;
}

// ============================================================================
// MAIN AUDIT LOG FUNCTIONS
// ============================================================================

/**
 * Log a general audit event
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (
        event_type, entity_type, entity_id, user_id, staff_id, location,
        action, old_values, new_values, metadata, smartpay_beneficiary_id,
        biometric_verification_id, ip_address, user_agent, request_id,
        response_status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
      [
        entry.event_type,
        entry.entity_type,
        entry.entity_id,
        entry.user_id || null,
        entry.staff_id || null,
        entry.location || null,
        entry.action,
        entry.old_values ? JSON.stringify(entry.old_values) : null,
        entry.new_values ? JSON.stringify(entry.new_values) : null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.smartpay_beneficiary_id || null,
        entry.biometric_verification_id || null,
        entry.ip_address || null,
        entry.user_agent || null,
        entry.request_id || null,
        entry.response_status || null,
        entry.error_message || null,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    logger.error('Failed to log audit event', error);
  }
}

/**
 * Log a PIN operation
 */
export async function logPINOperation(entry: PINAuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO pin_audit_logs (
        user_id, staff_id, operation_type, location, biometric_verification_id,
        id_verification_status, reason, ip_address, success, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.user_id,
        entry.staff_id || null,
        entry.operation_type,
        entry.location,
        entry.biometric_verification_id || null,
        entry.id_verification_status || null,
        entry.reason || null,
        entry.ip_address || null,
        entry.success,
        entry.error_message || null,
      ]
    );
  } catch (error) {
    logger.error('Failed to log PIN operation', error);
  }
}

/**
 * Log a voucher operation
 */
export async function logVoucherOperation(entry: VoucherAuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO voucher_audit_logs (
        voucher_id, operation_type, user_id, staff_id, location,
        smartpay_beneficiary_id, biometric_verification_id, old_status,
        new_status, amount, redemption_method, settlement_reference, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        entry.voucher_id,
        entry.operation_type,
        entry.user_id || null,
        entry.staff_id || null,
        entry.location || null,
        entry.smartpay_beneficiary_id,
        entry.biometric_verification_id || null,
        entry.old_status || null,
        entry.new_status,
        entry.amount || null,
        entry.redemption_method || null,
        entry.settlement_reference || null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ]
    );
  } catch (error) {
    logger.error('Failed to log voucher operation', error);
  }
}

/**
 * Log a transaction operation
 */
export async function logTransactionOperation(entry: TransactionAuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO transaction_audit_logs (
        transaction_id, transaction_type, user_id, amount, currency,
        from_wallet_id, to_wallet_id, recipient_id, payment_method,
        payment_reference, two_factor_verified, biometric_verification_id,
        ip_address, device_info, status, error_message, fraud_check_status,
        guardian_agent_result
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
      [
        entry.transaction_id,
        entry.transaction_type,
        entry.user_id,
        entry.amount,
        entry.currency || 'NAD',
        entry.from_wallet_id || null,
        entry.to_wallet_id || null,
        entry.recipient_id || null,
        entry.payment_method || null,
        entry.payment_reference || null,
        entry.two_factor_verified,
        entry.biometric_verification_id || null,
        entry.ip_address || null,
        entry.device_info ? JSON.stringify(entry.device_info) : null,
        entry.status,
        entry.error_message || null,
        entry.fraud_check_status || null,
        entry.guardian_agent_result ? JSON.stringify(entry.guardian_agent_result) : null,
      ]
    );
  } catch (error) {
    logger.error('Failed to log transaction operation', error);
  }
}

/**
 * Log an API sync operation (SmartPay ↔ Buffr)
 * Gracefully handles missing database connections (e.g., in standalone scripts)
 */
export async function logAPISyncOperation(entry: APISyncAuditLogEntry): Promise<void> {
  try {
    // Check if database is available (for standalone scripts)
    if (!process.env.DATABASE_URL && !process.env.NEON_CONNECTION_STRING) {
      // Silently skip logging if database is not configured (e.g., in test scripts)
      return;
    }
    
    await query(
      `INSERT INTO api_sync_audit_logs (
        direction, endpoint, method, request_payload, response_payload,
        status_code, response_time_ms, success, error_message, beneficiary_id,
        voucher_id, user_id, request_id, retry_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        entry.direction,
        entry.endpoint,
        entry.method,
        entry.request_payload ? JSON.stringify(entry.request_payload) : null,
        entry.response_payload ? JSON.stringify(entry.response_payload) : null,
        entry.status_code || null,
        entry.response_time_ms || null,
        entry.success,
        entry.error_message || null,
        entry.beneficiary_id || null,
        entry.voucher_id || null,
        entry.user_id || null,
        entry.request_id || null,
        entry.retry_count || 0,
      ]
    );
  } catch (error: any) {
    // Silently ignore database errors in standalone scripts or when DB is unavailable
    if (error?.message?.includes('DATABASE_URL') || error?.message?.includes('NEON_CONNECTION_STRING')) {
      // Database not available - this is expected in standalone scripts
      return;
    }
    // Log other errors
    logger.error('Failed to log API sync operation', error);
  }
}

/**
 * Log a staff action
 */
export async function logStaffAction(entry: StaffAuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO staff_audit_logs (
        staff_id, action_type, target_entity_type, target_entity_id, location,
        action_details, authorization_level, biometric_verification_required,
        biometric_verification_id, ip_address, success, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        entry.staff_id,
        entry.action_type,
        entry.target_entity_type,
        entry.target_entity_id,
        entry.location,
        entry.action_details ? JSON.stringify(entry.action_details) : null,
        entry.authorization_level || null,
        entry.biometric_verification_required || false,
        entry.biometric_verification_id || null,
        entry.ip_address || null,
        entry.success,
        entry.error_message || null,
      ]
    );
  } catch (error) {
    logger.error('Failed to log staff action', error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return undefined;
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Generate a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create audit log entry from request context
 */
export function createAuditEntryFromRequest(
  eventType: AuditEventType,
  entityType: EntityType,
  entityId: string,
  action: string,
  request: Request,
  options: {
    userId?: string;
    staffId?: string;
    location?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    metadata?: Record<string, any>;
    smartpayBeneficiaryId?: string;
    biometricVerificationId?: string;
    requestId?: string;
    responseStatus?: number;
    errorMessage?: string;
  } = {}
): AuditLogEntry {
  return {
    event_type: eventType,
    entity_type: entityType,
    entity_id: entityId,
    user_id: options.userId,
    staff_id: options.staffId,
    location: options.location,
    action,
    old_values: options.oldValues,
    new_values: options.newValues,
    metadata: options.metadata,
    smartpay_beneficiary_id: options.smartpayBeneficiaryId,
    biometric_verification_id: options.biometricVerificationId,
    ip_address: getIpAddress(request),
    user_agent: getUserAgent(request),
    request_id: options.requestId || generateRequestId(),
    response_status: options.responseStatus,
    error_message: options.errorMessage,
  };
}
