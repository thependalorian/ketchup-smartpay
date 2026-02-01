/**
 * Enhanced Error Handling Utilities
 * 
 * Location: utils/errorHandler.ts
 * Purpose: Comprehensive error handling, logging, and recovery utilities
 * 
 * Features:
 * - Structured error logging with context
 * - Error classification and categorization
 * - Retry logic for transient failures
 * - Error recovery strategies
 * - Database error handling
 * - Network error handling
 */

import { ExpoRequest } from 'expo-router/server';
import { errorResponse, HttpStatus } from './apiResponse';
import { generateRequestId, getIpAddress, getUserAgent } from './auditLogger';
import logger, { log } from '@/utils/logger';

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  DATABASE = 'database',
  NETWORK = 'network',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  UNKNOWN = 'unknown',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Structured error information
 */
export interface ErrorInfo {
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  statusCode: number;
  code?: string;
  details?: Record<string, any>;
  stack?: string;
  context?: {
    endpoint?: string;
    method?: string;
    userId?: string;
    requestId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
  };
}

/**
 * Classify error by message and type
 */
export function classifyError(error: unknown): ErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Determine category
  let category = ErrorCategory.UNKNOWN;
  let severity = ErrorSeverity.MEDIUM;
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let code: string | undefined;

  // Validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('required') ||
    errorMessage.includes('must be')
  ) {
    category = ErrorCategory.VALIDATION;
    severity = ErrorSeverity.LOW;
    statusCode = HttpStatus.BAD_REQUEST;
    code = 'VALIDATION_ERROR';
  }
  // Authentication errors
  else if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('token') ||
    errorMessage.includes('login')
  ) {
    category = ErrorCategory.AUTHENTICATION;
    severity = ErrorSeverity.MEDIUM;
    statusCode = HttpStatus.UNAUTHORIZED;
    code = 'AUTH_ERROR';
  }
  // Authorization errors
  else if (
    errorMessage.includes('forbidden') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('access denied')
  ) {
    category = ErrorCategory.AUTHORIZATION;
    severity = ErrorSeverity.MEDIUM;
    statusCode = HttpStatus.FORBIDDEN;
    code = 'AUTHORIZATION_ERROR';
  }
  // Not found errors
  else if (
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('missing')
  ) {
    category = ErrorCategory.NOT_FOUND;
    severity = ErrorSeverity.LOW;
    statusCode = HttpStatus.NOT_FOUND;
    code = 'NOT_FOUND';
  }
  // Database errors
  else if (
    errorMessage.includes('database') ||
    errorMessage.includes('query') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('SQL') ||
    errorMessage.includes('constraint')
  ) {
    category = ErrorCategory.DATABASE;
    severity = ErrorSeverity.HIGH;
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    code = 'DATABASE_ERROR';
  }
  // Network errors
  else if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND')
  ) {
    category = ErrorCategory.NETWORK;
    severity = ErrorSeverity.HIGH;
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    code = 'NETWORK_ERROR';
  }
  // External API errors
  else if (
    errorMessage.includes('API') ||
    errorMessage.includes('external') ||
    errorMessage.includes('third-party') ||
    errorMessage.includes('service unavailable')
  ) {
    category = ErrorCategory.EXTERNAL_API;
    severity = ErrorSeverity.HIGH;
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    code = 'EXTERNAL_API_ERROR';
  }
  // Business logic errors
  else if (
    errorMessage.includes('insufficient') ||
    errorMessage.includes('balance') ||
    errorMessage.includes('limit') ||
    errorMessage.includes('expired')
  ) {
    category = ErrorCategory.BUSINESS_LOGIC;
    severity = ErrorSeverity.MEDIUM;
    statusCode = HttpStatus.BAD_REQUEST;
    code = 'BUSINESS_LOGIC_ERROR';
  }
  // System errors (critical)
  else if (
    errorMessage.includes('fatal') ||
    errorMessage.includes('critical') ||
    errorMessage.includes('system')
  ) {
    category = ErrorCategory.SYSTEM;
    severity = ErrorSeverity.CRITICAL;
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    code = 'SYSTEM_ERROR';
  }

  return {
    message: errorMessage,
    category,
    severity,
    statusCode,
    code,
    stack: errorStack,
  };
}

/**
 * Log error with full context
 */
export async function logError(
  error: unknown,
  req?: ExpoRequest,
  additionalContext?: Record<string, any>
): Promise<void> {
  const errorInfo = classifyError(error);
  const requestId = generateRequestId();
  const ipAddress = req ? getIpAddress(req) : undefined;
  const userAgent = req ? getUserAgent(req) : undefined;

  const logEntry = {
    ...errorInfo,
    context: {
      endpoint: req ? new URL(req.url).pathname : undefined,
      method: req?.method,
      requestId,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      ...additionalContext,
    },
  };

  // Console logging (always)
  log.error('[Error Log]:', JSON.stringify(logEntry, null, 2));

  // Send to error tracking service in production (if configured)
  if (process.env.NODE_ENV === 'production') {
    // Only send critical and high severity errors to reduce noise
    if (errorInfo.severity === ErrorSeverity.CRITICAL || errorInfo.severity === ErrorSeverity.HIGH) {
      await sendToErrorTrackingService(logEntry).catch(err => {
        // Don't throw - error tracking failures shouldn't break the app
        log.error('Failed to send error to tracking service:', err);
      });
    }
  }
}

