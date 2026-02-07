/**
 * ATM Management API Client
 *
 * Purpose: Frontend API for ATM management (Ketchup portal).
 * Location: packages/api-client/src/ketchup/atmsAPI.ts
 */

import { apiClient } from './api';

const BASE = '/atms';

export interface Atm {
  id: string;
  terminalId: string;
  location: string;
  region: string | null;
  status: string;
  cashLevelPercent: number | null;
  mobileUnitId: string | null;
  lastServicedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AtmStats {
  total: number;
  operational: number;
  offline: number;
  maintenance: number;
  lowCash: number;
}

export const atmsAPI = {
  async getAll(filters?: { region?: string; status?: string; limit?: number; offset?: number }): Promise<Atm[]> {
    const data = await apiClient.get<Atm[]>(BASE, filters as Record<string, unknown>);
    return Array.isArray(data) ? data : [];
  },

  async getStats(): Promise<AtmStats> {
    return apiClient.get<AtmStats>(`${BASE}/stats`);
  },

  async getById(id: string): Promise<Atm | null> {
    const data = await apiClient.get<Atm>(`${BASE}/${id}`).catch(() => null);
    return data ?? null;
  },

  async create(body: {
    terminalId: string;
    location: string;
    region?: string;
    status?: string;
    cashLevelPercent?: number;
    mobileUnitId?: string;
    lastServicedAt?: string;
  }): Promise<Atm> {
    return apiClient.post<Atm>(BASE, body);
  },

  async update(
    id: string,
    body: {
      terminalId?: string;
      location?: string;
      region?: string;
      status?: string;
      cashLevelPercent?: number;
      mobileUnitId?: string | null;
      lastServicedAt?: string | null;
    }
  ): Promise<Atm> {
    return apiClient.patch<Atm>(`${BASE}/${id}`, body);
  },
};
