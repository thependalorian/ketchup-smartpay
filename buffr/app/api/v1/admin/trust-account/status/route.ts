/**
 * Open Banking API: /api/v1/admin/trust-account/status
 * 
 * Trust account status (Open Banking format)
 * 
 * Compliance: PSD-3
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/trust-account/status
 * Get trust account status
 */
async function handleGetStatus(req: ExpoRequest) {
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
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Get current trust account balance
    const currentTrustAccount = await query<{
      id: string;
      date: string;
      closing_balance: number;
      e_money_liabilities: number;
      discrepancy_amount: number;
      reconciliation_status: string;
      reconciled_at: string | null;
    }>(
      `SELECT id, date, closing_balance, e_money_liabilities, discrepancy_amount,
              reconciliation_status, reconciled_at
       FROM trust_account
       ORDER BY date DESC
       LIMIT 1`
    );

    // Calculate current e-money liabilities
    const liabilitiesResult = await query<{ total: number }>(
      `SELECT COALESCE(SUM(balance), 0) as total 
       FROM wallets 
       WHERE status = 'active'`
    );

    const currentLiabilities = parseFloat(liabilitiesResult[0]?.total?.toString() || '0');
    const currentTrustBalance = currentTrustAccount[0]?.closing_balance
      ? parseFloat(currentTrustAccount[0].closing_balance.toString())
      : 0;

    const currentDiscrepancy = currentTrustBalance - currentLiabilities;

    // Get recent reconciliation history
    const reconciliationHistory = await query<{
      id: string;
      reconciliation_date: string;
      trust_account_balance: number;
      e_money_liabilities: number;
      discrepancy_amount: number;
      status: string;
      reconciled_at: string;
    }>(
      `SELECT id, reconciliation_date, trust_account_balance, e_money_liabilities,
              discrepancy_amount, status, reconciled_at
       FROM trust_account_reconciliation_log
       WHERE reconciliation_date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY reconciliation_date DESC
       LIMIT 30`
    );

    const statusResponse = {
      Data: {
        Current: {
          TrustAccountBalance: currentTrustBalance,
          EMoneyLiabilities: currentLiabilities,
          DiscrepancyAmount: currentDiscrepancy,
          Status: Math.abs(currentDiscrepancy) <= 0.01 ? 'reconciled' : 'discrepancy',
          LastReconciled: currentTrustAccount[0]?.reconciled_at || null,
        },
        ReconciliationHistory: reconciliationHistory.map(r => ({
          ReconciliationId: r.id,
          Date: r.reconciliation_date,
          TrustAccountBalance: parseFloat(r.trust_account_balance.toString()),
          EMoneyLiabilities: parseFloat(r.e_money_liabilities.toString()),
          DiscrepancyAmount: parseFloat(r.discrepancy_amount.toString()),
          Status: r.status,
          ReconciledAt: r.reconciled_at,
        })),
      },
      Links: {
        Self: '/api/v1/admin/trust-account/status',
      },
      Meta: {},
    };

    return helpers.success(
      statusResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching trust account status:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching trust account status',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetStatus,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
