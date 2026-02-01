/**
 * Agent Service
 * 
 * Purpose: Agent network management and statistics
 * Location: backend/src/services/agents/AgentService.ts
 */

import { sql } from '../../database/connection';
import { logError } from '../../utils/logger';
import { Agent, AgentFilters } from '../../../../shared/types';

export class AgentService {
  /**
   * Get all agents with statistics
   */
  async getAll(filters?: {
    region?: string;
    status?: string;
    type?: string;
  }): Promise<Agent[]> {
    try {
      const region = filters?.region ?? null;
      const status = filters?.status ?? null;
      const type = filters?.type ?? null;

      const result = await sql`
        SELECT 
          a.id::text,
          a.name,
          a.type,
          COALESCE(a.location, 'Unknown') as region,
          a.status,
          COALESCE(a.liquidity_balance, 0) as liquidity,
          0::bigint as transactions_today,
          0::numeric as volume_today,
          100::numeric as success_rate
        FROM agents a
        WHERE
          (${region}::text IS NULL OR a.location = ${region})
          AND (${status}::text IS NULL OR a.status = ${status})
          AND (${type}::text IS NULL OR a.type = ${type})
      `;

      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        region: row.region,
        status: row.status,
        liquidity: Number(row.liquidity || 0),
        transactionsToday: Number(row.transactions_today || 0),
        volumeToday: Number(row.volume_today || 0),
        successRate: Number(row.success_rate || 100),
      }));
    } catch (error) {
      logError('Failed to get agents', error);
      // If agents table doesn't exist, return empty array
      if (error instanceof Error && error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get a single agent by id (for view-detail; used by mobile-units getById).
   */
  async getById(id: string): Promise<Agent | null> {
    try {
      const [row] = await sql`
        SELECT 
          a.id::text,
          a.name,
          a.type,
          COALESCE(a.location, 'Unknown') as region,
          a.status,
          COALESCE(a.liquidity_balance, 0) as liquidity,
          0::bigint as transactions_today,
          0::numeric as volume_today,
          100::numeric as success_rate
        FROM agents a
        WHERE a.id::text = ${id}
      `;
      if (!row) return null;
      return {
        id: (row as any).id,
        name: (row as any).name,
        type: (row as any).type,
        region: (row as any).region,
        status: (row as any).status,
        liquidity: Number((row as any).liquidity || 0),
        transactionsToday: Number((row as any).transactions_today || 0),
        volumeToday: Number((row as any).volume_today || 0),
        successRate: Number((row as any).success_rate || 100),
      };
    } catch (error) {
      logError('Failed to get agent by id', error);
      if (error instanceof Error && error.message.includes('does not exist')) return null;
      throw error;
    }
  }

  /**
   * Get agents with coordinates for map (NamibiaMap / mapAPI).
   * Returns rows with id, name, type, location (region), status, latitude, longitude.
   */
  async getForMap(filters?: { region?: string; type?: string }): Promise<
    Array<{
      id: string;
      name: string;
      type: string;
      region: string;
      status: string;
      latitude: number | null;
      longitude: number | null;
    }>
  > {
    try {
      const region = filters?.region ?? null;
      const type = filters?.type ?? null;
      const result = await sql`
        SELECT
          a.id::text,
          a.name,
          a.type,
          COALESCE(a.location, 'Unknown') as region,
          a.status,
          a.latitude,
          a.longitude
        FROM agents a
        WHERE
          (${region}::text IS NULL OR a.location = ${region})
          AND (${type}::text IS NULL OR a.type = ${type})
          AND a.latitude IS NOT NULL
          AND a.longitude IS NOT NULL
      `;
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        region: row.region,
        status: row.status,
        latitude: row.latitude != null ? Number(row.latitude) : null,
        longitude: row.longitude != null ? Number(row.longitude) : null,
      }));
    } catch (error) {
      logError('Failed to get agents for map', error);
      if (error instanceof Error && error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get agent statistics summary (optionally filtered by type, e.g. mobile_unit)
   */
  async getStats(type?: string | null): Promise<{
    total: number;
    active: number;
    inactive: number;
    lowLiquidity: number;
    down?: number;
    totalVolumeToday: number;
    avgSuccessRate: number;
  }> {
    try {
      const hasType = typeof type === 'string' && type.trim() !== '';
      const [stats] = hasType
        ? await sql`
            SELECT 
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'active') as active,
              COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
              COUNT(*) FILTER (WHERE status = 'low_liquidity') as low_liquidity,
              COUNT(*) FILTER (WHERE status = 'down') as down
            FROM agents
            WHERE type = ${type}
          `.catch(() => [{ total: 0, active: 0, inactive: 0, low_liquidity: 0, down: 0 }])
        : await sql`
            SELECT 
              COUNT(*) as total,
              COUNT(*) FILTER (WHERE status = 'active') as active,
              COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
              COUNT(*) FILTER (WHERE status = 'low_liquidity') as low_liquidity,
              0::bigint as down
            FROM agents
          `.catch(() => [{ total: 0, active: 0, inactive: 0, low_liquidity: 0, down: 0 }]);

      const [volumeStats] = await sql`
        SELECT 
          COALESCE(SUM(v.amount), 0) as total_volume,
          CASE 
            WHEN COUNT(v.id) > 0 THEN 
              AVG(CASE 
                WHEN COUNT(v.id) FILTER (WHERE v.status = 'redeemed') > 0 THEN 
                  (COUNT(v.id) FILTER (WHERE v.status = 'redeemed')::numeric / COUNT(v.id)::numeric) * 100
                ELSE 100
              END)
            ELSE 100
          END as avg_success_rate
        FROM vouchers v
        WHERE v.redeemed_at >= CURRENT_DATE
      `.catch(() => [{ total_volume: 0, avg_success_rate: 100 }]);

      return {
        total: Number(stats?.total || 0),
        active: Number(stats?.active || 0),
        inactive: Number(stats?.inactive || 0),
        lowLiquidity: Number(stats?.low_liquidity || 0),
        ...(hasType && stats && (stats as any).down !== undefined ? { down: Number((stats as any).down || 0) } : {}),
        totalVolumeToday: Number(volumeStats?.total_volume || 0),
        avgSuccessRate: Number(volumeStats?.avg_success_rate || 100),
      };
    } catch (error) {
      logError('Failed to get agent stats', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        lowLiquidity: 0,
        totalVolumeToday: 0,
        avgSuccessRate: 100,
      };
    }
  }
}
