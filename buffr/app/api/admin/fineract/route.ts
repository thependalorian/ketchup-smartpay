/**
 * Admin Fineract Integration API
 * 
 * Location: app/api/admin/fineract/route.ts
 * Purpose: Admin-only endpoints for Fineract integration monitoring
 * 
 * Requires: Admin authentication with 'fineract.view' permission
 */

import { ExpoRequest } from 'expo-router/server';
import { query, queryOne, getUserIdFromRequest } from '@/utils/db';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import logger from '@/utils/logger';

/**
 * GET /api/admin/fineract
 * 
 * Query parameters:
 * - action: 'status' | 'sync-status' | 'reconciliation' | 'mapping'
 */
async function getHandler(request: ExpoRequest) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status': {
        // Get overall Fineract integration status
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

        return successResponse({
          integration_enabled: process.env.FINERACT_SYNC_ENABLED === 'true',
          fineract_url: process.env.FINERACT_URL || 'Not configured',
          users_mapped: parseInt(usersWithFineract?.count ?? '0', 10),
          wallets_mapped: parseInt(walletsWithFineract?.count ?? '0', 10),
          transactions_synced: parseInt(syncedTransactions?.count ?? '0', 10),
          transactions_pending: parseInt(pendingSyncTransactions?.count ?? '0', 10),
          transactions_failed: parseInt(failedSyncTransactions?.count ?? '0', 10),
        });
      }

      case 'sync-status': {
        // Get detailed sync status
        const pendingTransactions = await query<any>(
          `SELECT 
            id,
            user_id,
            wallet_id,
            amount,
            transaction_type,
            status,
            created_at
          FROM transactions 
          WHERE fineract_synced = false 
            AND fineract_sync_error IS NULL
          ORDER BY created_at DESC
          LIMIT 50`
        );

        const failedTransactions = await query<any>(
          `SELECT 
            id,
            user_id,
            wallet_id,
            amount,
            transaction_type,
            status,
            fineract_sync_error,
            created_at
          FROM transactions 
          WHERE fineract_sync_error IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 50`
        );

        return successResponse({
          pending: pendingTransactions.map((tx: any) => ({
            id: tx.id,
            user_id: tx.user_id,
            wallet_id: tx.wallet_id,
            amount: parseFloat(tx.amount.toString()),
            type: tx.transaction_type,
            status: tx.status,
            created_at: tx.created_at?.toISOString() || null,
          })),
          failed: failedTransactions.map((tx: any) => ({
            id: tx.id,
            user_id: tx.user_id,
            wallet_id: tx.wallet_id,
            amount: parseFloat(tx.amount.toString()),
            type: tx.transaction_type,
            status: tx.status,
            error: tx.fineract_sync_error,
            created_at: tx.created_at?.toISOString() || null,
          })),
        });
      }

      case 'reconciliation': {
        // Get reconciliation status (compare Buffr vs Fineract balances)
        // Note: This requires Fineract API client to be implemented
        const walletsWithFineract = await query<any>(
          `SELECT 
            w.id,
            w.user_id,
            w.name,
            w.balance,
            w.fineract_account_id,
            u.fineract_client_id
          FROM wallets w
          LEFT JOIN users u ON u.id = w.user_id OR u.external_id = w.user_id
          WHERE w.fineract_account_id IS NOT NULL
          LIMIT 100`
        );

        return successResponse({
          wallets: walletsWithFineract.map((w: any) => ({
            wallet_id: w.id,
            user_id: w.user_id,
            name: w.name,
            buffr_balance: parseFloat(w.balance.toString()),
            fineract_account_id: w.fineract_account_id,
            fineract_client_id: w.fineract_client_id,
            // fineract_balance will be fetched when Fineract client is implemented
            reconciliation_status: 'pending',
          })),
          message: 'Fineract API client required for full reconciliation',
        });
      }

      case 'mapping': {
        // Get data mapping statistics
        const totalUsersResult = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM users'
        );
        const usersMappedResult = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM users WHERE fineract_client_id IS NOT NULL'
        );
        const totalWalletsResult = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM wallets'
        );
        const walletsMappedResult = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM wallets WHERE fineract_account_id IS NOT NULL'
        );
        const totalTransactionsResult = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM transactions'
        );
        const transactionsMappedResult = await queryOne<{ count: string }>(
          'SELECT COUNT(*) as count FROM transactions WHERE fineract_transaction_id IS NOT NULL'
        );

        const totalUsers = parseInt(totalUsersResult?.count ?? '0', 10);
        const usersMapped = parseInt(usersMappedResult?.count ?? '0', 10);
        const totalWallets = parseInt(totalWalletsResult?.count ?? '0', 10);
        const walletsMapped = parseInt(walletsMappedResult?.count ?? '0', 10);
        const totalTransactions = parseInt(totalTransactionsResult?.count ?? '0', 10);
        const transactionsMapped = parseInt(transactionsMappedResult?.count ?? '0', 10);

        return successResponse({
          users: {
            total: totalUsers,
            mapped: usersMapped,
            unmapped: totalUsers - usersMapped,
            mapping_percentage: totalUsers > 0
              ? ((usersMapped / totalUsers) * 100).toFixed(1)
              : '0.0',
          },
          wallets: {
            total: totalWallets,
            mapped: walletsMapped,
            unmapped: totalWallets - walletsMapped,
            mapping_percentage: totalWallets > 0
              ? ((walletsMapped / totalWallets) * 100).toFixed(1)
              : '0.0',
          },
          transactions: {
            total: totalTransactions,
            mapped: transactionsMapped,
            unmapped: totalTransactions - transactionsMapped,
            mapping_percentage: totalTransactions > 0
              ? ((transactionsMapped / totalTransactions) * 100).toFixed(1)
              : '0.0',
          },
        });
      }

      default:
        return errorResponse('Invalid action. Use: status, sync-status, reconciliation, mapping', HttpStatus.BAD_REQUEST);
    }
  } catch (error: any) {
    logger.error('Error fetching Fineract data', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch Fineract data',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/admin/fineract
 * 
 * Body:
 * - action: 'sync' | 'reconcile' | 'retry-failed'
 */
async function postHandler(request: ExpoRequest) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper
    const adminUserId = await getUserIdFromRequest(request);

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'sync': {
        // Trigger manual sync (placeholder - requires Fineract client)
        return successResponse({ action: 'sync', status: 'pending' }, 'Sync triggered. Fineract API client required for actual sync.');
      }

      case 'reconcile': {
        // Trigger reconciliation (placeholder - requires Fineract client)
        return successResponse({ action: 'reconcile', status: 'pending' }, 'Reconciliation triggered. Fineract API client required for actual reconciliation.');
      }

      case 'retry-failed': {
        // Retry failed syncs (placeholder)
        return successResponse({ action: 'retry-failed', status: 'pending' }, 'Retry triggered. Fineract API client required for actual retry.');
      }

      default:
        return errorResponse('Invalid action. Use: sync, reconcile, retry-failed', HttpStatus.BAD_REQUEST);
    }
  } catch (error: any) {
    logger.error('Error executing Fineract action', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to execute Fineract action',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.admin, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);

