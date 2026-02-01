/**
 * Compliance Monthly Statistics API
 * 
 * Location: app/api/admin/compliance/monthly-stats.ts
 * Purpose: Generate and retrieve monthly statistics for compliance reporting (PSD-1 Requirement)
 * 
 * PSD-1 Requirement:
 * - Monthly statistics submission to Bank of Namibia
 * - Due within 10 days after month end
 * - Includes transaction volumes, values, user statistics, etc.
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { logStaffAction, generateRequestId } from '@/utils/auditLogger';
import { getIpAddress } from '@/utils/auditLogger';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString(), 10);
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10);

    // Get existing monthly stats if they exist
    const existingStats = await query<{
      id: string;
      report_month: string;
      status: string;
      [key: string]: any;
    }>(
      `SELECT * FROM compliance_monthly_stats 
       WHERE report_year = $1 AND report_month_number = $2`,
      [year, month]
    );

    if (existingStats.length > 0) {
      return successResponse(existingStats[0], 'Monthly statistics retrieved');
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Transaction Statistics
    const transactionStats = await query<{
      count: number;
      total_value: number;
    }>(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_value
       FROM transactions
       WHERE created_at >= $1 AND created_at <= $2
       AND status IN ('completed', 'authorised')`,
      [startDate, endDate]
    );

    // 2. Voucher Statistics
    const voucherIssued = await query<{
      count: number;
      total_value: number;
    }>(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_value
       FROM vouchers
       WHERE created_at >= $1 AND created_at <= $2`,
      [startDate, endDate]
    );

    const voucherRedeemed = await query<{
      count: number;
      total_value: number;
    }>(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_value
       FROM vouchers
       WHERE status = 'redeemed'
       AND updated_at >= $1 AND updated_at <= $2`,
      [startDate, endDate]
    );

    const voucherExpired = await query<{
      count: number;
      total_value: number;
    }>(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_value
       FROM vouchers
       WHERE status = 'expired'
       AND updated_at >= $1 AND updated_at <= $2`,
      [startDate, endDate]
    );

    // 3. User Statistics
    const userStats = await query<{
      total_active: number;
      total_registered: number;
      new_users: number;
    }>(
      `SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as total_active,
        COUNT(*) as total_registered,
        COUNT(CASE WHEN created_at >= $1 AND created_at <= $2 THEN 1 END) as new_users
       FROM users`,
      [startDate, endDate]
    );

    // 4. Wallet Statistics
    const walletStats = await query<{
      total_wallets: number;
      total_balance: number;
      avg_balance: number;
    }>(
      `SELECT 
        COUNT(*) as total_wallets,
        COALESCE(SUM(balance), 0) as total_balance,
        COALESCE(AVG(balance), 0) as avg_balance
       FROM wallets
       WHERE status = 'active'`,
      []
    );

    // 5. Payment Method Statistics
    const paymentMethodStats = await query<{
      method: string;
      count: number;
      total_value: number;
    }>(
      `SELECT 
        payment_method as method,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_value
       FROM transactions
       WHERE created_at >= $1 AND created_at <= $2
       AND status IN ('completed', 'authorised')
       GROUP BY payment_method`,
      [startDate, endDate]
    );

    // 6. Compliance Statistics
    const complianceStats = await query<{
      total_2fa: number;
      total_audit_logs: number;
      total_fraud: number;
      total_incidents: number;
    }>(
      `SELECT 
        (SELECT COUNT(*) FROM pin_operations WHERE created_at >= $1 AND created_at <= $2) as total_2fa,
        (SELECT COUNT(*) FROM audit_logs WHERE created_at >= $1 AND created_at <= $2) as total_audit_logs,
        (SELECT COUNT(*) FROM fraud_detection_logs WHERE created_at >= $1 AND created_at <= $2) as total_fraud,
        (SELECT COUNT(*) FROM incident_reports WHERE created_at >= $1 AND created_at <= $2) as total_incidents`,
      [startDate, endDate]
    );

    // Aggregate payment method stats
    const walletTransfers = paymentMethodStats.find(p => p.method === 'wallet') || { count: 0, total_value: 0 };
    const bankTransfers = paymentMethodStats.find(p => p.method === 'bank_transfer') || { count: 0, total_value: 0 };
    const cashOut = paymentMethodStats.find(p => p.method === 'cash_out') || { count: 0, total_value: 0 };
    const merchantPayments = paymentMethodStats.find(p => p.method === 'merchant_payment') || { count: 0, total_value: 0 };

    // Create monthly stats record
    const monthlyStats = {
      report_month: startDate.toISOString().split('T')[0],
      report_year: year,
      report_month_number: month,
      total_transactions: parseInt(transactionStats[0]?.count?.toString() || '0'),
      total_transaction_value: parseFloat(transactionStats[0]?.total_value?.toString() || '0'),
      total_transaction_volume: parseInt(transactionStats[0]?.count?.toString() || '0'),
      total_vouchers_issued: parseInt(voucherIssued[0]?.count?.toString() || '0'),
      total_voucher_value_issued: parseFloat(voucherIssued[0]?.total_value?.toString() || '0'),
      total_vouchers_redeemed: parseInt(voucherRedeemed[0]?.count?.toString() || '0'),
      total_voucher_value_redeemed: parseFloat(voucherRedeemed[0]?.total_value?.toString() || '0'),
      total_vouchers_expired: parseInt(voucherExpired[0]?.count?.toString() || '0'),
      total_voucher_value_expired: parseFloat(voucherExpired[0]?.total_value?.toString() || '0'),
      total_active_users: parseInt(userStats[0]?.total_active?.toString() || '0'),
      total_registered_users: parseInt(userStats[0]?.total_registered?.toString() || '0'),
      new_users_this_month: parseInt(userStats[0]?.new_users?.toString() || '0'),
      total_wallets: parseInt(walletStats[0]?.total_wallets?.toString() || '0'),
      total_wallet_balance: parseFloat(walletStats[0]?.total_balance?.toString() || '0'),
      average_wallet_balance: parseFloat(walletStats[0]?.avg_balance?.toString() || '0'),
      wallet_transfers_count: parseInt(walletTransfers.count?.toString() || '0'),
      wallet_transfers_value: parseFloat(walletTransfers.total_value?.toString() || '0'),
      bank_transfers_count: parseInt(bankTransfers.count?.toString() || '0'),
      bank_transfers_value: parseFloat(bankTransfers.total_value?.toString() || '0'),
      cash_out_count: parseInt(cashOut.count?.toString() || '0'),
      cash_out_value: parseFloat(cashOut.total_value?.toString() || '0'),
      merchant_payments_count: parseInt(merchantPayments.count?.toString() || '0'),
      merchant_payments_value: parseFloat(merchantPayments.total_value?.toString() || '0'),
      total_2fa_verifications: parseInt(complianceStats[0]?.total_2fa?.toString() || '0'),
      total_audit_log_entries: parseInt(complianceStats[0]?.total_audit_logs?.toString() || '0'),
      total_fraud_attempts: parseInt(complianceStats[0]?.total_fraud?.toString() || '0'),
      total_incidents: parseInt(complianceStats[0]?.total_incidents?.toString() || '0'),
      status: 'draft',
    };

    return successResponse(monthlyStats, 'Monthly statistics calculated');

  } catch (error: any) {
    logger.error('Error calculating monthly statistics', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to calculate monthly statistics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  const requestId = generateRequestId();
  const ipAddress = getIpAddress(req);

  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const { year, month, ...stats } = body;

    if (!year || !month) {
      return errorResponse('Year and month are required', HttpStatus.BAD_REQUEST);
    }

    // Insert or update monthly stats
    const result = await query<{ id: string }>(
      `INSERT INTO compliance_monthly_stats (
        report_month, report_year, report_month_number,
        total_transactions, total_transaction_value, total_transaction_volume,
        total_vouchers_issued, total_voucher_value_issued,
        total_vouchers_redeemed, total_voucher_value_redeemed,
        total_vouchers_expired, total_voucher_value_expired,
        total_active_users, total_registered_users, new_users_this_month,
        total_wallets, total_wallet_balance, average_wallet_balance,
        wallet_transfers_count, wallet_transfers_value,
        bank_transfers_count, bank_transfers_value,
        cash_out_count, cash_out_value,
        merchant_payments_count, merchant_payments_value,
        total_2fa_verifications, total_audit_log_entries,
        total_fraud_attempts, total_incidents,
        status, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
      )
      ON CONFLICT (report_year, report_month_number)
      DO UPDATE SET
        total_transactions = EXCLUDED.total_transactions,
        total_transaction_value = EXCLUDED.total_transaction_value,
        total_transaction_volume = EXCLUDED.total_transaction_volume,
        total_vouchers_issued = EXCLUDED.total_vouchers_issued,
        total_voucher_value_issued = EXCLUDED.total_voucher_value_issued,
        total_vouchers_redeemed = EXCLUDED.total_vouchers_redeemed,
        total_voucher_value_redeemed = EXCLUDED.total_voucher_value_redeemed,
        total_vouchers_expired = EXCLUDED.total_vouchers_expired,
        total_voucher_value_expired = EXCLUDED.total_voucher_value_expired,
        total_active_users = EXCLUDED.total_active_users,
        total_registered_users = EXCLUDED.total_registered_users,
        new_users_this_month = EXCLUDED.new_users_this_month,
        total_wallets = EXCLUDED.total_wallets,
        total_wallet_balance = EXCLUDED.total_wallet_balance,
        average_wallet_balance = EXCLUDED.average_wallet_balance,
        wallet_transfers_count = EXCLUDED.wallet_transfers_count,
        wallet_transfers_value = EXCLUDED.wallet_transfers_value,
        bank_transfers_count = EXCLUDED.bank_transfers_count,
        bank_transfers_value = EXCLUDED.bank_transfers_value,
        cash_out_count = EXCLUDED.cash_out_count,
        cash_out_value = EXCLUDED.cash_out_value,
        merchant_payments_count = EXCLUDED.merchant_payments_count,
        merchant_payments_value = EXCLUDED.merchant_payments_value,
        total_2fa_verifications = EXCLUDED.total_2fa_verifications,
        total_audit_log_entries = EXCLUDED.total_audit_log_entries,
        total_fraud_attempts = EXCLUDED.total_fraud_attempts,
        total_incidents = EXCLUDED.total_incidents,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING id`,
      [
        new Date(year, month - 1, 1).toISOString().split('T')[0], // report_month
        year,
        month,
        stats.total_transactions || 0,
        stats.total_transaction_value || 0,
        stats.total_transaction_volume || 0,
        stats.total_vouchers_issued || 0,
        stats.total_voucher_value_issued || 0,
        stats.total_vouchers_redeemed || 0,
        stats.total_voucher_value_redeemed || 0,
        stats.total_vouchers_expired || 0,
        stats.total_voucher_value_expired || 0,
        stats.total_active_users || 0,
        stats.total_registered_users || 0,
        stats.new_users_this_month || 0,
        stats.total_wallets || 0,
        stats.total_wallet_balance || 0,
        stats.average_wallet_balance || 0,
        stats.wallet_transfers_count || 0,
        stats.wallet_transfers_value || 0,
        stats.bank_transfers_count || 0,
        stats.bank_transfers_value || 0,
        stats.cash_out_count || 0,
        stats.cash_out_value || 0,
        stats.merchant_payments_count || 0,
        stats.merchant_payments_value || 0,
        stats.total_2fa_verifications || 0,
        stats.total_audit_log_entries || 0,
        stats.total_fraud_attempts || 0,
        stats.total_incidents || 0,
        stats.status || 'draft',
        stats.notes || null,
      ]
    );

    // Log staff action
    await logStaffAction({
      staffId: userId,
      actionType: 'compliance_stats_update',
      entityType: 'compliance_monthly_stats',
      entityId: result[0]?.id,
      details: { year, month, status: stats.status || 'draft' },
      ipAddress,
      requestId,
    }).catch(err => logger.error('Failed to log staff action', err));

    return successResponse({ id: result[0]?.id, year, month }, 'Monthly statistics saved');

  } catch (error: any) {
    logger.error('Error saving monthly statistics', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to save monthly statistics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
