/**
 * API Client Tests
 *
 * Purpose: Unit tests for API client (no database needed). Uses same base URL
 * as actual implementation (backend at localhost:3001). Mock fetch to test
 * client behavior; for integration tests set VITE_API_URL and run against
 * real backend.
 * Location: packages/api-client/src/ketchup/api.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient } from './api';

global.fetch = vi.fn();

// Backend base URL (actual implementation default): http://localhost:3001 → /api/v1
const BACKEND_BASE = 'http://localhost:3001/api/v1';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
  });

  describe('get', () => {
    it('should make GET request with API key', async () => {
      const mockResponse = {
        success: true,
        data: { id: '123', name: 'Test' },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        `${BACKEND_BASE}/test`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toBeDefined();
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      const mockResponse = {
        success: true,
        data: { id: '123' },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.post('/test', { name: 'Test' });

      expect(fetch).toHaveBeenCalledWith(
        `${BACKEND_BASE}/test`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
      expect(result).toBeDefined();
      expect(result).toEqual(mockResponse.data);
    });
  });
});
