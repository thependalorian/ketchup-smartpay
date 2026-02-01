/**
 * Centralized Logging Utility
 * 
 * Location: utils/logger.ts
 * Purpose: Provides structured logging using Pino for all API routes and utilities
 * 
 * Features:
 * - Structured JSON logging (production)
 * - Pretty printing (development)
 * - Log levels: debug, info, warn, error, fatal
 * - Request ID tracking
 * - Performance timing
 * - Error stack traces
 * 
 * Usage:
 *   import logger from '@/utils/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Payment failed', { error, transactionId: 'tx-123' });
 */

import pino from 'pino';

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

// Create logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined, // Use default JSON output in production
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact sensitive information
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'token',
      'secret',
      'apiKey',
      'cardNumber',
      'cvv',
      'pin',
    ],
    remove: true,
  },
});

// Export logger instance
export default logger;

// Export convenience methods for common use cases
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(context, message),
  info: (message: string, context?: Record<string, any>) => logger.info(context, message),
  warn: (message: string, context?: Record<string, any>) => logger.warn(context, message),
  error: (message: string, error?: Error | unknown, context?: Record<string, any>) => {
    if (error instanceof Error) {
      logger.error({ ...context, err: error, stack: error.stack }, message);
    } else {
      logger.error({ ...context, error }, message);
    }
  },
  fatal: (message: string, error?: Error | unknown, context?: Record<string, any>) => {
    if (error instanceof Error) {
      logger.fatal({ ...context, err: error, stack: error.stack }, message);
    } else {
      logger.fatal({ ...context, error }, message);
    }
  },
};

// Helper for request logging
export const logRequest = (req: { method: string; url: string; headers?: Record<string, string> }, userId?: string) => {
  logger.info(
    {
      method: req.method,
      url: req.url,
      userId,
      userAgent: req.headers?.['user-agent'],
    },
    `${req.method} ${req.url}`
  );
};

// Helper for response logging
export const logResponse = (
  req: { method: string; url: string },
  statusCode: number,
  durationMs: number,
  userId?: string
) => {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level](
    {
      method: req.method,
      url: req.url,
      statusCode,
      durationMs,
      userId,
    },
    `${req.method} ${req.url} ${statusCode} (${durationMs}ms)`
  );
};

// Helper for database query logging
export const logQuery = (query: string, params?: any[], durationMs?: number) => {
  logger.debug(
    {
      query: query.substring(0, 200), // Truncate long queries
      paramCount: params?.length || 0,
      durationMs,
    },
    'Database query executed'
  );
};

// Helper for performance timing
export const createTimer = (operation: string) => {
  const start = Date.now();
  return {
    end: (context?: Record<string, any>) => {
      const duration = Date.now() - start;
      logger.debug({ ...context, durationMs: duration }, `${operation} completed`);
      return duration;
    },
  };
};

