/**
 * POS Terminal Management API Client
 *
 * Purpose: Frontend API for POS terminal management (Ketchup portal).
 * Location: packages/api-client/src/ketchup/posTerminalsAPI.ts
 */

import { apiClient } from './api';

const BASE = '/pos-terminals';

export interface PosTerminal {
  id: string;
  terminalId: string;
  agentId: string | null;
  merchantId: string | null;
  status: string;
  deviceId: string | null;
  provisionedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const posTerminalsAPI = {
  async getAll(filters?: { agentId?: string; merchantId?: string; status?: string; limit?: number; offset?: number }): Promise<PosTerminal[]> {
    const data = await apiClient.get<PosTerminal[]>(BASE, filters as Record<string, unknown>);
    return Array.isArray(data) ? data : [];
  },

  async getById(id: string): Promise<PosTerminal | null> {
    const data = await apiClient.get<PosTerminal>(`${BASE}/${id}`).catch(() => null);
    return data ?? null;
  },

  async create(body: { terminalId: string; agentId?: string; merchantId?: string; status?: string; deviceId?: string }): Promise<PosTerminal> {
    return apiClient.post<PosTerminal>(BASE, body);
  },

  async update(
    id: string,
    body: { terminalId?: string; agentId?: string | null; merchantId?: string | null; status?: string; deviceId?: string | null }
  ): Promise<PosTerminal> {
    return apiClient.patch<PosTerminal>(`${BASE}/${id}`, body);
  },
};
