/**
 * Vercel Serverless Entry Point for Backend
 *
 * This file is a bundled entry point that doesn't use dynamic imports.
 * Use this instead of api/index.js for Vercel deployments.
 *
 * Build: tsc && esbuild --bundle --platform=node --outfile=dist/vercel-entry.js src/vercel-entry.ts
 */
// Vercel injects env vars; for local dev run with dotenv pre-loaded or set env
import express from 'express';
import cors from 'cors';
// Database
import { testConnection } from './database/connection';
// Routes - Import directly (bundled)
import beneficiariesRouter from './api/routes/ketchup/beneficiaries';
import vouchersRouter from './api/routes/ketchup/vouchers';
import distributionRouter from './api/routes/ketchup/distribution';
import webhooksRouter from './api/routes/ketchup/webhooks';
import reconciliationRouter from './api/routes/ketchup/reconciliation';
import statusEventsRouter from './api/routes/shared/statusEvents';
import reportsRouter from './api/routes/government/reports';
import dashboardRouter from './api/routes/shared/dashboard';
import agentsRouter from './api/routes/ketchup/agents';
import mobileUnitsRouter from './api/routes/ketchup/mobileUnits';
import atmsRouter from './api/routes/ketchup/atms';
import posTerminalsRouter from './api/routes/ketchup/posTerminals';
import notificationsRouter from './api/routes/ketchup/notifications';
import mapRouter from './api/routes/ketchup/map';
import locationsRouter from './api/routes/ketchup/locations';
import tokenVaultRouter from './api/routes/ketchup/tokenVault';
import ketchupAdminRouter from './api/routes/ketchup/admin';
import { ketchupAuth } from './api/middleware/ketchupAuth';
import openBankingConsentRouter from './api/routes/shared/openbanking/consent';
import openBankingAccountsRouter from './api/routes/shared/openbanking/accounts';
import openBankingPaymentsRouter from './api/routes/shared/openbanking/payments';
import complianceRouter from './api/routes/government/compliance';
import governmentMonitoring from './api/routes/government/monitoring';
import governmentAnalytics from './api/routes/government/analytics';
import governmentAudit from './api/routes/government/audit';
// Utils
import { log, logError } from './utils/logger';
function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use((req, res, next) => {
        log(`${req.method} ${req.path}`, {
            query: req.query,
            body: req.method !== 'GET' ? req.body : undefined,
        });
        next();
    });
    app.get('/health', async (req, res) => {
        try {
            const dbConnected = await testConnection();
            res.json({
                status: 'healthy',
                database: dbConnected ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            res.status(500).json({
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });
    // API Routes
    app.use('/api/v1/beneficiaries', beneficiariesRouter);
    app.use('/api/v1/vouchers', vouchersRouter);
    app.use('/api/v1/distribution', distributionRouter);
    app.use('/api/v1/webhooks', webhooksRouter);
    app.use('/api/v1/reconciliation', reconciliationRouter);
    app.use('/api/v1/status-events', statusEventsRouter);
    app.use('/api/v1/reports', reportsRouter);
    app.use('/api/v1/dashboard', dashboardRouter);
    app.use('/api/v1/agents', agentsRouter);
    app.use('/api/v1/mobile-units', mobileUnitsRouter);
    app.use('/api/v1/atms', atmsRouter);
    app.use('/api/v1/pos-terminals', posTerminalsRouter);
    app.use('/api/v1/notifications', notificationsRouter);
    app.use('/api/v1/map', mapRouter);
    app.use('/api/v1/ketchup/locations', locationsRouter);
    app.use('/api/v1/ketchup/admin', ketchupAuth, ketchupAdminRouter);
    app.use('/api/v1/token-vault', tokenVaultRouter);
    // Open Banking
    app.use('/bon/v1/common', openBankingConsentRouter);
    app.use('/bon/v1/banking', openBankingAccountsRouter);
    app.use('/bon/v1/banking', openBankingPaymentsRouter);
    // Government
    app.use('/api/v1/compliance', complianceRouter);
    app.use('/api/v1/government/compliance', complianceRouter);
    app.use('/api/v1/government/monitoring', governmentMonitoring);
    app.use('/api/v1/government/analytics', governmentAnalytics);
    app.use('/api/v1/government/audit', governmentAudit);
    // 404 Handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: 'Route not found',
        });
    });
    // Error Handler (include message so Vercel 500s show DATABASE_URL etc. for debugging)
    app.use((err, req, res, _next) => {
        logError('Unhandled error', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: err?.message ?? undefined,
        });
    });
    return app;
}
// Export for Vercel
export default createApp();
//# sourceMappingURL=vercel-entry.js.map