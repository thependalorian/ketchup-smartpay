/**
 * Agent Transactions API Route
 * 
 * Location: app/api/agents/[id]/transactions/route.ts
 * Purpose: Get agent transaction history
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { agentNetworkService } from '@/services/agentNetworkService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest, { id: agentId }: { id: string }) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 1000);
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await agentNetworkService.getAgentTransactions(agentId, {
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      limit,
      offset,
    });

    // Format transactions
    const formattedTransactions = result.transactions.map(tx => ({
      id: tx.id,
      agentId: tx.agent_id,
      beneficiaryId: tx.beneficiary_id,
      voucherId: tx.voucher_id || null,
      amount: parseFloat(tx.amount.toString()),
      transactionType: tx.transaction_type,
      status: tx.status,
      createdAt: tx.created_at.toISOString(),
    }));

    return successResponse({
      transactions: formattedTransactions,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    }, 'Agent transactions retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting agent transactions', error, { agentId });
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve agent transactions',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
