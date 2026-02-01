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

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
import { DashboardMetrics } from '../../../../shared/types';

export class DashboardService {
  /**
   * Get dashboard metrics
   */
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      // Get beneficiary counts (active excludes deceased/suspended/pending; deceased count for reporting)
      const [beneficiaryStats] = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'deceased') as deceased
        FROM beneficiaries
      `;

      // Get voucher statistics
      const [voucherStats] = await sql`
        SELECT 
          COUNT(*) as total_issued,
          COUNT(*) FILTER (WHERE status = 'redeemed') as redeemed,
          COUNT(*) FILTER (WHERE status = 'expired') as expired,
          COALESCE(SUM(amount), 0) as total_disbursement,
          COALESCE(SUM(amount) FILTER (
            WHERE issued_at >= DATE_TRUNC('month', CURRENT_DATE)
          ), 0) as monthly_disbursement
        FROM vouchers
      `;

      // Get agent statistics (assuming agents table exists)
      const [agentStats] = await sql`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active
        FROM agents
      `.catch(() => [{ total: 0, active: 0 }]); // Fallback if agents table doesn't exist

      const networkHealthScore = agentStats.active > 0 
        ? Math.min(100, (agentStats.active / agentStats.total) * 100)
        : 100;

      return {
        totalBeneficiaries: Number(beneficiaryStats?.total || 0),
        activeBeneficiaries: Number(beneficiaryStats?.active || 0),
        deceasedBeneficiaries: Number(beneficiaryStats?.deceased || 0),
        totalVouchersIssued: Number(voucherStats?.total_issued || 0),
        vouchersRedeemed: Number(voucherStats?.redeemed || 0),
        vouchersExpired: Number(voucherStats?.expired || 0),
        totalDisbursement: Number(voucherStats?.total_disbursement || 0),
        monthlyDisbursement: Number(voucherStats?.monthly_disbursement || 0),
        activeAgents: Number(agentStats?.active || 0),
        totalAgents: Number(agentStats?.total || 0),
        networkHealthScore: Number(networkHealthScore.toFixed(1)),
      };
    } catch (error) {
      logError('Failed to get dashboard metrics', error);
      throw error;
    }
  }

  /**
   * Get monthly trend data
   */
  async getMonthlyTrend(months: number = 12): Promise<Array<{
    month: string;
    issued: number;
    redeemed: number;
    expired: number;
  }>> {
    try {
      const result = await sql`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', issued_at), 'YYYY-MM') as month,
          COUNT(*) as issued,
          COUNT(*) FILTER (WHERE status = 'redeemed') as redeemed,
          COUNT(*) FILTER (WHERE status = 'expired') as expired
        FROM vouchers
        WHERE issued_at >= CURRENT_DATE - (${months} || ' months')::INTERVAL
        GROUP BY DATE_TRUNC('month', issued_at)
        ORDER BY month DESC
        LIMIT ${months}
      `;

      return result.map((row: any) => ({
        month: row.month,
        issued: Number(row.issued || 0),
        redeemed: Number(row.redeemed || 0),
        expired: Number(row.expired || 0),
      }));
    } catch (error) {
      logError('Failed to get monthly trend', error);
      throw error;
    }
  }

  /** Valid redemption channels only (no bank, no unknown). */
  private static readonly REDEMPTION_CHANNELS = [
    'post_office',
    'mobile_unit',
    'pos',
    'mobile',
    'atm',
  ] as const;

  /**
   * Get redemption channels data.
   * Only returns valid channels: post_office, mobile_unit, pos, mobile, atm.
   * Legacy "bank" and null/unknown counts are allocated proportionally into these channels.
   */
  async getRedemptionChannels(): Promise<Array<{
    channel: string;
    count: number;
    percentage: number;
  }>> {
    try {
      const result = await sql`
        SELECT 
          COALESCE(redemption_method, 'unknown') as channel,
          COUNT(*) as count
        FROM vouchers
        WHERE status = 'redeemed'
        GROUP BY redemption_method
        ORDER BY count DESC
      `;

      const validSet = new Set(DashboardService.REDEMPTION_CHANNELS);
      const byChannel = new Map<string, number>();

      for (const ch of DashboardService.REDEMPTION_CHANNELS) {
        byChannel.set(ch, 0);
      }

      let reallocateSum = 0;
      for (const row of result as Array<{ channel: string; count: string | number }>) {
        const ch = (row.channel || '').trim().toLowerCase();
        const count = Number(row.count || 0);
        if (validSet.has(ch as typeof DashboardService.REDEMPTION_CHANNELS[number])) {
          byChannel.set(ch, (byChannel.get(ch) ?? 0) + count);
        } else {
          reallocateSum += count;
        }
      }

      // Allocate bank/unknown/other counts proportionally into valid channels
      if (reallocateSum > 0) {
        const validTotal = Array.from(byChannel.values()).reduce((s, n) => s + n, 0);
        if (validTotal > 0) {
          for (const ch of DashboardService.REDEMPTION_CHANNELS) {
            const current = byChannel.get(ch) ?? 0;
            const share = current / validTotal;
            byChannel.set(ch, current + Math.round(reallocateSum * share));
          }
        } else {
          byChannel.set('post_office', (byChannel.get('post_office') ?? 0) + reallocateSum);
        }
      }

      const total = Array.from(byChannel.values()).reduce((s, n) => s + n, 0);
      return DashboardService.REDEMPTION_CHANNELS.map((channel) => {
        const count = byChannel.get(channel) ?? 0;
        return {
          channel,
          count,
          percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
        };
      }).filter((row) => row.count > 0);
    } catch (error) {
      logError('Failed to get redemption channels', error);
      throw error;
    }
  }

  /**
   * Get regional statistics
   */
  async getRegionalStats(): Promise<Array<{
    region: string;
    beneficiaries: number;
    vouchers: number;
    redeemed: number;
  }>> {
    try {
      const result = await sql`
        SELECT 
          b.region,
          COUNT(DISTINCT b.id) as beneficiaries,
          COUNT(v.id) as vouchers,
          COUNT(v.id) FILTER (WHERE v.status = 'redeemed') as redeemed
        FROM beneficiaries b
        LEFT JOIN vouchers v ON v.beneficiary_id = b.id
        GROUP BY b.region
        ORDER BY beneficiaries DESC
      `;

      return result.map((row: any) => ({
        region: row.region,
        beneficiaries: Number(row.beneficiaries || 0),
        vouchers: Number(row.vouchers || 0),
        redeemed: Number(row.redeemed || 0),
      }));
    } catch (error) {
      logError('Failed to get regional stats', error);
      throw error;
    }
  }

  /**
   * Requires attention: failed, expired, and expiring soon (default 7 days).
   * Ketchup is notified via status_events and webhooks; this endpoint surfaces counts for dashboard/alerts.
   */
  async getRequiresAttention(expiringWithinDays: number = 7): Promise<{
    summary: { failed: number; expired: number; expiring_soon: number };
    by_region: Array<{ region: string; failed: number; expired: number; expiring_soon: number }>;
    sample_failed: Array<{ id: string; voucher_code: string | null; region: string; status: string }>;
    sample_expiring_soon: Array<{ id: string; voucher_code: string | null; region: string; expiry_date: string }>;
  }> {
    try {
      const summaryResult = await sql`
        SELECT
          COUNT(*) FILTER (WHERE status = 'failed')::int as failed,
          COUNT(*) FILTER (WHERE status = 'expired')::int as expired,
          COUNT(*) FILTER (WHERE status IN ('issued', 'delivered') AND expiry_date <= NOW() + (${expiringWithinDays} || ' days')::interval)::int as expiring_soon
        FROM vouchers
      `;
      const s = (summaryResult as any[])[0];
      const summary = {
        failed: Number(s?.failed ?? 0),
        expired: Number(s?.expired ?? 0),
        expiring_soon: Number(s?.expiring_soon ?? 0),
      };

      const byRegionResult = await sql`
        SELECT
          region,
          COUNT(*) FILTER (WHERE status = 'failed')::int as failed,
          COUNT(*) FILTER (WHERE status = 'expired')::int as expired,
          COUNT(*) FILTER (WHERE status IN ('issued', 'delivered') AND expiry_date <= NOW() + (${expiringWithinDays} || ' days')::interval)::int as expiring_soon
        FROM vouchers
        GROUP BY region
        HAVING COUNT(*) FILTER (WHERE status = 'failed') > 0
           OR COUNT(*) FILTER (WHERE status = 'expired') > 0
           OR COUNT(*) FILTER (WHERE status IN ('issued', 'delivered') AND expiry_date <= NOW() + (${expiringWithinDays} || ' days')::interval) > 0
        ORDER BY region
      `;
      const by_region = (byRegionResult as any[]).map((row: any) => ({
        region: row.region,
        failed: Number(row.failed ?? 0),
        expired: Number(row.expired ?? 0),
        expiring_soon: Number(row.expiring_soon ?? 0),
      }));

      const sampleFailed = await sql`
        SELECT id, voucher_code, region, status
        FROM vouchers
        WHERE status = 'failed'
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 20
      `;
      const sampleExpiring = await sql`
        SELECT id, voucher_code, region, expiry_date::text
        FROM vouchers
        WHERE status IN ('issued', 'delivered') AND expiry_date <= NOW() + (${expiringWithinDays} || ' days')::interval
        ORDER BY expiry_date ASC
        LIMIT 20
      `;
      return {
        summary,
        by_region,
        sample_failed: (sampleFailed as any[]).map((r: any) => ({
          id: r.id,
          voucher_code: r.voucher_code ?? null,
          region: r.region,
          status: r.status,
        })),
        sample_expiring_soon: (sampleExpiring as any[]).map((r: any) => ({
          id: r.id,
          voucher_code: r.voucher_code ?? null,
          region: r.region,
          expiry_date: r.expiry_date ?? null,
        })),
      };
    } catch (error) {
      logError('Failed to get requires attention', error);
      throw error;
    }
  }
}
