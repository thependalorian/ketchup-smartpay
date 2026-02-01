/**
 * Jest Test Setup
 *
 * Location: __tests__/setup.ts
 * Purpose: Global test configuration. Uses actual implementation when env is set.
 *
 * Database: If DATABASE_URL is set (e.g. in .env.local or CI), tests that hit the DB
 * use the real Neon DB. Otherwise fallback to mock URL for unit-only tests.
 * Backend API: Set KETCHUP_SMARTPAY_API_URL (e.g. http://localhost:3001) for
 * integration tests that call the SmartPay Connect backend.
 *
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */

// Use real DATABASE_URL when set (actual implementation); otherwise mock for unit tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
}
// Deprecated: kept for backward compatibility only
if (process.env.ALLOW_DEV_FALLBACK === undefined) {
  process.env.ALLOW_DEV_FALLBACK = 'true';
}

// Mock console.error to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
export const mockSql = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
