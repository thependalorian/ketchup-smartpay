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
interface HealthCheckResult {
    serviceName: string;
    status: 'up' | 'down' | 'degraded';
    responseTimeMs: number | null;
    timestamp: Date;
    errorMessage?: string;
}
interface UptimeReport {
    serviceName: string;
    date: string;
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    availabilityPercentage: number;
    totalDowntimeMinutes: number;
    meetsSLA: boolean;
}
interface CriticalService {
    name: string;
    url: string;
    type: 'http' | 'database' | 'internal';
    checkInterval?: number;
}
export declare class SystemUptimeMonitorService {
    private static readonly UPTIME_SLA;
    private static readonly ALLOWED_DOWNTIME_MINUTES_PER_MONTH;
    private static readonly CRITICAL_SERVICES;
    /**
     * Perform health check on a service
     * PSD-12: Continuous monitoring required
     */
    static performHealthCheck(service: CriticalService): Promise<HealthCheckResult>;
    /**
     * HTTP health check
     */
    private static readonly HTTP_CHECK_TIMEOUT_MS;
    private static httpHealthCheck;
    /**
     * Database health check
     */
    private static databaseHealthCheck;
    /**
     * Internal service check: uses database connectivity as proxy for internal component health.
     */
    private static internalServiceCheck;
    /**
     * Monitor all critical services
     * PSD-12: Continuous monitoring
     */
    static monitorAllServices(): Promise<HealthCheckResult[]>;
    /**
     * Generate daily availability summary
     * PSD-12 Section 13.1: Track against 99.9% SLA
     */
    static generateDailySummary(date: Date): Promise<UptimeReport[]>;
    /**
     * Calculate monthly uptime
     * PSD-12: Monthly compliance check
     */
    static calculateMonthlyUptime(serviceName: string, year: number, month: number): Promise<{
        availabilityPercentage: number;
        totalDowntimeMinutes: number;
        meetsSLA: boolean;
    }>;
    /**
     * Get current uptime status
     */
    static getCurrentUptimeStatus(): Promise<{
        services: Array<{
            name: string;
            status: string;
            availabilityPercentage: number;
            lastCheckTime: string;
        }>;
        overallCompliant: boolean;
    }>;
    /**
     * Start continuous monitoring
     * PSD-12: Real-time monitoring required
     */
    static startContinuousMonitoring(intervalMinutes?: number): NodeJS.Timeout;
}
export {};
//# sourceMappingURL=SystemUptimeMonitorService.d.ts.map