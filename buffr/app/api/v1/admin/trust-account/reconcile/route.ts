/**
 * Open Banking API: /api/v1/admin/trust-account/reconcile
 * 
 * Trust account reconciliation (Open Banking format)
 * 
 * Compliance: PSD-3 §13.3
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { sendDiscrepancyAlert } from '@/utils/trustAccountAlerts';
import { logStaffActionWithContext } from '@/utils/staffActionLogger';
import { log } from '@/utils/logger';

/**
 * POST /api/v1/admin/trust-account/reconcile
 * Run trust account reconciliation
 */
async function handleReconcile(req: ExpoRequest) {
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

    const { ReconciliationDate, TrustAccountBalance, Notes } = Data;

    // Use provided date or today's date
    const reconDate = ReconciliationDate ? new Date(ReconciliationDate) : new Date();
    const dateStr = reconDate.toISOString().split('T')[0];

    // Calculate total e-money liabilities
    const liabilitiesResult = await query<{ total: number }>(
      `SELECT COALESCE(SUM(balance), 0) as total 
       FROM wallets 
       WHERE status = 'active'`
    );

    const eMoneyLiabilities = parseFloat(liabilitiesResult[0]?.total?.toString() || '0');

    // Get or create trust account record
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
      [dateStr, TrustAccountBalance || 0, eMoneyLiabilities]
    );

    const trustAccountId = trustAccountResult[0]?.id;
    const actualTrustBalance = parseFloat(trustAccountResult[0]?.closing_balance?.toString() || '0');

    // Calculate discrepancy
    const discrepancyAmount = actualTrustBalance - eMoneyLiabilities;
    const hasDiscrepancy = Math.abs(discrepancyAmount) > 0.01;

    let status: 'success' | 'discrepancy' | 'error' = 'success';
    let message = 'Reconciliation successful. Trust account balance matches e-money liabilities.';

    if (hasDiscrepancy) {
      status = 'discrepancy';
      message = `Discrepancy detected: Trust account (${actualTrustBalance.toFixed(2)}) does not match e-money liabilities (${eMoneyLiabilities.toFixed(2)}). Difference: ${discrepancyAmount.toFixed(2)}`;
    }

    // Update trust account record
    await query(
      `UPDATE trust_account 
       SET reconciliation_status = $1,
           discrepancy_amount = $2,
           reconciled_by = $3,
           reconciled_at = NOW(),
           notes = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [hasDiscrepancy ? 'discrepancy' : 'reconciled', discrepancyAmount, actualUserId, Notes || null, trustAccountId]
    );

    // Log reconciliation attempt
    await query(
      `INSERT INTO trust_account_reconciliation_log (
        reconciliation_date, trust_account_balance, e_money_liabilities,
        discrepancy_amount, status, reconciled_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [dateStr, actualTrustBalance, eMoneyLiabilities, discrepancyAmount, status, actualUserId, Notes || null]
    );

    // Log staff action
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
          notes: Notes || null,
        },
        authorizationLevel: 'admin',
      },
      true
    ).catch(err => log.warn('Staff action logging failed (non-critical):', err));

    // If discrepancy, send alerts
    if (hasDiscrepancy) {
      sendDiscrepancyAlert(
        dateStr,
        actualTrustBalance,
        eMoneyLiabilities,
        discrepancyAmount
      ).catch(err => log.warn('Alert sending failed (non-critical):', err));
    }

    const reconcileResponse = {
      Data: {
        ReconciliationDate: dateStr,
        TrustAccountBalance: actualTrustBalance,
        EMoneyLiabilities: eMoneyLiabilities,
        DiscrepancyAmount: discrepancyAmount,
        Status: status,
        Message: message,
      },
      Links: {
        Self: '/api/v1/admin/trust-account/reconcile',
      },
      Meta: {},
    };

    return helpers.success(
      reconcileResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Trust account reconciliation error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while reconciling the trust account',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleReconcile,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
