/**
 * Audit Logs Query API
 * 
 * Location: app/api/admin/audit-logs/query/route.ts
 * Purpose: Query comprehensive audit logs from all audit log tables
 * 
 * Requires: Admin authentication
 * 
 * Supports querying:
 * - audit_logs (main audit log table)
 * - pin_audit_logs (PIN operations)
 * - voucher_audit_logs (voucher operations)
 * - transaction_audit_logs (transaction operations)
 * - api_sync_audit_logs (API sync operations)
 * - staff_audit_logs (staff actions)
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

type AuditLogTable = 
  | 'audit_logs'
  | 'pin_audit_logs'
  | 'voucher_audit_logs'
  | 'transaction_audit_logs'
  | 'api_sync_audit_logs'
  | 'staff_audit_logs'
  | 'all';

async function getHandler(request: ExpoRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Table selection
    const table = (searchParams.get('table') || 'all') as AuditLogTable;
    
    // Common filters
    const userId = searchParams.get('user_id');
    const staffId = searchParams.get('staff_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000); // Max 1000
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Table-specific filters
    const eventType = searchParams.get('event_type');
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const operationType = searchParams.get('operation_type');
    const voucherId = searchParams.get('voucher_id');
    const transactionId = searchParams.get('transaction_id');
    const direction = searchParams.get('direction'); // For API sync logs
    const location = searchParams.get('location');
    const smartpayBeneficiaryId = searchParams.get('smartpay_beneficiary_id');
    
    const results: any[] = [];
    
    // Query all tables or specific table
    const tablesToQuery: AuditLogTable[] = table === 'all' 
      ? ['audit_logs', 'pin_audit_logs', 'voucher_audit_logs', 'transaction_audit_logs', 'api_sync_audit_logs', 'staff_audit_logs']
      : [table];
    
    for (const tableName of tablesToQuery) {
      let sql = '';
      const params: any[] = [];
      let paramIndex = 1;
      
      // Build WHERE clause
      const conditions: string[] = [];
      
      if (userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(userId);
      }
      
      if (staffId) {
        if (tableName === 'audit_logs' || tableName === 'pin_audit_logs' || tableName === 'voucher_audit_logs' || tableName === 'staff_audit_logs') {
          conditions.push(`staff_id = $${paramIndex++}`);
          params.push(staffId);
        }
      }
      
      if (fromDate) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(fromDate);
      }
      
      if (toDate) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(toDate);
      }
      
      if (location) {
        if (tableName === 'audit_logs' || tableName === 'pin_audit_logs' || tableName === 'voucher_audit_logs' || tableName === 'staff_audit_logs') {
          conditions.push(`location = $${paramIndex++}`);
          params.push(location);
        }
      }
      
      if (smartpayBeneficiaryId) {
        if (tableName === 'audit_logs' || tableName === 'voucher_audit_logs') {
          conditions.push(`smartpay_beneficiary_id = $${paramIndex++}`);
          params.push(smartpayBeneficiaryId);
        }
      }
      
      // Table-specific filters
      if (tableName === 'audit_logs') {
        if (eventType) {
          conditions.push(`event_type = $${paramIndex++}`);
          params.push(eventType);
        }
        if (entityType) {
          conditions.push(`entity_type = $${paramIndex++}`);
          params.push(entityType);
        }
        if (entityId) {
          conditions.push(`entity_id = $${paramIndex++}`);
          params.push(entityId);
        }
        
        sql = `SELECT 
          id, event_type, entity_type, entity_id, user_id, staff_id, location,
          action, old_values, new_values, metadata, smartpay_beneficiary_id,
          biometric_verification_id, timestamp, ip_address, user_agent,
          request_id, response_status, error_message, created_at,
          'audit_logs' as log_table
        FROM audit_logs`;
      } else if (tableName === 'pin_audit_logs') {
        if (operationType) {
          conditions.push(`operation_type = $${paramIndex++}`);
          params.push(operationType);
        }
        
        sql = `SELECT 
          id, user_id, staff_id, operation_type, location, biometric_verification_id,
          id_verification_status, reason, ip_address, success, error_message,
          timestamp, created_at, 'pin_audit_logs' as log_table
        FROM pin_audit_logs`;
      } else if (tableName === 'voucher_audit_logs') {
        if (operationType) {
          conditions.push(`operation_type = $${paramIndex++}`);
          params.push(operationType);
        }
        if (voucherId) {
          conditions.push(`voucher_id = $${paramIndex++}`);
          params.push(voucherId);
        }
        
        sql = `SELECT 
          id, voucher_id, operation_type, user_id, staff_id, location,
          smartpay_beneficiary_id, biometric_verification_id, old_status, new_status,
          amount, redemption_method, settlement_reference, metadata,
          timestamp, created_at, 'voucher_audit_logs' as log_table
        FROM voucher_audit_logs`;
      } else if (tableName === 'transaction_audit_logs') {
        if (transactionId) {
          conditions.push(`transaction_id = $${paramIndex++}`);
          params.push(transactionId);
        }
        
        sql = `SELECT 
          id, transaction_id, transaction_type, user_id, amount, currency,
          from_wallet_id, to_wallet_id, recipient_id, payment_method,
          payment_reference, two_factor_verified, biometric_verification_id,
          ip_address, device_info, status, error_message, fraud_check_status,
          guardian_agent_result, timestamp, created_at, 'transaction_audit_logs' as log_table
        FROM transaction_audit_logs`;
      } else if (tableName === 'api_sync_audit_logs') {
        if (direction) {
          conditions.push(`direction = $${paramIndex++}`);
          params.push(direction);
        }
        if (voucherId) {
          conditions.push(`voucher_id = $${paramIndex++}`);
          params.push(voucherId);
        }
        
        sql = `SELECT 
          id, direction, endpoint, method, request_payload, response_payload,
          status_code, response_time_ms, success, error_message, beneficiary_id,
          voucher_id, user_id, request_id, retry_count, timestamp, created_at,
          'api_sync_audit_logs' as log_table
        FROM api_sync_audit_logs`;
      } else if (tableName === 'staff_audit_logs') {
        if (operationType) {
          conditions.push(`action_type = $${paramIndex++}`);
          params.push(operationType);
        }
        
        sql = `SELECT 
          id, staff_id, action_type, target_entity_type, target_entity_id, location,
          action_details, authorization_level, biometric_verification_required,
          biometric_verification_id, ip_address, success, error_message,
          timestamp, created_at, 'staff_audit_logs' as log_table
        FROM staff_audit_logs`;
      }
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      sql += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const tableResults = await query<any>(sql, params);
      results.push(...tableResults);
    }
    
    // Sort all results by timestamp (newest first)
    results.sort((a, b) => {
      const timeA = new Date(a.timestamp || a.created_at).getTime();
      const timeB = new Date(b.timestamp || b.created_at).getTime();
      return timeB - timeA;
    });
    
    // Format results (parse JSONB fields)
    const formattedResults = results.map((log: any) => {
      const formatted: any = { ...log };
      
      // Parse JSONB fields
      if (log.old_values && typeof log.old_values === 'string') {
        formatted.old_values = JSON.parse(log.old_values);
      }
      if (log.new_values && typeof log.new_values === 'string') {
        formatted.new_values = JSON.parse(log.new_values);
      }
      if (log.metadata && typeof log.metadata === 'string') {
        formatted.metadata = JSON.parse(log.metadata);
      }
      if (log.action_details && typeof log.action_details === 'string') {
        formatted.action_details = JSON.parse(log.action_details);
      }
      if (log.device_info && typeof log.device_info === 'string') {
        formatted.device_info = JSON.parse(log.device_info);
      }
      if (log.guardian_agent_result && typeof log.guardian_agent_result === 'string') {
        formatted.guardian_agent_result = JSON.parse(log.guardian_agent_result);
      }
      if (log.request_payload && typeof log.request_payload === 'string') {
        formatted.request_payload = JSON.parse(log.request_payload);
      }
      if (log.response_payload && typeof log.response_payload === 'string') {
        formatted.response_payload = JSON.parse(log.response_payload);
      }
      
      // Format timestamps
      if (formatted.timestamp) {
        formatted.timestamp = formatted.timestamp.toISOString();
      }
      if (formatted.created_at) {
        formatted.created_at = formatted.created_at.toISOString();
      }
      
      return formatted;
    });
    
    return successResponse({
      logs: formattedResults.slice(0, limit), // Limit final results
      pagination: {
        total: formattedResults.length,
        limit,
        offset,
        hasMore: formattedResults.length >= limit,
      },
      table,
    });
  } catch (error: any) {
    logger.error('Error querying audit logs', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to query audit logs',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
