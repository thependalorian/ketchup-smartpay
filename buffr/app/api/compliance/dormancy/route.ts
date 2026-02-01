/**
 * Dormant Wallet Management API
 * 
 * Location: app/api/compliance/dormancy/route.ts
 * Purpose: API endpoints for PSD-3 §11.4 dormant wallet compliance
 * 
 * Endpoints:
 * - GET: Get dormancy status/check results
 * - POST: Run dormancy processing or generate reports
 * 
 * === BANK OF NAMIBIA PSD-3 REQUIREMENTS ===
 * 
 * §11.4.1: Wallet dormant after 6 months no transactions
 * §11.4.2: Customer notified 1 month before 6-month period
 * §11.4.3: No fees charged on dormant wallets
 * §11.4.4: Dormant funds not intermediated or treated as income
 * §11.4.5: Funds handling: return to customer, estate, sender, or hold for 3 years
 * §11.4.6: Monthly reporting of dormant/terminated wallets
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';

import { log } from '@/utils/logger';
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

/**
 * GET /api/compliance/dormancy
 * 
 * Query parameters:
 * - action: 'check' | 'report' | 'reports-year'
 * - month: YYYY-MM for specific month report
 * - year: YYYY for yearly reports
 * 
 * Response:
 * - check: Current dormancy check results
 * - report: Specific month's report
 * - reports-year: All reports for a year
 */
async function handleGetDormancy(request: ExpoRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'check';

    switch (action) {
      case 'check': {
        // Run dormancy check and return results
        const checkResult = await runDormancyCheck();

        return successResponse({
          ...checkResult,
          thresholds: {
            warningDays: DORMANCY_WARNING_DAYS,
            dormancyDays: DORMANCY_THRESHOLD_DAYS,
            holdDays: DORMANCY_HOLD_DAYS,
          },
          timestamp: new Date().toISOString(),
        });
      }

      case 'wallets-warning': {
        // Get wallets needing warning
        const wallets = await getWalletsNeedingWarning();
        
        return successResponse({
          wallets,
          count: wallets.length,
        });
      }

      case 'wallets-dormant': {
        // Get wallets becoming dormant
        const wallets = await getWalletsBecomingDormant();
        
        return successResponse({
          wallets,
          count: wallets.length,
        });
      }

      case 'wallets-release': {
        // Get wallets eligible for funds release
        const wallets = await getWalletsForFundsRelease();
        
        return successResponse({
          wallets,
          count: wallets.length,
        });
      }

      case 'report': {
        // Get specific month report
        const monthParam = searchParams.get('month');
        if (!monthParam) {
          return errorResponse('Month parameter required (YYYY-MM)', HttpStatus.BAD_REQUEST);
        }

        const [year, month] = monthParam.split('-').map(Number);
        const reportMonth = new Date(year, month - 1, 1);
        const report = await getDormancyReport(reportMonth);

        if (!report) {
          return errorResponse('Report not found for specified month', HttpStatus.NOT_FOUND);
        }

        return successResponse(report);
      }

      case 'reports-year': {
        // Get all reports for a year
        const yearParam = searchParams.get('year');
        if (!yearParam) {
          return errorResponse('Year parameter required (YYYY)', HttpStatus.BAD_REQUEST);
        }

        const year = parseInt(yearParam, 10);
        const reports = await getDormancyReportsForYear(year);

        return successResponse({
          year,
          reports,
          count: reports.length,
        });
      }

      default:
        return errorResponse('Invalid action. Use: check, wallets-warning, wallets-dormant, wallets-release, report, reports-year', HttpStatus.BAD_REQUEST);
    }
  } catch (error) {
    log.error('Dormancy API GET error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/compliance/dormancy
 * 
 * Body:
 * - action: 'process' | 'generate-report'
 * - month: YYYY-MM for report generation (optional, defaults to previous month)
 * 
 * Response:
 * - process: Results of dormancy processing (warnings sent, wallets marked dormant)
 * - generate-report: Generated report data
 * 
 * Note: In production, these should be called by scheduled jobs (cron)
 * and protected with admin authentication
 */
async function handlePostDormancy(request: ExpoRequest) {
  try {
    const body = await request.json();
    const { action, month } = body;

    // Admin authentication is handled by secureAdminRoute wrapper

    switch (action) {
      case 'process': {
        // Run daily dormancy processing
        const result = await runDailyDormancyProcessing();

        return successResponse({
          ...result,
          processedAt: new Date().toISOString(),
        });
      }

      case 'generate-report': {
        // Generate monthly report
        let reportMonth: Date | undefined;
        
        if (month) {
          const [year, monthNum] = month.split('-').map(Number);
          reportMonth = new Date(year, monthNum - 1, 1);
        }

        const report = await generateMonthlyReport(reportMonth);

        if (!report) {
          return errorResponse('Failed to generate report', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return successResponse(report);
      }

      default:
        return errorResponse('Invalid action. Use: process, generate-report', HttpStatus.BAD_REQUEST);
    }
  } catch (error) {
    log.error('Dormancy API POST error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.compliance, handleGetDormancy);
export const POST = secureAdminRoute(RATE_LIMITS.compliance, handlePostDormancy);
