/**
 * Open Banking API: /api/v1/agents/{agentId}/transactions
 * 
 * Get agent transaction history (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { agentNetworkService } from '@/services/agentNetworkService';
import { log } from '@/utils/logger';

async function handleGetTransactions(
  req: ExpoRequest,
  { params }: { params: { agentId: string } }
) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { agentId } = params;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const { page, pageSize } = parsePaginationParams(req);

    const result = await agentNetworkService.getAgentTransactions(agentId, {
      status: status || undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // Format as Open Banking transactions
    const formattedTransactions = result.transactions.map((tx: any) => ({
      TransactionId: tx.id,
      AgentId: tx.agent_id,
      BeneficiaryId: tx.beneficiary_id,
      VoucherId: tx.voucher_id || null,
      Amount: parseFloat(tx.amount.toString()),
      TransactionType: tx.transaction_type,
      Status: tx.status,
      CreatedDateTime: tx.created_at.toISOString(),
    }));

    return helpers.paginated(
      formattedTransactions,
      'Transactions',
      `/api/v1/agents/${agentId}/transactions`,
      page,
      pageSize,
      result.total,
      req,
      status ? { status } : undefined,
      fromDate,
      toDate,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting agent transactions:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving agent transactions',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetTransactions,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
