/**
 * AgentService Integration Tests
 *
 * Purpose: Integration tests for AgentService using real database
 * Location: backend/src/services/agents/AgentService.test.ts
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AgentService } from './AgentService';
import { cleanTestData } from '../../test/setup';
describe('AgentService (Integration Tests)', () => {
    let service;
    beforeEach(async () => {
        service = new AgentService();
        await cleanTestData();
    });
    describe('getAll', () => {
        it('should return agents from database', async () => {
            const agents = await service.getAll();
            expect(Array.isArray(agents)).toBe(true);
            // If agents table exists and has data, verify structure
            if (agents.length > 0) {
                expect(agents[0]).toHaveProperty('id');
                expect(agents[0]).toHaveProperty('name');
                expect(agents[0]).toHaveProperty('type');
                expect(agents[0]).toHaveProperty('region');
                expect(agents[0]).toHaveProperty('status');
                expect(agents[0]).toHaveProperty('liquidity');
                expect(typeof agents[0].liquidity).toBe('number');
            }
        });
        it('should filter by region', async () => {
            const agents = await service.getAll({ region: 'Khomas' });
            expect(Array.isArray(agents)).toBe(true);
            if (agents.length > 0) {
                expect(agents.every((a) => a.region === 'Khomas')).toBe(true);
            }
        });
        it('should filter by status', async () => {
            const agents = await service.getAll({ status: 'active' });
            expect(Array.isArray(agents)).toBe(true);
            if (agents.length > 0) {
                expect(agents.every((a) => a.status === 'active')).toBe(true);
            }
        });
    });
    describe('getStats', () => {
        it('should return agent statistics from database', async () => {
            const stats = await service.getStats();
            expect(stats).toBeDefined();
            expect(typeof stats.total).toBe('number');
            expect(typeof stats.active).toBe('number');
            expect(typeof stats.inactive).toBe('number');
            expect(typeof stats.lowLiquidity).toBe('number');
            expect(typeof stats.totalVolumeToday).toBe('number');
            expect(typeof stats.avgSuccessRate).toBe('number');
            expect(stats.avgSuccessRate).toBeGreaterThanOrEqual(0);
            expect(stats.avgSuccessRate).toBeLessThanOrEqual(100);
        });
    });
});
//# sourceMappingURL=AgentService.test.js.map