/**
 * Idempotency Service
 *
 * Location: backend/src/services/idempotency/IdempotencyService.ts
 * Purpose: Centralized idempotency handling to avoid duplicate processing
 * PRD Requirement: Idempotency by event id or (voucher_id + status + timestamp) to avoid duplicate processing
 * PRD Requirement: All distribution and webhook handlers accept idempotency key (header or body); same key returns cached response
 * Aligned with buffr/utils/idempotency.ts for consistency
 */
export declare const ENDPOINT_DISTRIBUTION = "distribution";
export declare const ENDPOINT_WEBHOOK = "webhook";
export declare const ENDPOINT_VOUCHER = "voucher";
/**
 * Generate an idempotency key from voucher_id, status, and timestamp.
 * This is the default key format when client doesn't provide one.
 */
export declare function generateIdempotencyKey(voucherId: string, status: string, timestamp?: string): string;
/**
 * Result of an idempotency check.
 */
export interface IdempotencyCheckResult {
    isDuplicate: boolean;
    cachedResponse?: {
        status: number;
        body: unknown;
    };
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
export declare class IdempotencyService {
    /**
     * Get cached idempotency response (aligned with buffr/utils/idempotency.ts).
     * Returns cached response if exists and not expired.
     */
    getCachedResponse(idempotencyKey: string, endpointPrefix?: string): Promise<{
        status: number;
        body: unknown;
    } | null>;
    /**
     * Set cached idempotency response (aligned with buffr/utils/idempotency.ts).
     * Uses ON CONFLICT DO NOTHING for safe concurrent access.
     */
    setCachedResponse(idempotencyKey: string, status: number, body: unknown, endpointPrefix?: string): Promise<void>;
    /**
     * Check if a request with the given idempotency key has already been processed.
     * Returns cached response if exists and not expired.
     */
    check(key: string, endpointPrefix?: string): Promise<IdempotencyCheckResult>;
    /**
     * Store a successful response for an idempotency key.
     */
    store(key: string, status: number, body: unknown, endpointPrefix?: string): Promise<void>;
    /**
     * Generate a hash of the request for additional duplicate detection.
     * Includes: event type, voucher_id, status, and relevant data fields.
     */
    static hashRequest(data: Record<string, unknown>): string;
    /**
     * Cleanup expired idempotency records.
     * Should be called periodically (e.g., by a cron job).
     */
    cleanup(): Promise<{
        deleted: number;
    }>;
}
export declare const idempotencyService: IdempotencyService;
//# sourceMappingURL=IdempotencyService.d.ts.map