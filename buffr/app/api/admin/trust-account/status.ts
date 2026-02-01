/**
 * Trust Account Status API
 * 
 * Location: app/api/admin/trust-account/status.ts
 * Purpose: Get current trust account status and reconciliation history
 * 
 * Returns:
 * - Current trust account balance
 * - Current e-money liabilities
 * - Discrepancy amount
 * - Recent reconciliation history
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30', 10);

    // 1. Get current trust account balance (latest record)
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

    // 2. Calculate current e-money liabilities
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

    // 3. Get recent reconciliation history
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

    // 4. Get recent trust account transactions
    const recentTransactions = await query<{
      id: string;
      transaction_type: string;
      amount: number;
      description: string;
      created_at: string;
    }>(
      `SELECT id, transaction_type, amount, description, created_at
       FROM trust_account_transactions
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC
       LIMIT 50`
    );

    return successResponse({
      current: {
        trustAccountBalance: currentTrustBalance,
        eMoneyLiabilities: currentLiabilities,
        discrepancyAmount: currentDiscrepancy,
        status: Math.abs(currentDiscrepancy) <= 0.01 ? 'reconciled' : 'discrepancy',
        lastReconciled: currentTrustAccount[0]?.reconciled_at || null,
      },
      reconciliationHistory: reconciliationHistory.map(r => ({
        id: r.id,
        date: r.reconciliation_date,
        trustAccountBalance: parseFloat(r.trust_account_balance.toString()),
        eMoneyLiabilities: parseFloat(r.e_money_liabilities.toString()),
        discrepancyAmount: parseFloat(r.discrepancy_amount.toString()),
        status: r.status,
        reconciledAt: r.reconciled_at,
      })),
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        type: t.transaction_type,
        amount: parseFloat(t.amount.toString()),
        description: t.description,
        createdAt: t.created_at,
      })),
    }, 'Trust account status retrieved');

  } catch (error: any) {
    logger.error('Error fetching trust account status', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch trust account status',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
