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

import { TrustAccountService } from '../services/compliance/TrustAccountService';
import { DormantWalletService } from '../services/compliance/DormantWalletService';
import { CapitalRequirementsService } from '../services/compliance/CapitalRequirementsService';
import { SystemUptimeMonitorService } from '../services/compliance/SystemUptimeMonitorService';
import { BankOfNamibiaReportingService } from '../services/compliance/BankOfNamibiaReportingService';
import { IncidentResponseService } from '../services/compliance/IncidentResponseService';
import { log, logError } from '../utils/logger';
import { sql } from '../database/connection';

export class ComplianceScheduler {
  private static dailyReconciliationInterval: NodeJS.Timeout | null = null;
  private static uptimeMonitoringInterval: NodeJS.Timeout | null = null;
  private static dormancyCheckInterval: NodeJS.Timeout | null = null;
  private static capitalTrackingInterval: NodeJS.Timeout | null = null;

  /**
   * Start all compliance schedulers
   */
  static startAll(): void {
    console.log('🏛️  Starting PSD Compliance Schedulers...\n');

    // Start each scheduler
    this.startDailyReconciliation();
    this.startUptimeMonitoring();
    this.startDormancyChecks();
    this.startCapitalTracking();
    this.scheduleMonthlyReporting();

    console.log('✅ All compliance schedulers started successfully\n');
    console.log('📋 Active Schedules:');
    console.log('   • Trust Account Reconciliation: Daily at 00:00');
    console.log('   • System Uptime Monitoring: Every 5 minutes');
    console.log('   • Dormancy Checks: Daily at 01:00');
    console.log('   • Capital Tracking: Daily at 02:00');
    console.log('   • Monthly BoN Reports: 1st of each month at 00:00\n');
  }

  /**
   * Stop all schedulers (for graceful shutdown)
   */
  static stopAll(): void {
    console.log('🛑 Stopping compliance schedulers...');

    if (this.dailyReconciliationInterval) {
      clearInterval(this.dailyReconciliationInterval);
      this.dailyReconciliationInterval = null;
    }

    if (this.uptimeMonitoringInterval) {
      clearInterval(this.uptimeMonitoringInterval);
      this.uptimeMonitoringInterval = null;
    }

    if (this.dormancyCheckInterval) {
      clearInterval(this.dormancyCheckInterval);
      this.dormancyCheckInterval = null;
    }

    if (this.capitalTrackingInterval) {
      clearInterval(this.capitalTrackingInterval);
      this.capitalTrackingInterval = null;
    }

    console.log('✅ All schedulers stopped');
  }

