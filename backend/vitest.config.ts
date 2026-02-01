/**
 * Vitest Configuration for Backend
 * 
 * Purpose: Test configuration for SmartPay Connect backend
 * Location: backend/vitest.config.ts
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: [
      '**/node_modules/**', 
      '**/dist/**',
    ],
    setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],
    testTimeout: 30000, // 30 seconds for database operations
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/migrations/**',
        '**/test/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});
