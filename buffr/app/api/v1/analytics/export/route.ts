/**
 * Open Banking API: /api/v1/analytics/export
 * 
 * Analytics data export (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { anonymizeAnalyticsExport } from '@/utils/dataAnonymization';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/analytics/export
 * Export analytics data
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
    const analyticsType = searchParams.get('type') || 'transactions';
    const format = searchParams.get('format') || 'json';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    let startDate: string;
    let endDate: string;

    if (fromDate && toDate) {
      startDate = fromDate;
      endDate = toDate;
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      startDate = start.toISOString().split('T')[0];
      endDate = end.toISOString().split('T')[0];
    }

    // Fetch data based on type
    let data: any[] = [];
    let tableName = '';
    let selectFields = '';

    switch (analyticsType) {
      case 'transactions':
        tableName = 'transaction_analytics';
        selectFields = `
          date, transaction_type, payment_method, merchant_category,
          total_transactions, total_volume, average_transaction_amount,
          median_transaction_amount, unique_users, unique_merchants,
          day_of_week, hour_of_day
        `;
        break;
      case 'users':
        tableName = 'user_behavior_analytics';
        selectFields = `
          date, wallet_balance, average_balance, transaction_count,
          total_spent, total_received, preferred_payment_method,
          cash_out_count, cash_out_amount, merchant_payment_count,
          merchant_payment_amount, p2p_transfer_count, p2p_transfer_amount,
          bill_payment_count, bill_payment_amount, spending_velocity
        `;
        break;
      case 'merchants':
        tableName = 'merchant_analytics';
        selectFields = `
          date, transaction_count, total_volume, average_transaction_amount,
          unique_customers, payment_method_breakdown, peak_hours
        `;
        break;
      default:
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          'Invalid analytics type. Use: transactions, users, merchants',
          400
        );
    }

    const rawData = await query<any>(
      `SELECT ${selectFields}
       FROM ${tableName}
       WHERE date >= $1 AND date <= $2
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    // Anonymize data
    data = anonymizeAnalyticsExport(rawData, analyticsType);

    // Format response
    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return helpers.error(
          OpenBankingErrorCode.RESOURCE_NOT_FOUND,
          'No data found for export',
          404
        );
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row: any) =>
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
          'Content-Disposition': `attachment; filename="analytics_${analyticsType}_${startDate}_${endDate}.csv"`,
          'X-Request-ID': context?.requestId || '',
        },
      });
    }

    // JSON format
    const exportResponse = {
      Data: {
        AnalyticsType: analyticsType,
        Format: format,
        StartDate: startDate,
        EndDate: endDate,
        RecordCount: data.length,
        Data: data,
        ExportedDateTime: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/analytics/export',
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
    log.error('Error exporting analytics:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while exporting analytics',
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
