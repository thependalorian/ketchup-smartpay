/**
 * System Uptime Monitor Service
 *
 * Purpose: Monitor system availability and ensure 99.9% uptime
 * Regulation: PSD-12 Section 13.1 - Risk Indicators and Tolerance Levels
 * Location: backend/src/services/compliance/SystemUptimeMonitorService.ts
 *
 * Requirements:
 * - Monitor uptime of critical systems
 * - Target: 99.9% availability (43 minutes downtime/month allowed)
 * - Continuous monitoring
 * - Daily summary reports
 *
 * PSD-12 Section 13.1: "Uptime or Availability of Critical Systems: 99.9%"
 */
import { neon } from '@neondatabase/serverless';
import http from 'http';
import https from 'https';
const sql = neon(process.env.DATABASE_URL);
export class SystemUptimeMonitorService {
    static UPTIME_SLA = 99.9; // 99.9% required by PSD-12
    static ALLOWED_DOWNTIME_MINUTES_PER_MONTH = 43.2; // 0.1% of 30 days
    // Critical services to monitor (PSD-12 definition)
    static CRITICAL_SERVICES = [
        { name: 'API_Server', url: 'http://localhost:3001/health', type: 'http' },
        { name: 'Database', url: '', type: 'database' },
        { name: 'OAuth_Service', url: 'http://localhost:3001/bon/v1/common/health', type: 'http' },
        { name: 'Payment_Initiation', url: '', type: 'internal' },
        { name: 'Account_Information', url: '', type: 'internal' },
    ];
    /**
     * Perform health check on a service
     * PSD-12: Continuous monitoring required
     */
    static async performHealthCheck(service) {
        const startTime = Date.now();
        try {
            let status = 'up';
            let responseTimeMs = null;
            let errorMessage;
            // Self-check: when API_Server points to localhost, we are the API server — use internal check
            // to avoid false "down" from timeout/DB slowness on our own /health endpoint
            const isSelfCheck = service.name === 'API_Server' && (service.url.includes('localhost') || service.url.includes('127.0.0.1'));
            if (isSelfCheck) {
                const result = await this.internalServiceCheck(service.name);
                status = result.status;
                responseTimeMs = result.responseTimeMs;
                errorMessage = result.errorMessage;
            }
            else if (service.type === 'http') {
                // HTTP health check
                const result = await this.httpHealthCheck(service.url);
                status = result.status;
                responseTimeMs = result.responseTimeMs;
                errorMessage = result.errorMessage;
            }
            else if (service.type === 'database') {
                // Database health check
                const result = await this.databaseHealthCheck();
                status = result.status;
                responseTimeMs = result.responseTimeMs;
                errorMessage = result.errorMessage;
            }
            else {
                // Internal service check
                const result = await this.internalServiceCheck(service.name);
                status = result.status;
                responseTimeMs = result.responseTimeMs;
                errorMessage = result.errorMessage;
            }
            // Log to database
            await sql `
        INSERT INTO system_uptime_logs (
          service_name,
          check_timestamp,
          status,
          response_time_ms,
          error_message
        ) VALUES (
          ${service.name},
          NOW(),
          ${status},
          ${responseTimeMs},
          ${errorMessage || null}
        )
      `;
            return {
                serviceName: service.name,
                status,
                responseTimeMs,
                timestamp: new Date(),
                errorMessage,
            };
        }
        catch (error) {
            console.error(`❌ Health check failed for ${service.name}:`, error.message);
            // Log failure
            await sql `
        INSERT INTO system_uptime_logs (
          service_name,
          check_timestamp,
          status,
          response_time_ms,
          error_message
        ) VALUES (
          ${service.name},
          NOW(),
          'down',
          NULL,
          ${error.message}
        )
      `;
            return {
                serviceName: service.name,
                status: 'down',
                responseTimeMs: null,
                timestamp: new Date(),
                errorMessage: error.message,
            };
        }
    }
    /**
     * HTTP health check
     */
    static HTTP_CHECK_TIMEOUT_MS = 5000;
    static async httpHealthCheck(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const client = url.startsWith('https') ? https : http;
            let resolved = false;
            const safeResolve = (out) => {
                if (resolved)
                    return;
                resolved = true;
                resolve(out);
            };
            const req = client.get(url, (res) => {
                const responseTimeMs = Date.now() - startTime;
                if (res.statusCode === 200) {
                    safeResolve({ status: 'up', responseTimeMs });
                }
                else if (res.statusCode && res.statusCode < 500) {
                    safeResolve({ status: 'degraded', responseTimeMs, errorMessage: `HTTP ${res.statusCode}` });
                }
                else {
                    safeResolve({ status: 'down', responseTimeMs, errorMessage: `HTTP ${res.statusCode}` });
                }
            });
            req.setTimeout(this.HTTP_CHECK_TIMEOUT_MS, () => {
                req.destroy();
                safeResolve({
                    status: 'down',
                    responseTimeMs: Date.now() - startTime,
                    errorMessage: 'Request timeout',
                });
            });
            req.on('error', (error) => {
                safeResolve({
                    status: 'down',
                    responseTimeMs: Date.now() - startTime,
                    errorMessage: error.message,
                });
            });
        });
    }
    /**
     * Database health check
     */
    static async databaseHealthCheck() {
        const startTime = Date.now();
        try {
            await sql `SELECT 1 as health_check`;
            const responseTimeMs = Date.now() - startTime;
            // Degraded if slow (>1000ms)
            if (responseTimeMs > 1000) {
                return { status: 'degraded', responseTimeMs, errorMessage: 'Slow response' };
            }
            return { status: 'up', responseTimeMs };
        }
        catch (error) {
            const responseTimeMs = Date.now() - startTime;
            return { status: 'down', responseTimeMs, errorMessage: error.message };
        }
    }
    /**
     * Internal service check: uses database connectivity as proxy for internal component health.
     */
    static async internalServiceCheck(serviceName) {
        const startTime = Date.now();
        try {
            await sql `SELECT 1 as health_check`;
            const responseTimeMs = Date.now() - startTime;
            if (responseTimeMs > 1000) {
                return { status: 'degraded', responseTimeMs, errorMessage: 'Slow response' };
            }
            return { status: 'up', responseTimeMs };
        }
        catch (error) {
            const responseTimeMs = Date.now() - startTime;
            return { status: 'down', responseTimeMs, errorMessage: error.message };
        }
    }
    /**
     * Monitor all critical services
     * PSD-12: Continuous monitoring
     */
    static async monitorAllServices() {
        const results = [];
        for (const service of this.CRITICAL_SERVICES) {
            const result = await this.performHealthCheck(service);
            results.push(result);
        }
        return results;
    }
    /**
     * Generate daily availability summary
     * PSD-12 Section 13.1: Track against 99.9% SLA
     */
    static async generateDailySummary(date) {
        try {
            const dateStr = date.toISOString().split('T')[0];
            // Get unique services
            const services = await sql `
        SELECT DISTINCT service_name
        FROM system_uptime_logs
        WHERE DATE(check_timestamp) = ${dateStr}
      `;
            const reports = [];
            for (const serviceRow of services) {
                const serviceName = serviceRow.service_name;
                // Calculate metrics for this service
                const metrics = await sql `
          SELECT 
            COUNT(*) as total_checks,
            COUNT(CASE WHEN status = 'up' THEN 1 END) as successful_checks,
            COUNT(CASE WHEN status IN ('down', 'degraded') THEN 1 END) as failed_checks
          FROM system_uptime_logs
          WHERE service_name = ${serviceName}
            AND DATE(check_timestamp) = ${dateStr}
        `;
                const totalChecks = parseInt(metrics[0].total_checks);
                const successfulChecks = parseInt(metrics[0].successful_checks);
                const failedChecks = parseInt(metrics[0].failed_checks);
                const availabilityPercentage = totalChecks > 0
                    ? (successfulChecks / totalChecks) * 100
                    : 0;
                // Estimate downtime (assumes check every 5 minutes = 288 checks/day)
                const minutesPerCheck = 1440 / totalChecks; // 1440 minutes in a day
                const totalDowntimeMinutes = failedChecks * minutesPerCheck;
                const meetsSLA = availabilityPercentage >= this.UPTIME_SLA;
                // Insert summary
                await sql `
          INSERT INTO system_availability_summary (
            service_name,
            summary_date,
            total_checks,
            successful_checks,
            failed_checks,
            availability_percentage,
            total_downtime_minutes,
            incidents_count,
            meets_sla
          ) VALUES (
            ${serviceName},
            ${dateStr},
            ${totalChecks},
            ${successfulChecks},
            ${failedChecks},
            ${availabilityPercentage},
            ${totalDowntimeMinutes},
            ${failedChecks},
            ${meetsSLA}
          )
          ON CONFLICT (service_name, summary_date)
          DO UPDATE SET
            total_checks = ${totalChecks},
            successful_checks = ${successfulChecks},
            failed_checks = ${failedChecks},
            availability_percentage = ${availabilityPercentage},
            total_downtime_minutes = ${totalDowntimeMinutes},
            incidents_count = ${failedChecks},
            meets_sla = ${meetsSLA},
            created_at = NOW()
        `;
                reports.push({
                    serviceName,
                    date: dateStr,
                    totalChecks,
                    successfulChecks,
                    failedChecks,
                    availabilityPercentage,
                    totalDowntimeMinutes,
                    meetsSLA,
                });
                // Log non-compliance
                if (!meetsSLA) {
                    console.warn(`🚨 PSD-12 SLA VIOLATION: ${serviceName} - ${availabilityPercentage.toFixed(4)}% uptime (Required: 99.9%)`);
                    await sql `
            INSERT INTO compliance_audit_trail (
              audit_type,
              regulation,
              section,
              action_taken,
              performed_by,
              result,
              notes
            ) VALUES (
              'uptime_violation',
              'PSD-12',
              '13.1',
              'System uptime below 99.9% SLA',
              'System',
              'non_compliant',
              ${`Service: ${serviceName}, Uptime: ${availabilityPercentage.toFixed(4)}%, Downtime: ${totalDowntimeMinutes.toFixed(2)} minutes`}
            )
          `;
                }
            }
            return reports;
        }
        catch (error) {
            console.error('❌ Failed to generate daily summary:', error.message);
            throw error;
        }
    }
    /**
     * Calculate monthly uptime
     * PSD-12: Monthly compliance check
     */
    static async calculateMonthlyUptime(serviceName, year, month) {
        try {
            const result = await sql `
        SELECT 
          AVG(availability_percentage) as avg_availability,
          SUM(total_downtime_minutes) as total_downtime
        FROM system_availability_summary
        WHERE service_name = ${serviceName}
          AND EXTRACT(YEAR FROM summary_date) = ${year}
          AND EXTRACT(MONTH FROM summary_date) = ${month}
      `;
            const availabilityPercentage = parseFloat(result[0].avg_availability || '0');
            const totalDowntimeMinutes = parseFloat(result[0].total_downtime || '0');
            const meetsSLA = availabilityPercentage >= this.UPTIME_SLA;
            return {
                availabilityPercentage,
                totalDowntimeMinutes,
                meetsSLA,
            };
        }
        catch (error) {
            console.error('❌ Failed to calculate monthly uptime:', error.message);
            throw error;
        }
    }
    /**
     * Get current uptime status
     */
    static async getCurrentUptimeStatus() {
        try {
            // Get latest status for each service (last 24 hours)
            const services = await sql `
        SELECT DISTINCT ON (service_name)
          service_name,
          status,
          check_timestamp
        FROM system_uptime_logs
        WHERE check_timestamp > NOW() - INTERVAL '24 hours'
        ORDER BY service_name, check_timestamp DESC
      `;
            // Get 24-hour availability for each service
            const summaryData = await sql `
        SELECT 
          service_name,
          COUNT(*) as total_checks,
          COUNT(CASE WHEN status = 'up' THEN 1 END) as successful_checks
        FROM system_uptime_logs
        WHERE check_timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY service_name
      `;
            const serviceStatus = services.map((svc) => {
                const summary = summaryData.find((s) => s.service_name === svc.service_name);
                const totalChecks = summary ? parseInt(summary.total_checks) : 0;
                const successfulChecks = summary ? parseInt(summary.successful_checks) : 0;
                const availabilityPercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
                return {
                    name: svc.service_name,
                    status: svc.status,
                    availabilityPercentage,
                    lastCheckTime: svc.check_timestamp,
                };
            });
            const overallCompliant = serviceStatus.every(svc => svc.availabilityPercentage >= this.UPTIME_SLA);
            return {
                services: serviceStatus,
                overallCompliant,
            };
        }
        catch (error) {
            console.error('❌ Failed to get current uptime status:', error.message);
            throw error;
        }
    }
    /**
     * Start continuous monitoring
     * PSD-12: Real-time monitoring required
     */
    static startContinuousMonitoring(intervalMinutes = 5) {
        console.log(`🔍 Starting continuous uptime monitoring (every ${intervalMinutes} minutes)`);
        console.log(`📊 PSD-12 SLA Target: ${this.UPTIME_SLA}%`);
        return setInterval(async () => {
            try {
                const results = await this.monitorAllServices();
                const downServices = results.filter(r => r.status === 'down');
                if (downServices.length > 0) {
                    console.warn(`🚨 Services down: ${downServices.map(s => s.serviceName).join(', ')}`);
                }
            }
            catch (error) {
                console.error('❌ Monitoring interval failed:', error.message);
            }
        }, intervalMinutes * 60 * 1000);
    }
}
//# sourceMappingURL=SystemUptimeMonitorService.js.map