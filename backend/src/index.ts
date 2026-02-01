/**
 * SmartPay Connect Backend API
 * 
 * Location: backend/src/index.ts
 * Purpose: Main entry point for the backend API server
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database/connection';
import { log, logError } from './utils/logger';
import ComplianceScheduler from './schedulers/complianceScheduler';

// Import routes (from actual file locations)
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
import notificationsRouter from './api/routes/ketchup/notifications';
import mapRouter from './api/routes/ketchup/map';
import locationsRouter from './api/routes/ketchup/locations';

// Open Banking routes (Namibian Open Banking Standards v1.0)
import openBankingConsentRouter from './api/routes/shared/openbanking/consent';
import openBankingAccountsRouter from './api/routes/shared/openbanking/accounts';
import openBankingPaymentsRouter from './api/routes/shared/openbanking/payments';

// Compliance routes (PSD-1, PSD-3, PSD-12)
import complianceRouter from './api/routes/government/compliance';
import governmentMonitoring from './api/routes/government/monitoring';
import governmentAnalytics from './api/routes/government/analytics';
import governmentAudit from './api/routes/government/audit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  log(`${req.method} ${req.path}`, { 
    query: req.query, 
    body: req.method !== 'GET' ? req.body : undefined 
  });
  next();
});

// Health check endpoint
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

// API Routes (SmartPay Connect)
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
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/map', mapRouter); // NamibiaMap: agents + fixed locations
app.use('/api/v1/ketchup/locations', locationsRouter); // Fixed locations: NamPost, ATM, warehouse (map)

// Open Banking API Routes (Namibian Open Banking Standards v1.0)
// Section 9.1.2: URI Structure - /bon/v{version}/{sector|common}/*
app.use('/bon/v1/common', openBankingConsentRouter); // Common services (OAuth, Consent)
app.use('/bon/v1/banking', openBankingAccountsRouter); // AIS endpoints
app.use('/bon/v1/banking', openBankingPaymentsRouter); // PIS endpoints

// Compliance API Routes (PSD-1, PSD-3, PSD-12)
app.use('/api/v1/compliance', complianceRouter);
// Government portal uses /api/v1/government/* (same routers)
app.use('/api/v1/government/compliance', complianceRouter);
app.use('/api/v1/government/monitoring', governmentMonitoring);
app.use('/api/v1/government/analytics', governmentAnalytics);
app.use('/api/v1/government/audit', governmentAudit);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Unhandled error', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    const server = app.listen(PORT, () => {
      log(`SmartPay Connect Backend API running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
      });

      // Start PSD compliance schedulers
      if (process.env.NODE_ENV !== 'test') {
        console.log('\n🏛️  Starting PSD Compliance Automation...');
        ComplianceScheduler.startAll();
      }
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        logError(`Port ${PORT} is already in use.`, err);
        console.error(`\n💡 Try: PORT=3002 pnpm run dev  OR  kill the process: lsof -ti :3001 | xargs kill\n`);
      } else {
        logError('Server error', err);
      }
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n🛑 SIGTERM received, shutting down gracefully...');
      ComplianceScheduler.stopAll();
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('\n🛑 SIGINT received, shutting down gracefully...');
      ComplianceScheduler.stopAll();
      process.exit(0);
    });
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
}

startServer();
