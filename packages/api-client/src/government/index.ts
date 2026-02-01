/**
 * Government Portal API Methods
 * Read-only operations for oversight staff.
 * Unwraps response.data from backend so callers get payload directly.
 */

import { createGovernmentClient } from '../client';
import type { Beneficiary, Agent } from '@smartpay/types';

const client = createGovernmentClient({});

function unwrap<T>(r: { success?: boolean; data?: unknown }): T {
  if (!r?.success || r.data == null) return undefined as T;
  const d = r.data as { data?: T };
  return (d?.data ?? r.data) as T;
}

// Compliance APIs (backend routes: /dashboard, /trust-account/status, /incidents/open, etc.)
export const complianceAPI = {
  getDashboard: async () => unwrap(await client.get('/compliance/dashboard')),
  getTrustAccountStatus: async () => unwrap(await client.get('/compliance/trust-account/status')),
  getCapitalRequirements: async () => unwrap(await client.get('/compliance/capital/status')),
  getSystemUptime: async () => unwrap(await client.get('/compliance/uptime/status')),
  getIncidents: async (params?: Record<string, unknown>) => unwrap(await client.get('/compliance/incidents/open', params)),
};

// Monitoring APIs
export const monitoringAPI = {
  getVoucherStats: async (params?: Record<string, unknown>) => unwrap(await client.get('/monitoring/vouchers', params)),
  /** Single voucher by id (drill-down to smallest unit). */
  getVoucherById: async (id: string) => unwrap(await client.get(`/monitoring/vouchers/${encodeURIComponent(id)}`)),
  getBeneficiaryRegistry: async (params?: Record<string, unknown>) => {
    const data = unwrap<Beneficiary[]>(await client.get<Beneficiary[]>('/monitoring/beneficiaries', params));
    return Array.isArray(data) ? data : [];
  },
  /** Single beneficiary by id (drill-down to smallest unit). */
  getBeneficiaryById: async (id: string) => unwrap(await client.get(`/monitoring/beneficiaries/${encodeURIComponent(id)}`)),
  /** Vouchers for a single beneficiary (drill-down). Optional: status, page, limit. */
  getBeneficiaryVouchers: async (
    beneficiaryId: string,
    params?: { status?: string; page?: number; limit?: number }
  ) => unwrap(await client.get(`/monitoring/beneficiaries/${encodeURIComponent(beneficiaryId)}/vouchers`, params as Record<string, string>)),
  getAgentNetwork: async (params?: Record<string, unknown>) => {
    const data = unwrap<Agent[]>(await client.get<Agent[]>('/monitoring/agents', params));
    return Array.isArray(data) ? data : [];
  },
  /** Country-level summary: totals + status breakdown (issued, delivered, redeemed, expired, failed, pending). */
  getRegionalSummary: async () => unwrap(await client.get('/monitoring/regions/summary')),
  /** Regional performance with status breakdown per region. */
  getRegionalPerformance: async (params?: Record<string, unknown>) => {
    const data = unwrap(await client.get('/monitoring/regions', params));
    return Array.isArray(data) ? data : [];
  },
  /** Vouchers in a region (drill-down): id, status, time, redemption_method. Optional: status filter, page, limit. */
  getRegionVouchers: async (
    region: string,
    params?: { status?: string; page?: number; limit?: number }
  ) => unwrap(await client.get(`/monitoring/regions/${encodeURIComponent(region)}/vouchers`, params as Record<string, string>)),
};

// Analytics APIs (aggregate → drill-down to individual transactions)
export const analyticsAPI = {
  getFinancialSummary: async (params?: Record<string, unknown>) => unwrap(await client.get('/analytics/financial', params)),
  getSpendTrend: async (params?: Record<string, unknown>) => {
    const data = unwrap(await client.get('/analytics/spend-trend', params));
    return Array.isArray(data) ? data : [];
  },
  getGrantTypeBreakdown: async () => {
    const data = unwrap(await client.get('/analytics/grant-types'));
    return Array.isArray(data) ? data : [];
  },
  /** Drill-down: paginated list of individual redeemed vouchers (smallest data point). Params: page, limit, region, grantType, startDate, endDate, month (YYYY-MM). */
  getTransactions: async (params?: {
    page?: number;
    limit?: number;
    region?: string;
    grantType?: string;
    startDate?: string;
    endDate?: string;
    month?: string;
  }) => {
    const res = unwrap(await client.get('/analytics/transactions', params as Record<string, string>));
    return res && typeof res === 'object' && 'transactions' in res ? res : { transactions: [], total: 0, page: 1, limit: 50 };
  },
};

// Audit APIs
export const auditAPI = {
  getBeneficiaryAudit: async (params?: Record<string, unknown>) => unwrap(await client.get('/audit/beneficiaries', params)),
  getTransactionAudit: async (params?: Record<string, unknown>) => {
    const data = unwrap(await client.get('/audit/transactions', params));
    return Array.isArray(data) ? data : [];
  },
  getComplianceAudit: async (params?: Record<string, unknown>) => {
    const data = unwrap(await client.get('/audit/compliance', params));
    return Array.isArray(data) ? data : [];
  },
};

// Reports APIs
export const reportsAPI = {
  generateReport: async (type: string, params?: Record<string, unknown>) => unwrap(await client.post(`/reports/${type}`, params)),
  getReport: async (reportId: string) => unwrap(await client.get(`/reports/${reportId}`)),
  listReports: async (params?: Record<string, unknown>) => {
    const data = unwrap(await client.get('/reports', params));
    return Array.isArray(data) ? data : [];
  },
};
