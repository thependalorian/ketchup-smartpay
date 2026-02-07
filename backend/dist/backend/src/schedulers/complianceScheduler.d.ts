/**
 * Compliance Scheduler
 *
 * Purpose: Automated scheduling for PSD compliance tasks
 * Regulations: PSD-1, PSD-3, PSD-12
 * Location: backend/src/schedulers/complianceScheduler.ts
 *
 * Schedules:
 * - Daily: Trust account reconciliation, dormancy checks, capital tracking
 * - Hourly: System uptime monitoring
 * - Monthly: Bank of Namibia reporting
 *
 * This scheduler should be started when the backend server starts
 */
export declare class ComplianceScheduler {
    private static dailyReconciliationInterval;
    private static uptimeMonitoringInterval;
    private static dormancyCheckInterval;
    private static capitalTrackingInterval;
    /**
     * Start all compliance schedulers
     */
    static startAll(): void;
    /**
     * Stop all schedulers (for graceful shutdown)
     */
    static stopAll(): void;
    /**
     * Daily Trust Account Reconciliation
     * PSD-3 Section 11.2.4: Daily reconciliation required
     * Schedule: Every day at 00:00 NAM time
     */
    private static startDailyReconciliation;
    /**
     * Continuous Uptime Monitoring
     * PSD-12 Section 13.1: 99.9% uptime requirement
     * Schedule: Every 5 minutes
     */
    private static startUptimeMonitoring;
    /**
     * Daily Dormancy Checks
     * PSD-3 Section 11.4: 6-month inactivity = dormant
     * Schedule: Every day at 01:00 NAM time
     */
    private static startDormancyChecks;
    /**
     * Daily Capital Tracking
     * PSD-3 Section 11.5: Monitor N$1.5M initial + ongoing capital
     * Schedule: Every day at 02:00 NAM time
     */
    private static startCapitalTracking;
    /**
     * Monthly Bank of Namibia Reporting
     * PSD-3 Section 23.2: Due by 10th of following month
     * Schedule: 1st of each month at 00:00
     */
    private static scheduleMonthlyReporting;
    /**
     * Generate daily compliance summary
     * Useful for morning review
     */
    static generateDailySummary(): Promise<void>;
}
export default ComplianceScheduler;
//# sourceMappingURL=complianceScheduler.d.ts.map