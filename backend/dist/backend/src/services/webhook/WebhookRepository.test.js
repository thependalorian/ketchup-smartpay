/**
 * WebhookRepository Integration Tests
 *
 * Purpose: Integration tests for WebhookRepository using real database
 * Location: backend/src/services/webhook/WebhookRepository.test.ts
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookRepository } from './WebhookRepository';
import { sql } from '../../database/connection';
import { cleanTestData } from '../../test/setup';
describe('WebhookRepository (Integration Tests)', () => {
    let repository;
    beforeEach(async () => {
        repository = new WebhookRepository();
        await cleanTestData();
    });
    describe('create', () => {
        it('should create a webhook event in database', async () => {
            const eventData = {
                eventType: 'voucher.redeemed',
                voucherId: '550e8400-e29b-41d4-a716-446655440010', // Use proper UUID
                status: 'delivered',
                deliveryAttempts: 1,
                lastAttemptAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString(),
                errorMessage: undefined,
                signatureValid: true,
                payload: { test: 'data' },
            };
            const event = await repository.create(eventData);
            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            expect(event.eventType).toBe('voucher.redeemed');
            expect(event.voucherId).toBe('550e8400-e29b-41d4-a716-446655440010');
            expect(event.status).toBe('delivered');
            // Verify it was actually saved to database
            const [saved] = await sql `
        SELECT * FROM webhook_events WHERE id = ${event.id}
      `;
            expect(saved).toBeDefined();
            expect(saved.event_type).toBe('voucher.redeemed');
        });
    });
    describe('findAll', () => {
        it('should return empty array when no events exist', async () => {
            // Clean test range (same pattern as setup.ts so it works for VARCHAR or UUID voucher_id)
            await sql `
        DELETE FROM webhook_events 
        WHERE voucher_id::text LIKE '550e8400-e29b-41d4-a716-44665544%'
      `.catch(() => { });
            const events = await repository.findAll();
            const testEvents = events.filter((e) => String(e.voucherId).startsWith('550e8400-e29b-41d4-a716-44665544'));
            expect(testEvents).toEqual([]);
        });
        it('should return all events when no filters provided', async () => {
            // Create test events with proper UUIDs
            await repository.create({
                eventType: 'voucher.redeemed',
                voucherId: '550e8400-e29b-41d4-a716-446655440011',
                status: 'delivered',
                deliveryAttempts: 1,
                lastAttemptAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString(),
                signatureValid: true,
                payload: {},
            });
            await repository.create({
                eventType: 'voucher.delivered',
                voucherId: '550e8400-e29b-41d4-a716-446655440012',
                status: 'pending',
                deliveryAttempts: 0,
                lastAttemptAt: new Date().toISOString(),
                signatureValid: true,
                payload: {},
            });
            const events = await repository.findAll();
            expect(events.length).toBeGreaterThanOrEqual(2);
        });
        it('should filter by status', async () => {
            // Create test events with different statuses
            await repository.create({
                eventType: 'voucher.redeemed',
                voucherId: '550e8400-e29b-41d4-a716-446655440013',
                status: 'delivered',
                deliveryAttempts: 1,
                lastAttemptAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString(),
                signatureValid: true,
                payload: {},
            });
            await repository.create({
                eventType: 'voucher.delivered',
                voucherId: '550e8400-e29b-41d4-a716-446655440014',
                status: 'pending',
                deliveryAttempts: 0,
                lastAttemptAt: new Date().toISOString(),
                signatureValid: true,
                payload: {},
            });
            const deliveredEvents = await repository.findAll({ status: 'delivered' });
            expect(deliveredEvents.length).toBeGreaterThanOrEqual(1);
            expect(deliveredEvents.every((e) => e.status === 'delivered')).toBe(true);
        });
    });
    describe('findById', () => {
        it('should return null when event not found', async () => {
            // Use a valid UUID format that doesn't exist
            const event = await repository.findById('550e8400-e29b-41d4-a716-446655449999');
            expect(event).toBeNull();
        });
        it('should return event when found', async () => {
            const created = await repository.create({
                eventType: 'voucher.redeemed',
                voucherId: '550e8400-e29b-41d4-a716-446655440020',
                status: 'delivered',
                deliveryAttempts: 1,
                lastAttemptAt: new Date().toISOString(),
                deliveredAt: new Date().toISOString(),
                signatureValid: true,
                payload: {},
            });
            const found = await repository.findById(created.id);
            expect(found).toBeDefined();
            expect(found?.id).toBe(created.id);
            expect(found?.eventType).toBe('voucher.redeemed');
        });
    });
    describe('updateStatus', () => {
        it('should update event status', async () => {
            const created = await repository.create({
                eventType: 'voucher.redeemed',
                voucherId: '550e8400-e29b-41d4-a716-446655440016',
                status: 'pending',
                deliveryAttempts: 0,
                lastAttemptAt: new Date().toISOString(),
                signatureValid: true,
                payload: {},
            });
            await repository.updateStatus(created.id, 'delivered');
            const updated = await repository.findById(created.id);
            expect(updated?.status).toBe('delivered');
        });
    });
    describe('incrementAttempts', () => {
        it('should increment delivery attempts', async () => {
            const created = await repository.create({
                eventType: 'voucher.redeemed',
                voucherId: '550e8400-e29b-41d4-a716-446655440017',
                status: 'pending',
                deliveryAttempts: 1,
                lastAttemptAt: new Date().toISOString(),
                signatureValid: true,
                payload: {},
            });
            await repository.incrementAttempts(created.id);
            const updated = await repository.findById(created.id);
            expect(updated?.deliveryAttempts).toBe(2);
        });
    });
});
//# sourceMappingURL=WebhookRepository.test.js.map