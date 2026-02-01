/**
 * Open Banking API: /api/v1/admin/compliance/generate-report
 * 
 * Generate compliance reports (Open Banking format)
 * 
 * Compliance: PSD-1
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import { log } from '@/utils/logger';

/**
 * POST /api/v1/admin/compliance/generate-report
 * Generate compliance report
 */
async function handleGenerateReport(req: ExpoRequest) {
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

    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { MonthlyStatsId, Format } = Data;

    if (!MonthlyStatsId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.MonthlyStatsId is required',
        400
      );
    }

    if (!['csv', 'excel'].includes(Format || 'csv')) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        'Format must be "csv" or "excel"',
        400
      );
    }

    // Get monthly stats
    const stats = await query<{
      [key: string]: any;
    }>(
      'SELECT * FROM compliance_monthly_stats WHERE id = $1',
      [MonthlyStatsId]
    );

    if (stats.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Monthly statistics not found',
        404
      );
    }

    const monthlyStats = stats[0];

    // Generate CSV format
    if (Format === 'csv') {
      const csvRows: string[] = [];
      csvRows.push('Compliance Report - Bank of Namibia');
      csvRows.push(`Report Period: ${monthlyStats.report_month}`);
      csvRows.push(`Generated: ${new Date().toISOString()}`);
      csvRows.push('');
      csvRows.push('Transaction Statistics');
      csvRows.push(`Total Transactions,${monthlyStats.total_transactions}`);
      csvRows.push(`Total Transaction Value,${monthlyStats.total_transaction_value}`);
      csvRows.push('');

      const csv = csvRows.join('\n');

      // Save file record
      const fileName = `compliance_report_${monthlyStats.report_year}_${monthlyStats.report_month_number}_${Date.now()}.csv`;

      await query(
        `INSERT INTO compliance_report_files (
          monthly_stats_id, file_type, file_name, file_path,
          file_size, mime_type, generated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          MonthlyStatsId,
          'csv',
          fileName,
          `/reports/${fileName}`,
          Buffer.from(csv).length,
          'text/csv',
          actualUserId,
        ]
      );

      // Log staff action
      await logStaffActionWithContext(
        req,
        {
          actionType: 'compliance_report_generated',
          targetEntityType: 'compliance_report',
          targetEntityId: MonthlyStatsId,
          location: 'system',
          actionDetails: {
            format: 'csv',
            fileName,
            reportMonth: monthlyStats.report_month,
            reportYear: monthlyStats.report_year,
          },
          authorizationLevel: 'admin',
        },
        true
      ).catch(err => log.warn('Staff action logging failed (non-critical):', err));

      const reportResponse = {
        Data: {
          FileName: fileName,
          Format: 'csv',
          Content: csv,
          Size: Buffer.from(csv).length,
          GeneratedDateTime: new Date().toISOString(),
        },
        Links: {
          Self: '/api/v1/admin/compliance/generate-report',
        },
        Meta: {},
      };

      return helpers.success(
        reportResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    // For Excel, return a simplified response (full Excel generation would require ExcelJS)
    const reportResponse = {
      Data: {
        Message: 'Excel format requires additional processing',
        Format: 'excel',
        MonthlyStatsId,
      },
      Links: {
        Self: '/api/v1/admin/compliance/generate-report',
      },
      Meta: {},
    };

    return helpers.success(
      reportResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error generating compliance report:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while generating the compliance report',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleGenerateReport,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
