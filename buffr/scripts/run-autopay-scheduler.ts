#!/usr/bin/env ts-node
/**
 * Run AutoPay Scheduler
 *
 * This script starts the AutoPay backend scheduler as a standalone process.
 * It can be run manually or deployed as a long-running service.
 *
 * Usage:
 *   npm run autopay:scheduler
 *   # or
 *   ts-node scripts/run-autopay-scheduler.ts
 */

import { startAutoPayScheduler } from '../services/autopayBackendScheduler';
import logger from '@/utils/logger';

// Handle process termination gracefully
process.on('SIGINT', () => {
  logger.info('\n[AutoPay Scheduler] Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('\n[AutoPay Scheduler] Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the scheduler
logger.info('='.repeat(60));
logger.info('Starting Buffr AutoPay Backend Scheduler');
logger.info('Press Ctrl+C to stop');
logger.info('='.repeat(60));
logger.info('');

startAutoPayScheduler();
