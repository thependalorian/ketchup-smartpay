/**
 * Trust Account Reconciliation API
 * 
 * Location: app/api/admin/trust-account/reconcile.ts
 * Purpose: Daily reconciliation of trust account balance with e-money liabilities (PSD-3 Requirement)
 * 
 * PSD-3 Requirement:
 * - Trust account must equal 100% of outstanding e-money liabilities
 * - Daily reconciliation required
 * - Automated alerts for discrepancies
 * 
 * This endpoint:
 * - Calculates total e-money liabilities (sum of all wallet balances)
 * - Compares with trust account balance
 * - Records reconciliation result
 * - Alerts if discrepancy found
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { generateRequestId } from '@/utils/auditLogger';
import { sendDiscrepancyAlert } from '@/utils/trustAccountAlerts';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import logger from '@/utils/logger';

interface ReconciliationResult {
  reconciliationDate: string;
  trustAccountBalance: number;
  eMoneyLiabilities: number;
  discrepancyAmount: number;
  status: 'success' | 'discrepancy' | 'error';
  message: string;
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
    const { reconciliationDate, trustAccountBalance, notes } = body;

    // Use provided date or today's date
    const reconDate = reconciliationDate ? new Date(reconciliationDate) : new Date();
    const dateStr = reconDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. Calculate total e-money liabilities (sum of all wallet balances)
    const liabilitiesResult = await query<{ total: number }>(
      `SELECT COALESCE(SUM(balance), 0) as total 
       FROM wallets 
       WHERE status = 'active'`
    );

    const eMoneyLiabilities = parseFloat(liabilitiesResult[0]?.total?.toString() || '0');

    // 2. Get or create trust account record for today
    const trustAccountResult = await query<{ id: string; closing_balance: number }>(
      `INSERT INTO trust_account (date, closing_balance, e_money_liabilities, reconciliation_status)
       VALUES ($1, $2, $3, 'pending')
       ON CONFLICT (date) 
       DO UPDATE SET 
         closing_balance = $2,
         e_money_liabilities = $3,
         reconciliation_status = 'pending',
         updated_at = NOW()
       RETURNING id, closing_balance`,
      [dateStr, trustAccountBalance || 0, eMoneyLiabilities]
    );

    const trustAccountId = trustAccountResult[0]?.id;
    const actualTrustBalance = parseFloat(trustAccountResult[0]?.closing_balance?.toString() || '0');

    // 3. Calculate discrepancy
    const discrepancyAmount = actualTrustBalance - eMoneyLiabilities;
    const hasDiscrepancy = Math.abs(discrepancyAmount) > 0.01; // Allow 1 cent tolerance

    // 4. Determine status
    let status: 'success' | 'discrepancy' | 'error' = 'success';
    let message = 'Reconciliation successful. Trust account balance matches e-money liabilities.';

    if (hasDiscrepancy) {
      status = 'discrepancy';
      message = `Discrepancy detected: Trust account (${actualTrustBalance.toFixed(2)}) does not match e-money liabilities (${eMoneyLiabilities.toFixed(2)}). Difference: ${discrepancyAmount.toFixed(2)}`;
    }

    // 5. Update trust account record
    await query(
      `UPDATE trust_account 
       SET reconciliation_status = $1,
           discrepancy_amount = $2,
           reconciled_by = $3,
           reconciled_at = NOW(),
           notes = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [hasDiscrepancy ? 'discrepancy' : 'reconciled', discrepancyAmount, userId, notes || null, trustAccountId]
    );

    // 6. Log reconciliation attempt
    await query(
      `INSERT INTO trust_account_reconciliation_log (
        reconciliation_date, trust_account_balance, e_money_liabilities,
        discrepancy_amount, status, reconciled_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [dateStr, actualTrustBalance, eMoneyLiabilities, discrepancyAmount, status, userId, notes || null]
    );

    // 7. Log staff action (audit trail)
    await logStaffActionWithContext(
      req,
      {
        actionType: 'trust_account_reconcile',
        targetEntityType: 'trust_account',
        targetEntityId: trustAccountId || 'new',
        location: 'system',
        actionDetails: {
          reconciliationDate: dateStr,
          trustAccountBalance: actualTrustBalance,
          eMoneyLiabilities,
          discrepancyAmount,
          status,
          notes: notes || null,
        },
        authorizationLevel: 'admin',
      },
      true
    ).catch(err => {
      logger.warn('[Trust Account] Staff action logging failed (non-critical)', err);
    });

    // 8. If discrepancy, send alerts to admins
    if (hasDiscrepancy) {
      sendDiscrepancyAlert(
        dateStr,
        actualTrustBalance,
        eMoneyLiabilities,
        discrepancyAmount
      ).catch(err => {
        logger.warn('[Trust Account] Alert sending failed (non-critical)', err);
      });
    }

    const result: ReconciliationResult = {
      reconciliationDate: dateStr,
      trustAccountBalance: actualTrustBalance,
      eMoneyLiabilities,
      discrepancyAmount,
      status,
      message,
    };

    return successResponse(result, 'Reconciliation completed');

  } catch (error: any) {
    logger.error('Trust account reconciliation error', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to reconcile trust account',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
