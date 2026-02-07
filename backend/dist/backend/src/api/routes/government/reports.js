/**
 * Reports API Routes
 *
 * Location: backend/src/api/routes/reports.ts
 * Purpose: REST API endpoints for government compliance reports
 */
import { Router } from 'express';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { ReportService } from '../../../services/reports/ReportService';
const router = Router();
const reportService = new ReportService();
/**
 * GET /api/v1/reports/monthly
 * Generate monthly compliance report
 */
router.get('/monthly', authenticate, async (req, res) => {
    try {
        const month = req.query.month; // YYYY-MM format
        if (!month) {
            return res.status(400).json({
                success: false,
                error: 'Month is required (YYYY-MM format)',
            });
        }
        const report = await reportService.generateMonthlyReport(month);
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logError('Failed to generate monthly report', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate report',
        });
    }
});
/**
 * GET /api/v1/reports/voucher-distribution
 * Generate voucher distribution summary report
 */
router.get('/voucher-distribution', authenticate, async (req, res) => {
    try {
        const month = req.query.month;
        if (!month) {
            return res.status(400).json({
                success: false,
                error: 'Month is required (YYYY-MM format)',
            });
        }
        const report = await reportService.generateVoucherDistributionReport(month);
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logError('Failed to generate voucher distribution report', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate report',
        });
    }
});
/**
 * GET /api/v1/reports/redemption-analytics
 * Generate redemption analytics report
 */
router.get('/redemption-analytics', authenticate, async (req, res) => {
    try {
        const month = req.query.month;
        if (!month) {
            return res.status(400).json({
                success: false,
                error: 'Month is required (YYYY-MM format)',
            });
        }
        const report = await reportService.generateRedemptionAnalyticsReport(month);
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logError('Failed to generate redemption analytics report', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate report',
        });
    }
});
/**
 * GET /api/v1/reports/agent-network
 * Generate agent network performance report
 */
router.get('/agent-network', authenticate, async (req, res) => {
    try {
        const month = req.query.month;
        if (!month) {
            return res.status(400).json({
                success: false,
                error: 'Month is required (YYYY-MM format)',
            });
        }
        const report = await reportService.generateAgentNetworkReport(month);
        res.json({
            success: true,
            data: report,
        });
    }
    catch (error) {
        logError('Failed to generate agent network report', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate report',
        });
    }
});
export default router;
//# sourceMappingURL=reports.js.map