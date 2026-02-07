/**
 * Idempotency Service
 *
 * Location: backend/src/services/idempotency/IdempotencyService.ts
 * Purpose: Centralized idempotency handling to avoid duplicate processing
 * PRD Requirement: Idempotency by event id or (voucher_id + status + timestamp) to avoid duplicate processing
 * PRD Requirement: All distribution and webhook handlers accept idempotency key (header or body); same key returns cached response
 * Aligned with buffr/utils/idempotency.ts for consistency
 */

import crypto from 'crypto';
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';

const IDEMPOTENCY_TTL_HOURS = 24; // Idempotency keys expire after 24 hours

// Endpoint prefixes for different services
export const ENDPOINT_DISTRIBUTION = 'distribution';
export const ENDPOINT_WEBHOOK = 'webhook';
export const ENDPOINT_VOUCHER = 'voucher';

/**
 * Generate an idempotency key from voucher_id, status, and timestamp.
 * This is the default key format when client doesn't provide one.
 */
export function generateIdempotencyKey(voucherId: string, status: string, timestamp?: string): string {
  const ts = timestamp || new Date().toISOString();
  return crypto.createHash('sha256').update(`${voucherId}:${status}:${ts}`).digest('hex');
}

/**
 * Result of an idempotency check.
 */
export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  cachedResponse?: { status: number; body: unknown };
  idempotencyKey: string;
}

/**
 * Result of storing an idempotency record.
 */
export interface IdempotencyRecord {
  id: string;
  idempotency_key: string;
  endpoint_prefix: string;
  response_status: number;
  response_body: unknown;
  created_at: Date;
  expires_at: Date;
}

export class IdempotencyService {
  /**
   * Get cached idempotency response (aligned with buffr/utils/idempotency.ts).
   * Returns cached response if exists and not expired.
   */
  async getCachedResponse(
    idempotencyKey: string,
    endpointPrefix: string = ENDPOINT_DISTRIBUTION
  ): Promise<{ status: number; body: unknown } | null> {
    try {
      const rows = await sql`
        SELECT response_status, response_body FROM idempotency_keys
        WHERE idempotency_key = ${idempotencyKey}
          AND endpoint_prefix = ${endpointPrefix}
          AND expires_at > NOW()
        LIMIT 1
      `;

      if ((rows as { response_status: number; response_body: unknown }[]).length > 0) {
        const row = (rows as { response_status: number; response_body: unknown }[])[0];
        log('Idempotency: cache hit', { idempotencyKey, endpointPrefix });
        return { status: row.response_status, body: row.response_body };
      }

      return null;
    } catch (error) {
      logError('Idempotency getCachedResponse failed', error, { idempotencyKey, endpointPrefix });
      return null;
    }
  }

  /**
   * Set cached idempotency response (aligned with buffr/utils/idempotency.ts).
   * Uses ON CONFLICT DO NOTHING for safe concurrent access.
   */
  async setCachedResponse(
    idempotencyKey: string,
    status: number,
    body: unknown,
    endpointPrefix: string = ENDPOINT_DISTRIBUTION
  ): Promise<void> {
    try {
      await sql`
        INSERT INTO idempotency_keys (idempotency_key, endpoint_prefix, response_status, response_body, created_at, expires_at)
        VALUES (${idempotencyKey}, ${endpointPrefix}, ${status}, ${JSON.stringify(body)}, NOW(), NOW() + interval '${IDEMPOTENCY_TTL_HOURS} hours')
        ON CONFLICT (idempotency_key, endpoint_prefix) DO NOTHING
      `;
      log('Idempotency: stored response', { idempotencyKey, endpointPrefix, status });
    } catch (error) {
      logError('Idempotency setCachedResponse failed', error, { idempotencyKey, endpointPrefix });
    }
  }

  /**
   * Check if a request with the given idempotency key has already been processed.
   * Returns cached response if exists and not expired.
   */
  async check(key: string, endpointPrefix: string = ENDPOINT_DISTRIBUTION): Promise<IdempotencyCheckResult> {
    const cached = await this.getCachedResponse(key, endpointPrefix);
    if (cached) {
      return { isDuplicate: true, cachedResponse: cached, idempotencyKey: key };
    }
    return { isDuplicate: false, idempotencyKey: key };
  }

  /**
   * Store a successful response for an idempotency key.
   */
  async store(
    key: string,
    status: number,
    body: unknown,
    endpointPrefix: string = ENDPOINT_DISTRIBUTION
  ): Promise<void> {
    await this.setCachedResponse(key, status, body, endpointPrefix);
  }

  /**
   * Generate a hash of the request for additional duplicate detection.
   * Includes: event type, voucher_id, status, and relevant data fields.
   */
  static hashRequest(data: Record<string, unknown>): string {
    const relevantFields = {
      event: data.event,
      voucher_id: (data.data as Record<string, unknown>)?.voucher_id,
      status: (data.data as Record<string, unknown>)?.status,
      timestamp: data.timestamp,
    };
    return crypto.createHash('sha256').update(JSON.stringify(relevantFields)).digest('hex');
  }

  /**
   * Cleanup expired idempotency records.
   * Should be called periodically (e.g., by a cron job).
   */
  async cleanup(): Promise<{ deleted: number }> {
    try {
      const result = await sql`
        DELETE FROM idempotency_keys
        WHERE expires_at < NOW()
        RETURNING id
      `;
      const deleted = (result as { id: string }[]).length;
      log('Idempotency cleanup', { deleted });
      return { deleted };
    } catch (error) {
      logError('Idempotency cleanup failed', error);
      return { deleted: 0 };
    }
  }
}

export const idempotencyService = new IdempotencyService();
