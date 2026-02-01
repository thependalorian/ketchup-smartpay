/**
 * Fineract Trust Account Reconciliation API Route
 * 
 * Location: app/api/fineract/reconciliation/route.ts
 * Purpose: Reconcile trust account with Fineract
 * 
 * Compliance: PSD-3 (Trust account reconciliation)
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function postHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    const { trustAccountId } = body;

    if (!trustAccountId) {
      return errorResponse('trustAccountId is required', HttpStatus.BAD_REQUEST);
    }

    // Get trust account
    const trustAccounts = await query<{
      id: string;
      account_name: string;
      balance: number;
      fineract_account_id: number;
    }>(
      'SELECT id, account_name, balance, fineract_account_id FROM trust_account WHERE id = $1',
      [trustAccountId]
    );

    if (trustAccounts.length === 0) {
      return errorResponse('Trust account not found', HttpStatus.NOT_FOUND);
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
        trustAccountId,
        reconciliation.fineractBalance,
        reconciliation.applicationBalance,
        reconciliation.difference,
        reconciliation.reconciled,
        reconciliation.reconciled
          ? 'Reconciliation successful'
          : `Discrepancy detected: ${reconciliation.difference} NAD`,
      ]
    ).catch(err => logger.error('Failed to log reconciliation:', err));

    return successResponse({
      trustAccountId,
      trustAccountName: trustAccount.account_name,
      reconciliation: {
        fineractBalance: reconciliation.fineractBalance,
        applicationBalance: reconciliation.applicationBalance,
        difference: reconciliation.difference,
        reconciled: reconciliation.reconciled,
      },
      timestamp: new Date().toISOString(),
    }, reconciliation.reconciled
      ? 'Trust account reconciled successfully'
      : 'Reconciliation completed with discrepancy');
  } catch (error: any) {
    logger.error('Error reconciling trust account', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to reconcile trust account',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);
