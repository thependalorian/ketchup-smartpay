/**
 * Ketchup Admin API Client
 *
 * Purpose: Admin UI endpoints for Ketchup Portal (SmartPay, audit logs, trust account, compliance).
 * Location: packages/api-client/src/ketchup/adminAPI.ts
 * Backend: GET/POST /api/v1/ketchup/admin/* (ketchupAuth).
 */

import { apiClient } from './api';

export interface SmartPayHealth {
  status: string;
  service: string;
  timestamp: string;
}

export interface TrustAccountStatus {
  isCompliant: boolean;
  status: 'compliant' | 'deficient';
  coveragePercentage: number;
  coverage_ratio: number;
  deficiencyAmount: number | null;
  lastReconciliationDate: string | null;
}

export interface ReconciliationResult {
  id: string;
  reconciliationDate: string;
  trustAccountBalance: number;
  outstandingLiabilities: number;
  coveragePercentage: number;
  deficiencyAmount: number | null;
  status: string;
}

export interface AuditLogEntry {
  idempotency_key: string;
  endpoint_prefix: string;
  response_status: number;
  created_at: string;
}

export const adminAPI = {
  /** GET /ketchup/admin/smartpay/health */
  async getSmartPayHealth(): Promise<SmartPayHealth> {
    return apiClient.get<SmartPayHealth>('/ketchup/admin/smartpay/health');
  },

  /** GET /ketchup/admin/smartpay/sync-logs */
  async getSyncLogs(limit?: number): Promise<{ items: unknown[]; count: number }> {
    const res = await apiClient.get<{ items: unknown[]; count: number }>(
      '/ketchup/admin/smartpay/sync-logs',
      limit != null ? { limit: String(limit) } : undefined
    );
    return res ?? { items: [], count: 0 };
  },

  /** GET /ketchup/admin/audit-logs/query */
  async queryAuditLogs(params?: { limit?: number; endpoint_prefix?: string }): Promise<{
    items: AuditLogEntry[];
    count: number;
  }> {
    const q: Record<string, string> = {};
    if (params?.limit != null) q.limit = String(params.limit);
    if (params?.endpoint_prefix != null) q.endpoint_prefix = params.endpoint_prefix;
    const res = await apiClient.get<{ items: AuditLogEntry[]; count: number }>(
      '/ketchup/admin/audit-logs/query',
      Object.keys(q).length ? q : undefined
    );
    return res ?? { items: [], count: 0 };
  },

  /** GET /ketchup/admin/audit-logs/export - returns data, exportedAt, count (from idempotency_keys) */
  async exportAuditLogs(): Promise<{ data: unknown[]; exportedAt: string; count: number }> {
    return apiClient.get<{ data: unknown[]; exportedAt: string; count: number }>(
      '/ketchup/admin/audit-logs/export'
    );
  },

  /** POST /ketchup/admin/audit-logs/retention */
  async setAuditRetention(retention_days: number): Promise<{ retention_days: number; message: string }> {
    const res = await apiClient.post<{ retention_days: number; message: string }>(
      '/ketchup/admin/audit-logs/retention',
      { retention_days }
    );
    return res ?? { retention_days, message: 'Updated' };
  },

  /** GET /ketchup/admin/trust-account/status */
  async getTrustAccountStatus(): Promise<TrustAccountStatus> {
    return apiClient.get<TrustAccountStatus>('/ketchup/admin/trust-account/status');
  },

  /** POST /ketchup/admin/trust-account/reconcile */
  async reconcileTrustAccount(reconciledBy?: string): Promise<{
    data: ReconciliationResult;
    message: string;
  }> {
    return apiClient.post<{ data: ReconciliationResult; message: string }>(
      '/ketchup/admin/trust-account/reconcile',
      reconciledBy ? { reconciledBy } : {}
    );
  },

  /** GET /ketchup/admin/compliance/monthly-stats */
  async getMonthlyStats(year?: number, month?: number): Promise<unknown> {
    const params: Record<string, string> = {};
    if (year != null) params.year = String(year);
    if (month != null) params.month = String(month);
    return apiClient.get<unknown>(
      '/ketchup/admin/compliance/monthly-stats',
      Object.keys(params).length ? params : undefined
    );
  },

  /** POST /ketchup/admin/compliance/generate-report */
  async generateComplianceReport(year: number, month: number): Promise<{ data: unknown; message: string }> {
    return apiClient.post<{ data: unknown; message: string }>(
      '/ketchup/admin/compliance/generate-report',
      { year, month }
    );
  },
};