  /**
   * Daily Trust Account Reconciliation
   * PSD-3 Section 11.2.4: Daily reconciliation required
   * Schedule: Every day at 00:00 NAM time
   */
  private static startDailyReconciliation(): void {
    const runReconciliation = async () => {
      try {
        log('Running daily trust account reconciliation (PSD-3 §11.2.4)');
        const result = await TrustAccountService.performDailyReconciliation('Scheduler');
        
        if (result.status === 'compliant') {
          log('✅ Trust account reconciliation: COMPLIANT', { coverage: result.coveragePercentage });
        } else {
          logError('🚨 Trust account reconciliation: DEFICIENT', new Error(`Deficiency: N$${result.deficiencyAmount}`));
        }
      } catch (error: any) {
        logError('Failed to run daily reconciliation', error);
      }
    };

    // Calculate time until next 00:00
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Run immediately for first time
    runReconciliation();

    // Then schedule for midnight daily
    setTimeout(() => {
      runReconciliation();
      this.dailyReconciliationInterval = setInterval(runReconciliation, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    console.log('✅ Daily reconciliation scheduled (00:00 daily)');
  }

  /**
   * Continuous Uptime Monitoring
   * PSD-12 Section 13.1: 99.9% uptime requirement
   * Schedule: Every 5 minutes
   */
  private static startUptimeMonitoring(): void {
    const runMonitoring = async () => {
      try {
        const results = await SystemUptimeMonitorService.monitorAllServices();
        const downServices = results.filter(r => r.status === 'down');
        
        if (downServices.length > 0) {
          logError('System services down', new Error(`${downServices.map(s => s.serviceName).join(', ')}`));
        }
      } catch (error: any) {
        logError('Uptime monitoring failed', error);
      }
    };

    // Run immediately
    runMonitoring();

    // Then every 5 minutes
    this.uptimeMonitoringInterval = setInterval(runMonitoring, 5 * 60 * 1000);

    console.log('✅ Uptime monitoring scheduled (every 5 minutes)');
  }

  /**
   * Daily Dormancy Checks
   * PSD-3 Section 11.4: 6-month inactivity = dormant
   * Schedule: Every day at 01:00 NAM time
   */
  private static startDormancyChecks(): void {
    const runDormancyCheck = async () => {
      try {
        log('Running daily dormancy check (PSD-3 §11.4)');
        const result = await DormantWalletService.runDailyDormancyCheck();
        
        log('✅ Dormancy check complete', {
          approaching: result.approachingDormancy,
          dormant: result.nowDormant,
          notifications: result.notificationsToSend,
        });
      } catch (error: any) {
        logError('Failed to run dormancy check', error);
      }
    };

    // Calculate time until 01:00
    const now = new Date();
    const next1AM = new Date(now);
    next1AM.setHours(1, 0, 0, 0);
    if (next1AM <= now) {
      next1AM.setDate(next1AM.getDate() + 1);
    }
    const msUntil1AM = next1AM.getTime() - now.getTime();

    // Schedule for 01:00 daily
    setTimeout(() => {
      runDormancyCheck();
      this.dormancyCheckInterval = setInterval(runDormancyCheck, 24 * 60 * 60 * 1000);
    }, msUntil1AM);

    console.log('✅ Dormancy checks scheduled (01:00 daily)');
  }

  /**
   * Daily Capital Tracking
   * PSD-3 Section 11.5: Monitor N$1.5M initial + ongoing capital
   * Schedule: Every day at 02:00 NAM time
   */
  private static startCapitalTracking(): void {
    const runCapitalTracking = async () => {
      try {
        log('Running daily capital tracking (PSD-3 §11.5)');

        // Liquid assets from database: agent_float + agents.liquidity_balance; other buckets from env or 0
        let cashFromDb = 0;
        try {
          const floatRows = await sql`SELECT COALESCE(SUM(current_float), 0)::numeric AS total_float FROM agent_float`;
          const agentsRows = await sql`SELECT COALESCE(SUM(liquidity_balance), 0)::numeric AS total_liquidity FROM agents`;
          const totalFloat = floatRows[0] ? Number((floatRows[0] as { total_float: string }).total_float) : 0;
          const totalLiquidity = agentsRows[0] ? Number((agentsRows[0] as { total_liquidity: string }).total_liquidity) : 0;
          cashFromDb = totalFloat + totalLiquidity;
        } catch (e) {
          logError('Capital tracking: failed to read liquid assets from DB', e as Error);
        }
        const govBonds = Number(process.env.CAPITAL_GOVERNMENT_BONDS ?? 0);
        const shortTerm = Number(process.env.CAPITAL_SHORT_TERM_INSTRUMENTS ?? 0);
        const otherApproved = Number(process.env.CAPITAL_OTHER_APPROVED ?? 0);

        const liquidAssets = {
          cash: cashFromDb,
          governmentBonds: govBonds,
          shortTermInstruments: shortTerm,
          otherApprovedAssets: otherApproved,
        };
        const initialCapitalHeld = Number(process.env.CAPITAL_INITIAL_HELD ?? 1_500_000);

        const report = await CapitalRequirementsService.trackDailyCapital(
          liquidAssets,
          initialCapitalHeld
        );

        if (report.complianceStatus === 'compliant') {
          log('✅ Capital requirements: COMPLIANT', {
            ongoingRequired: report.ongoingCapitalRequired,
            ongoingHeld: report.ongoingCapitalHeld,
          });
        } else {
          logError('🚨 Capital requirements: DEFICIENT', new Error(`Deficiency: N$${report.deficiencyAmount}`));
        }
      } catch (error: any) {
        logError('Failed to run capital tracking', error);
      }
    };

    // Calculate time until 02:00
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);
    if (next2AM <= now) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    const msUntil2AM = next2AM.getTime() - now.getTime();

    // Schedule for 02:00 daily
    setTimeout(() => {
      runCapitalTracking();
      this.capitalTrackingInterval = setInterval(runCapitalTracking, 24 * 60 * 60 * 1000);
    }, msUntil2AM);

    console.log('✅ Capital tracking scheduled (02:00 daily)');
  }

  /**
   * Monthly Bank of Namibia Reporting
   * PSD-3 Section 23.2: Due by 10th of following month
   * Schedule: 1st of each month at 00:00
   */
  private static scheduleMonthlyReporting(): void {
    const runMonthlyReporting = async () => {
      try {
        log('Generating monthly BoN report (PSD-3 §23)');
        
        // Generate report for previous month
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const report = await BankOfNamibiaReportingService.generateMonthlyReport(lastMonth);
        
        log('✅ Monthly BoN report generated', {
          month: report.reportMonth,
          dueDate: report.dueDate,
          users: report.data.totalRegisteredUsers,
          liabilities: report.data.outstandingEmoneyLiabilities,
        });

        console.log(`📧 REMINDER: Submit report to assessments.npsd@bon.com.na by ${report.dueDate}`);
      } catch (error: any) {
        logError('Failed to generate monthly BoN report', error);
      }
    };

    // Calculate time until 1st of next month
    const now = new Date();
    const nextFirst = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    const msUntilFirst = nextFirst.getTime() - now.getTime();

    // Schedule for 1st of each month
    setTimeout(() => {
      runMonthlyReporting();
      setInterval(runMonthlyReporting, 30 * 24 * 60 * 60 * 1000); // ~30 days
    }, msUntilFirst);

    console.log('✅ Monthly BoN reporting scheduled (1st of each month)');
  }

  /**
   * Generate daily compliance summary
   * Useful for morning review
   */
  static async generateDailySummary(): Promise<void> {
    try {
      console.log('\n📊 DAILY COMPLIANCE SUMMARY - ' + new Date().toLocaleDateString());
      console.log('═'.repeat(60));

      // Trust Account
      const trustStatus = await TrustAccountService.checkComplianceStatus();
      console.log(`\n🏦 Trust Account (PSD-3 §11.2):`);
      console.log(`   Status: ${trustStatus.isCompliant ? '✅ COMPLIANT' : '❌ DEFICIENT'}`);
      console.log(`   Coverage: ${trustStatus.coveragePercentage.toFixed(2)}%`);
      if (trustStatus.deficiencyAmount) {
        console.log(`   ⚠️  Deficiency: N$${trustStatus.deficiencyAmount.toLocaleString()}`);
      }

      // Capital
      const capitalStatus = await CapitalRequirementsService.getCapitalComplianceStatus();
      console.log(`\n💰 Capital Requirements (PSD-3 §11.5):`);
      console.log(`   Status: ${capitalStatus.isCompliant ? '✅ COMPLIANT' : '❌ DEFICIENT'}`);
      console.log(`   Initial Capital: ${capitalStatus.initialCapitalCompliant ? '✅' : '❌'}`);
      console.log(`   Ongoing Capital: ${capitalStatus.ongoingCapitalCompliant ? '✅' : '❌'}`);

      // System Uptime
      const uptimeStatus = await SystemUptimeMonitorService.getCurrentUptimeStatus();
      console.log(`\n📡 System Uptime (PSD-12 §13.1):`);
      console.log(`   Target: 99.9%`);
      uptimeStatus.services.forEach(svc => {
        const icon = svc.availabilityPercentage >= 99.9 ? '✅' : '⚠️';
        console.log(`   ${icon} ${svc.name}: ${svc.availabilityPercentage.toFixed(4)}%`);
      });

      // Incidents
      const openIncidents = await IncidentResponseService.getOpenIncidents();
      const pendingBoNReports = await IncidentResponseService.getIncidentsPendingBoNReport();
      console.log(`\n🚨 Incidents (PSD-12 §11.13):`);
      console.log(`   Open: ${openIncidents.length}`);
      console.log(`   Critical: ${openIncidents.filter(i => i.severity === 'critical').length}`);
      console.log(`   Pending BoN Report: ${pendingBoNReports.length}`);

      // Dormant Wallets
      const dormancyStats = await DormantWalletService.getDormancyStatistics();
      console.log(`\n💤 Dormant Wallets (PSD-3 §11.4):`);
      console.log(`   Total Dormant: ${dormancyStats.totalDormantWallets}`);
      console.log(`   Approaching: ${dormancyStats.approachingDormancy}`);
      console.log(`   Total Balance: N$${dormancyStats.totalDormantBalance.toLocaleString()}`);

      // BoN Reporting
      const pendingReports = await BankOfNamibiaReportingService.getPendingReports();
      const overdueReports = pendingReports.filter(r => new Date(r.dueDate) < new Date());
      console.log(`\n📝 BoN Reporting (PSD-3 §23):`);
      console.log(`   Pending: ${pendingReports.length}`);
      console.log(`   Overdue: ${overdueReports.length}`);
      if (overdueReports.length > 0) {
        console.log(`   ⚠️  URGENT: ${overdueReports.length} overdue report(s)!`);
      }

      console.log('\n' + '═'.repeat(60) + '\n');
    } catch (error: any) {
      logError('Failed to generate daily summary', error);
    }
  }
}

// Export for use in main server
export default ComplianceScheduler;
