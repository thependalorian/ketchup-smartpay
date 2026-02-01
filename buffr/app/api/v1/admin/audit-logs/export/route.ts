/**
 * Open Banking API: /api/v1/admin/audit-logs/export
 * 
 * Export audit logs (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

type ExportFormat = 'csv' | 'json';
type AuditLogTable =
  | 'audit_logs'
  | 'pin_audit_logs'
  | 'voucher_audit_logs'
  | 'transaction_audit_logs'
  | 'api_sync_audit_logs'
  | 'staff_audit_logs'
  | 'all';

/**
 * GET /api/v1/admin/audit-logs/export
 * Export audit logs
 */
async function handleExport(req: ExpoRequest) {
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
    const format = (searchParams.get('format') || 'json') as ExportFormat;
    const table = (searchParams.get('table') || 'all') as AuditLogTable;

    // Query logs (similar to query endpoint but without pagination)
    const tablesToQuery: AuditLogTable[] = table === 'all'
      ? ['audit_logs', 'pin_audit_logs', 'voucher_audit_logs', 'transaction_audit_logs', 'api_sync_audit_logs', 'staff_audit_logs']
      : [table];

    const allResults: any[] = [];

    for (const tableName of tablesToQuery) {
      const tableLogs = await query<any>(
        `SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT 1000`
      );
      allResults.push(...tableLogs.map((log: any) => ({
        ...log,
        TableName: tableName,
      })));
    }

    if (format === 'csv') {
      if (allResults.length === 0) {
        return helpers.error(
          OpenBankingErrorCode.RESOURCE_NOT_FOUND,
          'No data found for export',
          404
        );
      }

      const headers = Object.keys(allResults[0]);
      const csvRows = [
        headers.join(','),
        ...allResults.map((row: any) =>
          headers.map((header) => {
            const value = row[header];
            return typeof value === 'object' ? JSON.stringify(value) : value;
          }).join(','))
      ];

      const csv = csvRows.join('\n');

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.csv"`,
          'X-Request-ID': context?.requestId || '',
        },
      });
    }

    // JSON format
    const exportResponse = {
      Data: {
        Format: format,
        Table: table,
        RecordCount: allResults.length,
        Logs: allResults,
        ExportedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/admin/audit-logs/export',
      },
      Meta: {},
    };

    return helpers.success(
      exportResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error exporting audit logs:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while exporting audit logs',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleExport,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
