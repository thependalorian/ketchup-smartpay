/**
 * Open Banking API: /api/v1/admin/audit-logs/query
 * 
 * Query comprehensive audit logs (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

type AuditLogTable =
  | 'audit_logs'
  | 'pin_audit_logs'
  | 'voucher_audit_logs'
  | 'transaction_audit_logs'
  | 'api_sync_audit_logs'
  | 'staff_audit_logs'
  | 'all';

/**
 * GET /api/v1/admin/audit-logs/query
 * Query audit logs from all audit log tables
 */
async function handleQuery(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const table = (searchParams.get('table') || 'all') as AuditLogTable;
    const userId = searchParams.get('user_id');
    const staffId = searchParams.get('staff_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const { page, pageSize } = parsePaginationParams(req);

    // Query all tables or specific table
    const tablesToQuery: AuditLogTable[] = table === 'all'
      ? ['audit_logs', 'pin_audit_logs', 'voucher_audit_logs', 'transaction_audit_logs', 'api_sync_audit_logs', 'staff_audit_logs']
      : [table];

    const allResults: any[] = [];

    for (const tableName of tablesToQuery) {
      let sql = '';
      const params: any[] = [];
      let paramIndex = 1;
      const conditions: string[] = [];

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

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      // Get logs from this table
      const tableLogs = await query<any>(
        `SELECT * FROM ${tableName} ${whereClause} ORDER BY timestamp DESC LIMIT 100`,
        params
      );

      allResults.push(...tableLogs.map((log: any) => ({
        ...log,
        TableName: tableName,
      })));
    }

    // Sort all results by timestamp
    allResults.sort((a, b) => {
      const aTime = new Date(a.timestamp || a.created_at || 0).getTime();
      const bTime = new Date(b.timestamp || b.created_at || 0).getTime();
      return bTime - aTime;
    });

    // Apply pagination
    const offset = (page - 1) * pageSize;
    const paginatedResults = allResults.slice(offset, offset + pageSize);

    // Format as Open Banking
    const formattedLogs = paginatedResults.map((log: any) => ({
      LogId: log.id,
      TableName: log.TableName,
      UserId: log.user_id || null,
      StaffId: log.staff_id || null,
      ActionType: log.action_type || log.operation_type || null,
      ResourceType: log.resource_type || log.entity_type || null,
      ResourceId: log.resource_id || log.entity_id || null,
      Timestamp: log.timestamp || log.created_at || null,
      Metadata: log.metadata || {},
    }));

    return helpers.paginated(
      formattedLogs,
      'AuditLogs',
      '/api/v1/admin/audit-logs/query',
      page,
      pageSize,
      allResults.length,
      req,
      table || userId || staffId || fromDate || toDate
        ? { table, userId, staffId, fromDate, toDate }
        : undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error querying audit logs:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while querying audit logs',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleQuery,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
