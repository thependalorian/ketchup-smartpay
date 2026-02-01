/**
 * Audit Logs Export API
 * 
 * Location: app/api/admin/audit-logs/export/route.ts
 * Purpose: Export audit logs to CSV/JSON format for regulatory reporting
 * 
 * Requires: Admin authentication
 * 
 * Supports exporting:
 * - audit_logs (main audit log table)
 * - pin_audit_logs (PIN operations)
 * - voucher_audit_logs (voucher operations)
 * - transaction_audit_logs (transaction operations)
 * - api_sync_audit_logs (API sync operations)
 * - staff_audit_logs (staff actions)
 */

import { ExpoRequest } from 'expo-router/server';
import { query } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

type ExportFormat = 'csv' | 'json';
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
    
    // Export parameters
    const format = (searchParams.get('format') || 'json') as ExportFormat;
    const table = (searchParams.get('table') || 'all') as AuditLogTable;
    
    // Filters (same as query endpoint)
    const userId = searchParams.get('user_id');
    const staffId = searchParams.get('staff_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const eventType = searchParams.get('event_type');
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const operationType = searchParams.get('operation_type');
    const voucherId = searchParams.get('voucher_id');
    const transactionId = searchParams.get('transaction_id');
    const direction = searchParams.get('direction');
    const location = searchParams.get('location');
    const smartpayBeneficiaryId = searchParams.get('smartpay_beneficiary_id');
    
    // Build query (similar to query endpoint but without pagination)
    const tablesToQuery: AuditLogTable[] = table === 'all' 
      ? ['audit_logs', 'pin_audit_logs', 'voucher_audit_logs', 'transaction_audit_logs', 'api_sync_audit_logs', 'staff_audit_logs']
      : [table];
    
    const allResults: any[] = [];
    
    for (const tableName of tablesToQuery) {
      let sql = '';
      const params: any[] = [];
      let paramIndex = 1;
      const conditions: string[] = [];
      
      // Apply same filters as query endpoint
      if (userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        params.push(userId);
      }
      
      if (staffId && (tableName === 'audit_logs' || tableName === 'pin_audit_logs' || tableName === 'voucher_audit_logs' || tableName === 'staff_audit_logs')) {
        conditions.push(`staff_id = $${paramIndex++}`);
        params.push(staffId);
      }
      
      if (fromDate) {
        conditions.push(`timestamp >= $${paramIndex++}`);
        params.push(fromDate);
      }
      
      if (toDate) {
        conditions.push(`timestamp <= $${paramIndex++}`);
        params.push(toDate);
      }
      
      if (location && (tableName === 'audit_logs' || tableName === 'pin_audit_logs' || tableName === 'voucher_audit_logs' || tableName === 'staff_audit_logs')) {
        conditions.push(`location = $${paramIndex++}`);
        params.push(location);
      }
      
      if (smartpayBeneficiaryId && (tableName === 'audit_logs' || tableName === 'voucher_audit_logs')) {
        conditions.push(`smartpay_beneficiary_id = $${paramIndex++}`);
        params.push(smartpayBeneficiaryId);
      }
      
      // Table-specific SQL (same as query endpoint)
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
        sql = `SELECT * FROM audit_logs`;
      } else if (tableName === 'pin_audit_logs') {
        if (operationType) {
          conditions.push(`operation_type = $${paramIndex++}`);
          params.push(operationType);
        }
        sql = `SELECT * FROM pin_audit_logs`;
      } else if (tableName === 'voucher_audit_logs') {
        if (operationType) {
          conditions.push(`operation_type = $${paramIndex++}`);
          params.push(operationType);
        }
        if (voucherId) {
          conditions.push(`voucher_id = $${paramIndex++}`);
          params.push(voucherId);
        }
        sql = `SELECT * FROM voucher_audit_logs`;
      } else if (tableName === 'transaction_audit_logs') {
        if (transactionId) {
          conditions.push(`transaction_id = $${paramIndex++}`);
          params.push(transactionId);
        }
        sql = `SELECT * FROM transaction_audit_logs`;
      } else if (tableName === 'api_sync_audit_logs') {
        if (direction) {
          conditions.push(`direction = $${paramIndex++}`);
          params.push(direction);
        }
        if (voucherId) {
          conditions.push(`voucher_id = $${paramIndex++}`);
          params.push(voucherId);
        }
        sql = `SELECT * FROM api_sync_audit_logs`;
      } else if (tableName === 'staff_audit_logs') {
        if (operationType) {
          conditions.push(`action_type = $${paramIndex++}`);
          params.push(operationType);
        }
        sql = `SELECT * FROM staff_audit_logs`;
      }
      
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      sql += ` ORDER BY timestamp DESC`;
      
      const tableResults = await query<any>(sql, params);
      allResults.push(...tableResults);
    }
    
    // Format results
    const formattedResults = allResults.map((log: any) => {
      const formatted: any = { ...log };
      
      // Parse JSONB fields
      ['old_values', 'new_values', 'metadata', 'action_details', 'device_info', 
       'guardian_agent_result', 'request_payload', 'response_payload'].forEach(field => {
        if (log[field] && typeof log[field] === 'string') {
          try {
            formatted[field] = JSON.parse(log[field]);
          } catch {
            formatted[field] = log[field];
          }
        }
      });
      
      // Format timestamps
      if (formatted.timestamp) {
        formatted.timestamp = formatted.timestamp.toISOString();
      }
      if (formatted.created_at) {
        formatted.created_at = formatted.created_at.toISOString();
      }
      
      return formatted;
    });
    
    // Export in requested format
    if (format === 'csv') {
      // Convert to CSV
      if (formattedResults.length === 0) {
        return new Response('No data to export', {
          status: 404,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="audit_logs.csv"',
          },
        });
      }
      
      // Get all unique keys from all records
      const allKeys = new Set<string>();
      formattedResults.forEach(record => {
        Object.keys(record).forEach(key => allKeys.add(key));
      });
      const headers = Array.from(allKeys);
      
      // Build CSV
      const csvRows = [
        headers.join(','), // Header row
        ...formattedResults.map(record =>
          headers.map(header => {
            const value = record[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
            return String(value).replace(/"/g, '""').replace(/\n/g, ' ');
          }).map(v => `"${v}"`).join(',')
        ),
      ];
      
      return new Response(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.csv"`,
        },
      });
    } else {
      // JSON format
      return new Response(JSON.stringify(formattedResults, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.json"`,
        },
      });
    }
  } catch (error: any) {
    logger.error('Error exporting audit logs', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to export audit logs',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
