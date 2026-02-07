/**
 * Main API Router
 *
 * Purpose: Route requests to appropriate portal handlers
 * Location: backend/src/api/routes/index.ts
 */
import { Router } from 'express';
import { ketchupAuth } from '../middleware/ketchupAuth';
import { governmentAuth } from '../middleware/governmentAuth';
import { rateLimit } from '../middleware/rateLimit';
// Import route modules
import ketchupAgents from './ketchup/agents';
import ketchupBeneficiaries from './ketchup/beneficiaries';
import ketchupVouchers from './ketchup/vouchers';
import ketchupDistribution from './ketchup/distribution';
import ketchupReconciliation from './ketchup/reconciliation';
import ketchupWebhooks from './ketchup/webhooks';
import ketchupMap from './ketchup/map';
import ketchupLocations from './ketchup/locations';
import ketchupAdmin from './ketchup/admin';
import governmentCompliance from './government/compliance';
import governmentMonitoring from './government/monitoring';
import governmentAnalytics from './government/analytics';
import governmentAudit from './government/audit';
import governmentReports from './government/reports';
import sharedDashboard from './shared/dashboard';
import sharedStatusEvents from './shared/statusEvents';
import sharedOpenBanking from './shared/openbanking';
const router = Router();
// Health check (no auth required)
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
        }
    });
});
// ============================================================
// KETCHUP ROUTES - Full CRUD Access
// ============================================================
router.use('/v1/ketchup/agents', ketchupAuth, ketchupAgents);
router.use('/v1/ketchup/beneficiaries', ketchupAuth, ketchupBeneficiaries);
router.use('/v1/ketchup/vouchers', ketchupAuth, ketchupVouchers);
router.use('/v1/ketchup/distribution', ketchupAuth, ketchupDistribution);
router.use('/v1/ketchup/reconciliation', ketchupAuth, ketchupReconciliation);
router.use('/v1/ketchup/webhooks', rateLimit(), ketchupWebhooks); // No auth for webhooks (uses signature)
router.use('/v1/map', ketchupMap); // NamibiaMap: agents + fixed locations
router.use('/v1/ketchup/locations', ketchupAuth, ketchupLocations); // Fixed locations: NamPost, ATM, warehouse (map)
router.use('/v1/ketchup/admin', ketchupAuth, ketchupAdmin); // Admin UI: SmartPay, audit logs, trust account, compliance (Ketchup Portal)
// ============================================================
// GOVERNMENT ROUTES - Read-Only Access
// ============================================================
router.use('/v1/government/compliance', governmentAuth, governmentCompliance);
router.use('/v1/government/monitoring', governmentAuth, governmentMonitoring);
router.use('/v1/government/analytics', governmentAuth, governmentAnalytics);
router.use('/v1/government/audit', governmentAuth, governmentAudit);
router.use('/v1/government/reports', governmentAuth, governmentReports);
// ============================================================
// SHARED ROUTES - Accessible by both portals
// ============================================================
router.use('/v1/shared/dashboard', sharedDashboard);
router.use('/v1/shared/status-events', sharedStatusEvents);
router.use('/v1/shared/open-banking', sharedOpenBanking);
// Backward compatibility (deprecated - redirect to new routes)
router.use('/v1/agents', (req, res, next) => {
    req.url = `/v1/ketchup/agents${req.url}`;
    next();
}, ketchupAuth, ketchupAgents);
router.use('/v1/beneficiaries', (req, res, next) => {
    req.url = `/v1/ketchup/beneficiaries${req.url}`;
    next();
}, ketchupAuth, ketchupBeneficiaries);
export default router;
//# sourceMappingURL=index.js.map