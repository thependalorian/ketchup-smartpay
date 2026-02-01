/**
 * Open Banking API: /api/v1/admin/fineract
 * 
 * Admin Fineract integration monitoring (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne } from '@/utils/db';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/admin/fineract
 * Get Fineract integration status
 */
async function handleGetFineract(req: ExpoRequest) {
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
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status': {
        const usersWithFineract = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM users WHERE fineract_client_id IS NOT NULL'
        );

        const walletsWithFineract = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM wallets WHERE fineract_account_id IS NOT NULL'
        );

        const syncedTransactions = await queryOne<{ count: string }>(
          "SELECT COUNT(*) as count FROM transactions WHERE fineract_synced = true"
        );

        const pendingSyncTransactions = await queryOne<{ count: string }>(
          "SELECT COUNT(*) as count FROM transactions WHERE fineract_synced = false AND fineract_sync_error IS NULL"
        );

        const failedSyncTransactions = await queryOne<{ count: string }>(
          "SELECT COUNT(*) as count FROM transactions WHERE fineract_sync_error IS NOT NULL"
        );

        const statusResponse = {
          Data: {
            IntegrationEnabled: process.env.FINERACT_SYNC_ENABLED === 'true',
            FineractUrl: process.env.FINERACT_URL || 'Not configured',
            UsersMapped: parseInt(usersWithFineract?.count ?? '0', 10),
            WalletsMapped: parseInt(walletsWithFineract?.count ?? '0', 10),
            TransactionsSynced: parseInt(syncedTransactions?.count ?? '0', 10),
            TransactionsPending: parseInt(pendingSyncTransactions?.count ?? '0', 10),
            TransactionsFailed: parseInt(failedSyncTransactions?.count ?? '0', 10),
          },
          Links: {
            Self: '/api/v1/admin/fineract?action=status',
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
      }

      default:
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          'Invalid action. Use: status',
          400
        );
    }
  } catch (error) {
    log.error('Error fetching Fineract status:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching Fineract status',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetFineract,
  {
    rateLimitConfig: RATE_LIMITS.admin,
    requireAuth: true,
    trackResponseTime: true,
  }
);
