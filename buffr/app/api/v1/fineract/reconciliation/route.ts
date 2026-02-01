/**
 * Open Banking API: /api/v1/fineract/reconciliation
 * 
 * Trust account reconciliation (Open Banking format)
 * 
 * Compliance: PSD-3 (Trust account reconciliation)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

async function handleReconciliation(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { TrustAccountId } = Data;

    if (!TrustAccountId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.TrustAccountId is required',
        400
      );
    }

    // Get trust account
    const trustAccounts = await query<any>(
      'SELECT id, account_name, balance, fineract_account_id FROM trust_account WHERE id = $1',
      [TrustAccountId]
    );

    if (trustAccounts.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Trust account not found',
        404
      );
    }

    const trustAccount = trustAccounts[0];

    // Reconcile with Fineract
    const reconciliation = await fineractService.reconcileTrustAccount(
      trustAccount.fineract_account_id
    );

    // Log reconciliation
    await query(
      `INSERT INTO trust_account_reconciliation_log (
        trust_account_id, fineract_balance, application_balance, difference, reconciled, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        TrustAccountId,
        reconciliation.fineractBalance,
        reconciliation.applicationBalance,
        reconciliation.difference,
        reconciliation.reconciled,
        reconciliation.reconciled
          ? 'Reconciliation successful'
          : `Discrepancy detected: ${reconciliation.difference} NAD`,
      ]
    ).catch(err => log.error('Failed to log reconciliation:', err));

    const reconciliationResponse = {
      Data: {
        TrustAccountId,
        TrustAccountName: trustAccount.account_name,
        Reconciliation: {
          FineractBalance: reconciliation.fineractBalance,
          ApplicationBalance: reconciliation.applicationBalance,
          Difference: reconciliation.difference,
          Reconciled: reconciliation.reconciled,
        },
        Timestamp: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/fineract/reconciliation',
      },
      Meta: {},
    };

    return helpers.success(
      reconciliationResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error reconciling trust account:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while reconciling the trust account',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleReconciliation,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
