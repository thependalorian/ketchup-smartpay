/**
 * Ketchup SmartPay Backend API - Local server entry
 *
 * Location: backend/src/index.ts
 * Purpose: Start the Express server locally (listen + compliance schedulers).
 * On Vercel, only app.ts is used as the serverless function entry.
 */

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { testConnection } from './database/connection';
import { log, logError } from './utils/logger';
import ComplianceScheduler from './schedulers/complianceScheduler';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await testConnection();

    const server = app.listen(PORT, () => {
      log(`Ketchup SmartPay Backend API running on port ${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
      });

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
