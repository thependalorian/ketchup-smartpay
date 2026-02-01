/**
 * Automated Incident Reporting Check Cron Endpoint
 * 
 * Location: app/api/cron/incident-reporting-check.ts
 * Purpose: Check for incidents requiring 24-hour notification (PSD-12 §11.13)
 * 
 * This endpoint should be called hourly to check for incidents that need notification
 * 
 * Authentication: Requires CRON_SECRET environment variable
 */

import { ExpoRequest } from 'expo-router/server';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { checkPendingNotifications, checkOverdueNotifications, alertOverdueNotifications } from '@/services/incidentReportingAutomation';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      log.error('[Cron] CRON_SECRET not configured');
      return errorResponse('Cron authentication not configured', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Check for pending and overdue notifications
    const pending = await checkPendingNotifications();
    const overdue = await checkOverdueNotifications();

    // Alert on overdue notifications
    if (overdue.length > 0) {
      await alertOverdueNotifications();
    }

    return successResponse({
      pendingNotifications: pending.length,
      overdueNotifications: overdue.length,
      pending: pending.map(p => ({
        incidentNumber: p.incidentNumber,
        hoursRemaining: p.hoursRemaining,
        severity: p.severity,
      })),
      overdue: overdue.map(o => ({
        incidentNumber: o.incidentNumber,
        hoursOverdue: o.hoursOverdue,
        severity: o.severity,
      })),
      checkedAt: new Date().toISOString(),
    }, 'Incident reporting check completed');
  } catch (error) {
    log.error('[Cron] Error checking incident reporting:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to check incident reporting',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = getHandler;
