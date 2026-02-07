/**
 * Dashboard API Client
 * 
 * Purpose: Frontend API client for dashboard metrics and analytics
 * Location: src/services/dashboardAPI.ts
 */

import { apiClient } from './api';

export interface DashboardMetrics {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  totalVouchersIssued: number;
  vouchersRedeemed: number;
  vouchersExpired: number;
  totalDisbursement: number;
  monthlyDisbursement: number;
  activeAgents: number;
  totalAgents: number;
  networkHealthScore: number;
}

export interface MonthlyTrend {
  month: string;
  issued: number;
  redeemed: number;
  expired: number;
}

export interface RedemptionChannel {
  channel: string;
  count: number;
  percentage: number;
}

export interface RegionalStat {
  region: string;
  beneficiaries: number;
  vouchers: number;
  redeemed: number;
}

export interface RequiresAttentionSummary {
  failed: number;
  expired: number;
  expiring_soon: number;
}

export interface RequiresAttentionRegion {
  region: string;
  failed: number;
  expired: number;
  expiring_soon: number;
}

export interface RequiresAttention {
  summary: RequiresAttentionSummary;
  by_region: RequiresAttentionRegion[];
  sample_failed: Array<{ id: string; voucher_code: string | null; region: string; status: string }>;
  sample_expiring_soon: Array<{ id: string; voucher_code: string | null; region: string; expiry_date: string | null }>;
}

export const dashboardAPI = {
  /**
   * Get dashboard metrics
   */
  async getMetrics(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>('/dashboard/metrics');
  },

  /**
   * Get monthly trend data
   */
  async getMonthlyTrend(months: number = 12): Promise<MonthlyTrend[]> {
    return apiClient.get<MonthlyTrend[]>('/dashboard/monthly-trend', { months });
  },

  /**
   * Get redemption channels data
   */
  async getRedemptionChannels(): Promise<RedemptionChannel[]> {
    return apiClient.get<RedemptionChannel[]>('/dashboard/redemption-channels');
  },

  /**
   * Get regional statistics
   */
  async getRegionalStats(): Promise<RegionalStat[]> {
    return apiClient.get<RegionalStat[]>('/dashboard/regional-stats');
  },

  /**
   * Get requires-attention alerts: failed, expired, expiring soon (for Ketchup dashboard/alerts).
   */
  async getRequiresAttention(expiringWithinDays: number = 7): Promise<RequiresAttention> {
    return apiClient.get<RequiresAttention>('/dashboard/requires-attention', { expiringWithinDays });
  },
};
