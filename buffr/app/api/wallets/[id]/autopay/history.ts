/**
 * API Route: /api/wallets/[id]/autopay/history
 * 
 * - GET: Fetches AutoPay transaction history for a wallet
 */
import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest, checkUserAuthorization } from '@/utils/db';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

interface AutoPayTransactionRow {
  id: string;
  rule_id: string | null;
  wallet_id: string;
  user_id: string;
  amount: number;
  status: string;
  executed_at: Date;
  failure_reason: string | null;
  recipient_id: string | null;
  recipient_name: string | null;
  rule_description: string | null;
  authorisation_code: string | null;
  created_at: Date;
}

async function getHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: walletId } = params;
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Check authorization
    const isAuthorized = await checkUserAuthorization(userId, 'wallet', walletId);
    if (!isAuthorized) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }
    
    // Fetch AutoPay history from Neon DB
    const transactions = await query<AutoPayTransactionRow>(
      `SELECT * FROM autopay_transactions 
       WHERE wallet_id = $1 
       ORDER BY executed_at DESC 
       LIMIT 50`,
      [walletId]
    );

    // Format response
    const formattedHistory = transactions.map(tx => ({
      id: tx.id,
      ruleId: tx.rule_id || '',
      walletId: tx.wallet_id,
      amount: parseFloat(tx.amount.toString()),
      status: tx.status,
      executedAt: tx.executed_at.toISOString(),
      failureReason: tx.failure_reason,
      recipient: tx.recipient_id ? {
        id: tx.recipient_id,
        name: tx.recipient_name || 'Unknown',
      } : undefined,
      ruleDescription: tx.rule_description || 'AutoPay payment',
      authorisationCode: tx.authorisation_code,
    }));

    return successResponse({ transactions: formattedHistory });
  } catch (error) {
    log.error('Error fetching AutoPay history:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch AutoPay history',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
