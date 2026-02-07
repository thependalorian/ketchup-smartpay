/**
 * Map / Locations API Client
 *
 * Purpose: CRUD for agent network map locations (POS, Nampost, merchants, etc.)
 * Location: packages/api-client/src/ketchup/mapAPI.ts
 */

import { apiClient } from './api';

export type LocationType =
  | 'agent-pos'
  | 'nampost-office'
  | 'merchant-store'
  | 'atm'
  | 'warehouse';
export type LocationStatus = 'active' | 'inactive' | 'maintenance' | 'offline';

export interface MapLocation {
  id: string;
  name: string;
  type: LocationType;
  latitude: number;
  longitude: number;
  address?: string;
  region: string;
  status: LocationStatus;
  lastActive?: string;
  deviceId?: string;
  agentName?: string;
  contactNumber?: string;
  radiusKm?: number;
}

export const mapAPI = {
  async getAllLocations(): Promise<MapLocation[]> {
    return apiClient.get<MapLocation[]>('/map/locations');
  },

  async getLocationById(id: string): Promise<MapLocation> {
    return apiClient.get<MapLocation>(`/map/locations/${id}`);
  },

  async addLocation(location: Omit<MapLocation, 'id'>): Promise<MapLocation> {
    return apiClient.post<MapLocation>('/map/locations', location);
  },

  async updateLocation(id: string, updates: Partial<MapLocation>): Promise<MapLocation> {
    return apiClient.put<MapLocation>(`/map/locations/${id}`, updates);
  },

  async deleteLocation(id: string): Promise<void> {
    return apiClient.delete(`/map/locations/${id}`);
  },

  async getLocationsByRegion(region: string): Promise<MapLocation[]> {
    return apiClient.get<MapLocation[]>(`/map/locations/region/${encodeURIComponent(region)}`);
  },

  async getLocationsByType(type: string): Promise<MapLocation[]> {
    return apiClient.get<MapLocation[]>(`/map/locations/type/${encodeURIComponent(type)}`);
  },

  /** Fixed locations: NamPost offices, ATMs, warehouses (from locations table). */
  async getFixedLocations(params?: { type?: string; region?: string }): Promise<MapLocation[]> {
    const search = new URLSearchParams();
    if (params?.type) search.set('type', params.type);
    if (params?.region) search.set('region', params.region);
    const qs = search.toString();
    return apiClient.get<MapLocation[]>(`/map/locations/fixed${qs ? `?${qs}` : ''}`);
  },

  async importLocations(locations: Omit<MapLocation, 'id'>[]): Promise<{ imported: number }> {
    return apiClient.post<{ imported: number }>('/map/locations/import', { locations });
  },
};
