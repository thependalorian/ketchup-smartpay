/**
 * Ketchup SmartPay Backend API - Express app
 *
 * Location: backend/src/app.ts
 * Purpose: Express app definition for both local server and Vercel serverless.
 * Vercel uses this file as the function entry (export default app); local dev uses index.ts which calls app.listen().
 */

import 'dotenv/config';
import express, { type Express } from 'express';
import cors from 'cors';
import { testConnection } from './database/connection';
import { log, logError } from './utils/logger';

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

const app: Express = express();

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
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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

app.use('/bon/v1/common', openBankingConsentRouter);
app.use('/bon/v1/banking', openBankingAccountsRouter);
app.use('/bon/v1/banking', openBankingPaymentsRouter);

app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/government/compliance', complianceRouter);
app.use('/api/v1/government/monitoring', governmentMonitoring);
app.use('/api/v1/government/analytics', governmentAnalytics);
app.use('/api/v1/government/audit', governmentAudit);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logError('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export default app;
