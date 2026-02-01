/**
 * Webhook Repository
 * 
 * Purpose: Data access layer for webhook events
 * Location: backend/src/services/webhook/WebhookRepository.ts
 */

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
import { WebhookEvent, WebhookFilters, WebhookEventType, WebhookDeliveryStatus } from '../../../../shared/types';

export class WebhookRepository {
  /**
   * Store a webhook event
   */
  async create(event: Omit<WebhookEvent, 'id' | 'timestamp'>): Promise<WebhookEvent> {
    try {
      const result = await sql`
        INSERT INTO webhook_events (
          event_type, voucher_id, status, delivery_attempts,
          last_attempt_at, delivered_at, error_message, signature_valid, payload
        )
        VALUES (
          ${event.eventType}, ${event.voucherId}, ${event.status}, ${event.deliveryAttempts},
          ${event.lastAttemptAt}, ${event.deliveredAt || null}, ${event.errorMessage || null},
          ${event.signatureValid}, ${JSON.stringify(event.payload)}
        )
        RETURNING id, created_at
      `;

      const row = result[0] as { id: string; created_at: string };

      return {
        id: row.id,
        ...event,
        timestamp: row.created_at,
      };
    } catch (error) {
      logError('Failed to create webhook event', error);
      throw error;
    }
  }

  /**
   * Get all webhook events with filters
   */
  async findAll(filters?: WebhookFilters): Promise<WebhookEvent[]> {
    try {
      const status = filters?.status ?? null;
      const eventType = filters?.eventType ?? null;
      const voucherId = filters?.voucherId ?? null;
      const limit = filters?.limit ?? 50;
      const offset = filters?.offset ?? 0;

      // Build query as single SQL statement (Neon serverless requirement)
      const rows = await sql`
        SELECT * FROM webhook_events
        WHERE
          (${status}::text IS NULL OR status = ${status})
          AND (${eventType}::text IS NULL OR event_type = ${eventType})
          AND (${voucherId}::text IS NULL OR voucher_id::text = ${voucherId})
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      return rows.map((row: any) => ({
        id: row.id,
        eventType: row.event_type,
        voucherId: row.voucher_id,
        status: row.status,
        deliveryAttempts: row.delivery_attempts,
        lastAttemptAt: row.last_attempt_at,
        deliveredAt: row.delivered_at,
        errorMessage: row.error_message,
        signatureValid: row.signature_valid,
        timestamp: row.created_at,
        payload: row.payload || {},
      }));
    } catch (error) {
      logError('Failed to find webhook events', error);
      throw error;
    }
  }

  /**
   * Get webhook event by ID
   */
  async findById(id: string): Promise<WebhookEvent | null> {
    try {
      const rows = await sql`
        SELECT * FROM webhook_events WHERE id = ${id}
      `;

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0] as any;
      return {
        id: row.id,
        eventType: row.event_type,
        voucherId: row.voucher_id,
        status: row.status,
        deliveryAttempts: row.delivery_attempts,
        lastAttemptAt: row.last_attempt_at,
        deliveredAt: row.delivered_at,
        errorMessage: row.error_message,
        signatureValid: row.signature_valid,
        timestamp: row.created_at,
        payload: row.payload || {},
      };
    } catch (error) {
      logError('Failed to find webhook event', error);
      throw error;
    }
  }

  /**
   * Update webhook event status
   */
  async updateStatus(id: string, status: 'pending' | 'delivered' | 'failed', errorMessage?: string): Promise<void> {
    try {
      await sql`
        UPDATE webhook_events
        SET status = ${status},
            error_message = ${errorMessage || null},
            updated_at = NOW()
        WHERE id = ${id}
      `;
      log('Updated webhook event status', { id, status });
    } catch (error) {
      logError('Failed to update webhook event status', error);
      throw error;
    }
  }

  /**
   * Increment delivery attempts
   */
  async incrementAttempts(id: string): Promise<void> {
    try {
      await sql`
        UPDATE webhook_events
        SET delivery_attempts = delivery_attempts + 1,
            last_attempt_at = NOW(),
            updated_at = NOW()
        WHERE id = ${id}
      `;
      log('Incremented webhook delivery attempts', { id });
    } catch (error) {
      logError('Failed to increment delivery attempts', error);
      throw error;
    }
  }
}
