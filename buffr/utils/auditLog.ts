/**
 * Audit Logging Utilities
 * 
 * Location: utils/auditLog.ts
 * Purpose: Comprehensive audit logging for all admin actions (PSD-1 compliance)
 * 
 * Every admin action is logged with:
 * - Admin user ID
 * - Action type
 * - Resource type and ID
 * - Action details
 * - IP address and user agent
 * - Status (success/failed/error)
 */

import { query } from './db';
import { log } from '@/utils/logger';

export type AuditActionType =
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.suspend'
  | 'user.reactivate'
  | 'user.lock'
  | 'user.unlock'
  | 'user.view'
  | 'transaction.view'
  | 'transaction.flag'
  | 'transaction.review'
  | 'transaction.approve'
  | 'transaction.reject'
  | 'compliance.report.generate'
  | 'compliance.report.view'
  | 'compliance.incident.create'
  | 'compliance.incident.update'
  | 'compliance.dormancy.process'
  | 'fraud.alert.view'
  | 'fraud.alert.override'
  | 'gamification.manage'
  | 'ai.monitoring.configure'
  | 'fineract.sync'
  | 'fineract.reconcile'
  | 'role.assign'
  | 'role.remove'
  | 'permission.grant'
  | 'permission.revoke'
  | 'system.configure'
  | 'audit.export'
  | 'login'
  | 'logout';

export type AuditResourceType =
  | 'user'
  | 'transaction'
  | 'compliance'
  | 'fraud'
  | 'gamification'
  | 'ai'
  | 'fineract'
  | 'role'
  | 'permission'
  | 'system'
  | 'audit'
  | 'auth';

export type AuditStatus = 'success' | 'failed' | 'error';

export interface AuditLogEntry {
  admin_user_id: string;
  action_type: AuditActionType;
  resource_type: AuditResourceType;
  resource_id?: string;
  action_details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status?: AuditStatus;
  error_message?: string;
}

/**
 * Log an admin action to the audit log
 * 
 * @param entry Audit log entry details
 * @returns Promise<void>
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs (
        admin_user_id,
        action_type,
        resource_type,
        resource_id,
        action_details,
        ip_address,
        user_agent,
        status,
        error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.admin_user_id,
        entry.action_type,
        entry.resource_type,
        entry.resource_id || null,
        entry.action_details ? JSON.stringify(entry.action_details) : '{}',
        entry.ip_address || null,
        entry.user_agent || null,
        entry.status || 'success',
        entry.error_message || null,
      ]
    );
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    // But log the error for monitoring
    log.error('Failed to log audit event:', error);
  }
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string | undefined {
  // Check various headers for IP address
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
 * Helper to create audit log entry from request
 */
export function createAuditEntry(
  adminUserId: string,
  actionType: AuditActionType,
  resourceType: AuditResourceType,
  request: Request,
  options: {
    resourceId?: string;
    actionDetails?: Record<string, any>;
    status?: AuditStatus;
    errorMessage?: string;
  } = {}
): AuditLogEntry {
  return {
    admin_user_id: adminUserId,
    action_type: actionType,
    resource_type: resourceType,
    resource_id: options.resourceId,
    action_details: options.actionDetails,
    ip_address: getIpAddress(request),
    user_agent: getUserAgent(request),
    status: options.status || 'success',
    error_message: options.errorMessage,
  };
}

