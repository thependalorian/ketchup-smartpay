/**
 * Compliance Report Generation API
 * 
 * Location: app/api/admin/compliance/generate-report.ts
 * Purpose: Generate compliance reports (CSV, Excel) for submission to Bank of Namibia
 * 
 * PSD-1 Requirement:
 * - Monthly statistics submission within 10 days of month end
 * - Reports in specified format (CSV/Excel)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import ExcelJS from 'exceljs';
import logger from '@/utils/logger';

async function postHandler(req: ExpoRequest) {

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const { monthlyStatsId, format = 'csv' } = body; // format: 'csv' | 'excel'

    if (!monthlyStatsId) {
      return errorResponse('monthlyStatsId is required', HttpStatus.BAD_REQUEST);
    }

    if (!['csv', 'excel'].includes(format)) {
      return errorResponse('Format must be "csv" or "excel"', HttpStatus.BAD_REQUEST);
    }

    // Get monthly stats
    const stats = await query<{
      [key: string]: any;
    }>(
      'SELECT * FROM compliance_monthly_stats WHERE id = $1',
      [monthlyStatsId]
    );

    if (stats.length === 0) {
      return errorResponse('Monthly statistics not found', HttpStatus.NOT_FOUND);
    }

    const monthlyStats = stats[0];

    // Generate CSV format
    if (format === 'csv') {
      const csvRows: string[] = [];
      
      // Header
      csvRows.push('Compliance Report - Bank of Namibia');
      csvRows.push(`Report Period: ${monthlyStats.report_month}`);
      csvRows.push(`Generated: ${new Date().toISOString()}`);
      csvRows.push('');

      // Transaction Statistics
      csvRows.push('Transaction Statistics');
      csvRows.push(`Total Transactions,${monthlyStats.total_transactions}`);
      csvRows.push(`Total Transaction Value,${monthlyStats.total_transaction_value}`);
      csvRows.push(`Total Transaction Volume,${monthlyStats.total_transaction_volume}`);
      csvRows.push('');

      // Voucher Statistics
      csvRows.push('Voucher Statistics');
      csvRows.push(`Vouchers Issued,${monthlyStats.total_vouchers_issued}`);
      csvRows.push(`Voucher Value Issued,${monthlyStats.total_voucher_value_issued}`);
      csvRows.push(`Vouchers Redeemed,${monthlyStats.total_vouchers_redeemed}`);
      csvRows.push(`Voucher Value Redeemed,${monthlyStats.total_voucher_value_redeemed}`);
      csvRows.push(`Vouchers Expired,${monthlyStats.total_vouchers_expired}`);
      csvRows.push(`Voucher Value Expired,${monthlyStats.total_voucher_value_expired}`);
      csvRows.push('');

      // User Statistics
      csvRows.push('User Statistics');
      csvRows.push(`Total Active Users,${monthlyStats.total_active_users}`);
      csvRows.push(`Total Registered Users,${monthlyStats.total_registered_users}`);
      csvRows.push(`New Users This Month,${monthlyStats.new_users_this_month}`);
      csvRows.push('');

      // Wallet Statistics
      csvRows.push('Wallet Statistics');
      csvRows.push(`Total Wallets,${monthlyStats.total_wallets}`);
      csvRows.push(`Total Wallet Balance,${monthlyStats.total_wallet_balance}`);
      csvRows.push(`Average Wallet Balance,${monthlyStats.average_wallet_balance}`);
      csvRows.push('');

      // Payment Method Statistics
      csvRows.push('Payment Method Statistics');
      csvRows.push(`Wallet Transfers Count,${monthlyStats.wallet_transfers_count}`);
      csvRows.push(`Wallet Transfers Value,${monthlyStats.wallet_transfers_value}`);
      csvRows.push(`Bank Transfers Count,${monthlyStats.bank_transfers_count}`);
      csvRows.push(`Bank Transfers Value,${monthlyStats.bank_transfers_value}`);
      csvRows.push(`Cash Out Count,${monthlyStats.cash_out_count}`);
      csvRows.push(`Cash Out Value,${monthlyStats.cash_out_value}`);
      csvRows.push(`Merchant Payments Count,${monthlyStats.merchant_payments_count}`);
      csvRows.push(`Merchant Payments Value,${monthlyStats.merchant_payments_value}`);
      csvRows.push('');

      // Compliance Statistics
      csvRows.push('Compliance Statistics');
      csvRows.push(`Total 2FA Verifications,${monthlyStats.total_2fa_verifications}`);
      csvRows.push(`Total Audit Log Entries,${monthlyStats.total_audit_log_entries}`);
      csvRows.push(`Total Fraud Attempts,${monthlyStats.total_fraud_attempts}`);
      csvRows.push(`Total Incidents,${monthlyStats.total_incidents}`);

      const csvContent = csvRows.join('\n');

      // Save file record
      const fileName = `compliance_report_${monthlyStats.report_year}_${monthlyStats.report_month_number}_${Date.now()}.csv`;
      const filePath = `/reports/${fileName}`; // In production, save to storage (S3, etc.)

      await query(
        `INSERT INTO compliance_report_files (
          monthly_stats_id, file_type, file_name, file_path,
          file_size, mime_type, generated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          monthlyStatsId,
          'csv',
          fileName,
          filePath,
          Buffer.from(csvContent).length,
          'text/csv',
          userId,
        ]
      );

      // Log staff action (CSV format)
      await logStaffActionWithContext(
        req,
        {
          actionType: 'compliance_report_generated',
          targetEntityType: 'compliance_report',
          targetEntityId: monthlyStatsId,
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
      ).catch(err => {
        logger.warn('[Compliance] Staff action logging failed (non-critical)', err);
      });

      return successResponse(
        {
          fileName,
          filePath,
          format: 'csv',
          content: csvContent, // In production, return download URL instead
          size: Buffer.from(csvContent).length,
        },
        'Compliance report generated'
      );
    }

    // Excel format using ExcelJS
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Compliance Report');

      // Set column widths
      worksheet.columns = [
        { width: 35 },
        { width: 25 },
      ];

      // Header row with styling
      worksheet.mergeCells('A1:B1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'Compliance Report - Bank of Namibia';
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 25;

      // Report period
      worksheet.mergeCells('A2:B2');
      const periodCell = worksheet.getCell('A2');
      periodCell.value = `Report Period: ${monthlyStats.report_month}`;
      periodCell.font = { bold: true };
      worksheet.getRow(2).height = 20;

      // Generated date
      worksheet.mergeCells('A3:B3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = `Generated: ${new Date().toISOString()}`;
      worksheet.getRow(3).height = 20;

      // Empty row
      worksheet.getRow(4).height = 10;

      // Transaction Statistics Section
      let currentRow = 5;
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const transHeader = worksheet.getCell(`A${currentRow}`);
      transHeader.value = 'Transaction Statistics';
      transHeader.font = { bold: true, size: 14 };
      transHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      const transactionData = [
        ['Total Transactions', monthlyStats.total_transactions],
        ['Total Transaction Value', monthlyStats.total_transaction_value],
        ['Total Transaction Volume', monthlyStats.total_transaction_volume],
      ];

      transactionData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
        currentRow++;
      });

      currentRow++; // Empty row

      // Voucher Statistics Section
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const voucherHeader = worksheet.getCell(`A${currentRow}`);
      voucherHeader.value = 'Voucher Statistics';
      voucherHeader.font = { bold: true, size: 14 };
      voucherHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      const voucherData = [
        ['Vouchers Issued', monthlyStats.total_vouchers_issued],
        ['Voucher Value Issued', monthlyStats.total_voucher_value_issued],
        ['Vouchers Redeemed', monthlyStats.total_vouchers_redeemed],
        ['Voucher Value Redeemed', monthlyStats.total_voucher_value_redeemed],
        ['Vouchers Expired', monthlyStats.total_vouchers_expired],
        ['Voucher Value Expired', monthlyStats.total_voucher_value_expired],
      ];

      voucherData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
        currentRow++;
      });

      currentRow++; // Empty row

      // User Statistics Section
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const userHeader = worksheet.getCell(`A${currentRow}`);
      userHeader.value = 'User Statistics';
      userHeader.font = { bold: true, size: 14 };
      userHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      const userData = [
        ['Total Active Users', monthlyStats.total_active_users],
        ['Total Registered Users', monthlyStats.total_registered_users],
        ['New Users This Month', monthlyStats.new_users_this_month],
      ];

      userData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        currentRow++;
      });

      currentRow++; // Empty row

      // Wallet Statistics Section
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const walletHeader = worksheet.getCell(`A${currentRow}`);
      walletHeader.value = 'Wallet Statistics';
      walletHeader.font = { bold: true, size: 14 };
      walletHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      const walletData = [
        ['Total Wallets', monthlyStats.total_wallets],
        ['Total Wallet Balance', monthlyStats.total_wallet_balance],
        ['Average Wallet Balance', monthlyStats.average_wallet_balance],
      ];

      walletData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
        currentRow++;
      });

      currentRow++; // Empty row

      // Payment Method Statistics Section
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const paymentHeader = worksheet.getCell(`A${currentRow}`);
      paymentHeader.value = 'Payment Method Statistics';
      paymentHeader.font = { bold: true, size: 14 };
      paymentHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      const paymentData = [
        ['Wallet Transfers Count', monthlyStats.wallet_transfers_count],
        ['Wallet Transfers Value', monthlyStats.wallet_transfers_value],
        ['Bank Transfers Count', monthlyStats.bank_transfers_count],
        ['Bank Transfers Value', monthlyStats.bank_transfers_value],
        ['Cash Out Count', monthlyStats.cash_out_count],
        ['Cash Out Value', monthlyStats.cash_out_value],
        ['Merchant Payments Count', monthlyStats.merchant_payments_count],
        ['Merchant Payments Value', monthlyStats.merchant_payments_value],
      ];

      paymentData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        worksheet.getCell(`B${currentRow}`).numFmt = '#,##0.00';
        currentRow++;
      });

      currentRow++; // Empty row

      // Compliance Statistics Section
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const complianceHeader = worksheet.getCell(`A${currentRow}`);
      complianceHeader.value = 'Compliance Statistics';
      complianceHeader.font = { bold: true, size: 14 };
      complianceHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      const complianceData = [
        ['Total 2FA Verifications', monthlyStats.total_2fa_verifications],
        ['Total Audit Log Entries', monthlyStats.total_audit_log_entries],
        ['Total Fraud Attempts', monthlyStats.total_fraud_attempts],
        ['Total Incidents', monthlyStats.total_incidents],
      ];

      complianceData.forEach(([label, value]) => {
        worksheet.getCell(`A${currentRow}`).value = label;
        worksheet.getCell(`B${currentRow}`).value = value;
        currentRow++;
      });

      // Generate Excel buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();
      const excelBase64 = Buffer.from(excelBuffer).toString('base64');

      // Save file record
      const fileName = `compliance_report_${monthlyStats.report_year}_${monthlyStats.report_month_number}_${Date.now()}.xlsx`;
      const filePath = `/reports/${fileName}`; // In production, save to storage (S3, etc.)

      await query(
        `INSERT INTO compliance_report_files (
          monthly_stats_id, file_type, file_name, file_path,
          file_size, mime_type, generated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          monthlyStatsId,
          'excel',
          fileName,
          filePath,
          excelBuffer.length,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          userId,
        ]
      );

      // Log staff action (Excel format)
      await logStaffActionWithContext(
        req,
        {
          actionType: 'compliance_report_generated',
          targetEntityType: 'compliance_report',
          targetEntityId: monthlyStatsId,
          location: 'system',
          actionDetails: {
            format: 'excel',
            fileName,
            reportMonth: monthlyStats.report_month,
            reportYear: monthlyStats.report_year,
          },
          authorizationLevel: 'admin',
        },
        true
      ).catch(err => {
        logger.warn('[Compliance] Staff action logging failed (non-critical)', err);
      });

      return successResponse(
        {
          fileName,
          filePath,
          format: 'excel',
          content: excelBase64, // Base64 encoded Excel file
          size: excelBuffer.length,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        'Compliance report generated successfully'
      );
    }

    return errorResponse('Invalid format', HttpStatus.BAD_REQUEST);

  } catch (error: any) {
    logger.error('Error generating compliance report', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate compliance report',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
