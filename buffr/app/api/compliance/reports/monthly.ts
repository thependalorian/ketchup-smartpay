/**
 * API Route: /api/compliance/reports/monthly
 * 
 * - GET: Generates a monthly compliance report for the Bank of Namibia.
 */
import { ExpoRequest } from 'expo-router/server';
import { query } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Aggregate transaction data from Neon DB
    const transactionStats = await query<{
      total_count: string;
      total_value: string;
      avg_value: string;
    }>(
      `SELECT 
        COUNT(*)::text as total_count,
        COALESCE(SUM(amount), 0)::text as total_value,
        COALESCE(AVG(amount), 0)::text as avg_value
       FROM transactions
       WHERE date >= $1 AND date <= $2
       AND status = 'completed'`,
      [startDate, endDate]
    );

    // Get total wallet balances (pool account balance)
    const walletStats = await query<{
      total_balance: string;
      user_count: string;
    }>(
      `SELECT 
        COALESCE(SUM(balance), 0)::text as total_balance,
        COUNT(DISTINCT user_id)::text as user_count
       FROM wallets`,
      []
    );

    const stats = transactionStats[0] || { total_count: '0', total_value: '0', avg_value: '0' };
    const wallet = walletStats[0] || { total_balance: '0', user_count: '0' };

    const totalTransactions = parseInt(stats.total_count) || 0;
    const totalValue = parseFloat(stats.total_value) || 0;
    const averageTransactionValue = totalTransactions > 0 
      ? (totalValue / totalTransactions).toFixed(2)
      : '0.00';
    const agentCount = parseInt(wallet.user_count) || 0;
    const totalPoolAccountBalance = parseFloat(wallet.total_balance) || 0;

    const report = {
      reportingPeriod: `${year}-${String(month).padStart(2, '0')}`,
      totalTransactions,
      totalValue,
      currency: 'NAD',
      averageTransactionValue,
      agentCount,
      totalPoolAccountBalance,
    };

    return successResponse(report, 'Report generated successfully');
  } catch (error) {
    log.error('Error generating compliance report:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to generate report',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.compliance, getHandler);
