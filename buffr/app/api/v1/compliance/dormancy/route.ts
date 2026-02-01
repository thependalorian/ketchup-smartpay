/**
 * Open Banking API: /api/v1/compliance/dormancy
 * 
 * Dormant wallet management (Open Banking format)
 * 
 * Compliance: PSD-3 §11.4
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
import {
  runDormancyCheck,
  runDailyDormancyProcessing,
  generateMonthlyReport,
  getDormancyReport,
  getDormancyReportsForYear,
  getWalletsNeedingWarning,
  getWalletsBecomingDormant,
  getWalletsForFundsRelease,
  DORMANCY_WARNING_DAYS,
  DORMANCY_THRESHOLD_DAYS,
  DORMANCY_HOLD_DAYS,
} from '@/utils/dormantWallet';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/compliance/dormancy
 * Get dormancy status/check results
 */
async function handleGetDormancy(req: ExpoRequest) {
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
    const action = searchParams.get('action') || 'check';

    switch (action) {
      case 'check': {
        const checkResult = await runDormancyCheck();

        const dormancyResponse = {
          Data: {
            ...checkResult,
            Thresholds: {
              WarningDays: DORMANCY_WARNING_DAYS,
              DormancyDays: DORMANCY_THRESHOLD_DAYS,
              HoldDays: DORMANCY_HOLD_DAYS,
            },
            Timestamp: new Date().toISOString(),
          },
          Links: {
            Self: '/api/v1/compliance/dormancy?action=check',
          },
          Meta: {},
        };

        return helpers.success(
          dormancyResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'wallets-warning': {
        const wallets = await getWalletsNeedingWarning();

        const walletsResponse = {
          Data: {
            Wallets: wallets,
            Count: wallets.length,
          },
          Links: {
            Self: '/api/v1/compliance/dormancy?action=wallets-warning',
          },
          Meta: {},
        };

        return helpers.success(
          walletsResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'wallets-dormant': {
        const wallets = await getWalletsBecomingDormant();

        const walletsResponse = {
          Data: {
            Wallets: wallets,
            Count: wallets.length,
          },
          Links: {
            Self: '/api/v1/compliance/dormancy?action=wallets-dormant',
          },
          Meta: {},
        };

        return helpers.success(
          walletsResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'wallets-release': {
        const wallets = await getWalletsForFundsRelease();

        const walletsResponse = {
          Data: {
            Wallets: wallets,
            Count: wallets.length,
          },
          Links: {
            Self: '/api/v1/compliance/dormancy?action=wallets-release',
          },
          Meta: {},
        };

        return helpers.success(
          walletsResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'report': {
        const monthParam = searchParams.get('month');
        if (!monthParam) {
          return helpers.error(
            OpenBankingErrorCode.FIELD_MISSING,
            'Month parameter required (YYYY-MM)',
            400
          );
        }

        const [year, month] = monthParam.split('-').map(Number);
        const reportMonth = new Date(year, month - 1, 1);
        const report = await getDormancyReport(reportMonth);

        if (!report) {
          return helpers.error(
            OpenBankingErrorCode.RESOURCE_NOT_FOUND,
            'Report not found for specified month',
            404
          );
        }

        const reportResponse = {
          Data: {
            Report: report,
            Month: monthParam,
          },
          Links: {
            Self: `/api/v1/compliance/dormancy?action=report&month=${monthParam}`,
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
      }

      case 'reports-year': {
        const yearParam = searchParams.get('year');
        if (!yearParam) {
          return helpers.error(
            OpenBankingErrorCode.FIELD_MISSING,
            'Year parameter required (YYYY)',
            400
          );
        }

        const year = parseInt(yearParam, 10);
        const reports = await getDormancyReportsForYear(year);

        const reportsResponse = {
          Data: {
            Year: year,
            Reports: reports,
            Count: reports.length,
          },
          Links: {
            Self: `/api/v1/compliance/dormancy?action=reports-year&year=${yearParam}`,
          },
          Meta: {},
        };

        return helpers.success(
          reportsResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      default:
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          'Invalid action. Use: check, wallets-warning, wallets-dormant, wallets-release, report, reports-year',
          400
        );
    }
  } catch (error) {
    log.error('Dormancy API GET error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the dormancy request',
      500
    );
  }
}

/**
 * POST /api/v1/compliance/dormancy
 * Run dormancy processing or generate reports
 */
async function handlePostDormancy(req: ExpoRequest) {
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

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Action, Month } = Data;

    if (!Action) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Action is required (process or generate-report)',
        400
      );
    }

    switch (Action) {
      case 'process': {
        const result = await runDailyDormancyProcessing();

        const processResponse = {
          Data: {
            ...result,
            ProcessedDateTime: new Date().toISOString(),
          },
          Links: {
            Self: '/api/v1/compliance/dormancy',
          },
          Meta: {},
        };

        return helpers.success(
          processResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'generate-report': {
        let reportMonth: Date | undefined;

        if (Month) {
          const [year, monthNum] = Month.split('-').map(Number);
          reportMonth = new Date(year, monthNum - 1, 1);
        }

        const report = await generateMonthlyReport(reportMonth);

        if (!report) {
          return helpers.error(
            OpenBankingErrorCode.SERVER_ERROR,
            'Failed to generate report',
            500
          );
        }

        const reportResponse = {
          Data: {
            Report: report,
            GeneratedDateTime: new Date().toISOString(),
          },
          Links: {
            Self: '/api/v1/compliance/dormancy',
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
      }

      default:
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          'Invalid action. Use: process, generate-report',
          400
        );
    }
  } catch (error) {
    log.error('Dormancy API POST error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the dormancy request',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetDormancy,
  {
    rateLimitConfig: RATE_LIMITS.compliance,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handlePostDormancy,
  {
    rateLimitConfig: RATE_LIMITS.compliance,
    requireAuth: true,
    trackResponseTime: true,
  }
);
