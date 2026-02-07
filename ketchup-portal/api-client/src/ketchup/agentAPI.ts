/**
 * Agent API Client
 * 
 * Purpose: Frontend API client for agent network management
 * Location: src/services/agentAPI.ts
 */

import { apiClient } from './api';
import type { PaginatedResponse } from '../types';

export interface Agent {
  id: string;
  name: string;
  type: 'small' | 'medium' | 'large';
  region: string;
  status: 'active' | 'inactive' | 'low_liquidity';
  liquidity: number;
  transactionsToday: number;
  volumeToday: number;
  successRate: number;
}

export interface AgentFilters {
  region?: string;
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface AgentStats {
  total: number;
  active: number;
  inactive: number;
  lowLiquidity: number;
  down?: number;
  totalVolumeToday: number;
  avgSuccessRate: number;
}

export const agentAPI = {
  /**
   * Get all agents with optional filters
   */
  async getAll(filters?: AgentFilters): Promise<PaginatedResponse<Agent>> {
    return apiClient.get<PaginatedResponse<Agent>>('/agents', filters);
  },

  /**
   * Get agent network statistics (optionally filtered by type, e.g. mobile_unit)
   */
  async getStats(type?: string): Promise<AgentStats> {
    return apiClient.get<AgentStats>('/agents/stats', type ? { type } : undefined);
  },
};
