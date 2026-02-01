/**
 * Analytics Data Export API
 * 
 * Location: app/api/analytics/export/route.ts
 * Purpose: Export anonymized analytics data for analysis
 * 
 * Features:
 * - Privacy-compliant data anonymization
 * - CSV and JSON export formats
 * - Filtered by date range and analytics type
 * - Removes personal identifiers
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { query } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { anonymizeAnalyticsExport } from '@/utils/dataAnonymization';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const analyticsType = searchParams.get('type') || 'transactions'; // transactions, users, merchants, geographic, payment-methods, channels
    const format = searchParams.get('format') || 'json'; // json, csv
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
        // Note: user_id is anonymized in the query
        break;
      case 'merchants':
        tableName = 'merchant_analytics';
        selectFields = `
          date, transaction_count, total_volume, average_transaction_amount,
          unique_customers, payment_method_breakdown, peak_hours
        `;
        break;
      case 'geographic':
        tableName = 'geographic_analytics';
        selectFields = `
          region, date, transaction_count, total_volume, unique_users,
          cash_out_ratio, digital_payment_ratio
        `;
        break;
      case 'payment-methods':
        tableName = 'payment_method_analytics';
        selectFields = `
          payment_method, date, transaction_count, total_volume,
          average_transaction_amount, unique_users, success_rate,
          average_processing_time_ms
        `;
        break;
      case 'channels':
        tableName = 'channel_analytics';
        selectFields = `
          channel, date, transaction_count, total_volume,
          unique_users, average_transaction_amount
        `;
        break;
      default:
        return errorResponse('Invalid analytics type', HttpStatus.BAD_REQUEST);
    }

    // Build query with anonymization for user data
    let sql = `SELECT ${selectFields}`;
    
    if (analyticsType === 'users') {
      // Anonymize user_id in query
      sql = sql.replace('date,', 'MD5(user_id::text) as user_id_hash, date,');
    }
    
    sql += ` FROM ${tableName} WHERE date >= $1 AND date <= $2 ORDER BY date DESC`;
    
    data = await query<any>(sql, [startDate, endDate]);

    // Apply additional anonymization layer
    const anonymizedData = anonymizeAnalyticsExport(data);

    // Format response based on export format
    if (format === 'csv') {
      if (anonymizedData.length === 0) {
        return errorResponse('No data to export', HttpStatus.NOT_FOUND);
      }

      // Generate CSV
      const headers = Object.keys(anonymizedData[0]).join(',');
      const rows = anonymizedData.map((row) =>
        Object.values(row)
          .map((val) => {
            if (val === null || val === undefined) return '';
            if (typeof val === 'object') return JSON.stringify(val);
            const str = String(val);
            return str.includes(',') || str.includes('"') || str.includes('\n')
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          })
          .join(',')
      );

      const csvContent = [headers, ...rows].join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics_${analyticsType}_${startDate}_to_${endDate}.csv"`,
        },
      });
    }

    // JSON format (default)
    return successResponse({
      type: analyticsType,
      format: 'json',
      period: {
        fromDate: startDate,
        toDate: endDate,
      },
      recordCount: anonymizedData.length,
      data: anonymizedData,
      anonymized: true,
      note: 'All personal identifiers have been anonymized for privacy compliance',
    });
  } catch (error: any) {
    log.error('Error exporting analytics data:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to export analytics data',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
