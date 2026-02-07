/**
 * Compliance API Routes
 *
 * Purpose: API endpoints for regulatory compliance monitoring and management.
 * Regulations: PSD-1, PSD-3, PSD-12; ETA 4 of 2019 (Electronic Transactions Act).
 * Location: backend/src/api/routes/government/compliance.ts
 *
 * Endpoints:
 * - Trust Account Reconciliation (PSD-3)
 * - System Uptime Monitoring (PSD-12)
 * - Incident Management (PSD-12)
 * - Dormant Wallet Management (PSD-3)
 * - Capital Requirements (PSD-3)
 * - Bank of Namibia Reporting (PSD-3 & PSD-1)
 * - Two-Factor Authentication (PSD-12)
 * - ETA: Take-down (s54), Input-error withdrawal (s33)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TrustAccountService } from '../../../services/compliance/TrustAccountService';
import { TwoFactorAuthService } from '../../../services/compliance/TwoFactorAuthService';
import { SystemUptimeMonitorService } from '../../../services/compliance/SystemUptimeMonitorService';
import { IncidentResponseService } from '../../../services/compliance/IncidentResponseService';
import { DormantWalletService } from '../../../services/compliance/DormantWalletService';
import { CapitalRequirementsService } from '../../../services/compliance/CapitalRequirementsService';
import { BankOfNamibiaReportingService } from '../../../services/compliance/BankOfNamibiaReportingService';
import {
  validateTakeDownNotice,
  executeTakeDownFlow,
  processInputErrorWithdrawal,
  type TakeDownNotice,
  type InputErrorWithdrawalRequest,
} from '../../../services/eta/ETAService';
import { authenticateAPIKey } from '../../middleware/auth';
import { logError } from '../../../utils/logger';
import { sql } from '../../../database/connection';

const router: Router = Router();

// ============================================================================
// PSD-3: Trust Account Reconciliation
// ============================================================================

/**
 * POST /api/compliance/trust-account/reconcile
 * Perform daily reconciliation
 */
router.post('/trust-account/reconcile', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { reconciledBy } = req.body;
    
    const result = await TrustAccountService.performDailyReconciliation(reconciledBy || 'API');

    res.json({
      success: true,
      data: result,
      message: result.status === 'compliant' 
        ? 'Trust account reconciliation successful - 100% coverage maintained' 
        : `Trust account deficient - N$${result.deficiencyAmount} shortfall. Must resolve within 1 business day.`,
    });
  } catch (error: any) {
    console.error('Trust account reconciliation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform reconciliation',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/trust-account/status
 * Get current compliance status
 */
router.get('/trust-account/status', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const status = await TrustAccountService.checkComplianceStatus();

    res.json({
      success: true,
      data: status,
      regulation: 'PSD-3 Section 11.2.4',
      requirement: '100% trust account coverage of outstanding e-money liabilities',
    });
  } catch (error: any) {
    console.error('Trust account status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trust account status',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/trust-account/history
 * Get reconciliation history
 */
router.get('/trust-account/history', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = await TrustAccountService.getReconciliationHistory(days);

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('Trust account history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reconciliation history',
      details: error.message,
    });
  }
});

// ============================================================================
// PSD-12: Two-Factor Authentication
// ============================================================================

/**
 * POST /api/compliance/2fa/generate
 * Generate OTP for payment transaction
 */
router.post('/2fa/generate', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { userId, userType, transactionType, transactionId, transactionAmount, method } = req.body;

    if (!userId || !userType || !transactionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, userType, transactionType',
      });
    }

    const result = await TwoFactorAuthService.generateOTP({
      userId,
      userType,
      transactionType,
      transactionId,
      transactionAmount,
      method: method || 'sms_otp',
    });

    res.json({
      success: true,
      data: result,
      regulation: 'PSD-12 Section 12.2',
      requirement: '2FA required for every payment transaction',
    });
  } catch (error: any) {
    console.error('2FA generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OTP',
      details: error.message,
    });
  }
});

/**
 * POST /api/compliance/2fa/validate
 * Validate OTP
 */
router.post('/2fa/validate', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { userId, otpCode, transactionId } = req.body;

    if (!userId || !otpCode || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, otpCode, transactionId',
      });
    }

    const result = await TwoFactorAuthService.validateOTP({
      userId,
      otpCode,
      transactionId,
    });

    res.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    console.error('2FA validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate OTP',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/2fa/verify/:transactionId
 * Verify transaction has 2FA
 */
router.get('/2fa/verify/:transactionId', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const isAuthorized = await TwoFactorAuthService.verifyTransactionAuth(transactionId);

    res.json({
      success: true,
      data: { transactionId, isAuthorized },
      message: isAuthorized 
        ? '2FA verification successful' 
        : 'Transaction not authorized - 2FA required',
    });
  } catch (error: any) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify transaction auth',
      details: error.message,
    });
  }
});

