/**
 * API Route: /api/transactions/[id]
 * 
 * - GET: Fetches a single transaction by its ID.
 */
import { ExpoRequest } from 'expo-router/server';

import { queryOne, getUserIdFromRequest, checkUserAuthorization, findUserId } from '@/utils/db';
import { mapTransactionRow } from '@/utils/db-adapters';
import { validateUUID } from '@/utils/validators';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    
    // Validate transaction ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid transaction ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Fetch transaction from Neon DB
    const transaction = await queryOne<any>(
      'SELECT * FROM transactions WHERE id = $1',
      [id]
    );

    if (!transaction) {
      return errorResponse('Transaction not found', HttpStatus.NOT_FOUND);
    }

    // Check authorization
    const isAuthorized = await checkUserAuthorization(userId, 'transaction', id);
    if (!isAuthorized) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }

    // Map transaction using adapter
    const mapped = mapTransactionRow(transaction);

    // Format response
    const formattedTransaction = {
      id: mapped.id,
      walletId: mapped.wallet_id,
      type: mapped.type,
      amount: parseFloat(mapped.amount.toString()),
      currency: mapped.currency,
      description: mapped.description,
      category: mapped.category,
      recipient: mapped.recipient_id ? {
        id: mapped.recipient_id,
        name: mapped.recipient_name,
      } : undefined,
      status: mapped.status,
      date: mapped.date,
      createdAt: mapped.created_at,
    };

    return successResponse(formattedTransaction);
  } catch (error) {
    log.error('Error fetching transaction:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch transaction',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
