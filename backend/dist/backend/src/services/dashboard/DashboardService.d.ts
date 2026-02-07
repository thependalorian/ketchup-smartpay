/**
 * Dashboard Service
 *
 * Purpose: Generate dashboard metrics from database
 * Location: backend/src/services/dashboard/DashboardService.ts
 *
 * Analytics endpoints (PRD Section 9): Impact KPIs exposed via government API:
 * - GET /api/government/impact – ImpactAnalyticsService.getImpactKPIs (financial inclusion, social impact, adoption, NPS)
 * - GET /api/government/analytics – existing analytics; can add adoption and training metrics
 */
import { DashboardMetrics } from '../../../../shared/types';
export declare class DashboardService {
    /**
     * Get dashboard metrics
     */
    getMetrics(): Promise<DashboardMetrics>;
    /**
     * Get monthly trend data
     */
    getMonthlyTrend(months?: number): Promise<Array<{
        month: string;
        issued: number;
        redeemed: number;
        expired: number;
    }>>;
    /** Valid redemption channels only (no bank, no unknown). */
    private static readonly REDEMPTION_CHANNELS;
    /**
     * Get redemption channels data.
     * Only returns valid channels: post_office, mobile_unit, pos, mobile, atm.
     * Legacy "bank" and null/unknown counts are allocated proportionally into these channels.
     */
    getRedemptionChannels(): Promise<Array<{
        channel: string;
        count: number;
        percentage: number;
    }>>;
    /**
     * Get regional statistics
     */
    getRegionalStats(): Promise<Array<{
        region: string;
        beneficiaries: number;
        vouchers: number;
        redeemed: number;
    }>>;
    /**
     * Requires attention: failed, expired, and expiring soon (default 7 days).
     * Ketchup is notified via status_events and webhooks; this endpoint surfaces counts for dashboard/alerts.
     */
    getRequiresAttention(expiringWithinDays?: number): Promise<{
        summary: {
            failed: number;
            expired: number;
            expiring_soon: number;
        };
        by_region: Array<{
            region: string;
            failed: number;
            expired: number;
            expiring_soon: number;
        }>;
        sample_failed: Array<{
            id: string;
            voucher_code: string | null;
            region: string;
            status: string;
        }>;
        sample_expiring_soon: Array<{
            id: string;
            voucher_code: string | null;
            region: string;
            expiry_date: string;
        }>;
    }>;
}
//# sourceMappingURL=DashboardService.d.ts.map