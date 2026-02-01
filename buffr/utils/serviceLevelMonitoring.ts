/**
 * Service Level Monitoring
 * 
 * Location: utils/serviceLevelMonitoring.ts
 * Purpose: Monitor and report service level metrics for Namibian Open Banking compliance
 * 
 * Standards:
 * - 99.9% availability target
 * - 300ms median response time target
 * - Error rate tracking
 * - Request count limits (4 automated requests per day per Account Holder)
 */

import { query } from './db';
import { ServiceLevelMetrics, checkServiceLevelTargets, NAMIBIAN_OPEN_BANKING } from './namibianOpenBanking';
import { log } from './logger';

/**
 * Get service level metrics for a time period
 */
export async function getServiceLevelMetrics(
  endpoint: string,
  participantId?: string,
  periodStart?: Date,
  periodEnd?: Date
): Promise<ServiceLevelMetrics> {
  const start = periodStart || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
  const end = periodEnd || new Date();
  
  let queryText = `
    SELECT 
      SUM(request_count) as total_requests,
      SUM(success_count) as successful_requests,
      SUM(error_count) as failed_requests,
      SUM(total_response_time_ms) as total_response_time,
      MIN(min_response_time_ms) as min_response_time,
      MAX(max_response_time_ms) as max_response_time
    FROM service_level_metrics
    WHERE endpoint = $1
      AND period_start >= $2
      AND period_end <= $3
  `;
  
  const params: any[] = [endpoint, start, end];
  
  if (participantId) {
    queryText += ` AND participant_id = $4`;
    params.push(participantId);
  }
  
  const results = await query<{
    total_requests: string;
    successful_requests: string;
    failed_requests: string;
    total_response_time: string;
    min_response_time: number | null;
    max_response_time: number | null;
  }>(queryText, params);
  
  const result = results[0] || {
    total_requests: '0',
    successful_requests: '0',
    failed_requests: '0',
    total_response_time: '0',
    min_response_time: null,
    max_response_time: null,
  };
  
  const totalRequests = parseInt(result.total_requests || '0', 10);
  const successfulRequests = parseInt(result.successful_requests || '0', 10);
  const failedRequests = parseInt(result.failed_requests || '0', 10);
  const totalResponseTime = parseInt(result.total_response_time || '0', 10);
  
  const availability = totalRequests > 0 ? successfulRequests / totalRequests : 1.0;
  const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
  const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0.0;
  
  // Calculate median response time (simplified - would need full data for accurate median)
  const medianResponseTime = averageResponseTime; // Approximation
  
  return {
    availability,
    medianResponseTime,
    errorRate,
    totalRequests,
    successfulRequests,
    failedRequests,
    averageResponseTime,
  };
}

/**
 * Check automated request limits per Account Holder
 * Maximum 4 automated requests per day per Account Holder
 */
export async function checkAutomatedRequestLimit(
  accountHolderId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Count requests today for this account holder on this endpoint
  const results = await query<{ count: string }>(
    `SELECT COUNT(*) as count
     FROM automated_request_tracking
     WHERE account_holder_id = $1
       AND endpoint = $2
       AND request_date = $3`,
    [accountHolderId, endpoint, today]
  );
  
  const requestCount = parseInt(results[0]?.count || '0', 10);
  const remaining = Math.max(0, NAMIBIAN_OPEN_BANKING.MAX_AUTOMATED_REQUESTS_PER_DAY - requestCount);
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt: tomorrow,
  };
}

/**
 * Record automated request
 */
export async function recordAutomatedRequest(
  accountHolderId: string,
  endpoint: string
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await query(
    `INSERT INTO automated_request_tracking 
     (account_holder_id, endpoint, request_date, request_count, updated_at)
     VALUES ($1, $2, $3, 1, NOW())
     ON CONFLICT (account_holder_id, endpoint, request_date)
     DO UPDATE SET 
       request_count = automated_request_tracking.request_count + 1,
       updated_at = NOW()`,
    [accountHolderId, endpoint, today]
  );
}

/**
 * Generate service level report
 */
export async function generateServiceLevelReport(
  periodStart: Date,
  periodEnd: Date
): Promise<{
  overall: ServiceLevelMetrics;
  byEndpoint: Record<string, ServiceLevelMetrics>;
  targets: {
    availability: { target: number; met: boolean };
    responseTime: { target: number; met: boolean };
  };
}> {
  // Get all endpoints
  const endpoints = await query<{ endpoint: string }>(
    `SELECT DISTINCT endpoint FROM service_level_metrics
     WHERE period_start >= $1 AND period_end <= $2`,
    [periodStart, periodEnd]
  );
  
  const byEndpoint: Record<string, ServiceLevelMetrics> = {};
  let totalRequests = 0;
  let totalSuccess = 0;
  let totalErrors = 0;
  let totalResponseTime = 0;
  
  for (const { endpoint } of endpoints) {
    const metrics = await getServiceLevelMetrics(endpoint, undefined, periodStart, periodEnd);
    byEndpoint[endpoint] = metrics;
    
    totalRequests += metrics.totalRequests;
    totalSuccess += metrics.successfulRequests;
    totalErrors += metrics.failedRequests;
    totalResponseTime += metrics.totalResponseTime;
  }
  
  const overall: ServiceLevelMetrics = {
    availability: totalRequests > 0 ? totalSuccess / totalRequests : 1.0,
    medianResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
    errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0.0,
    totalRequests,
    successfulRequests: totalSuccess,
    failedRequests: totalErrors,
    averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
  };
  
  const targets = checkServiceLevelTargets(overall);
  
  return {
    overall,
    byEndpoint,
    targets: {
      availability: {
        target: NAMIBIAN_OPEN_BANKING.AVAILABILITY_TARGET,
        met: targets.availabilityMet,
      },
      responseTime: {
        target: NAMIBIAN_OPEN_BANKING.MEDIAN_RESPONSE_TIME_TARGET_MS,
        met: targets.responseTimeMet,
      },
    },
  };
}
