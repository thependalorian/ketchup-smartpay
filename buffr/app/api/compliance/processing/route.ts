/**
 * Real-Time Processing & Settlement API
 * 
 * Location: app/api/compliance/processing/route.ts
 * Purpose: API endpoints for PSD-3 §13.3 real-time processing and settlement
 * 
 * Endpoints:
 * - GET: Get settlement batches, processing metrics, uptime stats
 * - POST: Run settlement, record health checks
 * 
 * === BANK OF NAMIBIA REQUIREMENTS ===
 * 
 * PSD-3 §13.3: Real-time processing and daily settlement
 * PSD-12 §13: 99.9% uptime requirement
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';

import {
  getPendingSettlementTransactions,
  getSettlementBatch,
  getSettlementBatches,
  runDailySettlement,
  recordHealthCheck,
  getRecentHealthChecks,
  getCurrentSystemHealth,
  getUptimeSummary,
  checkUptimeCompliance,
  getLatencyStats,
  TARGET_UPTIME_PERCENTAGE,
  type HealthStatus,
} from '@/utils/realtimeProcessing';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

/**
 * GET /api/compliance/processing
 * 
 * Query parameters:
 * - action: 'pending' | 'batches' | 'batch' | 'health' | 'uptime' | 'latency' | 'compliance'
 * - batch_id: Settlement batch ID (for 'batch')
 * - from_date: Filter from date (for 'batches')
 * - to_date: Filter to date (for 'batches')
 * - days: Number of days for metrics (default 30)
 * - check_type: Health check type filter (for 'health')
 */
async function handleGetProcessing(request: ExpoRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'compliance';

    switch (action) {
      case 'pending': {
        const transactions = await getPendingSettlementTransactions();

        return successResponse({
          transactions,
          count: transactions.length,
          message: `${transactions.length} transactions pending settlement`,
        });
      }

      case 'batches': {
        const fromDate = searchParams.get('from_date') 
          ? new Date(searchParams.get('from_date')!) 
          : undefined;
        const toDate = searchParams.get('to_date') 
          ? new Date(searchParams.get('to_date')!) 
          : undefined;

        const batches = await getSettlementBatches(fromDate, toDate);

        return jsonResponse({
          success: true,
          data: {
            batches,
            count: batches.length,
          },
        });
      }

      case 'batch': {
        const batchId = searchParams.get('batch_id');
        if (!batchId) {
          return jsonResponse(
            { success: false, error: 'batch_id is required' },
            { status: 400 }
          );
        }

        const batch = await getSettlementBatch(batchId);
        if (!batch) {
          return jsonResponse(
            { success: false, error: 'Batch not found' },
            { status: 404 }
          );
        }

        return jsonResponse({
          success: true,
          data: batch,
        });
      }

      case 'health': {
        const checkType = searchParams.get('check_type') || undefined;
        const limit = searchParams.get('limit') 
          ? parseInt(searchParams.get('limit')!) 
          : 100;

        const [currentHealth, recentChecks] = await Promise.all([
          getCurrentSystemHealth(),
          getRecentHealthChecks(checkType, limit),
        ]);

        return jsonResponse({
          success: true,
          data: {
            current: currentHealth,
            recent: recentChecks,
          },
        });
      }

      case 'uptime': {
        const days = searchParams.get('days') 
          ? parseInt(searchParams.get('days')!) 
          : 30;

        const summary = await getUptimeSummary(days);

        return jsonResponse({
          success: true,
          data: {
            summary,
            target_uptime: TARGET_UPTIME_PERCENTAGE,
            days_analyzed: summary.length,
          },
        });
      }

      case 'latency': {
        const days = searchParams.get('days') 
          ? parseInt(searchParams.get('days')!) 
          : 7;

        const stats = await getLatencyStats(days);

        return jsonResponse({
          success: true,
          data: {
            ...stats,
            days_analyzed: days,
          },
        });
      }

      case 'compliance': {
        const days = searchParams.get('days') 
          ? parseInt(searchParams.get('days')!) 
          : 30;

        const [uptimeCompliance, latencyStats, currentHealth] = await Promise.all([
          checkUptimeCompliance(days),
          getLatencyStats(days),
          getCurrentSystemHealth(),
        ]);

        return jsonResponse({
          success: true,
          data: {
            uptime: uptimeCompliance,
            latency: latencyStats,
            health: currentHealth,
            requirements: {
              'PSD-3 §13.3': 'Real-time processing and daily settlement',
              'PSD-12 §13': '99.9% uptime requirement',
            },
            is_compliant: uptimeCompliance.isCompliant && currentHealth.overall !== 'down',
          },
        });
      }

      default:
        return jsonResponse(
          { success: false, error: 'Invalid action. Use: pending, batches, batch, health, uptime, latency, compliance' },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('Processing API GET error:', error);
    return jsonResponse(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/compliance/processing
 * 
 * Body:
 * - action: 'settle' | 'health-check'
 * 
 * For 'settle':
 * - No additional parameters (runs daily settlement)
 * 
 * For 'health-check':
 * - check_type: Type of health check
 * - status: 'healthy' | 'degraded' | 'down'
 * - response_time_ms: Response time in milliseconds
 * - details: Optional object with additional details
 * - error_message: Optional error message
 */
async function handlePostProcessing(request: ExpoRequest) {
  try {
    // Admin auth is handled by secureAdminRoute wrapper

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'settle': {
        const result = await runDailySettlement();

        return jsonResponse({
          success: result.success,
          data: {
            batch: result.batch,
            processed: result.processed,
            failed: result.failed,
            message: result.message,
          },
        }, { status: result.success ? 200 : 500 });
      }

      case 'health-check': {
        if (!data.check_type || !data.status) {
          return jsonResponse(
            { success: false, error: 'check_type and status are required' },
            { status: 400 }
          );
        }

        const validStatuses: HealthStatus[] = ['healthy', 'degraded', 'down'];
        if (!validStatuses.includes(data.status)) {
          return jsonResponse(
            { success: false, error: 'status must be: healthy, degraded, or down' },
            { status: 400 }
          );
        }

        const success = await recordHealthCheck(
          data.check_type,
          data.status,
          data.response_time_ms || 0,
          data.details,
          data.error_message
        );

        if (!success) {
          return jsonResponse(
            { success: false, error: 'Failed to record health check' },
            { status: 500 }
          );
        }

        return jsonResponse({
          success: true,
          data: {
            message: 'Health check recorded',
            check_type: data.check_type,
            status: data.status,
          },
        });
      }

      default:
        return jsonResponse(
          { success: false, error: 'Invalid action. Use: settle, health-check' },
          { status: 400 }
        );
    }
  } catch (error) {
    log.error('Processing API POST error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.compliance, handleGetProcessing);
export const POST = secureAdminRoute(RATE_LIMITS.compliance, handlePostProcessing);
