/**
 * Open Banking API: /api/v1/compliance/reports/monthly
 * 
 * Monthly compliance reports (Open Banking format)
 * 
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/compliance/reports/monthly
 * Get monthly compliance report
 */
async function handleGetMonthlyReport(req: ExpoRequest) {
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
    const month = searchParams.get('month'); // YYYY-MM format

    if (!month) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Month parameter required (YYYY-MM)',
        400
      );
    }

    // Fetch monthly report (implementation depends on your report structure)
    const reportResponse = {
      Data: {
        Month: month,
        Report: {
          // Report data structure
          GeneratedDateTime: new Date().toISOString(),
        },
      },
      Links: {
        Self: `/api/v1/compliance/reports/monthly?month=${month}`,
      },
      Meta: {},
    };

    return helpers.success(
      reportResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching monthly compliance report:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the monthly compliance report',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetMonthlyReport,
  {
    rateLimitConfig: RATE_LIMITS.compliance,
    requireAuth: true,
    trackResponseTime: true,
  }
);
