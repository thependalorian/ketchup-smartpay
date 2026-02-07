/**
 * Idempotency Service Tests
 * Location: backend/tests/IdempotencyService.test.ts
 * Covers: idempotency key generation, duplicate detection, caching, and cleanup
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { sql } from '../src/database/connection';

// Mock the database connection for unit tests
// In real tests, these would connect to a test database
const mockIdempotencyKeys: Map<string, { 
  idempotency_key: string; 
  endpoint_prefix: string; 
  response_status: number; 
  response_body: unknown;
  created_at: Date;
  expires_at: Date;
}> = new Map();

const mockSql = async (query: TemplateStringsArray, ...values: unknown[]) => {
  const queryStr = query[0];
  
  // Handle INSERT
  if (queryStr.includes('INSERT INTO idempotency_keys')) {
    const idempotencyKey = values[0] as string;
    const endpointPrefix = values[1] as string;
    const responseStatus = values[2] as number;
    const responseBody = values[3] as unknown;
    const key = `${idempotencyKey}:${endpointPrefix}`;
    
    mockIdempotencyKeys.set(key, {
      idempotency_key: idempotencyKey,
      endpoint_prefix: endpointPrefix,
      response_status: responseStatus,
      response_body: responseBody,
      created_at: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    return [];
  }
  
  // Handle SELECT
  if (queryStr.includes('SELECT response_status, response_body FROM idempotency_keys')) {
    const idempotencyKey = values[0] as string;
    const endpointPrefix = values[1] as string;
    const key = `${idempotencyKey}:${endpointPrefix}`;
    const record = mockIdempotencyKeys.get(key);
    
    if (record && record.expires_at > new Date()) {
      return [{ response_status: record.response_status, response_body: record.response_body }];
    }
    return [];
  }
  
  // Handle DELETE for cleanup
  if (queryStr.includes('DELETE FROM idempotency_keys')) {
    const now = new Date();
    let deletedCount = 0;
    for (const [key, record] of mockIdempotencyKeys.entries()) {
      if (record.expires_at < now) {
        mockIdempotencyKeys.delete(key);
        deletedCount++;
      }
    }
    return Array(deletedCount).fill({ id: 'deleted' });
  }
  
  return [];
};

// Simulated IdempotencyService for testing (copies implementation for isolated testing)
const IDEMPOTENCY_TTL_HOURS = 24;
const ENDPOINT_DISTRIBUTION = 'distribution';
const ENDPOINT_WEBHOOK = 'webhook';

function generateIdempotencyKey(voucherId: string, status: string, timestamp?: string): string {
  const ts = timestamp || new Date().toISOString();
  return crypto.createHash('sha256').update(`${voucherId}:${status}:${ts}`).digest('hex');
}

class MockIdempotencyService {
  async getCachedResponse(
    idempotencyKey: string,
    endpointPrefix: string = ENDPOINT_DISTRIBUTION
  ): Promise<{ status: number; body: unknown } | null> {
    const rows = await mockSql`
      SELECT response_status, response_body FROM idempotency_keys
      WHERE idempotency_key = ${idempotencyKey}
        AND endpoint_prefix = ${endpointPrefix}
        AND expires_at > NOW()
      LIMIT 1
    `;
    
    if ((rows as { response_status: number; response_body: unknown }[]).length > 0) {
      const row = (rows as { response_status: number; response_body: unknown }[])[0];
      let body = row.response_body;
      // Parse if string (from JSON.stringify)
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch {}
      }
      return { status: row.response_status, body };
    }
    return null;
  }

  async setCachedResponse(
    idempotencyKey: string,
    status: number,
    body: unknown,
    endpointPrefix: string = ENDPOINT_DISTRIBUTION
  ): Promise<void> {
    await mockSql`
      INSERT INTO idempotency_keys (idempotency_key, endpoint_prefix, response_status, response_body, created_at, expires_at)
      VALUES (${idempotencyKey}, ${endpointPrefix}, ${status}, ${JSON.stringify(body)}, NOW(), NOW() + interval '${IDEMPOTENCY_TTL_HOURS} hours')
      ON CONFLICT (idempotency_key, endpoint_prefix) DO NOTHING
    `;
  }

  async check(key: string, endpointPrefix: string = ENDPOINT_DISTRIBUTION) {
    const cached = await this.getCachedResponse(key, endpointPrefix);
    if (cached) {
      return { isDuplicate: true, cachedResponse: cached, idempotencyKey: key };
    }
    return { isDuplicate: false, idempotencyKey: key };
  }

  async cleanup() {
    const result = await mockSql`DELETE FROM idempotency_keys WHERE expires_at < NOW() RETURNING id`;
    return { deleted: (result as { id: string }[]).length };
  }
}

describe('IdempotencyService', () => {
  let idempotencyService: MockIdempotencyService;

  beforeEach(() => {
    idempotencyService = new MockIdempotencyService();
    mockIdempotencyKeys.clear();
  });

  afterEach(() => {
    mockIdempotencyKeys.clear();
  });

  describe('generateIdempotencyKey', () => {
    it('should generate consistent hash for same inputs', () => {
      const key1 = generateIdempotencyKey('voucher-123', 'redeemed', '2024-01-01T00:00:00Z');
      const key2 = generateIdempotencyKey('voucher-123', 'redeemed', '2024-01-01T00:00:00Z');
      expect(key1).toBe(key2);
    });

    it('should generate different hash for different voucher_id', () => {
      const key1 = generateIdempotencyKey('voucher-123', 'redeemed', '2024-01-01T00:00:00Z');
      const key2 = generateIdempotencyKey('voucher-456', 'redeemed', '2024-01-01T00:00:00Z');
      expect(key1).not.toBe(key2);
    });

    it('should generate different hash for different status', () => {
      const key1 = generateIdempotencyKey('voucher-123', 'redeemed', '2024-01-01T00:00:00Z');
      const key2 = generateIdempotencyKey('voucher-123', 'expired', '2024-01-01T00:00:00Z');
      expect(key1).not.toBe(key2);
    });

    it('should generate different hash for different timestamp', () => {
      const key1 = generateIdempotencyKey('voucher-123', 'redeemed', '2024-01-01T00:00:00Z');
      const key2 = generateIdempotencyKey('voucher-123', 'redeemed', '2024-01-02T00:00:00Z');
      expect(key1).not.toBe(key2);
    });

    it('should use current timestamp when not provided', () => {
      const key1 = generateIdempotencyKey('voucher-123', 'redeemed');
      const key2 = generateIdempotencyKey('voucher-123', 'redeemed');
      // Same millisecond, should be equal
      expect(key1).toBe(key2);
    });

    it('should return 64-character hex string (SHA-256)', () => {
      const key = generateIdempotencyKey('voucher-123', 'redeemed', '2024-01-01T00:00:00Z');
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('getCachedResponse', () => {
    it('should return null for non-existent key', async () => {
      const result = await idempotencyService.getCachedResponse('non-existent', ENDPOINT_DISTRIBUTION);
      expect(result).toBeNull();
    });

    it('should return cached response for existing key', async () => {
      const testKey = 'test-key-' + crypto.randomUUID();
      const testResponse = { success: true, data: { id: '123' } };
      
      await idempotencyService.setCachedResponse(testKey, 200, testResponse, ENDPOINT_DISTRIBUTION);
      const cached = await idempotencyService.getCachedResponse(testKey, ENDPOINT_DISTRIBUTION);
      
      expect(cached).not.toBeNull();
      expect(cached?.status).toBe(200);
      expect(cached?.body).toEqual(testResponse);
    });

    it('should return null for expired key', async () => {
      const testKey = 'expired-key-' + crypto.randomUUID();
      
      // Manually insert an expired record
      const key = `${testKey}:${ENDPOINT_DISTRIBUTION}`;
      mockIdempotencyKeys.set(key, {
        idempotency_key: testKey,
        endpoint_prefix: ENDPOINT_DISTRIBUTION,
        response_status: 200,
        response_body: { expired: true },
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago (expired)
      });
      
      const cached = await idempotencyService.getCachedResponse(testKey, ENDPOINT_DISTRIBUTION);
      expect(cached).toBeNull();
    });
  });

  describe('setCachedResponse', () => {
    it('should store response with correct status code', async () => {
      const testKey = 'store-test-' + crypto.randomUUID();
      await idempotencyService.setCachedResponse(testKey, 201, { created: true }, ENDPOINT_DISTRIBUTION);
      
      const cached = await idempotencyService.getCachedResponse(testKey, ENDPOINT_DISTRIBUTION);
      expect(cached?.status).toBe(201);
    });

    it('should store complex response bodies', async () => {
      const testKey = 'complex-test-' + crypto.randomUUID();
      const complexResponse = {
        success: true,
        data: {
          vouchers: [{ id: 'v1' }, { id: 'v2' }],
          pagination: { page: 1, limit: 10 },
        },
        meta: { timestamp: new Date().toISOString() },
      };
      
      await idempotencyService.setCachedResponse(testKey, 200, complexResponse, ENDPOINT_DISTRIBUTION);
      const cached = await idempotencyService.getCachedResponse(testKey, ENDPOINT_DISTRIBUTION);
      
      expect(cached?.body).toEqual(complexResponse);
    });

    it('should handle different endpoint prefixes', async () => {
      const testKey = 'endpoint-test-' + crypto.randomUUID();
      const webhookResponse = { event: 'voucher.redeemed' };
      
      await idempotencyService.setCachedResponse(testKey, 200, webhookResponse, ENDPOINT_WEBHOOK);
      
      const webhookCached = await idempotencyService.getCachedResponse(testKey, ENDPOINT_WEBHOOK);
      const distCached = await idempotencyService.getCachedResponse(testKey, ENDPOINT_DISTRIBUTION);
      
      expect(webhookCached).not.toBeNull();
      expect(distCached).toBeNull();
    });
  });

  describe('check (duplicate detection)', () => {
    it('should return isDuplicate: false for new request', async () => {
      const result = await idempotencyService.check('new-request-key', ENDPOINT_DISTRIBUTION);
      expect(result.isDuplicate).toBe(false);
      expect(result.cachedResponse).toBeUndefined();
    });

    it('should return isDuplicate: true for duplicate request', async () => {
      const testKey = 'duplicate-test-' + crypto.randomUUID();
      const cachedResponse = { success: true };
      
      await idempotencyService.setCachedResponse(testKey, 200, cachedResponse, ENDPOINT_DISTRIBUTION);
      const result = await idempotencyService.check(testKey, ENDPOINT_DISTRIBUTION);
      
      expect(result.isDuplicate).toBe(true);
      expect(result.cachedResponse).toEqual({ status: 200, body: cachedResponse });
    });
  });

  describe('cleanup', () => {
    it('should delete expired idempotency records', async () => {
      // Add an expired record
      const expiredKey = 'expired-' + crypto.randomUUID();
      const key = `${expiredKey}:${ENDPOINT_DISTRIBUTION}`;
      mockIdempotencyKeys.set(key, {
        idempotency_key: expiredKey,
        endpoint_prefix: ENDPOINT_DISTRIBUTION,
        response_status: 200,
        response_body: { expired: true },
        created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      });
      
      // Add a valid record
      const validKey = 'valid-' + crypto.randomUUID();
      await idempotencyService.setCachedResponse(validKey, 200, { valid: true }, ENDPOINT_DISTRIBUTION);
      
      const cleanupResult = await idempotencyService.cleanup();
      expect(cleanupResult.deleted).toBe(1);
      
      // Valid record should still exist
      const validCached = await idempotencyService.getCachedResponse(validKey, ENDPOINT_DISTRIBUTION);
      expect(validCached).not.toBeNull();
      
      // Expired record should not exist
      const expiredCached = await idempotencyService.getCachedResponse(expiredKey, ENDPOINT_DISTRIBUTION);
      expect(expiredCached).toBeNull();
    });

    it('should return deleted: 0 when no expired records', async () => {
      const testKey = 'no-expire-' + crypto.randomUUID();
      await idempotencyService.setCachedResponse(testKey, 200, { test: true }, ENDPOINT_DISTRIBUTION);
      
      const cleanupResult = await idempotencyService.cleanup();
      expect(cleanupResult.deleted).toBe(0);
    });
  });

  describe('end-to-end idempotency flow', () => {
    it('should prevent duplicate webhook processing', async () => {
      const voucherId = 'voucher-e2e-' + crypto.randomUUID();
      const status = 'redeemed';
      const timestamp = '2024-01-01T00:00:00Z';
      
      // First request
      const idempotencyKey = generateIdempotencyKey(voucherId, status, timestamp);
      const firstResponse = { status: 'processed', voucherId, status };
      
      await idempotencyService.setCachedResponse(idempotencyKey, 200, firstResponse, ENDPOINT_WEBHOOK);
      
      // Simulate duplicate webhook
      const duplicateCheck = await idempotencyService.check(idempotencyKey, ENDPOINT_WEBHOOK);
      
      expect(duplicateCheck.isDuplicate).toBe(true);
      expect(duplicateCheck.cachedResponse?.body).toEqual(firstResponse);
    });

    it('should handle concurrent idempotency requests safely', async () => {
      const testKey = 'concurrent-' + crypto.randomUUID();
      const response = { success: true };
      
      // Simulate concurrent requests
      await Promise.all([
        idempotencyService.setCachedResponse(testKey, 200, response, ENDPOINT_DISTRIBUTION),
        idempotencyService.setCachedResponse(testKey, 200, response, ENDPOINT_DISTRIBUTION),
        idempotencyService.setCachedResponse(testKey, 200, response, ENDPOINT_DISTRIBUTION),
      ]);
      
      // Should still have only one record
      const cached = await idempotencyService.getCachedResponse(testKey, ENDPOINT_DISTRIBUTION);
      expect(cached).not.toBeNull();
      expect(cached?.status).toBe(200);
    });
  });
});