// ============================================================================
// PSD-12: System Uptime Monitoring
// ============================================================================

/**
 * GET /api/compliance/uptime/status
 * Get current uptime status
 */
router.get('/uptime/status', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const status = await SystemUptimeMonitorService.getCurrentUptimeStatus();

    res.json({
      success: true,
      data: status,
      regulation: 'PSD-12 Section 13.1',
      requirement: '99.9% uptime for critical systems',
    });
  } catch (error: any) {
    console.error('Uptime status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get uptime status',
      details: error.message,
    });
  }
});

/**
 * POST /api/compliance/uptime/monitor
 * Perform health check on all services
 */
router.post('/uptime/monitor', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const results = await SystemUptimeMonitorService.monitorAllServices();

    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        up: results.filter(r => r.status === 'up').length,
        down: results.filter(r => r.status === 'down').length,
        degraded: results.filter(r => r.status === 'degraded').length,
      },
    });
  } catch (error: any) {
    console.error('Uptime monitoring error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to monitor services',
      details: error.message,
    });
  }
});

// ============================================================================
// PSD-12: Incident Management
// ============================================================================

/**
 * POST /api/compliance/incidents/detect
 * Detect and log incident
 */
router.post('/incidents/detect', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { incidentType, severity, title, description, affectedSystems, detectedBy } = req.body;

    if (!incidentType || !severity || !title || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const incident = await IncidentResponseService.detectIncident({
      incidentType,
      severity,
      title,
      description,
      affectedSystems,
      detectedBy,
    });

    res.json({
      success: true,
      data: incident,
      warning: 'Preliminary report to Bank of Namibia due within 24 hours',
      regulation: 'PSD-12 Section 11.13',
    });
  } catch (error: any) {
    console.error('Incident detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect incident',
      details: error.message,
    });
  }
});

/**
 * POST /api/compliance/incidents/:incidentId/report-bon
 * Send preliminary report to BoN
 */
router.post('/incidents/:incidentId/report-bon', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const reportData = req.body;

    await IncidentResponseService.sendPreliminaryReportToBoN(incidentId, reportData);

    res.json({
      success: true,
      message: 'Preliminary report sent to Bank of Namibia',
      nextStep: 'Impact assessment due within 30 days',
    });
  } catch (error: any) {
    console.error('BoN report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send preliminary report',
      details: error.message,
    });
  }
});

/**
 * POST /api/compliance/incidents/:incidentId/impact-assessment
 * Submit impact assessment
 */
router.post('/incidents/:incidentId/impact-assessment', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { incidentId } = req.params;
    const assessment = { incidentId, ...req.body };

    await IncidentResponseService.submitImpactAssessment(assessment);

    res.json({
      success: true,
      message: 'Impact assessment submitted to Bank of Namibia',
      regulation: 'PSD-12 Section 11.14-11.15',
    });
  } catch (error: any) {
    console.error('Impact assessment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit impact assessment',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/incidents/open
 * Get open incidents
 */
router.get('/incidents/open', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const incidents = await IncidentResponseService.getOpenIncidents();

    res.json({
      success: true,
      data: incidents,
      count: incidents.length,
    });
  } catch (error: any) {
    console.error('Get incidents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get open incidents',
      details: error.message,
    });
  }
});

// ============================================================================
// PSD-3: Dormant Wallet Management
// ============================================================================

/**
 * POST /api/compliance/dormant-wallets/check
 * Run daily dormancy check
 */
