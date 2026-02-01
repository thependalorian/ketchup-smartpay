/**
 * Open Banking API: /api/v1/bills/scheduled
 * 
 * Get scheduled bills (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetScheduledBills(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const scheduledBills = await query<any>(
      `SELECT 
        sb.id, sb.bill_id, sb.wallet_id, sb.schedule_type, sb.amount,
        sb.is_active, sb.next_payment_date, sb.last_payment_date, sb.payment_count,
        b.name as bill_name, b.provider, b.category, b.amount as bill_amount
      FROM scheduled_bills sb
      INNER JOIN bills b ON sb.bill_id = b.id
      WHERE sb.user_id = $1
      ORDER BY sb.next_payment_date ASC`,
      [actualUserId]
    );

    const formattedBills = scheduledBills.map((sb: any) => ({
      ScheduledBillId: sb.id,
      BillId: sb.bill_id,
      BillName: sb.bill_name,
      Provider: sb.provider,
      Category: sb.category,
      Amount: parseFloat(sb.amount.toString()),
      BillAmount: parseFloat(sb.bill_amount.toString()),
      ScheduleType: sb.schedule_type,
      IsActive: sb.is_active || false,
      NextPaymentDate: sb.next_payment_date?.toISOString().split('T')[0] || null,
      LastPaymentDate: sb.last_payment_date?.toISOString().split('T')[0] || null,
      PaymentCount: sb.payment_count || 0,
      WalletId: sb.wallet_id || null,
    }));

    const response = {
      Data: {
        ScheduledBills: formattedBills,
        Total: formattedBills.length,
      },
      Links: {
        Self: '/api/v1/bills/scheduled',
      },
      Meta: {},
    };

    return helpers.success(
      response,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching scheduled bills:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching scheduled bills',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetScheduledBills,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);