/**
 * Send error to external error tracking service (Sentry, LogRocket, etc.)
 * Configure via environment variables:
 * - ERROR_TRACKING_ENABLED=true
 * - ERROR_TRACKING_DSN (Sentry DSN or similar)
 * - ERROR_TRACKING_SERVICE=sentry|logrocket|custom
 */
async function sendToErrorTrackingService(logEntry: any): Promise<void> {
  const enabled = process.env.ERROR_TRACKING_ENABLED === 'true';
  if (!enabled) {
    return; // Error tracking disabled
  }

  const service = process.env.ERROR_TRACKING_SERVICE || 'sentry';
  const dsn = process.env.ERROR_TRACKING_DSN;

  if (!dsn) {
    logger.warn('[Error Tracking] DSN not configured. Set ERROR_TRACKING_DSN environment variable.');
    return;
  }

  try {
    switch (service.toLowerCase()) {
      case 'sentry': {
        // Sentry integration
        // In production, install @sentry/node and use:
        // import * as Sentry from '@sentry/node';
        // Sentry.captureException(new Error(logEntry.message), {
        //   level: logEntry.severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error',
        //   tags: { category: logEntry.category, code: logEntry.code },
        //   extra: logEntry.context,
        // });
        
        // For now, send to Sentry API directly (fallback if SDK not installed)
        if (dsn.startsWith('https://')) {
          await fetch(`${dsn}/api/events/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${dsn.split('@')[0].split('//')[1]}`,
            },
            body: JSON.stringify({
              message: logEntry.message,
              level: logEntry.severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error',
              tags: {
                category: logEntry.category,
                code: logEntry.code,
              },
              extra: logEntry.context,
              timestamp: logEntry.context?.timestamp || new Date().toISOString(),
            }),
          });
        }
        break;
      }

      case 'logrocket': {
        // LogRocket integration
        // In production, install logrocket and use:
        // import LogRocket from 'logrocket';
        // LogRocket.captureException(new Error(logEntry.message), {
        //   tags: { category: logEntry.category },
        //   extra: logEntry.context,
        // });
        logger.info('[Error Tracking] LogRocket integration requires @logrocket/node package');
        break;
      }

      case 'custom': {
        // Custom error tracking endpoint
        const customEndpoint = process.env.ERROR_TRACKING_ENDPOINT;
        if (customEndpoint) {
          await fetch(customEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${dsn}`, // Use DSN as API key
            },
            body: JSON.stringify(logEntry),
          });
        }
        break;
      }

      default:
        logger.warn(`[Error Tracking] Unknown service: ${service}`);
    }
  } catch (error) {
    // Silently fail - don't let error tracking break the app
    log.error('[Error Tracking] Failed to send error:', error);
  }
}

/**
 * Handle error and return appropriate response
 */
export async function handleErrorWithResponse(
  error: unknown,
  req?: ExpoRequest,
  additionalContext?: Record<string, any>
): Promise<Response> {
  const errorInfo = classifyError(error);

  // Log the error
  await logError(error, req, additionalContext).catch(err => {
    log.error('Failed to log error:', err);
  });

  // Determine user-friendly message
  let userMessage = errorInfo.message;

  // Sanitize messages in production
  if (process.env.NODE_ENV === 'production') {
    if (errorInfo.category === ErrorCategory.DATABASE) {
      userMessage = 'A database error occurred. Please try again later.';
    } else if (errorInfo.category === ErrorCategory.NETWORK) {
      userMessage = 'A network error occurred. Please check your connection and try again.';
    } else if (errorInfo.category === ErrorCategory.EXTERNAL_API) {
      userMessage = 'An external service error occurred. Please try again later.';
    } else if (errorInfo.severity === ErrorSeverity.CRITICAL) {
      userMessage = 'An internal server error occurred. Please contact support if the problem persists.';
    }
  }

  return errorResponse(userMessage, errorInfo.statusCode);
}

/**
 * Check if error is retryable (transient failure)
 */
export function isRetryableError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Network errors are usually retryable
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('network')
  ) {
    return true;
  }

  // Database connection errors are retryable
  if (
    errorMessage.includes('connection') ||
    errorMessage.includes('ECONNRESET') ||
    errorMessage.includes('ETIMEDOUT')
  ) {
    return true;
  }

  // Rate limiting (429) is retryable
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return true;
  }

  // 5xx errors from external APIs are retryable
  if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
    return true;
  }

  return false;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      logger.info(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wrap async handler with comprehensive error handling
 */
export function withComprehensiveErrorHandling<T extends (...args: any[]) => Promise<Response>>(
  handler: T,
  options?: {
    logErrors?: boolean;
    includeStack?: boolean;
  }
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      // Extract request from args if available
      const req = args[0] as ExpoRequest | undefined;

      // Handle error with full context
      return await handleErrorWithResponse(error, req, {
        handler: handler.name || 'anonymous',
        options,
      });
    }
  }) as T;
}
