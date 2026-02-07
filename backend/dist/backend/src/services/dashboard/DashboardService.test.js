/**
 * DashboardService Integration Tests
 *
 * Purpose: Integration tests for DashboardService using real database
 * Location: backend/src/services/dashboard/DashboardService.test.ts
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardService } from './DashboardService';
import { cleanTestData } from '../../test/setup';
describe('DashboardService (Integration Tests)', () => {
    let service;
    beforeEach(async () => {
        service = new DashboardService();
        await cleanTestData();
    });
    describe('getMetrics', () => {
        it('should return metrics from database', async () => {
            const metrics = await service.getMetrics();
            expect(metrics).toBeDefined();
            expect(typeof metrics.totalBeneficiaries).toBe('number');
            expect(typeof metrics.activeBeneficiaries).toBe('number');
            expect(typeof metrics.totalVouchersIssued).toBe('number');
            expect(typeof metrics.vouchersRedeemed).toBe('number');
            expect(typeof metrics.totalDisbursement).toBe('number');
            expect(typeof metrics.monthlyDisbursement).toBe('number');
            expect(typeof metrics.networkHealthScore).toBe('number');
            expect(metrics.networkHealthScore).toBeGreaterThanOrEqual(0);
            expect(metrics.networkHealthScore).toBeLessThanOrEqual(100);
        });
    });
    describe('getMonthlyTrend', () => {
        it('should return monthly trend data from database', async () => {
            const trend = await service.getMonthlyTrend(12);
            expect(Array.isArray(trend)).toBe(true);
            if (trend.length > 0) {
                expect(trend[0]).toHaveProperty('month');
                expect(trend[0]).toHaveProperty('issued');
                expect(trend[0]).toHaveProperty('redeemed');
                expect(trend[0]).toHaveProperty('expired');
                expect(typeof trend[0].issued).toBe('number');
                expect(typeof trend[0].redeemed).toBe('number');
                expect(typeof trend[0].expired).toBe('number');
            }
        });
        it('should respect months parameter', async () => {
            const trend6 = await service.getMonthlyTrend(6);
            const trend12 = await service.getMonthlyTrend(12);
            expect(trend6.length).toBeLessThanOrEqual(6);
            expect(trend12.length).toBeLessThanOrEqual(12);
        });
    });
    describe('getRedemptionChannels', () => {
        it('should return redemption channels from database', async () => {
            const channels = await service.getRedemptionChannels();
            expect(Array.isArray(channels)).toBe(true);
            if (channels.length > 0) {
                expect(channels[0]).toHaveProperty('channel');
                expect(channels[0]).toHaveProperty('count');
                expect(channels[0]).toHaveProperty('percentage');
                expect(typeof channels[0].count).toBe('number');
                expect(typeof channels[0].percentage).toBe('number');
            }
        });
    });
    describe('getRegionalStats', () => {
        it('should return regional statistics from database', async () => {
            const stats = await service.getRegionalStats();
            expect(Array.isArray(stats)).toBe(true);
            if (stats.length > 0) {
                expect(stats[0]).toHaveProperty('region');
                expect(stats[0]).toHaveProperty('beneficiaries');
                expect(stats[0]).toHaveProperty('vouchers');
                expect(stats[0]).toHaveProperty('redeemed');
                expect(typeof stats[0].beneficiaries).toBe('number');
                expect(typeof stats[0].vouchers).toBe('number');
                expect(typeof stats[0].redeemed).toBe('number');
            }
        });
    });
});
//# sourceMappingURL=DashboardService.test.js.map