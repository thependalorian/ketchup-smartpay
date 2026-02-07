/**
 * Locations API Client (NamPost, ATM, Warehouse)
 *
 * Purpose: REST client for fixed locations. Same pattern as beneficiaryAPI/voucherAPI.
 * Backend: GET /api/v1/ketchup/locations, /locations/types, /locations/:id
 * Location: packages/api-client/src/ketchup/locationsAPI.ts
 */

import { apiClient } from './api';

export type LocationTypeApi =
  | 'nampost-office'
  | 'atm'
  | 'warehouse';

export interface FixedLocation {
  id: string;
  name: string;
  type: LocationTypeApi;
  typeDb?: 'nampost_office' | 'atm' | 'warehouse';
  region: string;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationsFilters {
  type?: 'nampost_office' | 'atm' | 'warehouse';
  region?: string;
}

export const locationsAPI = {
  /**
   * List fixed locations (NamPost offices, ATMs, warehouses).
   */
  getLocations: async (filters?: LocationsFilters): Promise<FixedLocation[]> => {
    return apiClient.get<FixedLocation[]>('/ketchup/locations', filters as Record<string, string>);
  },

  /**
   * Get one location by id.
   */
  getById: async (id: string): Promise<FixedLocation> => {
    return apiClient.get<FixedLocation>(`/ketchup/locations/${id}`);
  },

  /**
   * List distinct location types (for filter dropdowns).
   */
  getTypes: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/ketchup/locations/types');
  },

  /** NamPost offices only. */
  getNampostOffices: async (region?: string): Promise<FixedLocation[]> => {
    return apiClient.get<FixedLocation[]>('/ketchup/locations', {
      type: 'nampost_office',
      ...(region ? { region } : {}),
    });
  },

  /** ATMs only. */
  getAtms: async (region?: string): Promise<FixedLocation[]> => {
    return apiClient.get<FixedLocation[]>('/ketchup/locations', {
      type: 'atm',
      ...(region ? { region } : {}),
    });
  },

  /** Warehouses only. */
  getWarehouses: async (region?: string): Promise<FixedLocation[]> => {
    return apiClient.get<FixedLocation[]>('/ketchup/locations', {
      type: 'warehouse',
      ...(region ? { region } : {}),
    });
  },
};