router.post('/dormant-wallets/check', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const result = await DormantWalletService.runDailyDormancyCheck();

    res.json({
      success: true,
      data: result,
      regulation: 'PSD-3 Section 11.4',
      message: `Dormancy check complete: ${result.nowDormant} wallets marked dormant, ${result.notificationsToSend} notifications sent`,
    });
  } catch (error: any) {
    console.error('Dormancy check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run dormancy check',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/dormant-wallets
 * Get dormant wallets
 */
router.get('/dormant-wallets', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const wallets = await DormantWalletService.getDormantWallets(status);

    res.json({
      success: true,
      data: wallets,
      count: wallets.length,
    });
  } catch (error: any) {
    console.error('Get dormant wallets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dormant wallets',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/dormant-wallets/statistics
 * Get dormancy statistics
 */
router.get('/dormant-wallets/statistics', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const stats = await DormantWalletService.getDormancyStatistics();

    res.json({
      success: true,
      data: stats,
      regulation: 'PSD-3 Section 11.4.6',
    });
  } catch (error: any) {
    console.error('Dormancy statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dormancy statistics',
      details: error.message,
    });
  }
});

// ============================================================================
// PSD-3: Capital Requirements
// ============================================================================

/**
 * POST /api/compliance/capital/track
 * Track daily capital requirements
 */
router.post('/capital/track', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { liquidAssets, initialCapitalHeld } = req.body;

    if (!liquidAssets || !initialCapitalHeld) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: liquidAssets, initialCapitalHeld',
      });
    }

    const report = await CapitalRequirementsService.trackDailyCapital(
      liquidAssets,
      initialCapitalHeld
    );

    res.json({
      success: true,
      data: report,
      regulation: 'PSD-3 Section 11.5',
      requirements: {
        initial: 'N$1,500,000',
        ongoing: '6-month average of outstanding e-money liabilities',
      },
    });
  } catch (error: any) {
    console.error('Capital tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track capital',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/capital/status
 * Get capital compliance status
 */
router.get('/capital/status', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const status = await CapitalRequirementsService.getCapitalComplianceStatus();

    res.json({
      success: true,
      data: status,
      regulation: 'PSD-3 Section 11.5',
    });
  } catch (error: any) {
    console.error('Capital status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get capital status',
      details: error.message,
    });
  }
});

// ============================================================================
// PSD-3 & PSD-1: Bank of Namibia Reporting
// ============================================================================

/**
 * POST /api/compliance/bon-reports/generate
 * Generate monthly report
 */
router.post('/bon-reports/generate', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.body;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: year, month',
      });
    }

    const reportMonth = new Date(year, month - 1, 1);
    const report = await BankOfNamibiaReportingService.generateMonthlyReport(reportMonth);

    res.json({
      success: true,
      data: report,
      regulation: 'PSD-3 Section 23.1-23.2',
      requirement: 'Submit by 10th of following month',
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate monthly report',
      details: error.message,
    });
  }
});

/**
 * POST /api/compliance/bon-reports/:reportId/submit
 * Submit report to BoN
 */
router.post('/bon-reports/:reportId/submit', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { submittedBy } = req.body;

    await BankOfNamibiaReportingService.submitReportToBoN(reportId, submittedBy || 'API');

    res.json({
      success: true,
      message: 'Report submitted to Bank of Namibia',
      contact: 'assessments.npsd@bon.com.na',
    });
  } catch (error: any) {
    console.error('Report submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit report',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/bon-reports/pending
 * Get pending reports
 */
router.get('/bon-reports/pending', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const reports = await BankOfNamibiaReportingService.getPendingReports();

    res.json({
      success: true,
      data: reports,
      count: reports.length,
      warning: reports.length > 0 ? 'Reports pending submission to Bank of Namibia' : null,
    });
  } catch (error: any) {
    console.error('Pending reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending reports',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/bon-reports/:reportId/export
 * Export report in BoN format
 */
router.get('/bon-reports/:reportId/export', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const formattedReport = await BankOfNamibiaReportingService.exportReportForBoN(reportId);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="BoN_Report_${reportId}.txt"`);
    res.send(formattedReport);
  } catch (error: any) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export report',
      details: error.message,
    });
  }
});

// ============================================================================
// Compliance Dashboard
// ============================================================================

/**
 * GET /api/compliance/dashboard
 * Get overall compliance dashboard
 */
router.get('/dashboard', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    // Get status from all compliance areas
    const [
      trustAccountStatus,
      capitalStatus,
      uptimeStatus,
      openIncidents,
      pendingReports,
      dormancyStats,
    ] = await Promise.all([
      TrustAccountService.checkComplianceStatus(),
      CapitalRequirementsService.getCapitalComplianceStatus(),
      SystemUptimeMonitorService.getCurrentUptimeStatus(),
      IncidentResponseService.getOpenIncidents(),
      BankOfNamibiaReportingService.getPendingReports(),
      DormantWalletService.getDormancyStatistics(),
    ]);

    // Calculate overall compliance score
    const checks = [
      trustAccountStatus.isCompliant,
      capitalStatus.isCompliant,
      uptimeStatus.overallCompliant,
      openIncidents.filter(i => i.severity === 'critical').length === 0,
      pendingReports.length === 0,
    ];

    const complianceScore = (checks.filter(Boolean).length / checks.length) * 100;

    const dashboard = {
      overallComplianceScore: complianceScore,
      overallStatus: complianceScore === 100 ? 'FULLY COMPLIANT' : 'ACTION REQUIRED',
      
      // PSD-3 Compliance
      trustAccount: {
        compliant: trustAccountStatus.isCompliant,
        coveragePercentage: trustAccountStatus.coveragePercentage,
        deficiency: trustAccountStatus.deficiencyAmount,
        lastCheck: trustAccountStatus.lastReconciliationDate,
        regulation: 'PSD-3 Section 11.2',
      },
      
      capital: {
        compliant: capitalStatus.isCompliant,
        initialCapitalCompliant: capitalStatus.initialCapitalCompliant,
        ongoingCapitalCompliant: capitalStatus.ongoingCapitalCompliant,
        deficiency: capitalStatus.deficiencyAmount,
        lastCheck: capitalStatus.lastCheckDate,
        regulation: 'PSD-3 Section 11.5',
      },
      
      dormantWallets: {
        total: dormancyStats.totalDormantWallets,
        balance: dormancyStats.totalDormantBalance,
        approaching: dormancyStats.approachingDormancy,
        regulation: 'PSD-3 Section 11.4',
      },
      
      // PSD-12 Compliance
      systemUptime: {
        compliant: uptimeStatus.overallCompliant,
        services: uptimeStatus.services,
        regulation: 'PSD-12 Section 13.1',
        requirement: '99.9% availability',
      },
      
      incidents: {
        open: openIncidents.length,
        critical: openIncidents.filter(i => i.severity === 'critical').length,
        awaitingBoNReport: openIncidents.filter(i => !i.preliminaryReportSent).length,
        regulation: 'PSD-12 Section 11.13',
      },
      
      // Reporting
      reporting: {
        pendingReports: pendingReports.length,
        overdueReports: pendingReports.filter(r => new Date(r.dueDate) < new Date()).length,
        regulation: 'PSD-3 Section 23.2',
      },
    };

    res.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get compliance dashboard',
      details: error.message,
    });
  }
});

/**
 * GET /api/compliance/audit-trail
 * Get compliance audit trail
 */
router.get('/audit-trail', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const regulation = req.query.regulation as string;

    let auditRecords;
    
    if (regulation) {
      auditRecords = await sql`
        SELECT * FROM compliance_audit_trail
        WHERE regulation = ${regulation}
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    } else {
      auditRecords = await sql`
        SELECT * FROM compliance_audit_trail
        ORDER BY timestamp DESC
        LIMIT ${limit}
      `;
    }

    res.json({
      success: true,
      data: auditRecords,
      count: auditRecords.length,
    });
  } catch (error: any) {
    console.error('Audit trail error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit trail',
      details: error.message,
    });
  }
});

