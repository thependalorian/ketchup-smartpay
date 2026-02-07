/**
 * SmartPay Mobile API Client
 *
 * Purpose: Frontend API for SmartPay Mobile (agents type=mobile_unit); equipment, drivers, issue/return.
 * Location: packages/api-client/src/ketchup/mobileUnitsAPI.ts
 */

import { apiClient } from './api';
import type { Agent } from './agentAPI';
import type { PaginatedResponse } from '../types';

const BASE = '/mobile-units';

export type MobileUnit = Agent;

export interface MobileUnitStats {
  total: number;
  active: number;
  inactive: number;
  lowLiquidity: number;
  down?: number;
  totalVolumeToday: number;
  avgSuccessRate: number;
}

export interface EquipmentType {
  code: string;
  label: string;
  category: string;
}

export interface MobileUnitEquipment {
  id: string;
  mobileUnitId: string;
  equipmentTypeCode: string;
  assetId: string;
  status: string;
  issuedAt: string;
  returnedAt: string | null;
  conditionNotes: string | null;
}

export interface MobileUnitDriver {
  id: string;
  mobileUnitId: string;
  name: string;
  idNumber: string | null;
  phone: string | null;
  role: string;
  assignedAt: string;
  status: string;
}

export interface ActivityItem {
  type: 'equipment_issue' | 'equipment_return' | 'maintenance';
  at: string;
  id: string;
  description?: string;
  assetId?: string;
  equipmentTypeCode?: string;
  maintenanceType?: string;
  cost?: number | null;
  meterReading?: string | null;
}

export interface MaintenanceEvent {
  id: string;
  mobileUnitId: string;
  equipmentId: string | null;
  type: string;
  description: string;
  partsUsed: string | null;
  cost: number | null;
  meterReading: string | null;
  createdAt: string;
}

export const mobileUnitsAPI = {
  async getAll(filters?: { region?: string; status?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<MobileUnit>> {
    return apiClient.get<PaginatedResponse<MobileUnit>>(BASE, filters as Record<string, unknown>);
  },

  async getStats(): Promise<MobileUnitStats> {
    return apiClient.get<MobileUnitStats>(`${BASE}/stats`);
  },

  async getById(id: string): Promise<MobileUnit | null> {
    const data = await apiClient.get<MobileUnit>(`${BASE}/${id}`).catch(() => null);
    return data ?? null;
  },

  async getEquipment(unitId: string): Promise<MobileUnitEquipment[]> {
    const data = await apiClient.get<MobileUnitEquipment[]>(`${BASE}/${unitId}/equipment`).catch(() => []);
    return Array.isArray(data) ? data : [];
  },

  async getDrivers(unitId: string): Promise<MobileUnitDriver[]> {
    const data = await apiClient.get<MobileUnitDriver[]>(`${BASE}/${unitId}/drivers`).catch(() => []);
    return Array.isArray(data) ? data : [];
  },

  async getEquipmentTypes(): Promise<EquipmentType[]> {
    const data = await apiClient.get<EquipmentType[]>(`${BASE}/equipment/types`).catch(() => []);
    return Array.isArray(data) ? data : [];
  },

  async issueEquipment(unitId: string, body: { equipmentTypeCode: string; assetId: string; notes?: string }): Promise<MobileUnitEquipment> {
    return apiClient.post<MobileUnitEquipment>(`${BASE}/${unitId}/equipment/issue`, body);
  },

  async returnEquipment(unitId: string, equipmentId: string): Promise<MobileUnitEquipment> {
    return apiClient.post<MobileUnitEquipment>(`${BASE}/${unitId}/equipment/return`, { equipmentId });
  },

  async getActivity(unitId: string, limit?: number): Promise<ActivityItem[]> {
    const data = await apiClient.get<ActivityItem[]>(`${BASE}/${unitId}/activity`, limit != null ? { limit } : undefined).catch(() => []);
    return Array.isArray(data) ? data : [];
  },

  async postMaintenance(
    unitId: string,
    body: { type: string; description: string; partsUsed?: string; cost?: number; meterReading?: string; equipmentId?: string }
  ): Promise<MaintenanceEvent> {
    return apiClient.post<MaintenanceEvent>(`${BASE}/${unitId}/maintenance`, body);
  },

  async addDriver(
    unitId: string,
    body: { name: string; idNumber?: string; phone?: string; role?: string }
  ): Promise<MobileUnitDriver> {
    return apiClient.post<MobileUnitDriver>(`${BASE}/${unitId}/drivers`, body);
  },

  async updateDriver(
    unitId: string,
    driverId: string,
    body: { name?: string; idNumber?: string; phone?: string; role?: string; status?: string }
  ): Promise<MobileUnitDriver> {
    return apiClient.patch<MobileUnitDriver>(`${BASE}/${unitId}/drivers/${driverId}`, body);
  },

  async removeDriver(unitId: string, driverId: string): Promise<void> {
    await apiClient.delete(`${BASE}/${unitId}/drivers/${driverId}`);
  },
};
