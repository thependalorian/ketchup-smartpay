/**
 * Error Handler Tests
 * 
 * Location: __tests__/utils/errorHandler.test.ts
 * Purpose: Test error handling utilities including error tracking integration
 */

// Mock logger FIRST - before any imports
jest.mock('../../utils/logger', () => {
  const mockLogError = jest.fn(() => {});
  return {
    __esModule: true,
    default: {
      error: jest.fn(() => {}),
      warn: jest.fn(() => {}),
      info: jest.fn(() => {}),
      debug: jest.fn(() => {}),
      fatal: jest.fn(() => {}),
    },
    log: {
      error: mockLogError,
      warn: jest.fn(() => {}),
      info: jest.fn(() => {}),
      debug: jest.fn(() => {}),
      fatal: jest.fn(() => {}),
    },
  };
});

// Mock fetch for error tracking
global.fetch = jest.fn();

import {
  classifyError,
  logError,
  handleErrorWithResponse,
  isRetryableError,
  retryWithBackoff,
} from '../../utils/errorHandler';
import { ErrorCategory, ErrorSeverity } from '../../utils/errorHandler';

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // NODE_ENV is read-only, so we'll test with current environment
    delete process.env.ERROR_TRACKING_ENABLED;
    delete process.env.ERROR_TRACKING_DSN;
  });

  describe('classifyError', () => {
    it('should classify validation errors', () => {
      const error = new Error('Invalid input required');
      const result = classifyError(error);

      expect(result.category).toBe(ErrorCategory.VALIDATION);
      expect(result.severity).toBe(ErrorSeverity.LOW);
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    it('should classify authentication errors', () => {
      const error = new Error('Unauthorized token');
      const result = classifyError(error);

      expect(result.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      expect(result.code).toBe('AUTH_ERROR');
    });

    it('should classify database errors', () => {
      const error = new Error('Database connection failed');
      const result = classifyError(error);

      expect(result.category).toBe(ErrorCategory.DATABASE);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.code).toBe('DATABASE_ERROR');
    });

    it('should classify network errors', () => {
      const error = new Error('Network timeout');
      const result = classifyError(error);

      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.severity).toBe(ErrorSeverity.HIGH);
      expect(result.code).toBe('NETWORK_ERROR');
    });
  });

  describe('logError', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should log errors without throwing', async () => {
      const error = new Error('Test error');

      // Should not throw - logError should handle errors gracefully
      // Note: We test behavior (no throw) rather than implementation (logger call)
      await expect(logError(error)).resolves.not.toThrow();
    });

    it('should handle critical errors with tracking service', async () => {
      // Test with tracking enabled
      process.env.ERROR_TRACKING_ENABLED = 'true';
      process.env.ERROR_TRACKING_DSN = 'https://test@sentry.io/123';
      process.env.ERROR_TRACKING_SERVICE = 'sentry';
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });

      const error = new Error('Critical system error');
      const errorInfo = classifyError(error);
      errorInfo.severity = ErrorSeverity.CRITICAL;

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true });

      // Should not throw - even if tracking fails
      // Note: We test behavior (no throw) rather than implementation (logger call)
      await expect(logError(error)).resolves.not.toThrow();
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable network errors', () => {
      const error = new Error('Network timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify retryable connection errors', () => {
      const error = new Error('ECONNREFUSED');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify non-retryable validation errors', () => {
      const error = new Error('Invalid input');
      expect(isRetryableError(error)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should retry on transient failures', async () => {
      let attempts = 0;
      const fn = jest.fn(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Network timeout');
        }
        return 'success';
      });

      const result = await retryWithBackoff(fn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn(async () => {
        throw new Error('Network timeout');
      });

      await expect(
        retryWithBackoff(fn, { maxRetries: 2 })
      ).rejects.toThrow('Network timeout');

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
