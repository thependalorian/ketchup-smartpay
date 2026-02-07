/**
 * Webhook Repository
 *
 * Purpose: Data access layer for webhook events
 * Location: backend/src/services/webhook/WebhookRepository.ts
 */
import { WebhookEvent, WebhookFilters } from '../../../../shared/types';
export declare class WebhookRepository {
    /**
     * Store a webhook event
     */
    create(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<WebhookEvent>;
    /**
     * Get all webhook events with filters
     */
    findAll(filters?: WebhookFilters): Promise<WebhookEvent[]>;
    /**
     * Get webhook event by ID
     */
    findById(id: string): Promise<WebhookEvent | null>;
    /**
     * Update webhook event status
     */
    updateStatus(id: string, status: 'pending' | 'delivered' | 'failed', errorMessage?: string): Promise<void>;
    /**
     * Increment delivery attempts
     */
    incrementAttempts(id: string): Promise<void>;
}
//# sourceMappingURL=WebhookRepository.d.ts.map