// ============================================================================
// ETA 4 of 2019 – Electronic Transactions Act (PRD Appendix H)
// ============================================================================

const etaTakeDownSchema = z.object({
  complainantFullName: z.string().min(1),
  complainantAddress: z.string().min(1),
  signature: z.string().min(1),
  rightInfringed: z.string().min(1),
  materialOrActivityId: z.string().min(1),
  remedialAction: z.string().min(1),
  contactDetails: z.string().min(1),
  goodFaithAndAccuracy: z.boolean(),
});

const etaInputErrorSchema = z.object({
  userId: z.string().min(1),
  transactionId: z.string().min(1),
  notifiedAt: z.string().min(1),
  wishToCancel: z.boolean(),
  stepsToReturnOrCorrect: z.string(),
});

/** POST /api/v1/compliance/eta/take-down – ETA s54 take-down notice */
router.post('/eta/take-down', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const parsed = etaTakeDownSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const notice = parsed.data as TakeDownNotice;
    if (!validateTakeDownNotice(notice)) {
      return res.status(400).json({ error: 'Invalid take down notice' });
    }
    const result = await executeTakeDownFlow(
      notice,
      async (materialId: string) => { void materialId; },
      async (materialId: string) => `contact-${materialId}`,
      async (_contactId: string, _materialId: string) => {},
      async (_materialId: string, _reason: string) => {},
      async (_materialId: string, _info: string) => {},
      async () => false
    );
    return res.json(result);
  } catch (error: unknown) {
    logError('ETA take-down failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Take-down flow failed' });
  }
});

/** POST /api/v1/compliance/eta/input-error-withdrawal – ETA s33 input error withdrawal/refund */
router.post('/eta/input-error-withdrawal', authenticateAPIKey, async (req: Request, res: Response) => {
  try {
    const parsed = etaInputErrorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const request = parsed.data as InputErrorWithdrawalRequest;
    const refundPayment = async (txId: string) => { void txId; };
    const cancelContract = async (txId: string) => { void txId; };
    const result = await processInputErrorWithdrawal(request, refundPayment, cancelContract);
    return res.json(result);
  } catch (error: unknown) {
    logError('ETA input-error withdrawal failed', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Input-error withdrawal failed' });
  }
});

export default router;
