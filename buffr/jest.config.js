/**
 * Jest Configuration
 * 
 * Location: jest.config.js
 * Purpose: Configure Jest for unit testing Buffr API and utilities
 * 
 * Based on TrueLayer Testing Patterns:
 * - Unit tests (60%)
 * - Integration tests (30%)
 * - E2E tests (10%)
 * 
 * See: docs/TRUELAYER_TESTING_PLAN.md
 */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', { presets: ['@babel/preset-typescript'] }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'utils/**/*.ts',
    'app/api/**/*.ts',
    'services/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
